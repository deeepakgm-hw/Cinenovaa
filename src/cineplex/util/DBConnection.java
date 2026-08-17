package cineplex.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Thread-safe database connection factory for the cineplex.* package.
 * FIXED: Replaced singleton shared Connection (stale/closed on timeout)
 *        with a per-call fresh connection factory — same pattern as util.DatabaseConnection.
 * FIXED: Replaced System.err / printStackTrace with proper Logger.
 * DB: cineplex_db  (matches unified_schema.sql)
 */
public class DBConnection {
    private static final Logger LOG = Logger.getLogger(DBConnection.class.getName());
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
     * Kept getInstance() for backward-compat — delegates to this now.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    /** Backward-compatible shim for code that calls DBConnection.getInstance().getConnection(). */
    public static DBConnection getInstance() {
        return Holder.INSTANCE;
    }

    /** Inner shim object — just re-routes to the static method above. */
    public Connection getConn() throws SQLException {
        return getConnection();
    }

    private static class Holder {
        static final DBConnection INSTANCE = new DBConnection();
    }
}
