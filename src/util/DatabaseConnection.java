package util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Centralized database connection utility.
 * FIXED: Database name corrected from 'cineplex' → 'cineplex_db'
 * to match unified_schema.sql and DBConnection.java fallback.
 * Provides a fresh Connection per call (no singleton stale-connection risk).
 */
public class DatabaseConnection {
    private static final Logger LOG = Logger.getLogger(DatabaseConnection.class.getName());
    private static final String URL = "jdbc:mysql://localhost:3306/cineplex_db";
    private static final String USER = "root";
    private static final String PASSWORD = "9380";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            LOG.log(Level.SEVERE, "MySQL JDBC Driver not found. Add mysql-connector-java to classpath.", e);
        }
    }

    /**
     * Returns a fresh connection. Caller MUST close it (use try-with-resources).
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
