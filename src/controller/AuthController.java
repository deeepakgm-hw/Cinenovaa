package controller;

import dao.UserDAO;
import model.User;
import util.SessionManager;
import util.NavigationManager;
import view.LoginView;
import view.MovieListView;
import cineplex.view.AdminDashboardView;

import javax.swing.*;

public class AuthController {
    private final UserDAO userDAO = new UserDAO();

    public void login(String username, String password) {
        User user = userDAO.loginUser(username, password);
        if (user != null) {
            String role = user.getRole() != null ? user.getRole().trim() : "";
            SessionManager.getInstance().login(user.getId(), user.getUsername(), role);
            cineplex.util.SessionManager.getInstance().login(user.getId(), user.getUsername(), role);

            if ("ADMIN".equalsIgnoreCase(role)) {
                AdminDashboardView adminView = new AdminDashboardView();
                adminView.setVisible(true);
                if (NavigationManager.getMainFrame() != null) {
                    NavigationManager.getMainFrame().dispose();
                }
            } else {
                NavigationManager.navigateTo(new MovieListView(), "MOVIES");
            }
        } else {
            JOptionPane.showMessageDialog(null, "Invalid username or password", "Login Failed", JOptionPane.ERROR_MESSAGE);
        }
    }

    public void register(User user) {
        if (userDAO.registerUser(user)) {
            JOptionPane.showMessageDialog(null, "Registration successful!", "Success", JOptionPane.INFORMATION_MESSAGE);
            NavigationManager.navigateTo(new LoginView(), "LOGIN");
        } else {
            JOptionPane.showMessageDialog(null, "Registration failed. Username or email might be taken.", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    public void logout() {
        SessionManager.getInstance().clearSession();
        cineplex.util.SessionManager.getInstance().clearSession();
        NavigationManager.resetToLogin(new LoginView());
    }
}
