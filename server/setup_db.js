require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT, 10) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '9380';
    const database = process.env.DB_NAME || 'cineplex_db';

    console.log('--- DB SETUP START ---');
    console.log(`Connecting to MySQL on ${host}:${port} as user '${user}'...`);

    let connection;
    try {
        const isRemote = host !== 'localhost' && host !== '127.0.0.1';
        const connOptions = {
            host,
            port,
            user,
            password,
            multipleStatements: true,
            connectTimeout: 20000
        };
        if (process.env.DB_SSL === 'true' || (isRemote && process.env.DB_SSL !== 'false')) {
            connOptions.ssl = { rejectUnauthorized: false };
        }
        // Connect to server (without selecting DB first)
        connection = await mysql.createConnection(connOptions);
        console.log('Connection successful!');

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await connection.query(`USE \`${database}\``);
        console.log(`Switched to database '${database}'.`);

        // Read unified schema file
        const schemaPath = path.join(__dirname, '../database/unified_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.error(`Error: Schema file not found at ${schemaPath}`);
            process.exit(1);
        }

        console.log(`Reading unified schema from ${schemaPath}...`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

        console.log('Resetting schema and executing statements...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = [
            "otp_verification", "upcoming_movie_interest", "upcoming_movies",
            "transaction_history", "ticket_history", "user_sessions", "seat_locks",
            "loyalty_transactions", "snack_orders", "snacks", "payments", "bookings",
            "group_booking_sessions", "seats", "showtimes", "screens", "theatres",
            "cities", "movies", "wallet", "wallets", "wallet_transactions", "users",
            "admin_logs", "admin_settings"
        ];
        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
        }
        await connection.query(schemaSql);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Schema initialized successfully!');

        // Verify users
        const [users] = await connection.query('SELECT id, username, email, role FROM users');
        console.log('\n--- VERIFIED USERS ---');
        users.forEach(u => console.log(`  [ID=${u.id}] ${u.username} (${u.email}) - Role: ${u.role}`));

        // Verify movies
        const [movies] = await connection.query('SELECT id, title, genre, status FROM movies LIMIT 5');
        console.log('\n--- SAMPLE MOVIES ---');
        movies.forEach(m => console.log(`  [ID=${m.id}] ${m.title} (${m.genre}) - ${m.status}`));

        console.log('\n--- DB SETUP COMPLETE ---');
    } catch (err) {
        console.error('CRITICAL ERROR during database setup:', err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
