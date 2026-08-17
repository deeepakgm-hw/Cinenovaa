package util;

import javax.swing.*;
import java.awt.*;
import java.util.logging.Logger;

/**
 * Centralized navigation manager using CardLayout.
 * Fixes: duplicate panel accumulation — panels are replaced each time
 * the same screen name is navigated to, preventing ghost panel memory growth.
 */
public class NavigationManager {
    private static final Logger LOG = Logger.getLogger(NavigationManager.class.getName());

    private static JFrame mainFrame;
    private static JPanel contentPanel;
    private static CardLayout cardLayout;

    public static void init() {
        mainFrame = new JFrame("CinePlex Movie Booking System");
        mainFrame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        mainFrame.setSize(1200, 800);
        mainFrame.setLocationRelativeTo(null);

        cardLayout = new CardLayout();
        contentPanel = new JPanel(cardLayout);

        mainFrame.add(contentPanel);
        mainFrame.setVisible(true);
    }

    /**
     * Navigates to a panel, replacing any existing panel registered under the same name.
     * This prevents stale-panel accumulation in CardLayout.
     */
    public static void navigateTo(JPanel panel, String name) {
        if (mainFrame == null || contentPanel == null) {
            init();
        }

        // Remove stale panel with same name to prevent ghost panel accumulation
        for (Component c : contentPanel.getComponents()) {
            if (name.equals(c.getName())) {
                contentPanel.remove(c);
                break;
            }
        }

        panel.setName(name);
        contentPanel.add(panel, name);
        cardLayout.show(contentPanel, name);
        mainFrame.setTitle("CinePlex - " + name);
        mainFrame.revalidate();
        mainFrame.repaint();
        LOG.fine("Navigated to screen: " + name);
    }

    public static void setTitle(String title) {
        if (mainFrame != null) {
            mainFrame.setTitle("CinePlex - " + title);
        }
    }

    public static JFrame getMainFrame() {
        return mainFrame;
    }

    public static void resetToLogin(JPanel loginPanel) {
        if (mainFrame == null || contentPanel == null) {
            init();
        }
        contentPanel.removeAll();
        loginPanel.setName("LOGIN");
        contentPanel.add(loginPanel, "LOGIN");
        cardLayout.show(contentPanel, "LOGIN");
        mainFrame.setTitle("CinePlex - LOGIN");
        mainFrame.revalidate();
        mainFrame.repaint();
    }
}
