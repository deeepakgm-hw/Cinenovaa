package cineplex.view;

import cineplex.controller.AuthController;
import cineplex.util.SessionManager;

import javax.swing.*;
import javax.swing.border.Border;
import java.awt.*;
import java.awt.event.ActionEvent;

public class LoginView extends JFrame {
    private JTextField txtUsername;
    private JPasswordField txtPassword;
    private AuthController authController;

    public LoginView() {
        authController = new AuthController();
        initUI();
    }

    private void initUI() {
        setTitle("CineNova - Login");
        setSize(520, 680);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(10, 10, 12));
        setLayout(new BorderLayout());

        JPanel backgroundPanel = new JPanel(new GridBagLayout()) {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

                GradientPaint gp = new GradientPaint(
                        0, 0, new Color(8, 10, 18),
                        getWidth(), getHeight(), new Color(28, 8, 10)
                );
                g2.setPaint(gp);
                g2.fillRect(0, 0, getWidth(), getHeight());

                g2.setColor(new Color(255, 255, 255, 16));
                g2.fillOval(-120, -120, 360, 360);
                g2.fillOval(getWidth() - 220, getHeight() - 260, 320, 320);
                g2.dispose();
            }
        };

        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setOpaque(false);
        card.setMaximumSize(new Dimension(420, 560));
        card.setPreferredSize(new Dimension(420, 560));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(255, 255, 255, 40), 1, true),
                BorderFactory.createEmptyBorder(0, 0, 24, 0)
        ));

        JPanel glass = new JPanel(new BorderLayout()) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(16, 18, 24, 215));
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 28, 28);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        glass.setOpaque(false);
        glass.setLayout(new BoxLayout(glass, BoxLayout.Y_AXIS));

        JPanel banner = new JPanel(new BorderLayout()) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                GradientPaint gp = new GradientPaint(0, 0, new Color(140, 10, 20), getWidth(), getHeight(), new Color(32, 12, 22));
                g2.setPaint(gp);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 28, 28);
                g2.setColor(new Color(255, 255, 255, 25));
                g2.fillRect(0, getHeight() - 44, getWidth(), 44);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        banner.setOpaque(false);
        banner.setPreferredSize(new Dimension(420, 130));
        banner.setMaximumSize(new Dimension(Integer.MAX_VALUE, 130));
        banner.setBorder(BorderFactory.createEmptyBorder(18, 22, 18, 22));

        JLabel lblTitle = new JLabel("CINENOVA");
        lblTitle.setFont(new Font("Segoe UI Black", Font.BOLD, 34));
        lblTitle.setForeground(new Color(255, 245, 230));
        lblTitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel lblSubtitle = new JLabel("Sign In to Continue");
        lblSubtitle.setFont(new Font("Segoe UI", Font.PLAIN, 15));
        lblSubtitle.setForeground(new Color(240, 218, 170));
        lblSubtitle.setAlignmentX(Component.CENTER_ALIGNMENT);
        JLabel lblTag = new JLabel("Experience Cinema, Premium Style");
        lblTag.setFont(new Font("Segoe UI", Font.BOLD, 12));
        lblTag.setForeground(new Color(245, 233, 208));

        JPanel bannerText = new JPanel();
        bannerText.setOpaque(false);
        bannerText.setLayout(new BoxLayout(bannerText, BoxLayout.Y_AXIS));
        bannerText.add(lblTag);
        banner.add(bannerText, BorderLayout.SOUTH);

        txtUsername = new JTextField();
        txtUsername.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        txtUsername.setBackground(new Color(26, 28, 34));
        txtUsername.setForeground(Color.WHITE);
        txtUsername.setCaretColor(Color.WHITE);
        txtUsername.setSelectionColor(new Color(210, 24, 44));
        txtUsername.setSelectedTextColor(Color.WHITE);
        txtUsername.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        txtUsername.setSelectionColor(new Color(229, 9, 20));
        txtUsername.setSelectedTextColor(Color.WHITE);
        txtUsername.setBorder(createInputBorder());

        txtPassword = new JPasswordField();
        txtPassword.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        txtPassword.setBackground(new Color(26, 28, 34));
        txtPassword.setForeground(Color.WHITE);
        txtPassword.setCaretColor(Color.WHITE);
        txtPassword.setSelectionColor(new Color(210, 24, 44));
        txtPassword.setSelectedTextColor(Color.WHITE);
        txtPassword.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        txtPassword.setSelectionColor(new Color(229, 9, 20));
        txtPassword.setSelectedTextColor(Color.WHITE);
        txtPassword.setBorder(createInputBorder());

        JButton btnLogin = new JButton("LOGIN");
        btnLogin.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        btnLogin.setBackground(new Color(214, 18, 38));
        btnLogin.setForeground(Color.WHITE);
        btnLogin.setFont(new Font("Segoe UI", Font.BOLD, 15));
        btnLogin.setFocusPainted(false);
        btnLogin.setBorderPainted(false);
        btnLogin.setBorder(BorderFactory.createEmptyBorder(11, 18, 11, 18));
        btnLogin.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnLogin.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseEntered(java.awt.event.MouseEvent e) {
                btnLogin.setBackground(new Color(238, 34, 54));
            }
            @Override
            public void mouseExited(java.awt.event.MouseEvent e) {
                btnLogin.setBackground(new Color(214, 18, 38));
            }
        });
        btnLogin.addActionListener(this::handleLogin);

        JButton btnRegister = new JButton("Don't have an account? Register");
        btnRegister.setForeground(new Color(229, 194, 109));
        btnRegister.setBackground(new Color(16, 18, 24));
        btnRegister.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnRegister.setBorderPainted(false);
        btnRegister.setFocusPainted(false);
        btnRegister.setContentAreaFilled(false);
        btnRegister.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnRegister.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnRegister.addActionListener(e -> {
            new RegisterView().setVisible(true);
            dispose();
        });

        JPanel formPanel = new JPanel();
        formPanel.setOpaque(false);
        formPanel.setLayout(new BoxLayout(formPanel, BoxLayout.Y_AXIS));
        formPanel.setBorder(BorderFactory.createEmptyBorder(24, 30, 14, 30));

        formPanel.add(lblTitle);
        formPanel.add(Box.createRigidArea(new Dimension(0, 8)));
        formPanel.add(lblSubtitle);
        formPanel.add(Box.createRigidArea(new Dimension(0, 30)));

        JLabel lblUser = new JLabel("Username");
        lblUser.setForeground(new Color(240, 238, 234));
        lblUser.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lblUser.setAlignmentX(Component.LEFT_ALIGNMENT);
        formPanel.add(lblUser);
        formPanel.add(Box.createRigidArea(new Dimension(0, 8)));
        formPanel.add(txtUsername);

        formPanel.add(Box.createRigidArea(new Dimension(0, 18)));

        JLabel lblPass = new JLabel("Password");
        lblPass.setForeground(new Color(240, 238, 234));
        lblPass.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lblPass.setAlignmentX(Component.LEFT_ALIGNMENT);
        formPanel.add(lblPass);
        formPanel.add(Box.createRigidArea(new Dimension(0, 8)));
        formPanel.add(txtPassword);

        formPanel.add(Box.createRigidArea(new Dimension(0, 26)));
        formPanel.add(btnLogin);
        formPanel.add(Box.createRigidArea(new Dimension(0, 14)));
        formPanel.add(btnRegister);

        glass.add(banner);
        glass.add(formPanel);
        card.add(glass);

        backgroundPanel.add(card);
        add(backgroundPanel, BorderLayout.CENTER);
    }

    private Border createInputBorder() {
        return BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(88, 88, 98), 1, true),
                BorderFactory.createEmptyBorder(10, 12, 10, 12)
        );
    }

    private void handleLogin(ActionEvent e) {
        String username = txtUsername.getText();
        String password = new String(txtPassword.getPassword());

        if (username.trim().isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill in all fields.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        if (authController.login(username, password)) {
            if (SessionManager.getInstance().isAdmin()) {
                new AdminDashboardView().setVisible(true);
                dispose();
            } else {
                cineplex.util.NavigationManager.getInstance().showCitySelection(this);
            }
        } else {
            System.out.println("[DEBUG] AuthController.login returned false. Showing error dialog.");
            JOptionPane.showMessageDialog(this, "Invalid username or password.", "Login Failed", JOptionPane.ERROR_MESSAGE);
        }
    }
}
