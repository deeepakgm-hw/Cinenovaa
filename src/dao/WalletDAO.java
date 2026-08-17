package dao;

import model.Wallet;
import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class WalletDAO {

    /**
     * Retrieves a wallet for a given user ID.
     * Aligned with unified_schema.sql: table 'wallet', columns 'id', 'user_id', 'balance', 'loyalty_points'.
     */
    public Wallet getWalletByUserId(String userId) throws SQLException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            return getWalletByUserId(userId, conn);
        }
    }

    public Wallet getWalletByUserId(String userId, Connection conn) throws SQLException {
        String sql = "SELECT id, user_id, balance, loyalty_points FROM wallet WHERE user_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            // Note: Schema uses INT for user_id, converting String userId to int
            stmt.setInt(1, Integer.parseInt(userId));
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return new Wallet(
                        rs.getInt("id"),
                        String.valueOf(rs.getInt("user_id")),
                        rs.getDouble("balance"),
                        rs.getInt("loyalty_points")
                    );
                }
            }
        } catch (NumberFormatException e) {
            throw new SQLException("Invalid user ID format: " + userId);
        }
        return null;
    }

    /**
     * Deduct balance from wallet. Part of an atomic transaction.
     */
    public boolean deductBalance(String userId, double amount, Connection conn) throws SQLException {
        String sql = "UPDATE wallet SET balance = balance - ? WHERE user_id = ? AND balance >= ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setDouble(1, amount);
            stmt.setInt(2, Integer.parseInt(userId));
            stmt.setDouble(3, amount);
            int rows = stmt.executeUpdate();
            return rows > 0;
        }
    }

    /**
     * Updates loyalty points. Part of an atomic transaction.
     */
    public boolean updateLoyaltyPoints(String userId, int pointsEarned, int pointsRedeemed, Connection conn) throws SQLException {
        String sql = "UPDATE wallet SET loyalty_points = loyalty_points + ? - ? WHERE user_id = ? AND loyalty_points >= ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pointsEarned);
            stmt.setInt(2, pointsRedeemed);
            stmt.setInt(3, Integer.parseInt(userId));
            stmt.setInt(4, pointsRedeemed);
            int rows = stmt.executeUpdate();
            return rows > 0;
        }
    }
    
    /**
     * Records loyalty transaction. Part of an atomic transaction.
     */
    public void recordLoyaltyTransaction(int walletId, int pointsEarned, int pointsRedeemed, Connection conn) throws SQLException {
        String sql = "INSERT INTO loyalty_transactions (wallet_id, points_earned, points_redeemed) VALUES (?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, walletId);
            stmt.setInt(2, pointsEarned);
            stmt.setInt(3, pointsRedeemed);
            stmt.executeUpdate();
        }
    }
}
