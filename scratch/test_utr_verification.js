const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
    console.log("=== STARTING UTR VERIFICATION ENDPOINT TEST ===");
    const config = getDbConfig();
    const pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
    });

    try {
        // Find a valid showtime
        const [showtimes] = await pool.query("SELECT id FROM showtimes LIMIT 1");
        if (showtimes.length === 0) {
            console.error("No showtimes found in database.");
            process.exit(1);
        }
        const showtimeId = showtimes[0].id;
        const testSeat = "C10";
        const userId = 2; // johndoe

        // Cleanup
        console.log(`Cleaning up old locks and bookings for seat ${testSeat}...`);
        await pool.query("DELETE FROM seat_locks WHERE showtime_id = ? AND seat_number = ?", [showtimeId, testSeat]);
        await pool.query("DELETE FROM bookings WHERE showtime_id = ? AND CONCAT(',', REPLACE(seats,' ',''), ',') LIKE ?", [showtimeId, `%,${testSeat},%`]);

        // 1. Lock seat
        console.log(`Step 1: Locking seat ${testSeat}...`);
        await axios.post("http://localhost:8080/api/seats/lock", {
            showtimeId,
            userId,
            seats: [testSeat]
        });

        // 2. Create pending order
        console.log(`Step 2: Creating order/pending payment...`);
        const orderRes = await axios.post("http://localhost:8080/api/payments/create-order", {
            amount: 350.00,
            userId,
            showtimeId,
            seats: testSeat,
            paymentMethod: "UPI"
        });
        const orderId = orderRes.data.orderId;
        console.log(`Created Order ID: ${orderId}`);

        // 3. Try to verify with invalid UTR length
        console.log(`Step 3: Verifying with invalid 5-digit UTR...`);
        try {
            await axios.post("http://localhost:8080/api/payments/verify-utr", {
                orderId,
                utr: "12345"
            });
            console.error("FAIL: 5-digit UTR should have failed!");
        } catch (err) {
            console.log("Success! Rejected invalid UTR as expected. Status:", err.response?.status, "Message:", err.response?.data?.message);
        }

        // 4. Verify with valid 12-digit UTR
        const testUtr = "987654321012";
        console.log(`Step 4: Verifying with valid UTR ${testUtr}...`);
        const verifyRes = await axios.post("http://localhost:8080/api/payments/verify-utr", {
            orderId,
            utr: testUtr
        });
        console.log("Verify Response Status:", verifyRes.status, verifyRes.data);

        // Check if booking was confirmed in database
        const [bookings] = await pool.query("SELECT booking_status FROM bookings WHERE booking_id = ?", [orderRes.data.bookingId]);
        console.log("Booking status in DB:", bookings[0]?.booking_status);
        if (bookings[0]?.booking_status === "CONFIRMED") {
            console.log("Booking confirmed successfully!");
        } else {
            console.error("FAIL: Booking was not confirmed in DB!");
        }

        // 5. Try to verify another order with the DUPLICATE UTR
        const testSeat2 = "C11";
        console.log(`Step 5: Locking seat ${testSeat2} and trying to verify with duplicate UTR ${testUtr}...`);
        await pool.query("DELETE FROM seat_locks WHERE showtime_id = ? AND seat_number = ?", [showtimeId, testSeat2]);
        await pool.query("DELETE FROM bookings WHERE showtime_id = ? AND CONCAT(',', REPLACE(seats,' ',''), ',') LIKE ?", [showtimeId, `%,${testSeat2},%`]);

        await axios.post("http://localhost:8080/api/seats/lock", {
            showtimeId,
            userId,
            seats: [testSeat2]
        });

        const orderRes2 = await axios.post("http://localhost:8080/api/payments/create-order", {
            amount: 350.00,
            userId,
            showtimeId,
            seats: testSeat2,
            paymentMethod: "UPI"
        });
        const orderId2 = orderRes2.data.orderId;

        try {
            await axios.post("http://localhost:8080/api/payments/verify-utr", {
                orderId: orderId2,
                utr: testUtr
            });
            console.error("FAIL: Duplicate UTR should have failed!");
        } catch (err) {
            console.log("Success! Rejected duplicate UTR as expected. Status:", err.response?.status, "Message:", err.response?.data?.message);
        }

    } catch (err) {
        console.error("Error running test:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    } finally {
        await pool.end();
    }
})();
