package cineplex.view;

import cineplex.dao.AnalyticsDAO;
import cineplex.dao.UpcomingMovieDAO;
import cineplex.model.UpcomingMovie;
import cineplex.util.SessionManager;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;
import java.util.Map;

public class AdminDashboardView extends JFrame {
    private final AnalyticsDAO analyticsDAO = new AnalyticsDAO();
    private final UpcomingMovieDAO upcomingMovieDAO = new UpcomingMovieDAO();

    public AdminDashboardView() {
        setTitle("CinePlex Admin Command Center");
        setSize(1320, 840);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(12, 12, 16));
        setLayout(new BorderLayout());

        add(createSidebar(), BorderLayout.WEST);
        add(createMainPanel(), BorderLayout.CENTER);
    }

    private JPanel createSidebar() {
        JPanel side = new JPanel();
        side.setLayout(new BoxLayout(side, BoxLayout.Y_AXIS));
        side.setPreferredSize(new Dimension(260, 0));
        side.setBackground(new Color(18, 18, 24));
        side.setBorder(BorderFactory.createEmptyBorder(18, 16, 18, 16));

        JLabel brand = new JLabel("CINEPLEX ADMIN");
        brand.setForeground(new Color(241, 207, 118));
        brand.setFont(new Font("Segoe UI Black", Font.BOLD, 24));
        brand.setAlignmentX(Component.LEFT_ALIGNMENT);
        side.add(brand);

        JLabel user = new JLabel("Welcome, " + SessionManager.getInstance().getCurrentUserName());
        user.setForeground(new Color(218, 218, 228));
        user.setBorder(BorderFactory.createEmptyBorder(6, 0, 16, 0));
        user.setAlignmentX(Component.LEFT_ALIGNMENT);
        side.add(user);

        JButton btnAddMovie = createNavButton("Add Movie", new Color(46, 46, 58));
        btnAddMovie.addActionListener(e -> new AddMovieView().setVisible(true));

        JButton btnAddShowtime = createNavButton("Add Showtime", new Color(46, 46, 58));
        btnAddShowtime.addActionListener(e -> new AddShowtimeView().setVisible(true));

        JButton btnAnalytics = createNavButton("Sales Analytics", new Color(46, 46, 58));
        btnAnalytics.addActionListener(e -> new MovieSalesAnalyticsView().setVisible(true));

        JButton btnUpcoming = createNavButton("Upcoming Movies", new Color(46, 46, 58));
        btnUpcoming.addActionListener(e -> new UpcomingMoviesManagementView().setVisible(true));

        JButton btnLogout = createNavButton("Logout", new Color(214, 24, 46));
        btnLogout.addActionListener(e -> {
            SessionManager.getInstance().logout();
            new LoginView().setVisible(true);
            dispose();
        });

        side.add(btnAddMovie);
        side.add(Box.createRigidArea(new Dimension(0, 10)));
        side.add(btnAddShowtime);
        side.add(Box.createRigidArea(new Dimension(0, 10)));
        side.add(btnAnalytics);
        side.add(Box.createRigidArea(new Dimension(0, 10)));
        side.add(btnUpcoming);
        side.add(Box.createVerticalGlue());
        side.add(btnLogout);

        return side;
    }

    private JPanel createMainPanel() {
        JPanel main = new JPanel(new BorderLayout(12, 12));
        main.setBackground(new Color(12, 12, 16));
        main.setBorder(BorderFactory.createEmptyBorder(14, 14, 14, 14));

        JPanel top = new JPanel(new GridLayout(1, 4, 12, 12));
        top.setOpaque(false);
        Map<String, Object> summary = analyticsDAO.getSummary();

        top.add(createMetricCard("Total Bookings", String.valueOf(summary.getOrDefault("total_bookings", 0)), new Color(47, 128, 237)));
        top.add(createMetricCard("Total Revenue", "?" + String.format("%.2f", ((Number) summary.getOrDefault("total_revenue", 0.0)).doubleValue()), new Color(39, 174, 96)));
        top.add(createMetricCard("Most Booked", String.valueOf(summary.getOrDefault("most_booked_movie", "N/A")), new Color(242, 153, 74)));
        top.add(createMetricCard("Trending Upcoming", String.valueOf(summary.getOrDefault("trending_upcoming_movie", "N/A")), new Color(155, 81, 224)));

        JPanel center = new JPanel(new GridLayout(1, 2, 12, 12));
        center.setOpaque(false);
        center.add(createRevenueChartWidget());
        center.add(createUpcomingWidget());

        JPanel bottom = new JPanel(new GridLayout(1, 2, 12, 12));
        bottom.setOpaque(false);
        bottom.add(createTrendingMoviesTable());
        bottom.add(createOperationsWidget());

        main.add(top, BorderLayout.NORTH);
        main.add(center, BorderLayout.CENTER);
        main.add(bottom, BorderLayout.SOUTH);
        return main;
    }

    private JPanel createMetricCard(String title, String value, Color accent) {
        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(new Color(22, 22, 30));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(58, 58, 70), 1, true),
                BorderFactory.createEmptyBorder(14, 14, 14, 14)
        ));

        JLabel t = new JLabel(title);
        t.setForeground(new Color(200, 200, 214));
        t.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        JLabel v = new JLabel(value);
        v.setForeground(accent);
        v.setFont(new Font("Segoe UI Black", Font.BOLD, 20));

        card.add(t, BorderLayout.NORTH);
        card.add(v, BorderLayout.CENTER);
        return card;
    }

    private JPanel createRevenueChartWidget() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(new Color(22, 22, 30));
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(58, 58, 70), 1, true),
                BorderFactory.createEmptyBorder(12, 12, 12, 12)
        ));
        JLabel title = new JLabel("Revenue Pulse (Snapshot)");
        title.setForeground(new Color(242, 242, 248));
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        panel.add(title, BorderLayout.NORTH);

        JPanel chart = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                int w = getWidth();
                int h = getHeight();
                g2.setColor(new Color(40, 40, 52));
                for (int i = 1; i < 5; i++) {
                    int y = (h * i) / 5;
                    g2.drawLine(12, y, w - 12, y);
                }
                int[] xs = {22, w / 5, w / 3, w / 2, (w * 3) / 4, w - 22};
                int[] ys = {h - 34, h - 54, h - 44, h - 80, h - 66, h - 96};
                g2.setStroke(new BasicStroke(3f));
                g2.setColor(new Color(66, 133, 244));
                for (int i = 0; i < xs.length - 1; i++) {
                    g2.drawLine(xs[i], ys[i], xs[i + 1], ys[i + 1]);
                }
                g2.setColor(new Color(66, 133, 244, 80));
                Polygon p = new Polygon();
                for (int i = 0; i < xs.length; i++) p.addPoint(xs[i], ys[i]);
                p.addPoint(xs[xs.length - 1], h - 20);
                p.addPoint(xs[0], h - 20);
                g2.fillPolygon(p);
                g2.dispose();
            }
        };
        chart.setOpaque(false);
        panel.add(chart, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createUpcomingWidget() {
        JPanel panel = new JPanel(new BorderLayout(6, 6));
        panel.setBackground(new Color(22, 22, 30));
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(58, 58, 70), 1, true),
                BorderFactory.createEmptyBorder(12, 12, 12, 12)
        ));
        JLabel title = new JLabel("Upcoming & Engagement");
        title.setForeground(new Color(242, 242, 248));
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        panel.add(title, BorderLayout.NORTH);

        DefaultListModel<String> model = new DefaultListModel<>();
        List<UpcomingMovie> upcoming = upcomingMovieDAO.getTrendingUpcomingMovies();
        if (upcoming.isEmpty()) {
            model.addElement("No upcoming movies configured");
        } else {
            for (UpcomingMovie u : upcoming) {
                model.addElement("?? " + u.getMovieName() + "  |  Notify: " + u.getNotifyCount() + "  |  " + u.getStatus());
            }
        }
        JList<String> list = new JList<>(model);
        list.setBackground(new Color(28, 28, 36));
        list.setForeground(Color.WHITE);
        list.setSelectionBackground(new Color(58, 58, 72));
        panel.add(new JScrollPane(list), BorderLayout.CENTER);
        return panel;
    }

    private JPanel createTrendingMoviesTable() {
        JPanel panel = new JPanel(new BorderLayout(6, 6));
        panel.setBackground(new Color(22, 22, 30));
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(58, 58, 70), 1, true),
                BorderFactory.createEmptyBorder(12, 12, 12, 12)
        ));
        JLabel title = new JLabel("Trending Movies Table");
        title.setForeground(new Color(242, 242, 248));
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        panel.add(title, BorderLayout.NORTH);

        DefaultTableModel tm = new DefaultTableModel(new String[]{"Movie", "Tickets", "Revenue"}, 0);
        List<Map<String, Object>> rows = analyticsDAO.getMovieSalesAnalytics();
        for (Map<String, Object> r : rows) {
            tm.addRow(new Object[]{
                    r.get("movie_name"),
                    r.get("tickets_sold"),
                    "?" + String.format("%.2f", ((Number) r.get("revenue")).doubleValue())
            });
        }
        JTable table = new JTable(tm);
        table.setRowHeight(28);
        table.setBackground(new Color(28, 28, 36));
        table.setForeground(Color.WHITE);
        table.setGridColor(new Color(50, 50, 62));
        table.getTableHeader().setBackground(new Color(20, 20, 28));
        table.getTableHeader().setForeground(new Color(242, 204, 102));

        panel.add(new JScrollPane(table), BorderLayout.CENTER);
        return panel;
    }

    private JPanel createOperationsWidget() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(new Color(22, 22, 30));
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(58, 58, 70), 1, true),
                BorderFactory.createEmptyBorder(12, 12, 12, 12)
        ));

        JLabel title = new JLabel("Operations Widgets");
        title.setForeground(new Color(242, 242, 248));
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        panel.add(title);
        panel.add(Box.createRigidArea(new Dimension(0, 10)));

        panel.add(widgetLine("Screen Utilization", "72%", new Color(47, 128, 237)));
        panel.add(Box.createRigidArea(new Dimension(0, 8)));
        panel.add(widgetLine("Snack Conversion", "41%", new Color(39, 174, 96)));
        panel.add(Box.createRigidArea(new Dimension(0, 8)));
        panel.add(widgetLine("Avg. Order Value", "?684", new Color(242, 153, 74)));

        return panel;
    }

    private JPanel widgetLine(String label, String value, Color accent) {
        JPanel row = new JPanel(new BorderLayout());
        row.setBackground(new Color(28, 28, 36));
        row.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        JLabel l = new JLabel(label);
        l.setForeground(new Color(215, 215, 225));
        JLabel v = new JLabel(value);
        v.setForeground(accent);
        v.setFont(new Font("Segoe UI", Font.BOLD, 14));
        row.add(l, BorderLayout.WEST);
        row.add(v, BorderLayout.EAST);
        return row;
    }

    private JButton createNavButton(String text, Color color) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 15));
        btn.setBackground(color);
        btn.setForeground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setAlignmentX(Component.LEFT_ALIGNMENT);
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 46));
        btn.setBorder(BorderFactory.createEmptyBorder(10, 14, 10, 14));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        return btn;
    }
}
