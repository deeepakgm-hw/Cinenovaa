package view;

import controller.AuthController;
import util.RoundedButton;
import util.RoundedPanel;
import util.ThemeUtil;

import javax.swing.*;
import java.awt.*;

public class LoginView extends JPanel {
    private final AuthController authController = new AuthController();
    private JTextField usernameField;
    private JPasswordField passwordField;

    public LoginView() {
        setLayout(new BorderLayout());
        setBackground(ThemeUtil.BACKGROUND_DARK);
        initUI();
    }

    private void initUI() {
        JPanel centerPanel = new RoundedPanel(20, ThemeUtil.PANEL_BACKGROUND);
        centerPanel.setLayout(new GridBagLayout());
        centerPanel.setPreferredSize(new Dimension(400, 500));
        
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Title
        JLabel titleLabel = new JLabel("CinePlex Login");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 28));
        titleLabel.setForeground(ThemeUtil.ACCENT_GOLD);
        gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2;
        centerPanel.add(titleLabel, gbc);

        // Username
        gbc.gridy++; gbc.gridwidth = 1;
        centerPanel.add(createLabel("Username:"), gbc);
        usernameField = createTextField();
        gbc.gridx = 1;
        centerPanel.add(usernameField, gbc);

        // Password
        gbc.gridx = 0; gbc.gridy++;
        centerPanel.add(createLabel("Password:"), gbc);
        passwordField = createPasswordField();
        gbc.gridx = 1;
        centerPanel.add(passwordField, gbc);

        // Login Button
        RoundedButton loginBtn = new RoundedButton("Login", 15, ThemeUtil.ACCENT_RED, Color.WHITE);
        loginBtn.addActionListener(e -> authController.login(usernameField.getText(), new String(passwordField.getPassword())));
        gbc.gridx = 0; gbc.gridy++; gbc.gridwidth = 2;
        centerPanel.add(loginBtn, gbc);

        // Register Link
        JButton registerBtn = new JButton("Don't have an account? Register here");
        registerBtn.setForeground(Color.GRAY);
        registerBtn.setBorderPainted(false);
        registerBtn.setContentAreaFilled(false);
        registerBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        gbc.gridy++;
        centerPanel.add(registerBtn, gbc);

        add(centerPanel, BorderLayout.CENTER);
    }

    private JLabel createLabel(String text) {
        JLabel label = new JLabel(text);
        label.setForeground(Color.WHITE);
        label.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        return label;
    }

    private JTextField createTextField() {
        JTextField field = new JTextField(15);
        field.setBackground(new Color(38, 38, 38));
        field.setForeground(Color.WHITE);
        field.setCaretColor(Color.WHITE);
        field.setSelectionColor(new Color(229, 9, 20));
        field.setSelectedTextColor(Color.WHITE);
        field.setOpaque(true);
        field.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
        return field;
    }

    private JPasswordField createPasswordField() {
        JPasswordField field = new JPasswordField(15);
        field.setBackground(new Color(38, 38, 38));
        field.setForeground(Color.WHITE);
        field.setCaretColor(Color.WHITE);
        field.setSelectionColor(new Color(229, 9, 20));
        field.setSelectedTextColor(Color.WHITE);
        field.setOpaque(true);
        field.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
        return field;
    }
}
