package dao;

import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SeatLockDAO {
    private static final Logger LOG = Logger.getLogger(SeatLockDAO.class.getName());
    private static final int LOCK_MINUTES = 5;

    public boolean lockSeat(int showtimeId, String seatNumber, int userId) {
        String cleanSeat = normalizeSeat(seatNumber);
        try (Connection conn = DatabaseConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                cleanupExpiredLocks(conn, showtimeId);
                if (isBooked(conn, showtimeId, cleanSeat)) {
                    conn.rollback();
                    return false;
                }
                if (isLockedByOther(conn, showtimeId, cleanSeat, userId)) {
                    conn.rollback();
                    return false;
                }

                String upsert = "INSERT INTO seat_locks (showtime_id, seat_number, user_id, status, expires_at) " +
                        "VALUES (?, ?, ?, 'LOCKED', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE))";
                try (PreparedStatement stmt = conn.prepareStatement(upsert)) {
                    stmt.setInt(1, showtimeId);
                    stmt.setString(2, cleanSeat);
                    stmt.setInt(3, userId);
                    stmt.setInt(4, LOCK_MINUTES);
                    stmt.executeUpdate();
                }
                conn.commit();
                return true;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to lock seat " + cleanSeat + " for showtime " + showtimeId, e);
            return false;
        }
    }

    public void releaseSeatLock(int showtimeId, String seatNumber, int userId) {
        String sql = "UPDATE seat_locks SET status='RELEASED' WHERE showtime_id=? AND seat_number=? AND user_id=? AND status='LOCKED'";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, showtimeId);
            stmt.setString(2, normalizeSeat(seatNumber));
            stmt.setInt(3, userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            LOG.log(Level.WARNING, "Failed to release seat lock", e);
        }
    }

    public void releaseAllUserLocks(int showtimeId, int userId) {
        String sql = "UPDATE seat_locks SET status='RELEASED' WHERE showtime_id=? AND user_id=? AND status='LOCKED'";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, showtimeId);
            stmt.setInt(2, userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            LOG.log(Level.WARNING, "Failed to release user locks", e);
        }
    }

    public Set<String> getLockedSeatsByOtherUsers(int showtimeId, int userId) {
        Set<String> result = new HashSet<>();
        String sql = "SELECT seat_number FROM seat_locks WHERE showtime_id=? AND status='LOCKED' AND expires_at > CURRENT_TIMESTAMP AND user_id <> ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, showtimeId);
            stmt.setInt(2, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) result.add(normalizeSeat(rs.getString("seat_number")));
            }
        } catch (SQLException e) {
            LOG.log(Level.WARNING, "Failed to fetch locked seats", e);
        }
        return result;
    }

    public boolean validateAndMarkBooked(int showtimeId, String seatsCsv, int userId, Connection conn) throws SQLException {
        cleanupExpiredLocks(conn, showtimeId);
        String[] seats = seatsCsv.split(",");
        for (String raw : seats) {
            String seat = normalizeSeat(raw);
            if (isBooked(conn, showtimeId, seat)) return false;
            if (isLockedByOther(conn, showtimeId, seat, userId)) return false;
        }
        String markBooked = "UPDATE seat_locks SET status='BOOKED' WHERE showtime_id=? AND user_id=? AND status='LOCKED'";
        try (PreparedStatement stmt = conn.prepareStatement(markBooked)) {
            stmt.setInt(1, showtimeId);
            stmt.setInt(2, userId);
            stmt.executeUpdate();
        }
        return true;
    }

    private boolean isLockedByOther(Connection conn, int showtimeId, String seat, int userId) throws SQLException {
        String sql = "SELECT 1 FROM seat_locks WHERE showtime_id=? AND seat_number=? AND status='LOCKED' AND expires_at > CURRENT_TIMESTAMP AND user_id <> ? LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, showtimeId);
            stmt.setString(2, seat);
            stmt.setInt(3, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private boolean isBooked(Connection conn, int showtimeId, String seat) throws SQLException {
        String sql = "SELECT 1 FROM bookings WHERE showtime_id=? AND booking_status='CONFIRMED' " +
                "AND CONCAT(',', REPLACE(seats,' ',''), ',') LIKE ? LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, showtimeId);
            stmt.setString(2, "%," + seat + ",%");
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private void cleanupExpiredLocks(Connection conn, int showtimeId) throws SQLException {
        String sql = "UPDATE seat_locks SET status='RELEASED' WHERE showtime_id=? AND status='LOCKED' AND expires_at <= CURRENT_TIMESTAMP";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, showtimeId);
            stmt.executeUpdate();
        }
    }

    private String normalizeSeat(String seat) {
        return seat == null ? "" : seat.trim().replace(" ", "").toUpperCase();
    }
}
