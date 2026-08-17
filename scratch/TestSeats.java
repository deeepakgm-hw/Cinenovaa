import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import util.DatabaseConnection;

public class TestSeats {
    public static void main(String[] args) throws Exception {
        try (Connection conn = DatabaseConnection.getConnection()) {
            System.out.println("--- MOVIES IN DATABASE ---");
            String sqlMovies = "SELECT id, title, poster_url, backdrop_url FROM movies";
            try (PreparedStatement stmt = conn.prepareStatement(sqlMovies);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    System.out.println(String.format("ID: %d | Title: %s | Poster: %s | Backdrop: %s",
                        rs.getInt("id"), rs.getString("title"), rs.getString("poster_url"), rs.getString("backdrop_url")));
                }
            }
        }
    }
}
