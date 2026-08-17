package dao;

import model.Seat;
import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SeatDAO {
    private static final Logger LOG = Logger.getLogger(SeatDAO.class.getName());

    /**
     * Retrieves all seats for a specific screen.
     */
    public List<Seat> getSeatsForScreen(int screenId) {
        List<Seat> seats = new ArrayList<>();
        String sql = "SELECT * FROM seats WHERE screen_id = ? ORDER BY seat_number ASC";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, screenId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    seats.add(new Seat(
                        rs.getInt("id"),
                        rs.getInt("screen_id"),
                        rs.getString("seat_number"),
                        rs.getString("seat_type")
                    ));
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch seats for screen_id=" + screenId, e);
        }
        return seats;
    }

    /**
     * Retrieves booked seat numbers for a specific showtime.
     * Uses 'booking_status' column per unified_schema.sql.
     */
    public List<String> getBookedSeatNumbers(int showtimeId) {
        List<String> bookedSeats = new ArrayList<>();
        String sql = "SELECT seats FROM bookings WHERE showtime_id = ? AND booking_status != 'CANCELLED'";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, showtimeId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    String seatStr = rs.getString("seats");
                    if (seatStr != null && !seatStr.isEmpty()) {
                        String[] splitSeats = seatStr.split(",");
                        for (String s : splitSeats) {
                            bookedSeats.add(s.trim());
                        }
                    }
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch booked seats for showtime_id=" + showtimeId, e);
        }
        return bookedSeats;
    }
}
