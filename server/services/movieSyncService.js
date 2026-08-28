const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const axios = require('axios');

let dbConfig = null;
let dbPool = null;

// Parse environment variables / config for credentials and TMDB API Key
function getDbConfig() {
    if (dbConfig) return dbConfig;

    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '9380',
        database: process.env.DB_NAME || 'cineplex_db',
        tmdbKey: process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8'
    };

    if (config.tmdbKey.startsWith('your_')) {
        config.tmdbKey = '';
    }

    dbConfig = config;
    return dbConfig;
}

// Get MySQL connection pool
function getPool() {
    if (dbPool) return dbPool;
    const config = getDbConfig();
    dbPool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    return dbPool;
}

// Alter Table Helper on startup
async function ensureSchemaExtended() {
    const pool = getPool();
    try {
        // Check if backdrop_url column exists
        const [columns] = await pool.query('SHOW COLUMNS FROM movies LIKE "backdrop_url"');
        if (columns.length === 0) {
            console.log('[SYNC] Adding backdrop_url column to movies table...');
            await pool.query('ALTER TABLE movies ADD COLUMN backdrop_url VARCHAR(255) DEFAULT NULL');
            console.log('[SYNC] backdrop_url column added successfully.');
        }

        // Extend otp_verification schema for security: attempts, is_verified, last_sent_at, hashed otp_code
        const [otpColumns] = await pool.query('SHOW COLUMNS FROM otp_verification');
        const otpColumnNames = otpColumns.map(c => c.Field);

        const otpCodeCol = otpColumns.find(c => c.Field === 'otp_code');
        if (otpCodeCol && otpCodeCol.Type.includes('varchar(6)')) {
            console.log('[DATABASE] Altering otp_verification otp_code to VARCHAR(255)...');
            await pool.query('ALTER TABLE otp_verification MODIFY COLUMN otp_code VARCHAR(255) NOT NULL');
        }

        if (!otpColumnNames.includes('is_verified')) {
            console.log('[DATABASE] Adding is_verified column to otp_verification...');
            await pool.query('ALTER TABLE otp_verification ADD COLUMN is_verified TINYINT DEFAULT 0');
        }

        if (!otpColumnNames.includes('attempts')) {
            console.log('[DATABASE] Adding attempts column to otp_verification...');
            await pool.query('ALTER TABLE otp_verification ADD COLUMN attempts INT DEFAULT 0');
        }

        if (!otpColumnNames.includes('last_sent_at')) {
            console.log('[DATABASE] Adding last_sent_at column to otp_verification...');
            await pool.query('ALTER TABLE otp_verification ADD COLUMN last_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        }

        // 1. Extend theatres
        const [theatreCols] = await pool.query('SHOW COLUMNS FROM theatres');
        const theatreColNames = theatreCols.map(c => c.Field);
        if (!theatreColNames.includes('theatre_type')) {
            console.log('[DATABASE] Extending theatres schema: theatre_type');
            await pool.query("ALTER TABLE theatres ADD COLUMN theatre_type VARCHAR(50) DEFAULT 'Multiplex'");
        }
        if (!theatreColNames.includes('latitude')) {
            console.log('[DATABASE] Extending theatres schema: latitude');
            await pool.query("ALTER TABLE theatres ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL");
        }
        if (!theatreColNames.includes('longitude')) {
            console.log('[DATABASE] Extending theatres schema: longitude');
            await pool.query("ALTER TABLE theatres ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL");
        }
        if (!theatreColNames.includes('amenities')) {
            console.log('[DATABASE] Extending theatres schema: amenities');
            await pool.query("ALTER TABLE theatres ADD COLUMN amenities VARCHAR(255) DEFAULT 'Parking, Food Court'");
        }
        if (!theatreColNames.includes('total_screens')) {
            console.log('[DATABASE] Extending theatres schema: total_screens');
            await pool.query("ALTER TABLE theatres ADD COLUMN total_screens INT DEFAULT 1");
        }
        if (!theatreColNames.includes('rating')) {
            console.log('[DATABASE] Extending theatres schema: rating');
            await pool.query("ALTER TABLE theatres ADD COLUMN rating DECIMAL(2, 1) DEFAULT 4.0");
        }
        if (!theatreColNames.includes('image_url')) {
            console.log('[DATABASE] Extending theatres schema: image_url');
            await pool.query("ALTER TABLE theatres ADD COLUMN image_url VARCHAR(255) DEFAULT NULL");
        }

        // 2. Extend screens
        const [screenCols] = await pool.query('SHOW COLUMNS FROM screens');
        const screenColNames = screenCols.map(c => c.Field);
        if (!screenColNames.includes('screen_type')) {
            console.log('[DATABASE] Extending screens schema: screen_type');
            await pool.query("ALTER TABLE screens ADD COLUMN screen_type VARCHAR(50) DEFAULT 'Regular'");
        }

        // 3. Extend showtimes
        const [showtimeCols] = await pool.query('SHOW COLUMNS FROM showtimes');
        const showtimeColNames = showtimeCols.map(c => c.Field);
        if (!showtimeColNames.includes('show_type')) {
            console.log('[DATABASE] Extending showtimes schema: show_type');
            await pool.query("ALTER TABLE showtimes ADD COLUMN show_type VARCHAR(50) DEFAULT '2D'");
        }
        if (!showtimeColNames.includes('surge_pricing')) {
            console.log('[DATABASE] Extending showtimes schema: surge_pricing');
            await pool.query("ALTER TABLE showtimes ADD COLUMN surge_pricing DECIMAL(10, 2) DEFAULT 0.00");
        }

        // 4. Extend bookings
        const [bookingCols] = await pool.query('SHOW COLUMNS FROM bookings');
        const bookingColNames = bookingCols.map(c => c.Field);
        if (!bookingColNames.includes('payment_gateway_id')) {
            console.log('[DATABASE] Extending bookings schema: payment_gateway_id');
            await pool.query("ALTER TABLE bookings ADD COLUMN payment_gateway_id VARCHAR(100) DEFAULT NULL");
        }
        if (!bookingColNames.includes('transaction_id')) {
            console.log('[DATABASE] Extending bookings schema: transaction_id');
            await pool.query("ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(100) DEFAULT NULL");
        }
        if (!bookingColNames.includes('payment_status')) {
            console.log('[DATABASE] Extending bookings schema: payment_status');
            await pool.query("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING'");
        }

        // 5. Extend payments
        const [paymentCols] = await pool.query('SHOW COLUMNS FROM payments');
        const paymentColNames = paymentCols.map(c => c.Field);
        if (!paymentColNames.includes('payment_gateway_id')) {
            console.log('[DATABASE] Extending payments schema: payment_gateway_id');
            await pool.query("ALTER TABLE payments ADD COLUMN payment_gateway_id VARCHAR(100) DEFAULT NULL");
        }
        if (!paymentColNames.includes('transaction_id')) {
            console.log('[DATABASE] Extending payments schema: transaction_id');
            await pool.query("ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(100) DEFAULT NULL");
        }
        if (!paymentColNames.includes('payment_status')) {
            console.log('[DATABASE] Extending payments schema: payment_status');
            await pool.query("ALTER TABLE payments ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING'");
        }
        if (!paymentColNames.includes('razorpay_order_id')) {
            console.log('[DATABASE] Extending payments schema: razorpay_order_id');
            await pool.query("ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(100) DEFAULT NULL");
        }
        if (!paymentColNames.includes('razorpay_payment_id')) {
            console.log('[DATABASE] Extending payments schema: razorpay_payment_id');
            await pool.query("ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(100) DEFAULT NULL");
        }
        if (!paymentColNames.includes('transaction_time')) {
            console.log('[DATABASE] Extending payments schema: transaction_time');
            await pool.query("ALTER TABLE payments ADD COLUMN transaction_time TIMESTAMP NULL DEFAULT NULL");
        }
        if (!paymentColNames.includes('verification_signature')) {
            console.log('[DATABASE] Extending payments schema: verification_signature');
            await pool.query("ALTER TABLE payments ADD COLUMN verification_signature VARCHAR(255) DEFAULT NULL");
        }

        // 6. Update seeded theatres with premium data
        console.log('[DATABASE] Seeding premium theatre details...');
        await pool.query(`
            UPDATE theatres SET 
                theatre_type = 'IMAX', 
                latitude = 12.9716, 
                longitude = 77.5946, 
                amenities = 'Recliners, IMAX Laser, Food Court, Parking', 
                rating = 4.6, 
                total_screens = 5, 
                image_url = '/resources/theatres/pvr_orion.jpg' 
            WHERE id = 1
        `);
        await pool.query(`
            UPDATE theatres SET 
                theatre_type = 'Dolby Atmos', 
                latitude = 12.9345, 
                longitude = 77.6101, 
                amenities = 'Gourmet Food, Recliners, Dolby Atmos, Parking', 
                rating = 4.3, 
                total_screens = 4, 
                image_url = '/resources/theatres/inox_forum.jpg' 
            WHERE id = 2
        `);
        await pool.query(`
            UPDATE theatres SET 
                theatre_type = '4DX', 
                latitude = 19.1136, 
                longitude = 72.8697, 
                amenities = '4DX Motion Seats, Cafe, Parking', 
                rating = 4.2, 
                total_screens = 6, 
                image_url = '/resources/theatres/cinepolis_andheri.jpg' 
            WHERE id = 3
        `);
        await pool.query(`
            UPDATE theatres SET 
                theatre_type = 'Premium Gold Class', 
                latitude = 28.6304, 
                longitude = 77.2177, 
                amenities = 'Luxe Lounge, Recliners, Butlers, Valet Parking', 
                rating = 4.7, 
                total_screens = 3, 
                image_url = '/resources/theatres/pvr_plaza.jpg' 
            WHERE id = 4
        `);

        // Insert new theatres if they do not exist
        const [theatresCount] = await pool.query('SELECT COUNT(*) as count FROM theatres');
        if (theatresCount[0].count <= 4) {
            console.log('[DATABASE] Inserting additional premium theatres...');
            // VIP Lounge (Bangalore)
            await pool.query(`
                INSERT INTO theatres (id, name, city_id, location, theatre_type, latitude, longitude, amenities, total_screens, rating, image_url)
                VALUES (5, 'PVR Directors Cut VIP', 1, 'UB City Mall, Bangalore', 'VIP Lounge', 12.9719, 77.5968, 'Private Butler, Fully Reclining Beds, Gourmet Menu', 2, 4.9, '/resources/theatres/vip_lounge.jpg')
                ON DUPLICATE KEY UPDATE id=id
            `);
            // Open Air Cinema (Bangalore)
            await pool.query(`
                INSERT INTO theatres (id, name, city_id, location, theatre_type, latitude, longitude, amenities, total_screens, rating, image_url)
                VALUES (6, 'The Sunset Cinema Open Air', 1, 'Sarjapur Main Rd, Bangalore', 'Open Air', 12.9226, 77.6744, 'Outdoor Screen, Beanbags, Food Trucks, Wireless Headphones', 1, 4.5, '/resources/theatres/open_air.jpg')
                ON DUPLICATE KEY UPDATE id=id
            `);
            // Luxe Recliner (Mumbai)
            await pool.query(`
                INSERT INTO theatres (id, name, city_id, location, theatre_type, latitude, longitude, amenities, total_screens, rating, image_url)
                VALUES (7, 'INOX Insignia Luxe', 2, 'Atria Mall, Worli, Mumbai', 'Luxe Recliner', 18.9902, 72.8149, 'Plush Recliners, Laser Projection, Fine Dining', 4, 4.8, '/resources/theatres/luxe_recliner.jpg')
                ON DUPLICATE KEY UPDATE id=id
            `);

            // Seed screens for these new theatres
            await pool.query("INSERT IGNORE INTO screens (id, theatre_id, screen_name, total_seats, screen_type) VALUES (8, 5, 'Screen 1', 40, 'VIP Lounge')");
            await pool.query("INSERT IGNORE INTO screens (id, theatre_id, screen_name, total_seats, screen_type) VALUES (9, 5, 'Screen 2', 40, 'VIP Lounge')");
            await pool.query("INSERT IGNORE INTO screens (id, theatre_id, screen_name, total_seats, screen_type) VALUES (10, 6, 'Open Air lawn', 50, 'Open Air')");
            await pool.query("INSERT IGNORE INTO screens (id, theatre_id, screen_name, total_seats, screen_type) VALUES (11, 7, 'Screen 1', 40, 'Luxe Recliner')");
        }

        // Update existing screens with categories
        await pool.query("UPDATE screens SET screen_type = 'IMAX' WHERE id IN (1, 2)");
        await pool.query("UPDATE screens SET screen_type = 'Dolby Atmos' WHERE id IN (3, 4)");
        await pool.query("UPDATE screens SET screen_type = '4DX' WHERE id IN (5, 6)");
        await pool.query("UPDATE screens SET screen_type = 'Premium Gold Class' WHERE id = 7");

    } catch (err) {
        console.error('[SYNC ERROR] Failed to check or alter database schema:', err.message);
    }
}

// Fallback Movie Seed Data
const fallbackMovies = [
    {
        title: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        duration: 152,
        genre: "Action, Crime, Drama",
        language: "English",
        release_date: "2008-07-18",
        poster_url: "resources/images/posters/dark_knight.jpg",
        backdrop_url: "resources/images/posters/dark_knight.jpg",
        trailer_url: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
        rating: "9.0",
        status: "NOW_SHOWING",
        cast_members: "Christian Bale, Heath Ledger, Aaron Eckhart",
        movie_api_id: "fb_dark_knight"
    },
    {
        title: "Inception",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        duration: 148,
        genre: "Action, Sci-Fi, Adventure",
        language: "English",
        release_date: "2010-07-16",
        poster_url: "resources/images/posters/inception.jpg",
        backdrop_url: "resources/images/posters/inception.jpg",
        trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        rating: "8.8",
        status: "NOW_SHOWING",
        cast_members: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
        movie_api_id: "fb_inception"
    },
    {
        title: "Interstellar",
        description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        duration: 169,
        genre: "Sci-Fi, Drama, Adventure",
        language: "English",
        release_date: "2014-11-07",
        poster_url: "resources/images/posters/interstellar.jpg",
        backdrop_url: "resources/images/posters/interstellar.jpg",
        trailer_url: "https://www.youtube.com/watch?v=zSWdZATo3Dc",
        rating: "8.7",
        status: "NOW_SHOWING",
        cast_members: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
        movie_api_id: "fb_interstellar"
    },
    {
        title: "Kantara",
        description: "When greed paves the way for betrayal, scheming and rebellion, a young man reluctantly takes on the mantle of his ancestors to settle the unrest in his village.",
        duration: 150,
        genre: "Action, Thriller, Drama",
        language: "Kannada",
        release_date: "2022-09-30",
        poster_url: "resources/images/posters/karuppu.jpg",
        backdrop_url: "resources/images/posters/karuppu.jpg",
        trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        rating: "8.4",
        status: "NOW_SHOWING",
        cast_members: "Rishab Shetty, Sapthami Gowda, Kishore Kumar G.",
        movie_api_id: "fb_kantara"
    },
    {
        title: "Avatar: The Way of Water",
        description: "Jake Sully lives with his newfound family formed on the extraterrestrial pandoran moon. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.",
        duration: 192,
        genre: "Sci-Fi, Action, Adventure",
        language: "English",
        release_date: "2022-12-16",
        poster_url: "resources/images/posters/default_poster.png",
        backdrop_url: "resources/images/posters/default_poster.png",
        trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        rating: "7.8",
        status: "COMING_SOON",
        cast_members: "Sam Worthington, Zoe Saldana, Sigourney Weaver",
        movie_api_id: "fb_avatar2"
    },
    {
        title: "The Dark Knight Rises",
        description: "Eight years after the Joker's reign of anarchy, Batman, with the help of the enigmatic Catwoman, is forced from his exile to save Gotham City from the brutal guerrilla terrorist Bane.",
        duration: 165,
        genre: "Action, Thriller",
        language: "English",
        release_date: "2012-07-20",
        poster_url: "resources/images/posters/dark_knight.jpg",
        backdrop_url: "resources/images/posters/dark_knight.jpg",
        trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        rating: "8.4",
        status: "COMING_SOON",
        cast_members: "Christian Bale, Tom Hardy, Anne Hathaway",
        movie_api_id: "fb_dkr"
    }
];

// Helper to download official poster to resources/cache/posters/movie_api_id.jpg
async function downloadPosterLocal(url, apiId) {
    if (!url || !apiId) return;
    if (!url.startsWith('http')) return; // Skip local/relative paths
    try {
        const cacheDir = path.join(__dirname, '../../resources/cache/posters');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const destPath = path.join(cacheDir, `${apiId}.jpg`);
        if (fs.existsSync(destPath)) {
            return; // Already cached
        }
        
        console.log(`[SYNC CACHE] Downloading official poster for ID ${apiId} to local cache...`);
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 15000
        });
        
        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log(`[SYNC CACHE] Successfully cached poster ${apiId}.jpg`);
    } catch (err) {
        console.error(`[SYNC CACHE ERROR] Failed to download poster for ${apiId}:`, err.message);
    }
}

// Helper to check and sync single movie record
async function syncSingleMovie(pool, m) {
    try {
        // Download and cache the poster locally
        await downloadPosterLocal(m.poster_url, m.movie_api_id);
        // Look up by movie_api_id or details (title + release_date)
        let existingId = null;
        let existingStatus = null;
        let queryStr = 'SELECT id, status FROM movies WHERE (movie_api_id = ? AND movie_api_id IS NOT NULL) OR (title = ? AND release_date = ?)';
        const [rows] = await pool.query(queryStr, [m.movie_api_id, m.title, m.release_date]);
        
        if (rows.length > 0) {
            existingId = rows[0].id;
            existingStatus = rows[0].status;
        }

        const finalStatus = (existingStatus === 'NOW_SHOWING' && m.status === 'POPULAR') ? 'NOW_SHOWING' : m.status;

        if (existingId !== null) {
            // Update
            const updateSql = `
                UPDATE movies SET 
                    title = ?, description = ?, duration = ?, genre = ?, 
                    language = ?, release_date = ?, poster_url = ?, 
                    backdrop_url = ?, trailer_url = ?, rating = ?, 
                    status = ?, cast_members = ?, movie_api_id = ?
                WHERE id = ?
            `;
            await pool.query(updateSql, [
                m.title, m.description, m.duration, m.genre,
                m.language, m.release_date, m.poster_url,
                m.backdrop_url, m.trailer_url, m.rating,
                finalStatus, m.cast_members, m.movie_api_id,
                existingId
            ]);
            await createShowtimesIfNeeded(pool, existingId, finalStatus);
            return { action: 'updated', id: existingId };
        } else {
            // Insert
            const insertSql = `
                INSERT INTO movies (
                    title, description, duration, genre, 
                    language, release_date, poster_url, 
                    backdrop_url, trailer_url, rating, 
                    status, cast_members, movie_api_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.query(insertSql, [
                m.title, m.description, m.duration, m.genre,
                m.language, m.release_date, m.poster_url,
                m.backdrop_url, m.trailer_url, m.rating,
                m.status, m.cast_members, m.movie_api_id
            ]);
            await createShowtimesIfNeeded(pool, result.insertId, m.status);
            return { action: 'inserted', id: result.insertId };
        }
    } catch (err) {
        console.error(`[SYNC ERROR] Failed to sync movie "${m.title}":`, err.message);
        throw err;
    }
}

// Helper to create showtimes for synced movies if none exist
async function createShowtimesIfNeeded(pool, movieId, status) {
    if (status !== 'NOW_SHOWING' && status !== 'POPULAR') {
        return;
    }
    try {
        const [showtimeRows] = await pool.query('SELECT COUNT(*) as count FROM showtimes WHERE movie_id = ?', [movieId]);
        if (showtimeRows[0].count > 0) {
            return; // Showtimes already exist
        }

        const [screenRows] = await pool.query('SELECT id FROM screens');
        if (screenRows.length === 0) {
            return;
        }
        const screenIds = screenRows.map(r => r.id);

        const times = ["12:00:00", "15:00:00", "18:00:00", "21:00:00"];
        const prices = [250.00, 300.00, 350.00, 400.00];
        
        for (let day = 0; day < 3; day++) {
            const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
            const dateString = date.toISOString().substring(0, 10);
            
            for (let t = 0; t < times.length; t++) {
                const screenId = screenIds[(movieId + day + t) % screenIds.length];
                const showTimeStr = `${dateString} ${times[t]}`;
                
                await pool.query(
                    'INSERT INTO showtimes (movie_id, screen_id, show_time, price) VALUES (?, ?, ?, ?)',
                    [movieId, screenId, showTimeStr, prices[t]]
                );
            }
        }
        console.log(`[SYNC] Dynamically created showtimes for live movie ID: ${movieId}`);
    } catch (err) {
        console.error(`[SYNC ERROR] Failed to create showtimes for movie ID ${movieId}:`, err.message);
    }
}

// Fetch Full Details from TMDB for a movie ID
async function fetchMovieDetails(apiKey, movieId, status) {
    try {
        const url = `https://api.tmdb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,videos&language=en-US`;
        const res = await axios.get(url, { timeout: 8000 });
        const d = res.data;

        // Parse genres
        const genre = d.genres && d.genres.length > 0 ? d.genres.map(g => g.name).join(', ') : 'Cinema';

        // Parse language
        let language = 'English';
        const langCode = d.original_language;
        if (langCode === 'hi') language = 'Hindi';
        else if (langCode === 'kn') language = 'Kannada';
        else if (langCode === 'te') language = 'Telugu';
        else if (langCode === 'ta') language = 'Tamil';

        // Cast members (up to 5)
        let cast_members = 'N/A';
        if (d.credits && d.credits.cast) {
            cast_members = d.credits.cast.slice(0, 5).map(c => c.name).join(', ');
        }

        // YouTube trailer URL
        let trailer_url = 'https://www.youtube.com/watch?v=YoHD9XEInc0'; // default fallback
        if (d.videos && d.videos.results) {
            const trailer = d.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
            if (trailer) {
                trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
            }
        }

        // Image urls complete paths
        const poster_url = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : '';
        const backdrop_url = d.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : '';

        return {
            title: d.title || 'Untitled',
            description: d.overview || '',
            duration: d.runtime && d.runtime > 0 ? d.runtime : 120,
            genre,
            language,
            release_date: d.release_date || new Date().toISOString().substring(0, 10),
            poster_url,
            backdrop_url,
            trailer_url,
            rating: d.vote_average ? d.vote_average.toFixed(1) : '7.0',
            status,
            cast_members,
            movie_api_id: String(d.id)
        };
    } catch (err) {
        console.error(`[SYNC] Failed fetching TMDB detail for ID ${movieId}:`, err.message);
        return null;
    }
}

// Fetch list of movies from TMDB endpoint
async function fetchListFromTmdb(apiKey, endpoint, status) {
    const moviesList = [];
    try {
        const url = `https://api.tmdb.org/3${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US&page=1`;
        const res = await axios.get(url, { timeout: 8000 });
        const results = res.data.results || [];
        // Limit details fetch to prevent rate limit blocks (e.g. 10 per list)
        const items = results.slice(0, 10);
        for (const item of items) {
            const details = await fetchMovieDetails(apiKey, item.id, status);
            if (details) moviesList.push(details);
        }
    } catch (err) {
        console.error(`[SYNC] Failed list request to TMDB endpoint ${endpoint}:`, err.message);
    }
    return moviesList;
}

// Perform Sync function
async function runSync() {
    console.log('[SYNC] Starting database synchronization task...');
    await ensureSchemaExtended();
    const config = getDbConfig();
    const pool = getPool();

    let addedCount = 0;
    let updatedCount = 0;

    if (!config.tmdbKey) {
        console.log('[SYNC] No TMDB API Key configured. Running local mock seed database sync...');
        for (const m of fallbackMovies) {
            const res = await syncSingleMovie(pool, m);
            if (res.action === 'inserted') addedCount++;
            else updatedCount++;
        }
    } else {
        console.log('[SYNC] TMDB API key detected. Querying live endpoints...');
        try {
            // 1. Fetch Now Playing -> NOW_SHOWING
            const nowPlaying = await fetchListFromTmdb(config.tmdbKey, '/movie/now_playing', 'NOW_SHOWING');
            // 2. Fetch Upcoming -> COMING_SOON
            const upcoming = await fetchListFromTmdb(config.tmdbKey, '/movie/upcoming', 'COMING_SOON');
            // 3. Fetch Popular -> POPULAR
            const popular = await fetchListFromTmdb(config.tmdbKey, '/movie/popular', 'POPULAR');

            const allMovies = [...nowPlaying, ...upcoming, ...popular];

            if (allMovies.length === 0) {
                console.log('[SYNC WARNING] API queries returned 0 live movies. Falling back to offline fallback seed...');
                for (const m of fallbackMovies) {
                    const res = await syncSingleMovie(pool, m);
                    if (res.action === 'inserted') addedCount++;
                    else updatedCount++;
                }
            } else {
                for (const m of allMovies) {
                    const res = await syncSingleMovie(pool, m);
                    if (res.action === 'inserted') addedCount++;
                    else updatedCount++;
                }
            }
        } catch (err) {
            console.error('[SYNC ERROR] Live API synchronization failed, using offline fallback seed:', err.message);
            for (const m of fallbackMovies) {
                const res = await syncSingleMovie(pool, m);
                if (res.action === 'inserted') addedCount++;
                else updatedCount++;
            }
        }
    }

    console.log(`[SYNC] Sync complete. Added: ${addedCount}, Updated: ${updatedCount} movies in database.`);
    return { added: addedCount, updated: updatedCount };
}

// Live TMDB Search function
async function searchMoviesApi(query) {
    const config = getDbConfig();
    if (!config.tmdbKey) {
        return [];
    }
    try {
        const url = `https://api.tmdb.org/3/search/movie?api_key=${config.tmdbKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        const res = await axios.get(url, { timeout: 8000 });
        const results = res.data.results || [];
        const moviesList = [];
        // Resolve first 5 results in detail to provide full trailer and cast lists
        const items = results.slice(0, 5);
        for (const item of items) {
            const details = await fetchMovieDetails(config.tmdbKey, item.id, 'NOW_SHOWING');
            if (details) moviesList.push(details);
        }
        return moviesList;
    } catch (err) {
        console.error(`[SYNC ERROR] TMDB Search query failed for "${query}":`, err.message);
        return [];
    }
}

module.exports = {
    runSync,
    searchMoviesApi,
    getPool
};
