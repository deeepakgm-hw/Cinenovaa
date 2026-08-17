package cineplex.view;

import cineplex.dao.AnalyticsDAO;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;
import java.util.Map;

public class MovieSalesAnalyticsView extends JFrame {
    private final AnalyticsDAO analyticsDAO = new AnalyticsDAO();
    private final JLabel lblSummary = new JLabel();
    private final DefaultTableModel model = new DefaultTableModel(
            new String[]{"Movie", "Tickets Sold", "Revenue", "Occupancy %"}, 0);

    public MovieSalesAnalyticsView() {
        setTitle("Movie Sales Analytics");
        setSize(900, 600);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        getContentPane().setBackground(new Color(18, 18, 18));
        setLayout(new BorderLayout(12, 12));

        lblSummary.setForeground(Color.WHITE);
        lblSummary.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        add(lblSummary, BorderLayout.NORTH);

        JTable table = new JTable(model);
        table.setRowHeight(28);
        table.setBackground(new Color(24, 24, 24));
        table.setForeground(Color.WHITE);
        table.setGridColor(new Color(45, 45, 45));
        table.setSelectionBackground(new Color(229, 9, 20));
        table.getTableHeader().setBackground(new Color(35, 35, 35));
        table.getTableHeader().setForeground(Color.WHITE);
        JScrollPane scroll = new JScrollPane(table);
        scroll.getViewport().setBackground(new Color(24, 24, 24));
        add(scroll, BorderLayout.CENTER);

        JButton refresh = new JButton("Refresh");
        refresh.setBackground(new Color(229, 9, 20));
        refresh.setForeground(Color.WHITE);
        refresh.setFocusPainted(false);
        refresh.addActionListener(e -> loadData());
        JPanel footer = new JPanel();
        footer.setBackground(new Color(18, 18, 18));
        footer.add(refresh);
        add(footer, BorderLayout.SOUTH);

        loadData();
    }

    private void loadData() {
        model.setRowCount(0);
        List<Map<String, Object>> rows = analyticsDAO.getMovieSalesAnalytics();
        for (Map<String, Object> r : rows) {
            model.addRow(new Object[]{
                    r.get("movie_name"),
                    r.get("tickets_sold"),
                    String.format("%.2f", ((Number) r.get("revenue")).doubleValue()),
                    String.format("%.2f", ((Number) r.get("occupancy_percent")).doubleValue())
            });
        }
        Map<String, Object> s = analyticsDAO.getSummary();
        lblSummary.setText("Total Bookings: " + s.getOrDefault("total_bookings", 0)
                + " | Total Revenue: " + String.format("%.2f", ((Number) s.getOrDefault("total_revenue", 0.0)).doubleValue())
                + " | Most Booked Movie: " + s.getOrDefault("most_booked_movie", "N/A")
                + " | Trending Upcoming: " + s.getOrDefault("trending_upcoming_movie", "N/A")
                + " (" + s.getOrDefault("trending_upcoming_notify_count", 0) + ")");
    }
}
