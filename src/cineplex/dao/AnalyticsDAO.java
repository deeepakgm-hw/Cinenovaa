package cineplex.dao;

import cineplex.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AnalyticsDAO {
    private static final Logger LOG = Logger.getLogger(AnalyticsDAO.class.getName());

    public List<Map<String, Object>> getMovieSalesAnalytics() {
        List<Map<String, Object>> rows = new ArrayList<>();
        String sql = "SELECT m.title AS movie_name, " +
                "COALESCE(SUM(1 + LENGTH(REPLACE(b.seats,' ','')) - LENGTH(REPLACE(REPLACE(b.seats,' ',''), ',', ''))), 0) AS tickets_sold, " +
                "COALESCE(SUM(b.total_amount), 0) AS revenue, " +
                "COALESCE(ROUND((SUM(1 + LENGTH(REPLACE(b.seats,' ','')) - LENGTH(REPLACE(REPLACE(b.seats,' ',''), ',', ''))) * 100.0) / NULLIF(SUM(scr.total_seats),0), 2), 0) AS occupancy_percent " +
                "FROM movies m " +
                "LEFT JOIN showtimes s ON s.movie_id = m.id " +
                "LEFT JOIN screens scr ON scr.id = s.screen_id " +
                "LEFT JOIN bookings b ON b.showtime_id = s.id AND b.booking_status = 'CONFIRMED' " +
                "GROUP BY m.id, m.title " +
                "ORDER BY revenue DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("movie_name", rs.getString("movie_name"));
                map.put("tickets_sold", rs.getInt("tickets_sold"));
                map.put("revenue", rs.getDouble("revenue"));
                map.put("occupancy_percent", rs.getDouble("occupancy_percent"));
                rows.add(map);
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to load movie sales analytics", e);
        }
        return rows;
    }

    public Map<String, Object> getSummary() {
        Map<String, Object> map = new HashMap<>();
        String sql = "SELECT COUNT(*) total_bookings, COALESCE(SUM(total_amount),0) total_revenue FROM bookings WHERE booking_status='CONFIRMED'";
        String topSql = "SELECT movie_name, COUNT(*) cnt FROM ticket_history GROUP BY movie_name ORDER BY cnt DESC LIMIT 1";
        String trendingUpcomingSql = "SELECT movie_name, notify_count FROM upcoming_movies ORDER BY notify_count DESC, expected_release_date ASC LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                map.put("total_bookings", rs.getInt("total_bookings"));
                map.put("total_revenue", rs.getDouble("total_revenue"));
            }
            try (PreparedStatement topStmt = conn.prepareStatement(topSql);
                 ResultSet top = topStmt.executeQuery()) {
                map.put("most_booked_movie", top.next() ? top.getString("movie_name") : "N/A");
            }
            try (PreparedStatement trStmt = conn.prepareStatement(trendingUpcomingSql);
                 ResultSet tr = trStmt.executeQuery()) {
                if (tr.next()) {
                    map.put("trending_upcoming_movie", tr.getString("movie_name"));
                    map.put("trending_upcoming_notify_count", tr.getInt("notify_count"));
                } else {
                    map.put("trending_upcoming_movie", "N/A");
                    map.put("trending_upcoming_notify_count", 0);
                }
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to load analytics summary", e);
        }
        return map;
    }
}
