const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '9380',
        database: 'cineplex_db'
    });

    try {
        console.log("Updating existing wallet balances to 100.00...");
        const [result] = await conn.query("UPDATE wallet SET balance = 100.00");
        console.log("Success! Updated wallets count:", result.affectedRows);
    } catch (err) {
        console.error("Failed to update wallet balances:", err.message);
    } finally {
        await conn.end();
    }
})();
