package dao;

import model.Screen;
import util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ScreenDAO {

    /**
     * Fetches all screens.
     * Purpose: Admin operations (adding showtimes).
     */
    public List<Screen> getAllScreens() {
        List<Screen> screens = new ArrayList<>();
        String sql = "SELECT * FROM screens";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                screens.add(new Screen(
                    rs.getInt("id"),
                    rs.getInt("theatre_id"),
                    rs.getString("name"),
                    rs.getInt("total_seats")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return screens;
    }

    public Screen getScreenById(int id) {
        String sql = "SELECT * FROM screens WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new Screen(
                        rs.getInt("id"),
                        rs.getInt("theatre_id"),
                        rs.getString("name"),
                        rs.getInt("total_seats")
                    );
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}
