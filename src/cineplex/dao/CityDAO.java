package cineplex.dao;

import cineplex.model.City;
import cineplex.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CityDAO {
    private static final Logger LOG = Logger.getLogger(CityDAO.class.getName());

    public List<City> getAllCities() {
        List<City> cities = new ArrayList<>();
        String sql = "SELECT * FROM cities ORDER BY name ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            while (rs.next()) {
                cities.add(new City(rs.getInt("id"), rs.getString("name")));
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to fetch all cities", e);
        }
        return cities;
    }

    public boolean addCity(String name) {
        String sql = "INSERT INTO cities (name) VALUES (?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, name);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to add city: " + name, e);
            return false;
        }
    }
}
