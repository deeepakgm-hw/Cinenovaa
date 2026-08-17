package dao;

import model.Snack;
import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for snack operations.
 * Provides CRUD methods, stock management and safe transaction handling.
 */
public class SnackDAO {
    private static final Logger LOG = Logger.getLogger(SnackDAO.class.getName());

    /**
     * Retrieves all snacks from the database.
     */
    public List<Snack> getAllSnacks() {
        List<Snack> snacks = new ArrayList<>();
        String sql = "SELECT id, name, category, price, stock_quantity FROM snacks";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            while (rs.next()) {
                snacks.add(mapResultSetToSnack(rs));
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch snacks", e);
        }
        return snacks;
    }

    /**
     * Retrieves a snack by its id.
     */
    public Snack getSnackById(int id) {
        String sql = "SELECT id, name, category, price, stock_quantity FROM snacks WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToSnack(rs);
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch snack by id: " + id, e);
        }
        return null;
    }

    /**
     * Deducts snack stock within a transaction.
     * Used by BookingDAO.processBookingTransaction.
     */
    public boolean deductSnackStock(int snackId, int quantity, Connection conn) throws SQLException {
        String checkSql = "SELECT stock_quantity FROM snacks WHERE id = ? FOR UPDATE";
        String updateSql = "UPDATE snacks SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?";
        
        try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            checkStmt.setInt(1, snackId);
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next()) {
                    int currentStock = rs.getInt("stock_quantity");
                    if (currentStock < quantity) {
                        return false; // Insufficient stock
                    }
                } else {
                    return false; // Snack not found
                }
            }
        }

        try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
            updateStmt.setInt(1, quantity);
            updateStmt.setInt(2, snackId);
            updateStmt.setInt(3, quantity);
            return updateStmt.executeUpdate() > 0;
        }
    }

    /**
     * Inserts a new snack into the database.
     */
    public boolean addSnack(Snack snack) {
        String sql = "INSERT INTO snacks (name, category, price, stock_quantity) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            pstmt.setString(1, snack.getName());
            pstmt.setString(2, snack.getDescription());
            pstmt.setDouble(3, snack.getPrice());
            pstmt.setInt(4, snack.getStockQuantity());

            if (pstmt.executeUpdate() > 0) {
                try (ResultSet rs = pstmt.getGeneratedKeys()) {
                    if (rs.next()) snack.setId(rs.getInt(1));
                }
                return true;
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add snack", e);
        }
        return false;
    }

    /**
     * Updates an existing snack.
     */
    public boolean updateSnack(Snack snack) {
        String sql = "UPDATE snacks SET name = ?, category = ?, price = ?, stock_quantity = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, snack.getName());
            pstmt.setString(2, snack.getDescription());
            pstmt.setDouble(3, snack.getPrice());
            pstmt.setInt(4, snack.getStockQuantity());
            pstmt.setInt(5, snack.getId());
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to update snack", e);
        }
        return false;
    }

    /**
     * Deletes a snack by id.
     */
    public boolean deleteSnack(int id) {
        String sql = "DELETE FROM snacks WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to delete snack", e);
        }
        return false;
    }

    private Snack mapResultSetToSnack(ResultSet rs) throws SQLException {
        return new Snack(
            rs.getInt("id"),
            rs.getString("name"),
            rs.getString("category"),
            rs.getDouble("price"),
            rs.getInt("stock_quantity")
        );
    }
}
