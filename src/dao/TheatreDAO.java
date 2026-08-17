package dao;

import model.Theatre;
import util.DatabaseConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class TheatreDAO {
    private static final Logger LOG = Logger.getLogger(TheatreDAO.class.getName());

    public List<Theatre> getTheatresByCity(int cityId) {
        List<Theatre> theatres = new ArrayList<>();
        String sql = "SELECT * FROM theatres WHERE city_id = ? ORDER BY name ASC";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, cityId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    theatres.add(new Theatre(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getInt("city_id"),
                        rs.getString("location")
                    ));
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch theatres for city_id=" + cityId, e);
        }
        return theatres;
    }

    public boolean addTheatre(String name, int cityId, String location) {
        String sql = "INSERT INTO theatres (name, city_id, location) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, name);
            pstmt.setInt(2, cityId);
            pstmt.setString(3, location);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add theatre: " + name, e);
            return false;
        }
    }
}
