import java.sql.*;

public class VerifySync {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        String url = "jdbc:mysql://localhost:3306/cineplex_db";
        String user = "root";
        String password = "9380";
        
        System.out.println("Connecting to database...");
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("\n--- MOVIES IN DATABASE ---");
            try (ResultSet rs = stmt.executeQuery("SELECT id, title, rating, status, poster_url, backdrop_url, movie_api_id FROM movies")) {
                int count = 0;
                while (rs.next()) {
                    count++;
                    System.out.printf("Movie #%d: ID=%d, Title=%s, Rating=%s, Status=%s, ApiID=%s, Poster=%s, Backdrop=%s%n",
                        count, rs.getInt("id"), rs.getString("title"), rs.getString("rating"),
                        rs.getString("status"), rs.getString("movie_api_id"), rs.getString("poster_url"), rs.getString("backdrop_url"));
                }
                System.out.println("Total movies: " + count);
            }
            
            System.out.println("\n--- SHOWTIMES IN DATABASE ---");
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT s.id, m.title, scr.screen_name, s.show_time, s.price " +
                    "FROM showtimes s " +
                    "JOIN movies m ON s.movie_id = m.id " +
                    "JOIN screens scr ON s.screen_id = scr.id " +
                    "LIMIT 15")) {
                int count = 0;
                while (rs.next()) {
                    count++;
                    System.out.printf("Showtime #%d: ID=%d, Movie=%s, Screen=%s, Time=%s, Price=%.2f%n",
                        count, rs.getInt("id"), rs.getString("title"), rs.getString("screen_name"),
                        rs.getTimestamp("show_time"), rs.getDouble("price"));
                }
                System.out.println("Showtimes printed: " + count);
            }
        }
    }
}
