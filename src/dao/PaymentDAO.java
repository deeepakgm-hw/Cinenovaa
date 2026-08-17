package dao;

import model.Payment;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class PaymentDAO {

    /**
     * Saves a payment record. Should be part of a transaction.
     */
    public boolean savePayment(Payment payment, Connection conn) throws SQLException {
        String sql = "INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, payment.getBookingId());
            stmt.setDouble(2, payment.getAmount());
            stmt.setString(3, payment.getPaymentMethod());
            stmt.setString(4, payment.getPaymentStatus());
            
            int rows = stmt.executeUpdate();
            return rows > 0;
        }
    }
}
