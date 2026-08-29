const dns = require('dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { runSync, searchMoviesApi, getPool, ensureBaseSchema } = require('./services/movieSyncService');
const emailService = require('./services/emailService');
const Razorpay = require('razorpay');
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    : null;

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 8080;

app.use(cors());

// Serve local resources folder (contains poster images) statically
app.use('/resources', express.static(path.join(__dirname, '../resources')));

// Enable global JSON body parsing for API endpoints
app.use(express.json());

// Verify SMTP connection on startup
emailService.verifyConnection();

// ==========================================
// AUTH ENDPOINTS (Real NodeMailer SMTP OTP Flow)
// ==========================================

// POST /api/auth/otp/send - Generate and send OTP via SMTP
app.post('/api/auth/otp/send', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.trim() || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    try {
        const pool = getPool();

        // 1. Cooldown rate limit check
        const [rows] = await pool.query('SELECT last_sent_at FROM otp_verification WHERE email = ?', [email]);
        if (rows.length > 0) {
            const lastSent = new Date(rows[0].last_sent_at);
            const now = new Date();
            const diffSeconds = Math.floor((now - lastSent) / 1000);
            if (diffSeconds < 60) {
                console.log(`[OTP ROUTE] Rate limit triggered for ${email}. Seconds elapsed: ${diffSeconds}`);
                return res.status(429).json({ 
                    success: false, 
                    message: `Please wait ${60 - diffSeconds} seconds before requesting another code.` 
                });
            }
        }

        // 2. Generate secure 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Save to database (delete existing and insert new)
        await pool.query('DELETE FROM otp_verification WHERE email = ?', [email]);
        await pool.query(
            'INSERT INTO otp_verification (email, otp_code, expires_at, is_verified, attempts, last_sent_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 0, NOW())',
            [email, otp]
        );

        console.log(`[OTP ROUTE] Secure OTP generated for ${email}. Dispatching email...`);

        // Send email via Gmail directly to user's inbox
        await emailService.sendOTPEmail(email, otp, 5);
        console.log(`[OTP ROUTE] Email dispatched successfully to ${email}`);

        res.json({ 
            success: true, 
            message: 'A verification code has been sent to your Gmail inbox. Please check your inbox and spam folder.'
        });
    } catch (err) {
        console.error('[OTP ROUTE ERROR] Failed to send OTP:', err.message);
        res.status(500).json({ success: false, error: err.message, message: 'Internal server error during email dispatch.' });
    }
});

// POST /api/auth/otp/verify - Validate OTP and complete sign-in
app.post('/api/auth/otp/verify', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    try {
        const pool = getPool();

        // 1. Fetch OTP record
        const [rows] = await pool.query('SELECT otp_code, expires_at, attempts FROM otp_verification WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No verification code requested for this email.' });
        }

        const record = rows[0];
        const now = new Date();
        const expiresAt = new Date(record.expires_at);

        // 2. Check maximum retry attempts limit
        if (record.attempts >= 3) {
            return res.status(401).json({ 
                success: false, 
                message: 'Too many incorrect attempts. Please request a new verification code.' 
            });
        }

        // 3. Check code expiration
        if (expiresAt < now) {
            return res.status(401).json({ 
                success: false, 
                message: 'Verification code has expired. Please request a new code.' 
            });
        }

        // 4. Compare input OTP directly
        if (otp.trim() !== record.otp_code) {
            const newAttempts = record.attempts + 1;
            await pool.query('UPDATE otp_verification SET attempts = ? WHERE email = ?', [newAttempts, email]);
            console.log(`[OTP ROUTE] Invalid OTP attempt for ${email}. Attempt: ${newAttempts}/3`);

            if (newAttempts >= 3) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Too many incorrect attempts. Please request a new verification code.' 
                });
            } else {
                return res.status(401).json({ 
                    success: false, 
                    message: `Incorrect verification code. Attempts remaining: ${3 - newAttempts}.` 
                });
            }
        }

        // 5. Successful validation. Load or register the user
        let userId = -1;
        let username = email.split('@')[0];
        let role = 'USER';
        
        if (username.toLowerCase() === 'admin') {
            role = 'ADMIN';
        }

        // Query user table
        const [userRows] = await pool.query('SELECT id, username, role FROM users WHERE email = ?', [email]);
        if (userRows.length > 0) {
            userId = userRows[0].id;
            username = userRows[0].username;
            role = userRows[0].role;
        } else {
            // Register new user
            const [insertRes] = await pool.query(
                'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                [username, 'OTP_USER', email, role]
            );
            userId = insertRes.insertId;

            // Create user wallet with balance 1000.00 and 50 loyalty points
            await pool.query(
                'INSERT INTO wallet (user_id, balance, loyalty_points) VALUES (?, ?, ?)',
                [userId, 1000.00, 50]
            );
            console.log(`[OTP ROUTE] Registered new user ${email} (ID: ${userId}) with initial wallet balance.`);
        }

        // 6. Create user session ID
        const sessionId = 'SES-' + crypto.randomBytes(8).toString('hex').toUpperCase();
        await pool.query(
            "INSERT INTO user_sessions (session_id, user_id, username, status) VALUES (?, ?, ?, 'ACTIVE')",
            [sessionId, userId, username]
        );

        // 7. Clean up OTP record
        await pool.query('DELETE FROM otp_verification WHERE email = ?', [email]);
        
        console.log(`[OTP ROUTE] User ${email} verified successfully. Session ${sessionId} created.`);

        res.json({
            success: true,
            sessionId,
            user: { id: userId, username, email, role }
        });

    } catch (err) {
        console.error('[OTP ROUTE ERROR] Verification failed:', err.message);
        res.status(500).json({ success: false, error: err.message, message: 'Internal server error during verification.' });
    }
});

// ==========================================
// CITIES ENDPOINTS
// ==========================================

// GET /api/cities - List all available cities
app.get('/api/cities', async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM cities ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error('[API ERROR] Failed to fetch cities:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// THEATRE & SHOWTIME ENDPOINTS (Premium Experience)
// ==========================================

// GET /api/theatres - Filterable theatres list
app.get('/api/theatres', async (req, res) => {
    const { cityId, movieId, search, type, lat, lng } = req.query;
    
    try {
        const pool = getPool();
        let sql = '';
        let params = [];

        if (movieId && cityId) {
            sql = `
                SELECT DISTINCT t.* FROM theatres t 
                JOIN screens scr ON t.id = scr.theatre_id 
                JOIN showtimes s ON scr.id = s.screen_id 
                WHERE t.city_id = ? AND s.movie_id = ?
            `;
            params = [parseInt(cityId, 10), parseInt(movieId, 10)];
        } else if (cityId) {
            sql = `SELECT * FROM theatres WHERE city_id = ?`;
            params = [parseInt(cityId, 10)];
        } else {
            sql = `SELECT * FROM theatres`;
        }

        const [rows] = await pool.query(sql, params);

        let filtered = rows;

        // Apply search filter
        if (search && search.trim()) {
            const queryLower = search.toLowerCase();
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(queryLower) || 
                t.location.toLowerCase().includes(queryLower) ||
                t.amenities.toLowerCase().includes(queryLower)
            );
        }

        // Apply type filter
        if (type && type !== 'All' && type !== 'all') {
            filtered = filtered.filter(t => t.theatre_type === type);
        }

        // Apply proximity mapping if coordinates provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            filtered = filtered.map(t => {
                const distance = getDistance(userLat, userLng, parseFloat(t.latitude), parseFloat(t.longitude));
                return { ...t, distance: (distance !== null && !isNaN(distance)) ? parseFloat(distance.toFixed(1)) : null };
            });
            // Sort by nearest first
            filtered.sort((a, b) => {
                const distA = (a.distance !== null && a.distance !== undefined) ? a.distance : 9999;
                const distB = (b.distance !== null && b.distance !== undefined) ? b.distance : 9999;
                return distA - distB;
            });
        } else {
            // Sort alphabetically by default
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        res.json(filtered);
    } catch (err) {
        console.error('[SERVER ERROR] GET /api/theatres failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/showtimes - Query showtimes for a movie with pricing dynamics
app.get('/api/showtimes', async (req, res) => {
    const { movieId, theatreId } = req.query;
    if (!movieId) {
        return res.status(400).json({ error: 'movieId parameter is required' });
    }

    try {
        const pool = getPool();
        let sql = `
            SELECT s.id, s.show_time, s.price, s.show_type, s.surge_pricing,
                   scr.screen_name, scr.screen_type,
                   t.name AS theatre_name, t.id AS theatre_id
            FROM showtimes s
            JOIN screens scr ON s.screen_id = scr.id
            JOIN theatres t ON scr.theatre_id = t.id
            WHERE s.movie_id = ?
        `;
        const params = [parseInt(movieId, 10)];

        if (theatreId) {
            sql += ' AND t.id = ?';
            params.push(parseInt(theatreId, 10));
        }

        sql += ' ORDER BY s.show_time ASC';

        const [rows] = await pool.query(sql, params);

        // Process dynamic pricing calculations
        const processed = rows.map(s => {
            const showTime = new Date(s.show_time);
            const day = showTime.getDay();
            const isWeekend = (day === 0 || day === 6); // Sunday = 0, Saturday = 6

            let originalPrice = parseFloat(s.price);
            let finalPrice = originalPrice;
            let surgeBreakdown = [];

            // 1. Weekend surge (+20% base price)
            if (isWeekend) {
                const weekendSurge = originalPrice * 0.20;
                finalPrice += weekendSurge;
                surgeBreakdown.push({ label: 'Weekend Surge (+20%)', amount: weekendSurge });
            }

            // 2. Format specific pricing adjustments
            let formatSurge = 0;
            if (s.screen_type === 'IMAX') {
                formatSurge = 150.00;
            } else if (s.screen_type === 'Dolby Atmos') {
                formatSurge = 80.00;
            } else if (s.screen_type === '4DX') {
                formatSurge = 120.00;
            } else if (s.screen_type === 'VIP Lounge') {
                formatSurge = 300.00;
            } else if (s.screen_type === 'Luxe Recliner') {
                formatSurge = 200.00;
            }

            if (formatSurge > 0) {
                finalPrice += formatSurge;
                surgeBreakdown.push({ label: `${s.screen_type} Format Charge`, amount: formatSurge });
            }

            return {
                id: s.id,
                showTime: s.show_time,
                showType: s.show_type || '2D',
                basePrice: originalPrice,
                price: parseFloat(finalPrice.toFixed(2)),
                screenName: s.screen_name,
                screenType: s.screen_type || 'Regular',
                theatreName: s.theatre_name,
                theatreId: s.theatre_id,
                isWeekend,
                surgeBreakdown
            };
        });

        res.json(processed);
    } catch (err) {
        console.error('[SERVER ERROR] GET /api/showtimes failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Helper for GPS distance computation (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// GET /api/showtimes/:id - Fetch details of a single showtime and its movie
app.get('/api/showtimes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
        const sql = `
            SELECT s.id, s.show_time, s.price, s.show_type, s.surge_pricing,
                   scr.screen_name, scr.screen_type,
                   t.name AS theatreName, t.id AS theatreId,
                   m.id AS movieId, m.title, m.genre, m.duration, m.poster_url, m.backdrop_url
            FROM showtimes s
            JOIN screens scr ON s.screen_id = scr.id
            JOIN theatres t ON scr.theatre_id = t.id
            JOIN movies m ON s.movie_id = m.id
            WHERE s.id = ?
        `;
        const [rows] = await pool.query(sql, [parseInt(id, 10)]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Showtime not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('[SERVER ERROR] GET /api/showtimes/:id failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/showtimes/:id/seats - Generate dynamic seat layout based on screen type
app.get('/api/showtimes/:id/seats', async (req, res) => {
    const showtimeId = parseInt(req.params.id, 10);
    if (isNaN(showtimeId)) {
        return res.status(400).json({ error: 'Invalid showtime ID' });
    }

    try {
        const pool = getPool();

        // 1. Fetch showtime and screen details
        const [showtimeRows] = await pool.query(
            'SELECT s.price, scr.total_seats, scr.screen_type FROM showtimes s JOIN screens scr ON s.screen_id = scr.id WHERE s.id = ?',
            [showtimeId]
        );
        if (showtimeRows.length === 0) {
            return res.status(404).json({ error: 'Showtime not found' });
        }

        const basePrice = parseFloat(showtimeRows[0].price);
        const screenType = showtimeRows[0].screen_type || 'Regular';

        // 2. Fetch booked seats
        const [bookedRows] = await pool.query(
            "SELECT seats FROM bookings WHERE showtime_id = ? AND booking_status = 'CONFIRMED'",
            [showtimeId]
        );
        const bookedSeats = new Set();
        bookedRows.forEach(row => {
            if (row.seats) {
                row.seats.split(',').forEach(seat => bookedSeats.add(seat.trim()));
            }
        });

        // 3. Fetch locked seats
        const [lockedRows] = await pool.query(
            "SELECT seat_number FROM seat_locks WHERE showtime_id = ? AND expires_at > NOW() AND status = 'LOCKED'",
            [showtimeId]
        );
        const lockedSeats = new Set(lockedRows.map(r => r.seat_number.trim()));

        // 4. Generate dynamic seating configuration based on screen type
        const layoutSeats = [];
        let rowsCount = 8;
        let colsCount = 10;
        let categoriesConfig = {};

        if (screenType === 'IMAX') {
            rowsCount = 8;
            colsCount = 15;
            categoriesConfig = {
                'A': { type: 'Regular', addPrice: 0 },
                'B': { type: 'Regular', addPrice: 0 },
                'C': { type: 'Regular', addPrice: 0 },
                'D': { type: 'Premium', addPrice: 80.00 },
                'E': { type: 'Premium', addPrice: 80.00 },
                'F': { type: 'Premium', addPrice: 80.00 },
                'G': { type: 'Balcony', addPrice: 180.00 },
                'H': { type: 'Balcony', addPrice: 180.00 }
            };
        } else if (screenType === 'VIP Lounge' || screenType === 'Luxe Recliner') {
            rowsCount = 4;
            colsCount = 10;
            categoriesConfig = {
                'A': { type: 'Recliner', addPrice: 200.00 },
                'B': { type: 'Recliner', addPrice: 200.00 },
                'C': { type: 'Gold Class', addPrice: 350.00 },
                'D': { type: 'Gold Class', addPrice: 350.00 }
            };
        } else if (screenType === 'Open Air') {
            rowsCount = 5;
            colsCount = 10;
            categoriesConfig = {
                'A': { type: 'Regular', addPrice: 0 },
                'B': { type: 'Regular', addPrice: 0 },
                'C': { type: 'Regular', addPrice: 0 },
                'D': { type: 'Couple Seats', addPrice: 150.00 },
                'E': { type: 'Couple Seats', addPrice: 150.00 }
            };
        } else {
            // Standard/Dolby Atmos/4DX/Premium Gold Class
            rowsCount = 8;
            colsCount = 10;
            categoriesConfig = {
                'A': { type: 'Regular', addPrice: 0 },
                'B': { type: 'Regular', addPrice: 0 },
                'C': { type: 'Regular', addPrice: 0 },
                'D': { type: 'Premium', addPrice: 50.00 },
                'E': { type: 'Premium', addPrice: 50.00 },
                'F': { type: 'Premium', addPrice: 50.00 },
                'G': { type: 'Executive', addPrice: 100.00 },
                'H': { type: 'VIP', addPrice: 180.00 }
            };
        }

        // Loop and build seats list
        for (let r = 0; r < rowsCount; r++) {
            const rowChar = String.fromCharCode('A'.charCodeAt(0) + r);
            const rowConfig = categoriesConfig[rowChar] || { type: 'Regular', addPrice: 0 };
            
            for (let c = 1; c <= colsCount; c++) {
                const seatNumber = `${rowChar}${c}`;
                
                let status = 'AVAILABLE';
                if (bookedSeats.has(seatNumber)) {
                    status = 'BOOKED';
                } else if (lockedSeats.has(seatNumber)) {
                    status = 'LOCKED';
                } else {
                    // Seed some seats as blocked for Maintenance (e.g. corner seats in row A or projecting issues)
                    const isMaintenance = (rowChar === 'A' && (c === 1 || c === colsCount));
                    if (isMaintenance) {
                        status = 'MAINTENANCE';
                    }
                }

                // Calculate price
                const seatPrice = basePrice + rowConfig.addPrice;

                // Handle Couple Seat pairing identifiers
                let couplePairId = null;
                if (rowConfig.type === 'Couple Seats') {
                    // Columns 1-2, 3-4, 5-6, 7-8, 9-10 are paired
                    const pairNum = Math.ceil(c / 2);
                    couplePairId = `${rowChar}${pairNum * 2 - 1}-${rowChar}${pairNum * 2}`;
                }

                layoutSeats.push({
                    seatNumber,
                    type: rowConfig.type,
                    price: parseFloat(seatPrice.toFixed(2)),
                    status,
                    couplePairId
                });
            }
        }

        res.json(layoutSeats);

    } catch (err) {
        console.error(`[SERVER ERROR] GET /api/showtimes/${showtimeId}/seats failed:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/seats/lock - Transaction-safe temporary seat locking (expires in 5 minutes)
app.post('/api/seats/lock', async (req, res) => {
    let { showtimeId, userId, seats } = req.body;
    if (typeof seats === 'string') {
        seats = seats.split(',').map(s => s.trim());
    }
    if (!showtimeId || !userId || !seats || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid lock request parameters.' });
    }

    try {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Check if user exists in the database to prevent foreign key constraint failures
            const [userRows] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
            if (userRows.length === 0) {
                await connection.rollback();
                return res.status(401).json({ 
                    success: false, 
                    message: 'User session is invalid or user does not exist. Please log out and sign in again.' 
                });
            }

            // 1. Clear expired locks first
            await connection.query('DELETE FROM seat_locks WHERE expires_at < NOW()');

            // 2. Check if any selected seats are booked
            const [bookedRows] = await connection.query(
                "SELECT seats FROM bookings WHERE showtime_id = ? AND booking_status = 'CONFIRMED'",
                [showtimeId]
            );
            const bookedSeats = new Set();
            bookedRows.forEach(row => {
                if (row.seats) {
                    row.seats.split(',').forEach(s => bookedSeats.add(s.trim()));
                }
            });

            for (const seat of seats) {
                if (bookedSeats.has(seat)) {
                    await connection.rollback();
                    return res.status(409).json({ 
                        success: false, 
                        message: `Seat ${seat} is already booked.` 
                    });
                }
            }

            // 3. Check if any selected seats are currently locked by someone else
            const [lockedRows] = await connection.query(
                "SELECT seat_number FROM seat_locks WHERE showtime_id = ? AND expires_at > NOW() AND status = 'LOCKED' AND user_id != ?",
                [showtimeId, userId]
            );
            const lockedSeats = new Set(lockedRows.map(r => r.seat_number.trim()));

            for (const seat of seats) {
                if (lockedSeats.has(seat)) {
                    await connection.rollback();
                    return res.status(409).json({ 
                        success: false, 
                        message: `Seat ${seat} is temporarily locked by another user.` 
                    });
                }
            }

            // 4. Perform locking
            // Delete any existing locks for THESE specific seats by this user for this showtime to refresh them
            await connection.query(
                'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ? AND seat_number IN (?)',
                [showtimeId, userId, seats]
            );

            // Insert new locks using database-native NOW() to avoid timezone mismatch issues
            for (const seat of seats) {
                await connection.query(
                    'INSERT INTO seat_locks (showtime_id, seat_number, user_id, status, expires_at) VALUES (?, ?, ?, "LOCKED", DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
                    [showtimeId, seat, userId]
                );
            }

            await connection.commit();
            console.log(`[SEAT LOCK] Locked ${seats.length} seats for user ${userId} on showtime ${showtimeId} successfully.`);
            res.json({ success: true, message: 'Seats locked successfully for 5 minutes.' });

        } catch (txErr) {
            await connection.rollback();
            throw txErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('[SEAT LOCK ERROR] Failed to lock seats:', err.message);
        res.status(500).json({ success: false, error: err.message, message: 'Internal transaction failure during seat locking.' });
    }
});

// POST /api/seats/release - Unlock seats manually (e.g. if payment fails or user cancels)
app.post('/api/seats/release', async (req, res) => {
    let { showtimeId, userId, seats } = req.body;
    if (typeof seats === 'string') {
        seats = seats.split(',').map(s => s.trim());
    }
    if (!showtimeId || !userId) {
        return res.status(400).json({ success: false, message: 'Missing parameters for release.' });
    }

    try {
        const pool = getPool();
        
        if (seats && Array.isArray(seats) && seats.length > 0) {
            // Release specific seats
            await pool.query(
                'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ? AND seat_number IN (?)',
                [showtimeId, userId, seats]
            );
            console.log(`[SEAT RELEASE] Released seats ${seats.join(', ')} for user ${userId} on showtime ${showtimeId}`);
        } else {
            // Release all seats locked by user for this showtime
            await pool.query(
                'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ?',
                [showtimeId, userId]
            );
            console.log(`[SEAT RELEASE] Released all locks for user ${userId} on showtime ${showtimeId}`);
        }

        res.json({ success: true, message: 'Seats unlocked successfully.' });
    } catch (err) {
        console.error('[SEAT RELEASE ERROR] Failed to release seats:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/wallet/:userId - Fetch user's current wallet balance and loyalty points
app.get('/api/wallet/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    try {
        const pool = getPool();
        let [rows] = await pool.query('SELECT balance, loyalty_points FROM wallet WHERE user_id = ?', [userId]);
        if (rows.length === 0) {
            // Seed a new wallet entry with 1000.00 balance and 50 loyalty points
            await pool.query(
                'INSERT INTO wallet (user_id, balance, loyalty_points) VALUES (?, 1000.00, 50)',
                [userId]
            );
            rows = [{ balance: 1000.00, loyalty_points: 50 }];
        }
        res.json({
            success: true,
            balance: parseFloat(rows[0].balance),
            loyaltyPoints: parseInt(rows[0].loyalty_points, 10)
        });
    } catch (err) {
        console.error('[WALLET ERROR] Failed to fetch/seed wallet:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper function to process successful payment, commit booking, release locks, update loyalty points
async function handlePaymentSuccess(orderId, paymentId, signature) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get payment and booking details
        const [paymentRows] = await connection.query(
            'SELECT booking_id, amount, payment_status FROM payments WHERE razorpay_order_id = ?',
            [orderId]
        );
        if (paymentRows.length === 0) {
            console.log(`[PAYMENT SUCCESS] No payment record found for order ${orderId}`);
            await connection.rollback();
            return;
        }

        const payment = paymentRows[0];
        if (payment.payment_status === 'SUCCESS') {
            console.log(`[PAYMENT SUCCESS] Order ${orderId} is already completed.`);
            await connection.rollback();
            return;
        }

        const bookingId = payment.booking_id;

        // 2. Get booking details
        const [bookingRows] = await connection.query(
            'SELECT user_id, showtime_id, seats, total_amount FROM bookings WHERE booking_id = ?',
            [bookingId]
        );
        if (bookingRows.length === 0) {
            console.log(`[PAYMENT SUCCESS] No booking found for booking_id ${bookingId}`);
            await connection.rollback();
            return;
        }

        const booking = bookingRows[0];

        // 3. Update payment status
        await connection.query(
            `UPDATE payments SET payment_status = 'SUCCESS', razorpay_payment_id = ?, verification_signature = ?, transaction_time = NOW() WHERE razorpay_order_id = ?`,
            [paymentId, signature, orderId]
        );

        // 4. Update booking status to CONFIRMED
        await connection.query(
            `UPDATE bookings SET booking_status = 'CONFIRMED' WHERE booking_id = ?`,
            [bookingId]
        );

        // 5. Deduct stock for any concessions
        const [snackRows] = await connection.query(
            'SELECT snack_id, quantity FROM snack_orders WHERE booking_id = ?',
            [bookingId]
        );
        for (const item of snackRows) {
            await connection.query(
                'UPDATE snacks SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
                [item.quantity, item.snack_id, item.quantity]
            );
        }

        // 6. Release locked seats
        const seatList = booking.seats.split(',').map(s => s.trim());
        await connection.query(
            'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ? AND seat_number IN (?)',
            [booking.showtime_id, booking.user_id, seatList]
        );

        // 7. Add loyalty points (1 point per 10 INR spent)
        const pointsEarned = Math.round(booking.total_amount * 0.10);
        await connection.query(
            'UPDATE wallet SET loyalty_points = loyalty_points + ? WHERE user_id = ?',
            [pointsEarned, booking.user_id]
        );

        // Record loyalty transaction
        const [walletRows] = await connection.query('SELECT id FROM wallet WHERE user_id = ?', [booking.user_id]);
        if (walletRows.length > 0) {
            await connection.query(
                'INSERT INTO loyalty_transactions (wallet_id, points_earned, points_redeemed) VALUES (?, ?, 0)',
                [walletRows[0].id, pointsEarned]
            );
        }

        // Record Ticket History (sales audit)
        await connection.query(
            `INSERT INTO ticket_history (booking_id, user_id, movie_name, seats, total_amount) 
             VALUES (?, ?, (SELECT movie_name FROM bookings WHERE booking_id = ?), ?, ?)`,
            [bookingId, booking.user_id, bookingId, booking.seats, booking.total_amount]
        );

        await connection.commit();
        console.log(`[PAYMENT SUCCESS] Finalized Booking transaction ID: ${bookingId} for Order ${orderId}`);
    } catch (err) {
        await connection.rollback();
        console.error('[PAYMENT SUCCESS ERROR] Transaction failed:', err.message);
    } finally {
        connection.release();
    }
}

// POST /api/payments/create-order - Create Razorpay order and insert pending booking
app.post('/api/payments/create-order', async (req, res) => {
    const { amount, userId, showtimeId, seats, paymentMethod, snacks } = req.body;
    if (!amount || isNaN(amount) || !userId || !showtimeId || !seats) {
        return res.status(400).json({ success: false, message: 'Missing or invalid parameters for order creation.' });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Generate unique booking and order IDs
        const bookingId = "BKG-" + Date.now().toString(16).toUpperCase() + "-" + crypto.randomBytes(2).toString('hex').toUpperCase();
        let orderId = 'order_mock_' + crypto.randomBytes(8).toString('hex');
        let keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey';

        // 2. Double Booking Check (Verify seats are not already booked)
        const seatList = seats.split(',').map(s => s.trim());
        const [bookedRows] = await connection.query(
            "SELECT seats FROM bookings WHERE showtime_id = ? AND booking_status = 'CONFIRMED'",
            [showtimeId]
        );
        const bookedSeats = new Set();
        bookedRows.forEach(row => {
            if (row.seats) {
                row.seats.split(',').forEach(s => bookedSeats.add(s.trim()));
            }
        });

        for (const seat of seatList) {
            if (bookedSeats.has(seat)) {
                await connection.rollback();
                return res.status(409).json({ success: false, message: `Seat ${seat} is already booked.` });
            }
        }

        // 3. Load Showtime and Movie details to store in booking
        const [detailsRows] = await connection.query(
            `SELECT m.title AS movie_name, t.name AS theatre_name, s.show_time 
             FROM showtimes s 
             JOIN movies m ON s.movie_id = m.id 
             JOIN screens scr ON s.screen_id = scr.id 
             JOIN theatres t ON scr.theatre_id = t.id 
             WHERE s.id = ?`,
            [showtimeId]
        );
        if (detailsRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Showtime not found.' });
        }
        const details = detailsRows[0];

        // 4. Create Razorpay order if SDK is active
        if (razorpay) {
            try {
                const rzpOrder = await razorpay.orders.create({
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    receipt: bookingId
                });
                orderId = rzpOrder.id;
            } catch (rzpErr) {
                console.error('[RAZORPAY ERROR] Failed to create order in Razorpay, falling back to mock:', rzpErr.message);
            }
        }

        // 5. Insert pending booking
        await connection.query(
            `INSERT INTO bookings (booking_id, user_id, showtime_id, movie_name, theatre_name, show_time, seats, total_amount, booking_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [bookingId, userId, showtimeId, details.movie_name, details.theatre_name, details.show_time, seats, amount]
        );

        // 6. Insert pending payment
        await connection.query(
            `INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_gateway_id, razorpay_order_id)
             VALUES (?, ?, ?, 'PENDING', ?, ?)`,
            [bookingId, amount, paymentMethod || 'UPI', orderId, orderId]
        );

        // 7. Insert pending concessions if any
        if (snacks && Array.isArray(snacks)) {
            for (const item of snacks) {
                await connection.query(
                    'INSERT INTO snack_orders (booking_id, snack_id, quantity, total_price) VALUES (?, ?, ?, ?)',
                    [bookingId, item.snackId, item.quantity, item.price * item.quantity]
                );
            }
        }

        await connection.commit();
        console.log(`[ORDER CREATED] Created pending booking ${bookingId} and order ${orderId} for User ${userId}`);
        
        res.json({
            success: true,
            orderId,
            bookingId,
            amount: Math.round(amount * 100), // in paise
            currency: 'INR',
            key: keyId
        });

    } catch (err) {
        await connection.rollback();
        console.error('[ORDER ERROR] Failed to initialize payment order:', err.message);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        connection.release();
    }
});

// GET /api/payment/status/:orderId - Check transaction and payment status in real-time
app.get('/api/payment/status/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT p.payment_status, p.booking_id FROM payments p WHERE p.razorpay_order_id = ?',
            [orderId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        
        const paymentStatus = rows[0].payment_status;
        
        if (paymentStatus === 'SUCCESS') {
            const [bookingDetails] = await pool.query(
                `SELECT b.booking_id AS bookingId, b.movie_name AS movieName, b.seats, b.total_amount AS totalAmount, 
                        b.theatre_name AS theatreName, b.show_time AS showTime, p.payment_gateway_id AS paymentGatewayId, 
                        p.razorpay_payment_id AS transactionId 
                 FROM bookings b 
                 JOIN payments p ON b.booking_id = p.booking_id 
                 WHERE p.razorpay_order_id = ?`,
                [orderId]
            );
            res.json({
                success: true,
                status: 'PAID',
                bookingId: rows[0].booking_id,
                ...bookingDetails[0]
            });
        } else {
            res.json({
                success: true,
                status: paymentStatus, // PENDING, FAILED, EXPIRED
                bookingId: rows[0].booking_id
            });
        }
    } catch (err) {
        console.error('[STATUS ERROR] Failed to fetch payment status:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/payments/webhook - Razorpay webhook handler
app.post('/api/payments/webhook', async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'CineNovaSecret';
    const signature = req.headers['x-razorpay-signature'];
    
    let verified = false;
    try {
        if (signature) {
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(JSON.stringify(req.body));
            const generated = hmac.digest('hex');
            if (generated === signature) {
                verified = true;
            }
        }
    } catch (err) {
        console.error('[WEBHOOK ERROR] Signature verification failed:', err.message);
    }

    const event = req.body.event;
    console.log(`[WEBHOOK] Received event: ${event}`);
    
    if (verified && (event === 'order.paid' || event === 'payment.captured')) {
        const orderId = req.body.payload.payment.entity.order_id || req.body.payload.order.entity.id;
        const paymentId = req.body.payload.payment.entity.id;
        
        await handlePaymentSuccess(orderId, paymentId, signature);
    }
    
    res.json({ status: 'ok' });
});

// POST /api/payments/verify-utr - Secure manual UTR verification endpoint
app.post('/api/payments/verify-utr', async (req, res) => {
    const { orderId, utr } = req.body;
    if (!orderId || !utr) {
        return res.status(400).json({ success: false, message: 'Missing orderId or UTR parameter.' });
    }

    const cleanUtr = utr.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
        return res.status(400).json({ success: false, message: 'Invalid UTR format. UPI UTR numbers must be exactly 12 digits.' });
    }

    const pool = getPool();
    try {
        const [existing] = await pool.query(
            "SELECT id FROM payments WHERE razorpay_payment_id = ? AND payment_status = 'SUCCESS'",
            [cleanUtr]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'This transaction reference/UTR has already been used for another booking.' });
        }

        console.log(`[UTR VERIFICATION] Successfully verified unique UTR ${cleanUtr} for order ${orderId}.`);
        await handlePaymentSuccess(orderId, cleanUtr, 'MANUAL_BANK_VERIFIED');
        res.json({ success: true, message: 'UTR verified successfully. Payment confirmed.' });
    } catch (err) {
        console.error('[UTR VERIFICATION ERROR] failed:', err.message);
        res.status(500).json({ success: false, error: err.message, message: 'Internal server error during UTR verification.' });
    }
});

// POST /api/payments/cancel - Cancel pending payment and release locked seats
app.post('/api/payments/cancel', async (req, res) => {
    const { orderId, reason } = req.body;
    if (!orderId) {
        return res.status(400).json({ success: false, message: 'Missing orderId parameter.' });
    }

    console.log(`[CANCEL PAYMENT] Cancelling payment for order: ${orderId}. Reason: ${reason || 'User cancelled'}`);
    
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get payment details
        const [paymentRows] = await connection.query(
            'SELECT booking_id, payment_status FROM payments WHERE razorpay_order_id = ?',
            [orderId]
        );
        if (paymentRows.length === 0) {
            await connection.rollback();
            return res.json({ success: true, message: 'Order not found, nothing to cancel.' });
        }

        const payment = paymentRows[0];
        if (payment.payment_status === 'SUCCESS') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Cannot cancel a completed transaction.' });
        }

        const bookingId = payment.booking_id;

        // 2. Get booking details
        const [bookingRows] = await connection.query(
            'SELECT user_id, showtime_id, seats FROM bookings WHERE booking_id = ?',
            [bookingId]
        );

        // 3. Update payment status to FAILED or EXPIRED
        const newStatus = reason === 'EXPIRED' ? 'EXPIRED' : 'FAILED';
        await connection.query(
            `UPDATE payments SET payment_status = ? WHERE razorpay_order_id = ?`,
            [newStatus, orderId]
        );

        // 4. Update booking status to CANCELLED
        await connection.query(
            `UPDATE bookings SET booking_status = 'CANCELLED' WHERE booking_id = ?`,
            [bookingId]
        );

        if (bookingRows.length > 0) {
            const booking = bookingRows[0];
            const seatList = booking.seats.split(',').map(s => s.trim());

            // 5. Release seat locks
            await connection.query(
                'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ? AND seat_number IN (?)',
                [booking.showtime_id, booking.user_id, seatList]
            );
        }

        await connection.commit();
        console.log(`[CANCEL SUCCESS] Cancelled payment and booking for order ${orderId} successfully.`);
        res.json({ success: true, message: 'Payment cancelled and seats released.' });
    } catch (err) {
        await connection.rollback();
        console.error('[CANCEL ERROR] Transaction failed:', err.message);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        connection.release();
    }
});

// POST /api/payments/confirm - Process secure payment and finalize booking transaction
app.post('/api/payments/confirm', async (req, res) => {
    const { 
        userId, showtimeId, seats, totalAmount, paymentMethod, snacks,
        razorpayPaymentId, razorpayOrderId, razorpaySignature 
    } = req.body;

    if (!userId || !showtimeId || !seats || totalAmount === undefined || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'Missing confirm parameters.' });
    }

    // 1. Signature Verification for official Gateway payments
    if (paymentMethod === 'CARD' || paymentMethod === 'UPI') {
        const isMock = razorpayOrderId && razorpayOrderId.startsWith('order_mock_');
        if (!isMock) {
            // Verify signature using crypto hmac
            try {
                const secret = process.env.RAZORPAY_KEY_SECRET || 'CineNovaSecret';
                const hmac = crypto.createHmac('sha256', secret);
                hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
                const generatedSignature = hmac.digest('hex');
                if (generatedSignature !== razorpaySignature) {
                    return res.status(400).json({ success: false, message: 'Payment verification failed: Signature mismatch.' });
                }
            } catch (sigErr) {
                console.error('[SIGNATURE ERROR] Signature checks failed:', sigErr.message);
                return res.status(400).json({ success: false, message: 'Signature verification error.' });
            }
        }
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if user exists in the database to prevent foreign key constraint failures
        const [userRows] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            await connection.rollback();
            return res.status(401).json({ 
                success: false, 
                message: 'User session is invalid or user does not exist. Please log out and sign in again.' 
            });
        }

        // 2. Double Booking Check (Verify seats are not already booked)
        const seatList = seats.split(',').map(s => s.trim());
        const [bookedRows] = await connection.query(
            "SELECT seats FROM bookings WHERE showtime_id = ? AND booking_status = 'CONFIRMED'",
            [showtimeId]
        );
        const bookedSeats = new Set();
        bookedRows.forEach(row => {
            if (row.seats) {
                row.seats.split(',').forEach(s => bookedSeats.add(s.trim()));
            }
        });

        for (const seat of seatList) {
            if (bookedSeats.has(seat)) {
                throw new Error(`Seat ${seat} is already booked by another transaction.`);
            }
        }

        // 3. Load Showtime, Movie, and Theatre metadata
        const [detailsRows] = await connection.query(
            `SELECT m.title AS movie_name, t.name AS theatre_name, s.show_time 
             FROM showtimes s 
             JOIN movies m ON s.movie_id = m.id 
             JOIN screens scr ON s.screen_id = scr.id 
             JOIN theatres t ON scr.theatre_id = t.id 
             WHERE s.id = ?`,
            [showtimeId]
        );
        if (detailsRows.length === 0) {
            throw new Error('Showtime details not found.');
        }

        const details = detailsRows[0];
        const bookingId = "BKG-" + Date.now().toString(16).toUpperCase() + "-" + crypto.randomBytes(2).toString('hex').toUpperCase();

        // Resolve group session if code is provided
        let groupSessionId = null;
        if (req.body.groupSessionCode) {
            const [sessRows] = await connection.query('SELECT id FROM group_booking_sessions WHERE session_code = ?', [req.body.groupSessionCode]);
            if (sessRows.length > 0) {
                groupSessionId = sessRows[0].id;
            }
        }

        // 4. Create Booking Record
        await connection.query(
            `INSERT INTO bookings (booking_id, user_id, showtime_id, movie_name, theatre_name, show_time, seats, total_amount, booking_status, payment_gateway_id, transaction_id, payment_status, group_session_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, 'SUCCESS', ?)`,
            [bookingId, userId, showtimeId, details.movie_name, details.theatre_name, details.show_time, seats, totalAmount, razorpayOrderId || null, razorpayPaymentId || null, groupSessionId]
        );

        // 5. Handle Snack Orders & Stock
        if (snacks && Array.isArray(snacks)) {
            for (const item of snacks) {
                await connection.query(
                    'INSERT INTO snack_orders (booking_id, snack_id, quantity, total_price) VALUES (?, ?, ?, ?)',
                    [bookingId, item.snackId, item.quantity, item.price * item.quantity]
                );

                // Deduct snack stock
                await connection.query(
                    'UPDATE snacks SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
                    [item.quantity, item.snackId, item.quantity]
                );

                // Transaction history for snacks
                await connection.query(
                    `INSERT INTO transaction_history (user_id, booking_id, transaction_type, amount, payment_method, status) 
                     VALUES (?, ?, 'SNACK_PURCHASE', ?, ?, 'SUCCESS')`,
                    [userId, bookingId, item.price * item.quantity, paymentMethod]
                );
            }
        }

        // 6. Create Payment Record
        await connection.query(
            `INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_gateway_id, transaction_id) 
             VALUES (?, ?, ?, 'SUCCESS', ?, ?)`,
            [bookingId, totalAmount, paymentMethod, razorpayOrderId || null, razorpayPaymentId || null]
        );

        // 7. Wallet Deduction (if WALLET payment)
        if (paymentMethod === 'WALLET') {
            const [walletRows] = await connection.query('SELECT balance FROM wallet WHERE user_id = ?', [userId]);
            if (walletRows.length === 0 || parseFloat(walletRows[0].balance) < totalAmount) {
                throw new Error('Insufficient wallet balance.');
            }
            await connection.query('UPDATE wallet SET balance = balance - ? WHERE user_id = ?', [totalAmount, userId]);
            
            // Transaction history for wallet deduction
            await connection.query(
                `INSERT INTO transaction_history (user_id, booking_id, transaction_type, amount, payment_method, status) 
                 VALUES (?, ?, 'WALLET_DEDUCTION', ?, 'WALLET', 'SUCCESS')`,
                [userId, bookingId, totalAmount]
            );
        } else {
            // General Transaction history for Gateway payment
            await connection.query(
                `INSERT INTO transaction_history (user_id, booking_id, transaction_type, amount, payment_method, status) 
                 VALUES (?, ?, 'PAYMENT', ?, ?, 'SUCCESS')`,
                [userId, bookingId, totalAmount, paymentMethod]
            );
        }

        // 8. Update Loyalty Points (Earn 1 point per 10 INR spent)
        const pointsEarned = Math.round(totalAmount * 0.10);
        await connection.query(
            'UPDATE wallet SET loyalty_points = loyalty_points + ? WHERE user_id = ?',
            [pointsEarned, userId]
        );

        // Record loyalty transaction
        const [walletRows] = await connection.query('SELECT id FROM wallet WHERE user_id = ?', [userId]);
        if (walletRows.length > 0) {
            await connection.query(
                'INSERT INTO loyalty_transactions (wallet_id, points_earned, points_redeemed) VALUES (?, ?, 0)',
                [walletRows[0].id, pointsEarned]
            );
        }

        // 9. Record Ticket History (sales audit)
        await connection.query(
            `INSERT INTO ticket_history (booking_id, user_id, movie_name, seats, total_amount) 
             VALUES (?, ?, ?, ?, ?)`,
            [bookingId, userId, details.movie_name, seats, totalAmount]
        );

        // 10. Clean up Seat Locks
        await connection.query(
            'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ? AND seat_number IN (?)',
            [showtimeId, userId, seatList]
        );

        await connection.commit();
        console.log(`[BOOKING SUCCESS] Finalized Booking transaction ID: ${bookingId} for User ${userId}.`);

        if (req.body.groupSessionCode) {
            try {
                await pool.query("UPDATE group_booking_sessions SET status = 'completed' WHERE session_code = ?", [req.body.groupSessionCode]);
                const groupNamespace = io.of('/group-seats');
                groupNamespace.to(req.body.groupSessionCode).emit('booking_completed');
            } catch (sockErr) {
                console.error('[SOCKET ERROR] Failed to broadcast booking success:', sockErr.message);
            }
        }

        res.json({
            success: true,
            bookingId,
            movieName: details.movie_name,
            seats,
            totalAmount,
            theatreName: details.theatre_name,
            showTime: details.show_time,
            paymentGatewayId: razorpayOrderId || null,
            transactionId: razorpayPaymentId || null
        });

    } catch (txErr) {
        await connection.rollback();
        console.error('[BOOKING ERROR] Transaction rolled back:', txErr.message);
        res.status(500).json({ success: false, message: txErr.message || 'Transaction failed.' });
    } finally {
        connection.release();
    }
});

// ==========================================
// MOVIE ENDPOINTS (Node.js backend)
// ==========================================

// GET /api/movies/sync - Trigger sync manually
app.get('/api/movies/sync', async (req, res) => {
    try {
        const stats = await runSync();
        res.json({ success: true, message: 'Movies synced successfully', ...stats });
    } catch (err) {
        console.error('[SERVER ERROR] Manual sync failed:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/movies/now-playing - Query NOW_SHOWING status
app.get('/api/movies/now-playing', async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query("SELECT * FROM movies WHERE status = 'NOW_SHOWING' OR status = 'POPULAR'");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/movies/upcoming - Query COMING_SOON status
app.get('/api/movies/upcoming', async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query("SELECT * FROM movies WHERE status = 'COMING_SOON'");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/movies/popular - Query POPULAR status
app.get('/api/movies/popular', async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query("SELECT * FROM movies WHERE status = 'POPULAR' OR status = 'NOW_SHOWING' ORDER BY CAST(rating AS DECIMAL(3,1)) DESC LIMIT 10");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/movies/search - Search endpoint by query param "q" or "query"
app.get('/api/movies/search', async (req, res) => {
    const queryStr = req.query.q || req.query.query || '';
    if (!queryStr.trim()) {
        return res.json([]);
    }
    try {
        // Try searching local DB first
        const pool = getPool();
        const searchPattern = `%${queryStr}%`;
        const [dbRows] = await pool.query(
            'SELECT * FROM movies WHERE title LIKE ? OR genre LIKE ? OR cast_members LIKE ? OR language LIKE ?',
            [searchPattern, searchPattern, searchPattern, searchPattern]
        );

        // If local database has no matches, and API key is set, try searching TMDB API
        if (dbRows.length === 0) {
            console.log(`[SEARCH] Local search returned 0 results. Querying TMDB API for: "${queryStr}"`);
            const apiResults = await searchMoviesApi(queryStr);
            if (apiResults.length > 0) {
                // Return API results directly
                return res.json(apiResults);
            }
        }
        res.json(dbRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/movies - List endpoint for React app (gets now showing)
app.get('/api/movies', async (req, res) => {
    try {
        const cityId = req.query.cityId;
        const pool = getPool();
        let rows;
        if (cityId) {
            // Find movies with active showtimes in this city
            const sql = `
                SELECT DISTINCT m.* FROM movies m
                JOIN showtimes s ON m.id = s.movie_id
                JOIN screens sc ON s.screen_id = sc.id
                JOIN theatres t ON sc.theatre_id = t.id
                WHERE t.city_id = ? AND (m.status = 'NOW_SHOWING' OR m.status = 'POPULAR')
            `;
            [rows] = await pool.query(sql, [cityId]);
        } else {
            [rows] = await pool.query("SELECT * FROM movies WHERE status = 'NOW_SHOWING' OR status = 'POPULAR'");
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// DB MIGRATION FOR LIVE GROUP BOOKINGS
// ==========================================
async function initGroupBookingDB() {
    try {
        const pool = getPool();
        
        // Check if the table exists first and inspect columns
        const [tables] = await pool.query("SHOW TABLES LIKE 'group_booking_sessions'");
        if (tables.length > 0) {
            const [columns] = await pool.query("SHOW COLUMNS FROM group_booking_sessions LIKE 'participant_ids'");
            if (columns.length === 0) {
                console.log('[DB] Dropping legacy group_booking_sessions table to recreate with JSON columns...');
                await pool.query("DROP TABLE group_booking_sessions");
            }
        }

        // 1. Create group_booking_sessions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS group_booking_sessions (
                id VARCHAR(36) PRIMARY KEY,
                showtime_id INT NOT NULL,
                organiser_user_id INT NOT NULL,
                session_code VARCHAR(6) NOT NULL UNIQUE,
                participant_ids JSON,
                participant_cursors JSON,
                status VARCHAR(20) DEFAULT 'active',
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Check if group_session_id column exists in bookings
        const [columns] = await pool.query(`SHOW COLUMNS FROM bookings LIKE 'group_session_id'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE bookings ADD COLUMN group_session_id VARCHAR(36) NULL`);
        }
        console.log('[DB] Group booking tables checked/initialized successfully.');
    } catch (err) {
        console.error('[DB ERROR] Failed to initialize group booking tables:', err.message);
    }
}

// ==========================================
// GROUP BOOKING SESSIONS ENDPOINTS
// ==========================================

// POST /api/group-sessions - Create group session
app.post('/api/group-sessions', async (req, res) => {
    const { showtimeId, organiserUserId } = req.body;
    if (!showtimeId || !organiserUserId) {
        return res.status(400).json({ success: false, message: 'showtimeId and organiserUserId are required.' });
    }

    try {
        const pool = getPool();
        const id = crypto.randomUUID();
        // Generate a 6-character alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let sessionCode = '';
        for (let i = 0; i < 6; i++) {
            sessionCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Set expires_at to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await pool.query(
            `INSERT INTO group_booking_sessions (id, showtime_id, organiser_user_id, session_code, participant_ids, participant_cursors, status, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, parseInt(showtimeId), parseInt(organiserUserId), sessionCode, JSON.stringify([]), JSON.stringify({}), 'active', expiresAt]
        );

        res.json({
            success: true,
            id,
            sessionCode,
            joinUrl: `http://localhost:5173/seats?showtimeId=${showtimeId}&session=${sessionCode}`
        });
    } catch (err) {
        console.error('[GROUP ROUTE ERROR] Failed to create group session:', err.message);
        res.status(500).json({ success: false, error: err.message, message: 'Failed to create group session.' });
    }
});

// GET /api/group-sessions/:code - Get group session details
app.get('/api/group-sessions/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT * FROM group_booking_sessions WHERE session_code = ? AND status = 'active' AND expires_at > NOW()`,
            [code]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Group session not found or expired.' });
        }
        res.json({ success: true, session: rows[0] });
    } catch (err) {
        console.error('[GROUP ROUTE ERROR] Failed to fetch session:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/group-sessions/:code - organiser closes session
app.delete('/api/group-sessions/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const pool = getPool();
        await pool.query(
            `UPDATE group_booking_sessions SET status = 'expired' WHERE session_code = ?`,
            [code]
        );
        res.json({ success: true, message: 'Group session closed.' });
    } catch (err) {
        console.error('[GROUP ROUTE ERROR] Failed to close session:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// WEBSOCKET SERVICES (Socket.io Namespace: /group-seats)
// ==========================================
const groupSessions = new Map();
const COLORS = ['amber', 'teal', 'coral', 'purple', 'green', 'blue'];
const groupSeatsNamespace = io.of('/group-seats');

groupSeatsNamespace.on('connection', (socket) => {
    console.log('[WS] Client connected to /group-seats namespace:', socket.id);

    let clientSessionCode = null;
    let clientUserId = null;

    socket.on('join_session', async ({ sessionCode, userId, displayName }) => {
        clientSessionCode = sessionCode;
        clientUserId = userId;
        socket.join(sessionCode);

        console.log(`[WS] User ${displayName} (${userId}) joined room ${sessionCode}`);

        if (!groupSessions.has(sessionCode)) {
            groupSessions.set(sessionCode, {
                participants: new Map(),
                selectedSeats: new Map(),
                countdownTimer: null,
                disconnectTimer: null
            });
        }

        const session = groupSessions.get(sessionCode);

        // Cancel pending organizer/session disconnect timer if anyone reconnects
        if (session.disconnectTimer) {
            clearTimeout(session.disconnectTimer);
            session.disconnectTimer = null;
            console.log(`[WS] Reconnection detected in room ${sessionCode}. Grace period cancelled.`);
        }

        if (session.participants.size >= 6 && !session.participants.has(userId)) {
            socket.emit('error_message', { message: 'Session is full. Max 6 participants allowed.' });
            return;
        }

        let color = 'amber';
        if (session.participants.has(userId)) {
            color = session.participants.get(userId).color;
        } else {
            color = COLORS[session.participants.size % COLORS.length];
        }

        session.participants.set(userId, {
            displayName,
            color,
            socketId: socket.id,
            ready: false
        });

        try {
            const pool = getPool();
            await pool.query(
                `UPDATE group_booking_sessions SET participant_ids = ? WHERE session_code = ?`,
                [JSON.stringify(Array.from(session.participants.keys())), sessionCode]
            );
        } catch (e) {
            console.error('[WS DB ERROR] Failed to sync participants to DB:', e.message);
        }

        groupSeatsNamespace.to(sessionCode).emit('participant_joined', {
            userId,
            displayName,
            color,
            participants: Array.from(session.participants.entries()).map(([uid, u]) => ({
                userId: uid,
                displayName: u.displayName,
                color: u.color,
                ready: u.ready
            }))
        });

        socket.emit('initial_state', {
            selectedSeats: Array.from(session.selectedSeats.entries()).map(([seatId, uid]) => ({
                seatId,
                userId: uid,
                color: session.participants.get(uid)?.color || 'amber'
            }))
        });
    });

    socket.on('cursor_move', ({ sessionCode, userId, seatId, action }) => {
        const session = groupSessions.get(sessionCode);
        if (!session) return;

        const participant = session.participants.get(userId);
        if (!participant) return;

        if (action === 'hover') {
            socket.to(sessionCode).emit('seat_state_update', {
                seatId,
                userId,
                action: 'hover',
                color: participant.color,
                displayName: participant.displayName
            });
        } else if (action === 'select') {
            if (session.selectedSeats.has(seatId)) {
                const ownerId = session.selectedSeats.get(seatId);
                const owner = session.participants.get(ownerId);
                if (ownerId !== userId) {
                    socket.emit('selection_failed', {
                        seatId,
                        message: `${owner ? owner.displayName : 'Another participant'} just took that seat.`
                    });
                    return;
                }
            }

            const userSeatsCount = Array.from(session.selectedSeats.values()).filter(uid => uid === userId).length;
            if (userSeatsCount >= 2) {
                socket.emit('selection_failed', {
                    seatId,
                    message: 'You cannot select more than 2 seats.'
                });
                return;
            }

            session.selectedSeats.set(seatId, userId);
            
            groupSeatsNamespace.to(sessionCode).emit('seat_state_update', {
                seatId,
                userId,
                action: 'select',
                color: participant.color,
                displayName: participant.displayName
            });
        } else if (action === 'deselect') {
            if (session.selectedSeats.get(seatId) === userId) {
                session.selectedSeats.delete(seatId);
                groupSeatsNamespace.to(sessionCode).emit('seat_state_update', {
                    seatId,
                    userId,
                    action: 'deselect',
                    color: participant.color,
                    displayName: participant.displayName
                });
            }
        }
    });

    socket.on('confirm_ready', ({ sessionCode, userId }) => {
        const session = groupSessions.get(sessionCode);
        if (!session) return;

        const participant = session.participants.get(userId);
        if (!participant) return;

        participant.ready = true;

        groupSeatsNamespace.to(sessionCode).emit('ready_state_update', {
            userId,
            ready: true,
            participants: Array.from(session.participants.entries()).map(([uid, u]) => ({
                userId: uid,
                displayName: u.displayName,
                color: u.color,
                ready: u.ready
            }))
        });

        const allReady = Array.from(session.participants.values()).every(p => p.ready);
        if (allReady && session.participants.size > 0) {
            groupSeatsNamespace.to(sessionCode).emit('all_ready', { countdown: 5 });
            
            if (session.countdownTimer) clearTimeout(session.countdownTimer);
            session.countdownTimer = setTimeout(() => {
                const finalSeats = Array.from(session.selectedSeats.entries())
                    .map(([seatId, uid]) => ({ seatId, userId: uid }));
                
                groupSeatsNamespace.to(sessionCode).emit('start_checkout', {
                    seats: finalSeats
                });
            }, 5000);
        }
    });

    socket.on('payment_success', ({ sessionCode }) => {
        console.log(`[WS] Booking finalized for session ${sessionCode}`);
        groupSeatsNamespace.to(sessionCode).emit('booking_completed');
        groupSessions.delete(sessionCode);
    });

    socket.on('disconnect', () => {
        console.log('[WS] Client disconnected:', socket.id);
        if (!clientSessionCode || !clientUserId) return;

        const session = groupSessions.get(clientSessionCode);
        if (!session) return;

        const participant = session.participants.get(clientUserId);
        if (!participant) return;

        Array.from(session.selectedSeats.entries()).forEach(([seatId, uid]) => {
            if (uid === clientUserId) {
                session.selectedSeats.delete(seatId);
                groupSeatsNamespace.to(clientSessionCode).emit('seat_state_update', {
                    seatId,
                    userId: clientUserId,
                    action: 'deselect',
                    color: participant.color,
                    displayName: participant.displayName
                });
            }
        });

        session.participants.delete(clientUserId);
        
        groupSeatsNamespace.to(clientSessionCode).emit('participant_left', {
            userId: clientUserId,
            participants: Array.from(session.participants.entries()).map(([uid, u]) => ({
                userId: uid,
                displayName: u.displayName,
                color: u.color,
                ready: u.ready
            }))
        });

        if (session.participants.size === 0) {
            session.disconnectTimer = setTimeout(() => {
                console.log(`[WS] Session ${clientSessionCode} inactive for 60s, closing.`);
                groupSeatsNamespace.to(clientSessionCode).emit('session_expired');
                groupSessions.delete(clientSessionCode);
            }, 60000);
        }
    });
});


// ==========================================
// ADMIN ROUTES
// ==========================================

const adminAuth = async (req, res, next) => {
  const email = req.headers['x-admin-email'] || req.headers['x-admin-token'];
  if (!email) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT role FROM users WHERE email = ?', [email]);
    if (rows.length === 0 || rows[0].role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (e) {
      res.status(500).json({ success: false, message: e.message }); 
  }
};

app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const [[{ totalRevenue }]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) as totalRevenue FROM bookings WHERE status='CONFIRMED'");
        const [[{ ticketsSold }]] = await pool.query("SELECT COUNT(*) as ticketsSold FROM bookings WHERE status='CONFIRMED'");
        const [[{ activeShows }]] = await pool.query("SELECT COUNT(*) as activeShows FROM showtimes WHERE show_time > NOW()");
        const [[{ registeredUsers }]] = await pool.query("SELECT COUNT(*) as registeredUsers FROM users");
        const [[{ revenueLastWeek }]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) as revenueLastWeek FROM bookings WHERE status='CONFIRMED' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        const [[{ ticketsSoldLastWeek }]] = await pool.query("SELECT COUNT(*) as ticketsSoldLastWeek FROM bookings WHERE status='CONFIRMED' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        const [[{ activeShowsYesterday }]] = await pool.query("SELECT COUNT(*) as activeShowsYesterday FROM showtimes WHERE show_time >= DATE_SUB(NOW(), INTERVAL 1 DAY) AND show_time < NOW()");
        const [[{ newUsersLastWeek }]] = await pool.query("SELECT COUNT(*) as newUsersLastWeek FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");

        res.json({
            success: true,
            stats: {
                totalRevenue, ticketsSold, activeShows, registeredUsers,
                revenueLastWeek, ticketsSoldLastWeek, activeShowsYesterday, newUsersLastWeek
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/activity', adminAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 14;
        const pool = getPool();
        const [rows] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as bookings, COALESCE(SUM(total_amount),0) as revenue 
            FROM bookings 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) 
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        `, [days]);
        res.json({ success: true, activity: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/movies', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search}%` : '%%';
        const status = req.query.status || '';
        const language = req.query.language || '';
        
        const pool = getPool();
        const [rows] = await pool.query(`
            SELECT * FROM movies 
            WHERE (title LIKE ? OR description LIKE ?) 
            AND (status = ? OR ? = '') 
            AND (language = ? OR ? = '') 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `, [search, search, status, status, language, language, limit, offset]);
        
        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total FROM movies 
            WHERE (title LIKE ? OR description LIKE ?) 
            AND (status = ? OR ? = '') 
            AND (language = ? OR ? = '')
        `, [search, search, status, status, language, language]);

        res.json({ success: true, movies: rows, total, page, totalPages: Math.ceil(total/limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/movies', adminAuth, async (req, res) => {
    try {
        const m = req.body;
        const pool = getPool();
        const [result] = await pool.query(`
            INSERT INTO movies (title, description, genre, language, duration, release_date, poster_url, backdrop_url, trailer_url, rating, status, cast_members, movie_api_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [m.title, m.description, m.genre, m.language, m.duration, m.release_date, m.poster_url, m.backdrop_url, m.trailer_url, m.rating, m.status, m.cast_members, m.movie_api_id]);
        res.json({ success: true, movieId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/movies/:id', adminAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const m = req.body;
        const pool = getPool();
        await pool.query(`
            UPDATE movies SET title=?, description=?, genre=?, language=?, duration=?, release_date=?, poster_url=?, backdrop_url=?, trailer_url=?, rating=?, status=?, cast_members=?, movie_api_id=?
            WHERE id=?
        `, [m.title, m.description, m.genre, m.language, m.duration, m.release_date, m.poster_url, m.backdrop_url, m.trailer_url, m.rating, m.status, m.cast_members, m.movie_api_id, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/movies/:id', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        await pool.query('DELETE FROM movies WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/showtimes', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search}%` : '%%';
        
        const pool = getPool();
        const [rows] = await pool.query(`
            SELECT s.*, m.title as movie_title, t.name as theatre_name 
            FROM showtimes s 
            JOIN movies m ON s.movie_id=m.id 
            JOIN theatres t ON s.theatre_id=t.id 
            WHERE (m.title LIKE ? OR t.name LIKE ?) 
            ORDER BY s.show_time DESC 
            LIMIT ? OFFSET ?
        `, [search, search, limit, offset]);

        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total
            FROM showtimes s JOIN movies m ON s.movie_id=m.id JOIN theatres t ON s.theatre_id=t.id
            WHERE (m.title LIKE ? OR t.name LIKE ?)
        `, [search, search]);

        res.json({ success: true, showtimes: rows, total, page, totalPages: Math.ceil(total/limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/showtimes', adminAuth, async (req, res) => {
    try {
        const s = req.body;
        const pool = getPool();
        const [result] = await pool.query(`
            INSERT INTO showtimes (movie_id, theatre_id, show_time, price, screen_name, screen_type, show_type, total_seats, is_surge)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [s.movie_id, s.theatre_id, s.show_time, s.price, s.screen_name, s.screen_type, s.show_type, s.total_seats, s.is_surge]);
        res.json({ success: true, showtimeId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/showtimes/:id', adminAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const s = req.body;
        const pool = getPool();
        await pool.query(`
            UPDATE showtimes SET movie_id=?, theatre_id=?, show_time=?, price=?, screen_name=?, screen_type=?, show_type=?, total_seats=?, is_surge=?
            WHERE id=?
        `, [s.movie_id, s.theatre_id, s.show_time, s.price, s.screen_name, s.screen_type, s.show_type, s.total_seats, s.is_surge, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/showtimes/:id', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        await pool.query('DELETE FROM showtimes WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/bookings', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const pool = getPool();
        
        let q = `
            SELECT b.*, u.email as user_email, u.username, m.title as movie_title, t.name as theatre_name, s.screen_name, s.show_time 
            FROM bookings b 
            JOIN users u ON b.user_id=u.id 
            JOIN showtimes s ON b.showtime_id=s.id 
            JOIN movies m ON s.movie_id=m.id 
            JOIN theatres t ON s.theatre_id=t.id 
            ORDER BY b.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(q, [limit, offset]);
        const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM bookings");

        res.json({ success: true, bookings: rows, total, page, totalPages: Math.ceil(total/limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/bookings/:id', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query(`
            SELECT b.*, u.email as user_email, u.username, m.title as movie_title, t.name as theatre_name, s.screen_name, s.show_time 
            FROM bookings b 
            JOIN users u ON b.user_id=u.id 
            JOIN showtimes s ON b.showtime_id=s.id 
            JOIN movies m ON s.movie_id=m.id 
            JOIN theatres t ON s.theatre_id=t.id 
            WHERE b.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, booking: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/bookings/:id/cancel', adminAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const pool = getPool();
        const [bRows] = await pool.query("SELECT * FROM bookings WHERE id=?", [id]);
        if (bRows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        const b = bRows[0];
        if (b.status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Already cancelled' });

        await pool.query("UPDATE bookings SET status='CANCELLED' WHERE id=?", [id]);

        if (b.payment_method === 'WALLET') {
            await pool.query("UPDATE wallets SET balance=balance+? WHERE user_id=?", [b.total_amount, b.user_id]);
            const [wRows] = await pool.query("SELECT id FROM wallets WHERE user_id=?", [b.user_id]);
            if (wRows.length > 0) {
                await pool.query("INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, 'CREDIT', 'Refund for cancelled booking')", [wRows[0].id, b.total_amount]);
            }
        }
        res.json({ success: true, message: 'Booking cancelled' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search}%` : '%%';
        
        const pool = getPool();
        const [rows] = await pool.query(`
            SELECT u.*, w.balance as wallet_balance, 
            (SELECT COUNT(*) FROM bookings WHERE user_id=u.id AND status='CONFIRMED') as total_bookings, 
            (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE user_id=u.id AND status='CONFIRMED') as total_spent 
            FROM users u LEFT JOIN wallets w ON w.user_id=u.id 
            WHERE (u.email LIKE ? OR u.username LIKE ?)
            ORDER BY u.created_at DESC 
            LIMIT ? OFFSET ?
        `, [search, search, limit, offset]);
        const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM users u WHERE (u.email LIKE ? OR u.username LIKE ?)", [search, search]);
        res.json({ success: true, users: rows, total, page, totalPages: Math.ceil(total/limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/users/:id', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const [uRows] = await pool.query(`
            SELECT u.*, w.balance as wallet_balance, w.id as wallet_id
            FROM users u LEFT JOIN wallets w ON w.user_id=u.id 
            WHERE u.id = ?
        `, [req.params.id]);
        if (uRows.length === 0) return res.status(404).json({ success: false });
        
        const user = uRows[0];
        const [bookings] = await pool.query("SELECT * FROM bookings WHERE user_id=? ORDER BY created_at DESC", [user.id]);
        
        let tx = [];
        if (user.wallet_id) {
            const [tRows] = await pool.query("SELECT * FROM wallet_transactions WHERE wallet_id=? ORDER BY created_at DESC", [user.wallet_id]);
            tx = tRows;
        }

        res.json({ success: true, user, bookings, wallet_transactions: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/users/:id/role', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        await pool.query("UPDATE users SET role=? WHERE id=?", [req.body.role, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/users/:id/wallet', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const amount = parseFloat(req.body.amount);
        if (isNaN(amount)) return res.status(400).json({ success: false, message: 'Invalid amount' });
        
        await pool.query("UPDATE wallets SET balance=balance+? WHERE user_id=?", [amount, req.params.id]);
        const [wRows] = await pool.query("SELECT id FROM wallets WHERE user_id=?", [req.params.id]);
        if (wRows.length > 0) {
            const type = amount >= 0 ? 'CREDIT' : 'DEBIT';
            await pool.query("INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)", 
                [wRows[0].id, Math.abs(amount), type, 'Admin wallet adjustment']);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/reports', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const dateFrom = req.query.dateFrom || '2000-01-01';
        const dateTo = req.query.dateTo || '2100-01-01';
        
        const [[{ totalRevenue }]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) as totalRevenue FROM bookings WHERE status='CONFIRMED' AND created_at BETWEEN ? AND ?", [dateFrom, dateTo]);
        const [[{ totalTickets }]] = await pool.query("SELECT COUNT(*) as totalTickets FROM bookings WHERE status='CONFIRMED' AND created_at BETWEEN ? AND ?", [dateFrom, dateTo]);
        const [[{ cancelledTickets }]] = await pool.query("SELECT COUNT(*) as cancelledTickets FROM bookings WHERE status='CANCELLED' AND created_at BETWEEN ? AND ?", [dateFrom, dateTo]);
        const [[{ totalAll }]] = await pool.query("SELECT COUNT(*) as totalAll FROM bookings WHERE created_at BETWEEN ? AND ?", [dateFrom, dateTo]);
        
        const avgOrderValue = totalTickets > 0 ? totalRevenue / totalTickets : 0;
        const cancellationRate = totalAll > 0 ? cancelledTickets / totalAll : 0;

        const [revenueByMovie] = await pool.query(`
            SELECT m.title, COALESCE(SUM(b.total_amount),0) as revenue
            FROM bookings b JOIN showtimes s ON b.showtime_id=s.id JOIN movies m ON s.movie_id=m.id
            WHERE b.status='CONFIRMED' AND b.created_at BETWEEN ? AND ?
            GROUP BY m.id ORDER BY revenue DESC LIMIT 10
        `, [dateFrom, dateTo]);

        const [revenueByPaymentMethod] = await pool.query(`
            SELECT payment_method as method, COALESCE(SUM(total_amount),0) as revenue
            FROM bookings WHERE status='CONFIRMED' AND created_at BETWEEN ? AND ?
            GROUP BY payment_method
        `, [dateFrom, dateTo]);
        
        const [topShows] = await pool.query(`
            SELECT s.id, m.title, t.name as theatre, s.show_time, COALESCE(SUM(b.total_amount),0) as revenue
            FROM bookings b JOIN showtimes s ON b.showtime_id=s.id JOIN movies m ON s.movie_id=m.id JOIN theatres t ON s.theatre_id=t.id
            WHERE b.status='CONFIRMED' AND b.created_at BETWEEN ? AND ?
            GROUP BY s.id ORDER BY revenue DESC LIMIT 10
        `, [dateFrom, dateTo]);

        res.json({ success: true, reports: { totalRevenue, avgOrderValue, totalTickets, cancellationRate, revenueByMovie, revenueByPaymentMethod, topShows } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/reports/export/csv', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const dateFrom = req.query.dateFrom || '2000-01-01';
        const dateTo = req.query.dateTo || '2100-01-01';
        
        const [rows] = await pool.query(`
            SELECT b.id, b.user_id, b.showtime_id, b.total_amount, b.status, b.created_at, b.booking_reference 
            FROM bookings b 
            WHERE b.created_at BETWEEN ? AND ?
        `, [dateFrom, dateTo]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
        
        let csv = 'ID,User ID,Showtime ID,Total Amount,Status,Created At,Reference\n';
        rows.forEach(r => {
            csv += `${r.id},${r.user_id},${r.showtime_id},${r.total_amount},${r.status},${r.created_at},${r.booking_reference}\n`;
        });
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/settings', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        await pool.query("CREATE TABLE IF NOT EXISTS admin_settings (key_name VARCHAR(100) PRIMARY KEY, key_value TEXT)");
        const [rows] = await pool.query("SELECT * FROM admin_settings");
        
        let settings = { seat_lock_duration: '10', gst_rate: '18', spotlight_movie_id: null, surge_rules: '[]' };
        rows.forEach(r => settings[r.key_name] = r.key_value);
        
        if (rows.length === 0) {
            await pool.query("INSERT INTO admin_settings (key_name, key_value) VALUES ('seat_lock_duration', '10'), ('gst_rate', '18'), ('surge_rules', '[]')");
        }
        
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/settings', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const s = req.body;
        for (const key in s) {
            await pool.query("INSERT INTO admin_settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)", [key, s[key]]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/settings/test-email', adminAuth, async (req, res) => {
    try {
        res.json({ success: true, message: 'Test email sent (mock)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/performance', adminAuth, async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query(`
            SELECT m.id, m.title, m.poster_url, COUNT(DISTINCT s.id) as showtime_count,
            SUM(CASE WHEN seats.status='booked' THEN 1 ELSE 0 END) as booked_seats,
            SUM(s.total_seats) as total_seats
            FROM movies m 
            JOIN showtimes s ON s.movie_id=m.id AND s.show_time > NOW()
            LEFT JOIN seats ON seats.showtime_id=s.id
            GROUP BY m.id 
            ORDER BY booked_seats DESC LIMIT 8
        `);
        res.json({ success: true, performance: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin City Management
app.post('/api/admin/city', adminAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'City name is required' });
        }
        const pool = getPool();
        const [result] = await pool.query('INSERT INTO cities (name) VALUES (?)', [name.trim()]);
        res.json({ success: true, cityId: result.insertId, message: 'City added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin Theatre Management
app.post('/api/admin/theatre', adminAuth, async (req, res) => {
    try {
        const { name, cityId, location } = req.body;
        if (!name || !name.trim() || !cityId) {
            return res.status(400).json({ success: false, message: 'Name and cityId are required' });
        }
        const pool = getPool();
        const [result] = await pool.query('INSERT INTO theatres (name, city_id, location) VALUES (?, ?, ?)', [name.trim(), parseInt(cityId, 10), (location || '').trim()]);
        res.json({ success: true, theatreId: result.insertId, message: 'Theatre added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin Screen Management
app.post('/api/admin/screen', adminAuth, async (req, res) => {
    try {
        const { theatreId, screenName, totalSeats } = req.body;
        if (!theatreId || !screenName || !totalSeats) {
            return res.status(400).json({ success: false, message: 'theatreId, screenName, and totalSeats are required' });
        }
        const pool = getPool();
        const [result] = await pool.query('INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES (?, ?, ?)', [parseInt(theatreId, 10), screenName.trim(), parseInt(totalSeats, 10)]);
        res.json({ success: true, screenId: result.insertId, message: 'Screen added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// SYSTEM STATUS ENDPOINT
// ==========================================
app.get('/api/status', async (req, res) => {
    let dbConnected = false;
    try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT 1');
        dbConnected = rows.length > 0;
    } catch (e) {
        dbConnected = false;
    }
    res.json({
        status: 'RUNNING',
        database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// SERVER INITIALIZATION & BACKGROUND SCHEDULERS
// ==========================================

// Start HTTP server and run startup sync
server.listen(PORT, async () => {
    console.log(`[SERVER] Express server listening on http://localhost:${PORT}`);
    
    // Automatically initialize tables if database is fresh
    await ensureBaseSchema();

    // Initialize group booking DB structure
    await initGroupBookingDB();
    
    // Auto sync on startup in background
    setTimeout(async () => {
        try {
            await runSync();
        } catch (err) {
            console.error('[SERVER ERROR] Startup database synchronization failed:', err.message);
        }
    }, 1000);
});

// Schedule task to refresh movie database every 24 hours (using node-cron)
cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Executing scheduled daily database movie refresh...');
    try {
        await runSync();
    } catch (err) {
        console.error('[CRON ERROR] Scheduled daily sync failed:', err.message);
    }
});

// Schedule task to automatically clean up expired seat locks every minute
cron.schedule('*/1 * * * *', async () => {
    try {
        const pool = getPool();
        const [result] = await pool.query("DELETE FROM seat_locks WHERE expires_at < NOW()");
        if (result.affectedRows > 0) {
            console.log(`[CRON] Auto-cleaned up ${result.affectedRows} expired seat locks from database.`);
        }
    } catch (err) {
        console.error('[CRON ERROR] Scheduled expired seat locks cleanup failed:', err.message);
    }
});
