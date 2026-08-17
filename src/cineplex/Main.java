package cineplex;

import util.ThemeUtil;
import cineplex.view.LoginView;

import javax.swing.SwingUtilities;

public class Main {
    public static void main(String[] args) {
        ThemeUtil.setupModernLookAndFeel();

        SwingUtilities.invokeLater(() -> {
            LoginView loginView = new LoginView();
            loginView.setVisible(true);
        });
    }
}
