package cineplex.view;

import cineplex.controller.AuthController;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;

public class RegisterView extends JFrame {
    private JTextField txtUsername;
    private JTextField txtEmail;
    private JPasswordField txtPassword;
    private AuthController authController;

    public RegisterView() {
        authController = new AuthController();
        initUI();
    }

    private void initUI() {
        setTitle("CinePlex - Register");
        setSize(400, 550);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(18, 18, 18));
        setLayout(new BorderLayout());

        JPanel mainPanel = new JPanel();
        mainPanel.setLayout(new BoxLayout(mainPanel, BoxLayout.Y_AXIS));
        mainPanel.setBackground(new Color(18, 18, 18));
        mainPanel.setBorder(BorderFactory.createEmptyBorder(30, 40, 30, 40));

        JLabel lblTitle = new JLabel("JOIN CINEPLEX");
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 28));
        lblTitle.setForeground(new Color(229, 9, 20));
        lblTitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        txtUsername = createTextField();
        txtEmail = createTextField();
        txtPassword = createPasswordField();

        JButton btnRegister = new JButton("CREATE ACCOUNT");
        btnRegister.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        btnRegister.setBackground(new Color(229, 9, 20));
        btnRegister.setForeground(Color.WHITE);
        btnRegister.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnRegister.setFocusPainted(false);
        btnRegister.setBorderPainted(false);
        btnRegister.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnRegister.addActionListener(this::handleRegister);

        JButton btnLogin = new JButton("Already have an account? Login");
        btnLogin.setForeground(Color.LIGHT_GRAY);
        btnLogin.setBackground(new Color(18, 18, 18));
        btnLogin.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        btnLogin.setBorderPainted(false);
        btnLogin.setFocusPainted(false);
        btnLogin.setContentAreaFilled(false);
        btnLogin.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnLogin.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnLogin.addActionListener(e -> {
            new LoginView().setVisible(true);
            dispose();
        });

        mainPanel.add(Box.createVerticalGlue());
        mainPanel.add(lblTitle);
        mainPanel.add(Box.createRigidArea(new Dimension(0, 30)));

        addLabeledField(mainPanel, "Username", txtUsername);
        addLabeledField(mainPanel, "Email", txtEmail);
        addLabeledField(mainPanel, "Password", txtPassword);

        mainPanel.add(Box.createRigidArea(new Dimension(0, 20)));
        mainPanel.add(btnRegister);
        mainPanel.add(Box.createRigidArea(new Dimension(0, 15)));
        mainPanel.add(btnLogin);
        mainPanel.add(Box.createVerticalGlue());

        add(mainPanel, BorderLayout.CENTER);
    }

    private void addLabeledField(JPanel panel, String labelText, JComponent field) {
        JLabel label = new JLabel(labelText);
        label.setForeground(Color.LIGHT_GRAY);
        label.setAlignmentX(Component.LEFT_ALIGNMENT);
        panel.add(label);
        panel.add(Box.createRigidArea(new Dimension(0, 5)));
        panel.add(field);
        panel.add(Box.createRigidArea(new Dimension(0, 15)));
    }

    private JTextField createTextField() {
        JTextField field = new JTextField();
        field.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        field.setBackground(new Color(30, 30, 30));
        field.setForeground(Color.WHITE);
        field.setCaretColor(Color.WHITE);
        field.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(50, 50, 50)),
            BorderFactory.createEmptyBorder(5, 10, 5, 10)));
        return field;
    }

    private JPasswordField createPasswordField() {
        JPasswordField field = new JPasswordField();
        field.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        field.setBackground(new Color(30, 30, 30));
        field.setForeground(Color.WHITE);
        field.setCaretColor(Color.WHITE);
        field.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(50, 50, 50)),
            BorderFactory.createEmptyBorder(5, 10, 5, 10)));
        return field;
    }

    private void handleRegister(ActionEvent e) {
        String username = txtUsername.getText();
        String email = txtEmail.getText();
        String password = new String(txtPassword.getPassword());

        if (username.trim().isEmpty() || email.trim().isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill in all fields.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        if (!email.contains("@") || !email.contains(".")) {
            JOptionPane.showMessageDialog(this, "Please enter a valid email address.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        if (authController.register(username, password, email)) {
            JOptionPane.showMessageDialog(this, "Registration successful! Wallet created.", "Success", JOptionPane.INFORMATION_MESSAGE);
            new LoginView().setVisible(true);
            dispose();
        } else {
            JOptionPane.showMessageDialog(this, "Registration failed. Username or email might already be taken.", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}
