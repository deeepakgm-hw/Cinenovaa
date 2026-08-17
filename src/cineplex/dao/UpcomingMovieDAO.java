package cineplex.dao;

import cineplex.model.UpcomingMovie;
import cineplex.util.DBConnection;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class UpcomingMovieDAO {
    private static final Logger LOG = Logger.getLogger(UpcomingMovieDAO.class.getName());

    public List<UpcomingMovie> getAllUpcomingMovies() {
        List<UpcomingMovie> list = new ArrayList<>();
        String sql = "SELECT * FROM upcoming_movies ORDER BY expected_release_date ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to fetch upcoming movies", e);
        }
        return list;
    }

    public boolean addUpcomingMovie(UpcomingMovie m) {
        String sql = "INSERT INTO upcoming_movies (movie_name, teaser_description, expected_release_date, poster_url, trailer_url, status) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, m.getMovieName());
            stmt.setString(2, m.getTeaserDescription());
            stmt.setDate(3, m.getExpectedReleaseDate());
            stmt.setString(4, m.getPosterUrl());
            stmt.setString(5, m.getTrailerUrl());
            stmt.setString(6, m.getStatus() == null ? "COMING_SOON" : m.getStatus());
            return stmt.executeUpdate() > 0;
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to add upcoming movie", e);
            return false;
        }
    }

    public boolean updateUpcomingMovie(UpcomingMovie m) {
        String sql = "UPDATE upcoming_movies SET movie_name=?, teaser_description=?, expected_release_date=?, poster_url=?, trailer_url=?, status=? WHERE upcoming_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, m.getMovieName());
            stmt.setString(2, m.getTeaserDescription());
            stmt.setDate(3, m.getExpectedReleaseDate());
            stmt.setString(4, m.getPosterUrl());
            stmt.setString(5, m.getTrailerUrl());
            stmt.setString(6, m.getStatus());
            stmt.setInt(7, m.getUpcomingId());
            return stmt.executeUpdate() > 0;
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to update upcoming movie", e);
            return false;
        }
    }

    public boolean deleteUpcomingMovie(int id) {
        String sql = "DELETE FROM upcoming_movies WHERE upcoming_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to delete upcoming movie", e);
            return false;
        }
    }

    public boolean registerInterest(int userId, int upcomingId) {
        String insert = "INSERT IGNORE INTO upcoming_movie_interest (user_id, upcoming_id) VALUES (?, ?)";
        String bump = "UPDATE upcoming_movies SET notify_count = notify_count + 1 WHERE upcoming_id=?";
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement s1 = conn.prepareStatement(insert);
                 PreparedStatement s2 = conn.prepareStatement(bump)) {
                s1.setInt(1, userId);
                s1.setInt(2, upcomingId);
                int rows = s1.executeUpdate();
                if (rows > 0) {
                    s2.setInt(1, upcomingId);
                    s2.executeUpdate();
                }
                conn.commit();
                return rows > 0;
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to register upcoming movie interest", e);
            return false;
        }
    }

    public List<UpcomingMovie> getTrendingUpcomingMovies() {
        List<UpcomingMovie> list = new ArrayList<>();
        String sql = "SELECT * FROM upcoming_movies WHERE status IN ('COMING_SOON','TRENDING') ORDER BY notify_count DESC, expected_release_date ASC LIMIT 5";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to fetch trending upcoming movies", e);
        }
        return list;
    }

    private UpcomingMovie map(ResultSet rs) throws Exception {
        UpcomingMovie m = new UpcomingMovie();
        m.setUpcomingId(rs.getInt("upcoming_id"));
        m.setMovieName(rs.getString("movie_name"));
        m.setTeaserDescription(rs.getString("teaser_description"));
        m.setExpectedReleaseDate(rs.getDate("expected_release_date"));
        m.setPosterUrl(rs.getString("poster_url"));
        m.setTrailerUrl(rs.getString("trailer_url"));
        m.setNotifyCount(rs.getInt("notify_count"));
        m.setStatus(rs.getString("status"));
        return m;
    }
}
