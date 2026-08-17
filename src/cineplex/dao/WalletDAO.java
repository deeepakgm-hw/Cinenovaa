package cineplex.dao;

import cineplex.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class WalletDAO {
    private static final Logger LOG = Logger.getLogger(WalletDAO.class.getName());

    public boolean createWallet(int userId) {
        String sql = "INSERT INTO wallet (user_id, balance, loyalty_points) VALUES (?, 0.00, 0)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to create wallet for user_id=" + userId, e);
            return false;
        }
    }

    public boolean addBalance(int userId, double amount) {
        String sql = "UPDATE wallet SET balance = balance + ? WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setDouble(1, amount);
            pstmt.setInt(2, userId);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add balance for user_id=" + userId, e);
            return false;
        }
    }

    public boolean deductBalance(int userId, double amount) {
        String sql = "UPDATE wallet SET balance = balance - ? WHERE user_id = ? AND balance >= ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setDouble(1, amount);
            pstmt.setInt(2, userId);
            pstmt.setDouble(3, amount);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to deduct balance for user_id=" + userId, e);
            return false;
        }
    }

    /**
     * Overloaded — uses a shared transaction connection for atomicity.
     */
    public boolean deductBalance(Connection conn, int userId, double amount) throws SQLException {
        String sql = "UPDATE wallet SET balance = balance - ? WHERE user_id = ? AND balance >= ?";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setDouble(1, amount);
            pstmt.setInt(2, userId);
            pstmt.setDouble(3, amount);
            return pstmt.executeUpdate() > 0;
        }
    }

    public double getBalance(int userId) {
        String sql = "SELECT balance FROM wallet WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getDouble("balance");
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to get balance for user_id=" + userId, e);
        }
        return 0.0;
    }

    public boolean addLoyaltyPoints(int userId, int points) {
        String sql = "UPDATE wallet SET loyalty_points = loyalty_points + ? WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, points);
            pstmt.setInt(2, userId);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add loyalty points for user_id=" + userId, e);
            return false;
        }
    }

    public boolean redeemPoints(int userId, int points) {
        String sql = "UPDATE wallet SET loyalty_points = loyalty_points - ? WHERE user_id = ? AND loyalty_points >= ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, points);
            pstmt.setInt(2, userId);
            pstmt.setInt(3, points);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to redeem points for user_id=" + userId, e);
            return false;
        }
    }
}
