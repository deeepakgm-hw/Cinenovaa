package cineplex.dao;

import cineplex.model.Showtime;
import cineplex.model.Movie;
import cineplex.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ShowtimeDAO {
    private static final Logger LOG = Logger.getLogger(ShowtimeDAO.class.getName());

    public boolean addShowtime(Showtime showtime) {
        String sql = "INSERT INTO showtimes (movie_id, screen_id, show_time, price) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, showtime.getMovieId());
            pstmt.setInt(2, showtime.getScreenId());
            pstmt.setTimestamp(3, showtime.getShowTime());
            pstmt.setDouble(4, showtime.getPrice());

            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add showtime", e);
            return false;
        }
    }

    public List<Showtime> getShowtimesForMovie(int movieId) {
        List<Showtime> showtimes = new ArrayList<>();
        String sql = "SELECT * FROM showtimes WHERE movie_id = ? ORDER BY show_time ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, movieId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    showtimes.add(new Showtime(
                        rs.getInt("id"),
                        rs.getInt("movie_id"),
                        rs.getInt("screen_id"),
                        rs.getTimestamp("show_time"),
                        rs.getDouble("price")
                    ));
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch showtimes for movie id=" + movieId, e);
        }
        return showtimes;
    }

    public Showtime getShowtimeById(int id) {
        String sql = "SELECT * FROM showtimes WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new Showtime(
                        rs.getInt("id"),
                        rs.getInt("movie_id"),
                        rs.getInt("screen_id"),
                        rs.getTimestamp("show_time"),
                        rs.getDouble("price")
                    );
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch showtime id=" + id, e);
        }
        return null;
    }

    public boolean deleteShowtime(int id) {
        String sql = "DELETE FROM showtimes WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to delete showtime id=" + id, e);
            return false;
        }
    }

    public List<Movie> getMoviesByCity(int cityId) {
        List<Movie> movies = new ArrayList<>();
        String sql = "SELECT DISTINCT m.* FROM movies m " +
                     "LEFT JOIN showtimes s ON m.id = s.movie_id " +
                     "LEFT JOIN screens sc ON s.screen_id = sc.id " +
                     "LEFT JOIN theatres t ON sc.theatre_id = t.id " +
                     "WHERE m.status = 'COMING_SOON' OR (m.status = 'NOW_SHOWING' AND t.city_id = ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, cityId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Movie movie = new Movie(
                        rs.getInt("id"),
                        rs.getString("title"),
                        rs.getString("description"),
                        rs.getInt("duration"),
                        rs.getString("genre"),
                        rs.getString("language"),
                        rs.getDate("release_date"),
                        rs.getString("poster_url"),
                        rs.getString("rating"),
                        rs.getString("status"),
                        rs.getString("cast_members"),
                        rs.getString("trailer_url"),
                        rs.getString("movie_api_id"),
                        rs.getString("backdrop_url")
                    );
                    movies.add(movie);
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch movies for cityId=" + cityId, e);
        }
        return movies;
    }

    public List<Showtime> getShowtimesByTheatre(int theatreId) {
        List<Showtime> showtimes = new ArrayList<>();
        String sql = "SELECT s.* FROM showtimes s " +
                     "JOIN screens sc ON s.screen_id = sc.id " +
                     "WHERE sc.theatre_id = ? ORDER BY s.show_time ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, theatreId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    showtimes.add(new Showtime(
                        rs.getInt("id"),
                        rs.getInt("movie_id"),
                        rs.getInt("screen_id"),
                        rs.getTimestamp("show_time"),
                        rs.getDouble("price")
                    ));
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch showtimes for theatreId=" + theatreId, e);
        }
        return showtimes;
    }

    public List<Showtime> getShowtimesForMovieAndTheatre(int movieId, int theatreId) {
        List<Showtime> showtimes = new ArrayList<>();
        String sql = "SELECT s.* FROM showtimes s " +
                     "JOIN screens sc ON s.screen_id = sc.id " +
                     "WHERE s.movie_id = ? AND sc.theatre_id = ? ORDER BY s.show_time ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, movieId);
            pstmt.setInt(2, theatreId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    showtimes.add(new Showtime(
                        rs.getInt("id"),
                        rs.getInt("movie_id"),
                        rs.getInt("screen_id"),
                        rs.getTimestamp("show_time"),
                        rs.getDouble("price")
                    ));
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch showtimes for movie=" + movieId + ", theatre=" + theatreId, e);
        }
        return showtimes;
    }
}
