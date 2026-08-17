package dao;

import model.User;
import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class UserDAO {
    private static final Logger LOG = Logger.getLogger(UserDAO.class.getName());

    /**
     * Registers a new user.
     */
    public boolean registerUser(User user) {
        String sql = "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            String resolvedRole = (user.getRole() != null && !user.getRole().trim().isEmpty())
                    ? user.getRole().trim().toUpperCase()
                    : "USER";

            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getPassword());
            pstmt.setString(3, user.getEmail());
            pstmt.setString(4, resolvedRole);

            int rows = pstmt.executeUpdate();
            LOG.info("registerUser success: username=" + user.getUsername() + ", role=" + resolvedRole
                    + ", rowsAffected=" + rows + ", autoCommit=" + conn.getAutoCommit());
            return rows > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to register user: " + user.getUsername(), e);
            return false;
        }
    }

    /**
     * Authenticates a user.
     */
    public User loginUser(String username, String password) {
        String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, username);
            pstmt.setString(2, password);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Login query failed for user: " + username, e);
        }
        return null;
    }

    public User getUserById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to get user by id: " + id, e);
        }
        return null;
    }

    public int getTotalLoginSessions() {
        String sql = "SELECT COUNT(*) FROM user_sessions";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch total login sessions", e);
        }
        return 0;
    }

    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("id"),
            rs.getString("username"),
            rs.getString("password"),
            rs.getString("email"),
            rs.getString("role")
        );
    }
}
