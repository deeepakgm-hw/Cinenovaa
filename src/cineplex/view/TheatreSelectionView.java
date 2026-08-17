package cineplex.view;

import cineplex.dao.TheatreDAO;
import cineplex.model.Theatre;
import cineplex.util.NavigationManager;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.List;

public class TheatreSelectionView extends JFrame {
    private final TheatreDAO theatreDAO = new TheatreDAO();

    public TheatreSelectionView() {
        String cityName = NavigationManager.getInstance().getSelectedCityName();
        String movieTitle = NavigationManager.getInstance().getSelectedMovie().getTitle();

        setTitle("CineNova - Select Theatre");
        setSize(800, 600);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(10, 10, 12));
        setLayout(new BorderLayout());

        JPanel headerPanel = new JPanel();
        headerPanel.setBackground(new Color(16, 18, 24));
        headerPanel.setBorder(new EmptyBorder(24, 24, 24, 24));
        headerPanel.setLayout(new BoxLayout(headerPanel, BoxLayout.Y_AXIS));

        JLabel lblMovie = new JLabel(movieTitle);
        lblMovie.setFont(new Font("Segoe UI Black", Font.BOLD, 28));
        lblMovie.setForeground(Color.WHITE);
        lblMovie.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel lblSubtitle = new JLabel("Select a theatre in " + cityName + " to see available showtimes");
        lblSubtitle.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        lblSubtitle.setForeground(new Color(148, 163, 184));
        lblSubtitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        headerPanel.add(lblMovie);
        headerPanel.add(Box.createRigidArea(new Dimension(0, 8)));
        headerPanel.add(lblSubtitle);
        add(headerPanel, BorderLayout.NORTH);

        JPanel listPanel = new JPanel();
        listPanel.setLayout(new BoxLayout(listPanel, BoxLayout.Y_AXIS));
        listPanel.setOpaque(false);
        listPanel.setBorder(new EmptyBorder(20, 30, 20, 30));

        int cityId = NavigationManager.getInstance().getSelectedCityId();
        List<Theatre> theatres = theatreDAO.getTheatresByCity(cityId);

        if (theatres.isEmpty()) {
            JLabel lblEmpty = new JLabel("No theatres currently hosting shows in this city.");
            lblEmpty.setForeground(Color.GRAY);
            lblEmpty.setFont(new Font("Segoe UI", Font.ITALIC, 16));
            lblEmpty.setAlignmentX(Component.CENTER_ALIGNMENT);
            listPanel.add(lblEmpty);
        } else {
            for (Theatre theatre : theatres) {
                listPanel.add(createTheatreItem(theatre));
                listPanel.add(Box.createRigidArea(new Dimension(0, 15)));
            }
        }

        JScrollPane scrollPane = new JScrollPane(listPanel);
        scrollPane.setBorder(null);
        scrollPane.getViewport().setBackground(new Color(10, 10, 12));
        add(scrollPane, BorderLayout.CENTER);

        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        bottomPanel.setBackground(new Color(10, 10, 12));
        bottomPanel.setBorder(new EmptyBorder(15, 15, 15, 15));

        JButton btnBack = new JButton("← Back to Movies");
        btnBack.setBackground(new Color(30, 30, 36));
        btnBack.setForeground(Color.WHITE);
        btnBack.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnBack.setFocusPainted(false);
        btnBack.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        btnBack.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnBack.addActionListener(e -> NavigationManager.getInstance().showMovieList(this));
        bottomPanel.add(btnBack);

        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JPanel createTheatreItem(Theatre theatre) {
        JPanel item = new JPanel(new BorderLayout(15, 0));
        item.setMaximumSize(new Dimension(Integer.MAX_VALUE, 90));
        item.setPreferredSize(new Dimension(0, 90));
        item.setBackground(new Color(22, 22, 30));
        item.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(55, 55, 65), 1, true),
                BorderFactory.createEmptyBorder(15, 20, 15, 20)
        ));
        item.setCursor(new Cursor(Cursor.HAND_CURSOR));

        JPanel textPanel = new JPanel(new GridLayout(2, 1, 4, 4));
        textPanel.setOpaque(false);

        JLabel lblName = new JLabel(theatre.getName());
        lblName.setFont(new Font("Segoe UI", Font.BOLD, 16));
        lblName.setForeground(Color.WHITE);

        JLabel lblLoc = new JLabel(theatre.getLocation() != null ? theatre.getLocation() : "Unknown Location");
        lblLoc.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lblLoc.setForeground(new Color(156, 163, 175));

        textPanel.add(lblName);
        textPanel.add(lblLoc);
        item.add(textPanel, BorderLayout.CENTER);

        JLabel lblArrow = new JLabel("View Shows →");
        lblArrow.setFont(new Font("Segoe UI", Font.BOLD, 14));
        lblArrow.setForeground(new Color(239, 68, 68));
        item.add(lblArrow, BorderLayout.EAST);

        item.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                item.setBackground(new Color(239, 68, 68, 20));
                item.setBorder(BorderFactory.createLineBorder(new Color(239, 68, 68), 1, true));
            }

            @Override
            public void mouseExited(MouseEvent e) {
                item.setBackground(new Color(22, 22, 30));
                item.setBorder(BorderFactory.createLineBorder(new Color(55, 55, 65), 1, true));
            }

            @Override
            public void mouseClicked(MouseEvent e) {
                NavigationManager.getInstance().setSelectedTheatreId(theatre.getId());
                NavigationManager.getInstance().setSelectedTheatreName(theatre.getName());
                NavigationManager.getInstance().showShowtimeSelection(TheatreSelectionView.this);
            }
        });

        return item;
    }
}
