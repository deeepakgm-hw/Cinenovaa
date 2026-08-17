const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read db.properties to get the correct password and database name
function getDbConfig() {
    const propsPath = path.join(__dirname, '../src/db.properties');
    const config = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'cineplex_db'
    };

    if (fs.existsSync(propsPath)) {
        const content = fs.readFileSync(propsPath, 'utf-8');
        content.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const index = trimmed.indexOf('=');
                const key = trimmed.substring(0, index).trim();
                const val = trimmed.substring(index + 1).trim();

                if (key === 'db.url') {
                    const match = val.match(/jdbc:mysql:\/\/([^:]+):(\d+)\/([^?]+)/);
                    if (match) {
                        config.host = match[1];
                        config.port = parseInt(match[2], 10);
                        config.database = match[3];
                    }
                } else if (key === 'db.user') {
                    config.user = val;
                } else if (key === 'db.password') {
                    config.password = val;
                }
            }
        });
    }
    return config;
}

(async () => {
    console.log("=== STARTING E2E BOOKING FLOW TEST ===");
    const config = getDbConfig();
    const pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
    });

    try {
        // Ensure test users exist: user 1 (admin) and user 2 (johndoe)
        // If not, insert them
        await pool.query("INSERT IGNORE INTO users (id, username, password, email, role) VALUES (1, 'admin', 'admin123', 'admin@cineplex.com', 'ADMIN')");
        await pool.query("INSERT IGNORE INTO users (id, username, password, email, role) VALUES (2, 'johndoe', 'password123', 'john@example.com', 'USER')");
        
        // Ensure wallets exist
        await pool.query("INSERT IGNORE INTO wallet (id, user_id, balance, loyalty_points) VALUES (1, 1, 10000.00, 500)");
        await pool.query("INSERT IGNORE INTO wallet (id, user_id, balance, loyalty_points) VALUES (2, 2, 10000.00, 100)");
        await pool.query("UPDATE wallet SET balance = 10000.00 WHERE user_id = 2");

        // Fetch a valid showtime
        const [showtimes] = await pool.query("SELECT id FROM showtimes LIMIT 1");
        if (showtimes.length === 0) {
            console.error("No showtimes found in the database. Cannot run test.");
            process.exit(1);
        }
        const showtimeId = showtimes[0].id;
        console.log(`Using Showtime ID: ${showtimeId}`);

        const testSeat = "C9";
        const userId1 = 2; // johndoe
        const userId2 = 1; // admin

        // Step 1: Clean up any old booking/lock for testSeat
        console.log(`Cleaning up old locks and bookings for seat ${testSeat}...`);
        await pool.query("DELETE FROM seat_locks WHERE showtime_id = ? AND seat_number = ?", [showtimeId, testSeat]);
        await pool.query("DELETE FROM bookings WHERE showtime_id = ? AND CONCAT(',', REPLACE(seats,' ',''), ',') LIKE ?", [showtimeId, `%,${testSeat},%`]);

        // Step 2: Lock seat for userId1 (johndoe)
        console.log(`Step 2: Locking seat ${testSeat} for User ${userId1}...`);
        const lockRes1 = await axios.post("http://localhost:8080/api/seats/lock", {
            showtimeId,
            userId: userId1,
            seats: [testSeat]
        });
        console.log("Lock response 1 status:", lockRes1.status, lockRes1.data);

        // Step 3: Try to lock the SAME seat for userId2 (admin) -> should fail with 409
        console.log(`Step 3: Trying to double-lock seat ${testSeat} for User ${userId2} (should fail)...`);
        try {
            await axios.post("http://localhost:8080/api/seats/lock", {
                showtimeId,
                userId: userId2,
                seats: [testSeat]
            });
            console.error("FAIL: Double lock succeeded but it should have failed!");
        } catch (err) {
            console.log("Success! Double lock rejected as expected. Status:", err.response?.status, "Message:", err.response?.data?.message);
        }

        // Step 4: Confirm payment and complete booking for userId1
        console.log(`Step 4: Confirming payment for User ${userId1} on seat ${testSeat}...`);
        const confirmRes = await axios.post("http://localhost:8080/api/payments/confirm", {
            userId: userId1,
            showtimeId,
            seats: testSeat,
            totalAmount: 350.00,
            paymentMethod: "WALLET",
            razorpayOrderId: "order_mock_12345",
            razorpayPaymentId: "pay_mock_12345",
            razorpaySignature: "sig_mock_12345"
        });
        console.log("Confirm response status:", confirmRes.status, confirmRes.data);

        // Step 5: Verify lock was deleted or marked booked
        const [locks] = await pool.query("SELECT * FROM seat_locks WHERE showtime_id = ? AND seat_number = ?", [showtimeId, testSeat]);
        console.log("Seat locks in DB after booking:", locks);

        // Step 6: Verify booking is created in database
        const [bookings] = await pool.query("SELECT * FROM bookings WHERE booking_id = ?", [confirmRes.data.bookingId]);
        console.log("Bookings in DB after booking:", bookings);
        if (bookings.length > 0 && bookings[0].booking_status === "CONFIRMED") {
            console.log("=== E2E BOOKING FLOW TEST PASSED SUCCESSFULLY ===");
        } else {
            console.error("FAIL: Booking was not found or not confirmed in database.");
        }

    } catch (err) {
        console.error("Test failed with error:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    } finally {
        await pool.end();
    }
})();
