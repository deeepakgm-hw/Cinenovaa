package dao;

import model.Booking;
import model.Payment;
import model.SnackOrder;
import util.DatabaseConnection;

import javax.swing.*;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class BookingDAO {
    private static final Logger LOG = Logger.getLogger(BookingDAO.class.getName());

    private final WalletDAO walletDAO = new WalletDAO();
    private final PaymentDAO paymentDAO = new PaymentDAO();
    private final SnackDAO snackDAO = new SnackDAO();
    private final ActivityTrackingDAO activityTrackingDAO = new ActivityTrackingDAO();
    private final SeatLockDAO seatLockDAO = new SeatLockDAO();

    /**
     * Executes the entire booking flow as an atomic transaction.
     * Order: Booking → Snacks → Payment → Wallet → Loyalty
     */
    public boolean processBookingTransaction(Booking booking, Payment payment, int pointsEarned, int pointsRedeemed) {
        Connection conn = null;
        try {
            conn = DatabaseConnection.getConnection();
            conn.setAutoCommit(false); // Begin transaction
            int userId = Integer.parseInt(booking.getUserId());
            LOG.info("Calling validateAndMarkBooked. Showtime ID: " + booking.getShowtimeId() + ", Seats: " + booking.getSeats() + ", User ID: " + userId);
            if (!seatLockDAO.validateAndMarkBooked(booking.getShowtimeId(), booking.getSeats(), userId, conn)) {
                throw new SQLException("Selected seats are no longer available.");
            }

            // 1. Create Booking Record
            if (!saveBooking(booking, conn)) {
                throw new SQLException("Failed to create booking record.");
            }

            // 2. Handle Snack Orders & Stock
            for (SnackOrder order : booking.getSnackOrders()) {
                order.setBookingId(booking.getBookingId());
                if (!saveSnackOrder(order, conn)) {
                    throw new SQLException("Failed to save snack order.");
                }
                if (!activityTrackingDAO.insertTransactionHistory(
                        Integer.parseInt(booking.getUserId()),
                        booking.getBookingId(),
                        "SNACK_PURCHASE",
                        order.getTotalPrice(),
                        "BOOKING_ADDON",
                        "SUCCESS",
                        conn)) {
                    throw new SQLException("Failed to save snack transaction history.");
                }
                if (!snackDAO.deductSnackStock(order.getSnackId(), order.getQuantity(), conn)) {
                    throw new SQLException("Insufficient stock for snack ID: " + order.getSnackId());
                }
            }

            // 3. Process Payment Record
            payment.setBookingId(booking.getBookingId());
            if (!paymentDAO.savePayment(payment, conn)) {
                throw new SQLException("Failed to save payment record.");
            }
            if (!activityTrackingDAO.insertTransactionHistory(
                    userId, booking.getBookingId(), "PAYMENT", payment.getAmount(),
                    payment.getPaymentMethod(), payment.getPaymentStatus(), conn)) {
                throw new SQLException("Failed to save payment transaction history.");
            }

            // 4. Deduct Wallet Balance (if WALLET payment)
            if ("WALLET".equalsIgnoreCase(payment.getPaymentMethod())) {
                if (!walletDAO.deductBalance(booking.getUserId(), payment.getAmount(), conn)) {
                    throw new SQLException("Insufficient wallet balance.");
                }
                if (!activityTrackingDAO.insertTransactionHistory(
                        userId, booking.getBookingId(), "WALLET_DEDUCTION", payment.getAmount(),
                        "WALLET", "SUCCESS", conn)) {
                    throw new SQLException("Failed to save wallet deduction history.");
                }
            }

            // 5. Update Loyalty Points
            if (!walletDAO.updateLoyaltyPoints(booking.getUserId(), pointsEarned, pointsRedeemed, conn)) {
                throw new SQLException("Failed to update loyalty points.");
            }

            // 6. Record Loyalty Transaction
            model.Wallet wallet = walletDAO.getWalletByUserId(booking.getUserId(), conn);
            if (wallet != null) {
                walletDAO.recordLoyaltyTransaction(wallet.getWalletId(), pointsEarned, pointsRedeemed, conn);
                if (pointsEarned > 0) {
                    activityTrackingDAO.insertTransactionHistory(
                            userId, booking.getBookingId(), "LOYALTY_EARNED", pointsEarned,
                            "LOYALTY", "SUCCESS", conn);
                }
                if (pointsRedeemed > 0) {
                    activityTrackingDAO.insertTransactionHistory(
                            userId, booking.getBookingId(), "LOYALTY_REDEEMED", pointsRedeemed,
                            "LOYALTY", "SUCCESS", conn);
                }
            }

            if (!activityTrackingDAO.insertTicketHistory(booking, conn)) {
                throw new SQLException("Failed to insert ticket history.");
            }

            if (!markBookingConfirmed(booking.getBookingId(), conn)) {
                throw new SQLException("Failed to mark booking as CONFIRMED.");
            }

            conn.commit(); // Commit all changes atomically
            return true;

        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Booking transaction failed — rolling back. Reason: " + e.getMessage(), e);
            if (conn != null) {
                try {
                    conn.rollback();
                    LOG.warning("Transaction rolled back successfully.");
                } catch (SQLException ex) {
                    LOG.log(Level.SEVERE, "Rollback failed!", ex);
                }
            }
            showErrorMessage("Transaction Failed: " + e.getMessage());
            return false;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    LOG.log(Level.WARNING, "Failed to close connection after transaction", e);
                }
            }
        }
    }

    private boolean saveBooking(Booking booking, Connection conn) throws SQLException {
        String sql = "INSERT INTO bookings (booking_id, user_id, showtime_id, movie_name, theatre_name, show_time, seats, total_amount, booking_status) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, booking.getBookingId());
            stmt.setInt(2, Integer.parseInt(booking.getUserId()));
            stmt.setInt(3, booking.getShowtimeId());
            stmt.setString(4, booking.getMovieName());
            stmt.setString(5, booking.getTheatreName());
            stmt.setTimestamp(6, booking.getShowTime());
            stmt.setString(7, booking.getSeats());
            stmt.setDouble(8, booking.getTotalAmount());
            stmt.setString(9, booking.getBookingStatus());
            return stmt.executeUpdate() > 0;
        }
    }

    private boolean saveSnackOrder(SnackOrder order, Connection conn) throws SQLException {
        String sql = "INSERT INTO snack_orders (booking_id, snack_id, quantity, total_price) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, order.getBookingId());
            stmt.setInt(2, order.getSnackId());
            stmt.setInt(3, order.getQuantity());
            stmt.setDouble(4, order.getTotalPrice());
            return stmt.executeUpdate() > 0;
        }
    }

    private boolean markBookingConfirmed(String bookingId, Connection conn) throws SQLException {
        String sql = "UPDATE bookings SET booking_status = 'CONFIRMED' WHERE booking_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, bookingId);
            return stmt.executeUpdate() > 0;
        }
    }

    private void showErrorMessage(String message) {
        SwingUtilities.invokeLater(
                () -> JOptionPane.showMessageDialog(null, message, "Booking Error", JOptionPane.ERROR_MESSAGE));
    }
}
