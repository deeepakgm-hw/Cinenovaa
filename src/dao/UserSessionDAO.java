package dao;

import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

public class UserSessionDAO {
    private static final Logger LOG = Logger.getLogger(UserSessionDAO.class.getName());

    public String openSession(int userId, String username) {
        String existing = getActiveSessionId(userId);
        if (existing != null) {
            return existing;
        }

        String sessionId = "SES-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24).toUpperCase();
        String sql = "INSERT INTO user_sessions (session_id, user_id, username, login_time, status) " +
                "VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE')";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, sessionId);
            stmt.setInt(2, userId);
            stmt.setString(3, username);
            stmt.executeUpdate();
            return sessionId;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to open session for user_id=" + userId, e);
            return null;
        }
    }

    public boolean closeSession(String sessionId) {
        if (sessionId == null || sessionId.trim().isEmpty()) return false;
        String sql = "UPDATE user_sessions SET logout_time = CURRENT_TIMESTAMP, status = 'LOGGED_OUT' " +
                "WHERE session_id = ? AND status = 'ACTIVE'";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, sessionId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to close session: " + sessionId, e);
            return false;
        }
    }

    public int getActiveUserCount() {
        String sql = "SELECT COUNT(*) FROM user_sessions WHERE status = 'ACTIVE'";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to count active users", e);
        }
        return 0;
    }

    private String getActiveSessionId(int userId) {
        String sql = "SELECT session_id FROM user_sessions WHERE user_id = ? AND status = 'ACTIVE' " +
                "ORDER BY login_time DESC LIMIT 1";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getString("session_id");
            }
        } catch (SQLException e) {
            LOG.log(Level.WARNING, "Failed to check active session for user_id=" + userId, e);
        }
        return null;
    }
}
