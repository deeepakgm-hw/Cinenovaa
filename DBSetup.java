import java.sql.*;
import java.nio.file.*;
import java.util.stream.*;

public class DBSetup {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        String url = "jdbc:mysql://localhost:3306/?allowMultiQueries=true";
        String user = "root";
        String password = "9380";
        
        System.out.println("--- DB DIAGNOSTIC START ---");
        System.out.println("Connecting to: " + url + " as " + user);
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Connection successful! DB: " + conn.getCatalog());
            
            stmt.execute("CREATE DATABASE IF NOT EXISTS cineplex_db");
            stmt.execute("USE cineplex_db");
            
            System.out.println("Resetting schema...");
            stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
            String[] tables = {"otp_verification", "upcoming_movie_interest", "upcoming_movies", "transaction_history", "ticket_history", "user_sessions", "seat_locks", "loyalty_transactions", "snack_orders", "snacks", "payments", "bookings", "group_booking_sessions", "seats", "showtimes", "screens", "theatres", "cities", "movies", "wallet", "users", "admin_logs"};
            for (String table : tables) {
                stmt.execute("DROP TABLE IF EXISTS " + table);
            }
            stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
            
            System.out.println("Reading unified_schema.sql...");
            String schema = Files.readString(Paths.get("database/unified_schema.sql"));
            
            System.out.println("Executing schema queries...");
            String[] queries = schema.split(";");
            for (String query : queries) {
                if (!query.trim().isEmpty()) {
                    try {
                        stmt.execute(query);
                    } catch (SQLException e) {
                        System.err.println("Error executing query starting with: " + query.trim().substring(0, Math.min(query.trim().length(), 40)));
                        System.err.println("Message: " + e.getMessage());
                    }
                }
            }
            
            System.out.println("Verifying movies and poster_url column:");
            try {
                DatabaseMetaData metaData = conn.getMetaData();
                // We check with both lowercase and uppercase in case of DB settings
                boolean hasColumn = false;
                try (ResultSet colRs = metaData.getColumns(null, null, "movies", "%")) {
                    while (colRs.next()) {
                        String colName = colRs.getString("COLUMN_NAME");
                        if ("poster_url".equalsIgnoreCase(colName)) {
                            hasColumn = true;
                            break;
                        }
                    }
                }
                if (!hasColumn) {
                    System.out.println("  poster_url column missing! Executing safe ALTER query...");
                    stmt.execute("ALTER TABLE movies ADD COLUMN poster_url VARCHAR(255)");
                    System.out.println("  Successfully added poster_url column.");
                } else {
                    System.out.println("  poster_url column verified in movies table.");
                }
                
                try (ResultSet rs = stmt.executeQuery("SELECT id, title, poster_url FROM movies")) {
                    while (rs.next()) {
                        System.out.println("  Movie: [ID=" + rs.getInt("id") + ", Title=" + rs.getString("title") + ", PosterURL=" + rs.getString("poster_url") + "]");
                    }
                }
            } catch (SQLException e) {
                System.err.println("  Error verifying/altering movies table: " + e.getMessage());
            }
            System.out.println("\n--- VERIFICATION ---");
            System.out.println("Verifying users:");
            try (ResultSet rs = stmt.executeQuery("SELECT id, username, role FROM users")) {
                while (rs.next()) {
                    System.out.println("  User: [ID=" + rs.getInt("id") + ", Name=" + rs.getString("username") + ", Role=" + rs.getString("role") + "]");
                }
            }
            
            System.out.println("Verifying wallet balances:");
            try (ResultSet rs = stmt.executeQuery("SELECT user_id, balance FROM wallet")) {
                while (rs.next()) {
                    System.out.println("  Wallet: [UserID=" + rs.getInt("user_id") + ", Balance=" + rs.getDouble("balance") + "]");
                }
            }
            
            System.out.println("--- DB DIAGNOSTIC END ---");
        } catch (SQLException e) {
            System.err.println("CRITICAL ERROR: Could not connect to database.");
            System.err.println("Reason: " + e.getMessage());
        }
    }
}
