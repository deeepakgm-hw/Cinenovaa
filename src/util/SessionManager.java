package util;

import dao.UserSessionDAO;

public class SessionManager {
    private static SessionManager instance;
    private int currentUserId;
    private String currentUserRole;
    private String currentUserName;
    private String currentSessionId;
    private final UserSessionDAO userSessionDAO = new UserSessionDAO();

    private SessionManager() {}

    public static synchronized SessionManager getInstance() {
        if (instance == null) {
            instance = new SessionManager();
        }
        return instance;
    }

    public void login(int userId, String userName, String role) {
        this.currentUserId = userId;
        this.currentUserName = userName;
        this.currentUserRole = role;
        this.currentSessionId = userSessionDAO.openSession(userId, userName);
    }

    public void logout() {
        userSessionDAO.closeSession(this.currentSessionId);
        this.currentUserId = 0;
        this.currentUserName = null;
        this.currentUserRole = null;
        this.currentSessionId = null;
    }

    public void clearSession() {
        logout();
    }

    public boolean isLoggedIn() {
        return currentUserName != null;
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(currentUserRole);
    }

    public int getCurrentUserId() { 
        return currentUserId; 
    }

    public String getCurrentUserRole() { 
        return currentUserRole; 
    }

    public String getCurrentUserName() { 
        return currentUserName; 
    }

    public String getCurrentSessionId() {
        return currentSessionId;
    }

    public int getActiveUserCount() {
        return userSessionDAO.getActiveUserCount();
    }
}
