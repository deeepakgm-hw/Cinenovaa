package dao;

import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReportDAO {

    /**
     * Aggregates revenue data by movie.
     * Purpose: Admin operations (Reporting).
     */
    public List<Map<String, Object>> getRevenueByMovie() {
        String sql = "SELECT m.title, COUNT(b.booking_id) as total_bookings, SUM(b.total_amount) as total_revenue " +
                     "FROM movies m " +
                     "JOIN showtimes s ON m.id = s.movie_id " +
                     "JOIN bookings b ON s.id = b.showtime_id " +
                     "GROUP BY m.title " +
                     "ORDER BY total_revenue DESC";
        return executeQuery(sql);
    }

    /**
     * Calculates seat occupancy percentages for showtimes.
     */
    public List<Map<String, Object>> getSeatOccupancy() {
        String sql = "SELECT m.title, scr.name, s.show_time, scr.total_seats, " +
                     "COUNT(b.booking_id) as booked_seats, " +
                     "(COUNT(b.booking_id) * 100.0 / scr.total_seats) as occupancy_percentage " +
                     "FROM showtimes s " +
                     "JOIN movies m ON s.movie_id = m.id " +
                     "JOIN screens scr ON s.screen_id = scr.id " +
                     "LEFT JOIN bookings b ON s.id = b.showtime_id " +
                     "GROUP BY s.id " +
                     "ORDER BY occupancy_percentage DESC";
        return executeQuery(sql);
    }

    /**
     * Tracks loyalty points usage.
     */
    public List<Map<String, Object>> getLoyaltyPointsUsage() {
        String sql = "SELECT u.username, SUM(lt.points_earned) as earned, SUM(lt.points_redeemed) as redeemed " +
                     "FROM users u " +
                     "JOIN wallet w ON u.id = w.user_id " +
                     "JOIN loyalty_transactions lt ON w.id = lt.wallet_id " +
                     "GROUP BY u.id";
        return executeQuery(sql);
    }

    private List<Map<String, Object>> executeQuery(String sql) {
        List<Map<String, Object>> results = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            ResultSetMetaData md = rs.getMetaData();
            int columns = md.getColumnCount();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columns; i++) {
                    row.put(md.getColumnLabel(i), rs.getObject(i));
                }
                results.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return results;
    }
}
