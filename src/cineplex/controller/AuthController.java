package cineplex.controller;

import cineplex.dao.UserDAO;
import cineplex.dao.WalletDAO;
import cineplex.model.User;
import cineplex.util.SessionManager;

public class AuthController {
    private UserDAO userDAO;
    private WalletDAO walletDAO;

    public AuthController() {
        this.userDAO = new UserDAO();
        this.walletDAO = new WalletDAO();
    }

    public boolean login(String username, String password) {
        User user = userDAO.loginUser(username, password);
        if (user != null) {
            SessionManager.getInstance().login(user.getId(), user.getUsername(), user.getRole());
            return true;
        }
        return false;
    }

    public boolean register(String username, String password, String email) {
        // Prevent duplicate email registrations
        if (userDAO.getUserByEmail(email) != null) {
            return false;
        }

        User user = new User(0, username, password, email, "USER");
        if (userDAO.registerUser(user)) {
            User createdUser = userDAO.getUserByEmail(email);
            if (createdUser != null) {
                walletDAO.createWallet(createdUser.getId());
            }
            return true;
        }
        return false;
    }

    public void logout() {
        SessionManager.getInstance().logout();
    }
}
