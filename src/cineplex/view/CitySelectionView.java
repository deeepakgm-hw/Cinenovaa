package cineplex.view;

import cineplex.dao.CityDAO;
import cineplex.model.City;
import cineplex.util.NavigationManager;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.List;

public class CitySelectionView extends JFrame {
    private final CityDAO cityDAO = new CityDAO();

    public CitySelectionView() {
        setTitle("CineNova - Select City");
        setSize(700, 500);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(10, 10, 12));
        setLayout(new BorderLayout());

        JPanel headerPanel = new JPanel();
        headerPanel.setBackground(new Color(16, 18, 24));
        headerPanel.setBorder(new EmptyBorder(24, 24, 24, 24));
        headerPanel.setLayout(new BoxLayout(headerPanel, BoxLayout.Y_AXIS));

        JLabel lblLogo = new JLabel("CineNova");
        lblLogo.setFont(new Font("Segoe UI Black", Font.BOLD, 36));
        lblLogo.setForeground(new Color(239, 68, 68));
        lblLogo.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel lblSubtitle = new JLabel("Choose your location to browse running movies");
        lblSubtitle.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        lblSubtitle.setForeground(new Color(148, 163, 184));
        lblSubtitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        headerPanel.add(lblLogo);
        headerPanel.add(Box.createRigidArea(new Dimension(0, 10)));
        headerPanel.add(lblSubtitle);
        add(headerPanel, BorderLayout.NORTH);

        JPanel citiesPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 20, 30));
        citiesPanel.setOpaque(false);
        citiesPanel.setBorder(new EmptyBorder(20, 20, 20, 20));

        List<City> cities = cityDAO.getAllCities();
        if (cities.isEmpty()) {
            JLabel lblNoCities = new JLabel("No cities available. Please seed database.");
            lblNoCities.setForeground(Color.GRAY);
            lblNoCities.setFont(new Font("Segoe UI", Font.ITALIC, 16));
            citiesPanel.add(lblNoCities);
        } else {
            for (City city : cities) {
                citiesPanel.add(createCityCard(city));
            }
        }

        JScrollPane scrollPane = new JScrollPane(citiesPanel);
        scrollPane.setBorder(null);
        scrollPane.getViewport().setBackground(new Color(10, 10, 12));
        add(scrollPane, BorderLayout.CENTER);
    }

    private JPanel createCityCard(City city) {
        JPanel card = new JPanel(new BorderLayout());
        card.setPreferredSize(new Dimension(150, 120));
        card.setBackground(new Color(22, 22, 30));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(55, 55, 65), 1, true),
                BorderFactory.createEmptyBorder(15, 15, 15, 15)
        ));
        card.setCursor(new Cursor(Cursor.HAND_CURSOR));

        JLabel lblName = new JLabel(city.getName(), SwingConstants.CENTER);
        lblName.setFont(new Font("Segoe UI", Font.BOLD, 16));
        lblName.setForeground(Color.WHITE);
        card.add(lblName, BorderLayout.CENTER);

        card.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                card.setBackground(new Color(239, 68, 68, 25));
                card.setBorder(BorderFactory.createLineBorder(new Color(239, 68, 68), 1, true));
                lblName.setForeground(new Color(239, 68, 68));
            }

            @Override
            public void mouseExited(MouseEvent e) {
                card.setBackground(new Color(22, 22, 30));
                card.setBorder(BorderFactory.createLineBorder(new Color(55, 55, 65), 1, true));
                lblName.setForeground(Color.WHITE);
            }

            @Override
            public void mouseClicked(MouseEvent e) {
                NavigationManager.getInstance().setSelectedCityId(city.getId());
                NavigationManager.getInstance().setSelectedCityName(city.getName());
                NavigationManager.getInstance().showMovieList(CitySelectionView.this);
            }
        });

        return card;
    }
}
