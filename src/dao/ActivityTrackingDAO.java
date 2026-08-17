package dao;

import model.Booking;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class ActivityTrackingDAO {

    public boolean insertTicketHistory(Booking booking, Connection conn) throws SQLException {
        String sql = "INSERT INTO ticket_history (booking_id, user_id, movie_name, seats, total_amount, booking_time) " +
                "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, booking.getBookingId());
            stmt.setInt(2, Integer.parseInt(booking.getUserId()));
            stmt.setString(3, booking.getMovieName() != null ? booking.getMovieName() : "UNKNOWN");
            stmt.setString(4, booking.getSeats() != null ? booking.getSeats() : "");
            stmt.setDouble(5, booking.getTotalAmount());
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean insertTransactionHistory(int userId, String bookingId, String transactionType,
                                            double amount, String paymentMethod, String status,
                                            Connection conn) throws SQLException {
        String sql = "INSERT INTO transaction_history " +
                "(user_id, booking_id, transaction_type, amount, transaction_time, payment_method, status) " +
                "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            if (bookingId == null || bookingId.trim().isEmpty()) {
                stmt.setNull(2, java.sql.Types.VARCHAR);
            } else {
                stmt.setString(2, bookingId);
            }
            stmt.setString(3, transactionType);
            stmt.setDouble(4, amount);
            if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
                stmt.setNull(5, java.sql.Types.VARCHAR);
            } else {
                stmt.setString(5, paymentMethod);
            }
            stmt.setString(6, status);
            return stmt.executeUpdate() > 0;
        }
    }
}
