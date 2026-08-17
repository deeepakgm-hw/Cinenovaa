package dao;

import model.Movie;
import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class MovieDAO {
    private static final Logger LOG = Logger.getLogger(MovieDAO.class.getName());

    /**
     * Retrieves all movies from the database.
     */
    public List<Movie> getAllMovies() {
        List<Movie> movies = new ArrayList<>();
        String sql = "SELECT * FROM movies";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                movies.add(mapResultSetToMovie(rs));
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch all movies", e);
        }
        return movies;
    }

    public Movie getMovieById(int id) {
        String sql = "SELECT * FROM movies WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToMovie(rs);
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch movie id=" + id, e);
        }
        return null;
    }

    public boolean addMovie(Movie movie) {
        String sql = "INSERT INTO movies (title, description, duration, genre, language, release_date, poster_url, rating, status, cast_members, trailer_url, movie_api_id, backdrop_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, movie.getTitle());
            pstmt.setString(2, movie.getDescription());
            pstmt.setInt(3, movie.getDuration());
            pstmt.setString(4, movie.getGenre());
            pstmt.setString(5, movie.getLanguage());
            pstmt.setDate(6, movie.getReleaseDate());
            pstmt.setString(7, movie.getPosterUrl());
            pstmt.setString(8, movie.getRating());
            pstmt.setString(9, movie.getStatus() != null ? movie.getStatus() : "NOW_SHOWING");
            pstmt.setString(10, movie.getCastMembers());
            pstmt.setString(11, movie.getTrailerUrl());
            pstmt.setString(12, movie.getMovieApiId());
            pstmt.setString(13, movie.getBackdropUrl());

            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add movie: " + movie.getTitle(), e);
            return false;
        }
    }

    public boolean updateMovie(Movie movie) {
        String sql = "UPDATE movies SET title=?, description=?, duration=?, genre=?, language=?, release_date=?, poster_url=?, rating=?, status=?, cast_members=?, trailer_url=?, movie_api_id=?, backdrop_url=? WHERE id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, movie.getTitle());
            pstmt.setString(2, movie.getDescription());
            pstmt.setInt(3, movie.getDuration());
            pstmt.setString(4, movie.getGenre());
            pstmt.setString(5, movie.getLanguage());
            pstmt.setDate(6, movie.getReleaseDate());
            pstmt.setString(7, movie.getPosterUrl());
            pstmt.setString(8, movie.getRating());
            pstmt.setString(9, movie.getStatus() != null ? movie.getStatus() : "NOW_SHOWING");
            pstmt.setString(10, movie.getCastMembers());
            pstmt.setString(11, movie.getTrailerUrl());
            pstmt.setString(12, movie.getMovieApiId());
            pstmt.setString(13, movie.getBackdropUrl());
            pstmt.setInt(14, movie.getMovieId());

            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to update movie id=" + movie.getMovieId(), e);
            return false;
        }
    }

    public boolean deleteMovie(int id) {
        String sql = "DELETE FROM movies WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to delete movie id=" + id, e);
            return false;
        }
    }

    public Movie getMovieByApiIdOrDetails(String apiId, String title, java.sql.Date releaseDate) {
        String sql = "SELECT * FROM movies WHERE (movie_api_id = ? AND movie_api_id IS NOT NULL) OR (title = ? AND release_date = ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, apiId);
            pstmt.setString(2, title);
            pstmt.setDate(3, releaseDate);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToMovie(rs);
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to check movie existence", e);
        }
        return null;
    }

    private Movie mapResultSetToMovie(ResultSet rs) throws SQLException {
        return new Movie(
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
    }
}
