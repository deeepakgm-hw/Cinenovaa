package controller;

import dao.SnackDAO;
import model.Snack;

import java.util.List;

public class SnackController {
    
    private SnackDAO snackDAO;

    public SnackController() {
        this.snackDAO = new SnackDAO();
    }

    /**
     * Retrieves all available snacks from the database.
     */
    public List<Snack> getAvailableSnacks() {
        return snackDAO.getAllSnacks();
    }

    /**
     * Filter snacks by search text.
     */
    public List<Snack> filterSnacks(List<Snack> allSnacks, String query) {
        if (query == null || query.trim().isEmpty()) {
            return allSnacks;
        }
        query = query.toLowerCase();
        List<Snack> filtered = new java.util.ArrayList<>();
        for (Snack s : allSnacks) {
            if (s.getSnackName().toLowerCase().contains(query) || 
                s.getCategory().toLowerCase().contains(query)) {
                filtered.add(s);
            }
        }
        return filtered;
    }
}
