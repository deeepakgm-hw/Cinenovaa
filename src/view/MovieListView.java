package view;

import controller.MovieController;
import model.Movie;
import util.SessionManager;
import util.NavigationManager;

import javax.swing.*;
import java.awt.*;
import java.util.List;

public class MovieListView extends JPanel {
    private final MovieController movieController = new MovieController();

    public MovieListView() {
        setLayout(new BorderLayout());
        setBackground(new Color(18, 18, 18));
        initUI();
    }

    private void initUI() {
        // Header
        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setBackground(new Color(229, 9, 20));
        headerPanel.setBorder(BorderFactory.createEmptyBorder(15, 20, 15, 20));
        
        JLabel lblTitle = new JLabel("Now Showing");
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 24));
        lblTitle.setForeground(Color.WHITE);
        headerPanel.add(lblTitle, BorderLayout.WEST);
        
        JButton btnLogout = new JButton("Logout");
        btnLogout.setBackground(new Color(40, 40, 40));
        btnLogout.setForeground(Color.WHITE);
        btnLogout.setFocusPainted(false);
        btnLogout.addActionListener(e -> {
            SessionManager.getInstance().logout();
            NavigationManager.navigateTo(new LoginView(), "LOGIN");
        });
        headerPanel.add(btnLogout, BorderLayout.EAST);
        
        add(headerPanel, BorderLayout.NORTH);

        // Center Movies Grid
        JPanel moviesPanel = new JPanel(new GridLayout(0, 3, 20, 20));
        moviesPanel.setBackground(new Color(18, 18, 18));
        moviesPanel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        List<Movie> movies = movieController.getAllMovies();
        for (Movie m : movies) {
            moviesPanel.add(createMovieCard(m));
        }

        JScrollPane scrollPane = new JScrollPane(moviesPanel);
        scrollPane.setBorder(null);
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);
        add(scrollPane, BorderLayout.CENTER);
    }

    private JPanel createMovieCard(Movie movie) {
        JPanel card = new JPanel(new BorderLayout(5, 5));
        card.setBackground(new Color(30, 30, 30));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(50, 50, 50), 2),
                BorderFactory.createEmptyBorder(10, 10, 10, 10)
        ));

        JLabel lblImage = new JLabel("", SwingConstants.CENTER);
        lblImage.setPreferredSize(new Dimension(150, 220));
        
        // Load image in a background thread to prevent UI freezing
        new Thread(() -> {
            ImageIcon scaledIcon = cineplex.view.MovieListView.getScaledPoster(movie.getPosterUrl(), 150, 220);
            SwingUtilities.invokeLater(() -> {
                lblImage.setIcon(scaledIcon);
                lblImage.revalidate();
                lblImage.repaint();
            });
        }).start();
        
        card.add(lblImage, BorderLayout.CENTER);

        JPanel bottomPanel = new JPanel(new GridLayout(2, 1));
        bottomPanel.setBackground(new Color(30, 30, 30));

        JLabel lblTitle = new JLabel(movie.getTitle(), SwingConstants.CENTER);
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));
        lblTitle.setForeground(Color.WHITE);
        bottomPanel.add(lblTitle);

        JButton btnBook = new JButton("Book Tickets");
        btnBook.setBackground(new Color(229, 9, 20));
        btnBook.setForeground(Color.WHITE);
        btnBook.setFocusPainted(false);
        btnBook.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnBook.addActionListener(e -> {
            // NavigationManager.navigateTo(new ShowtimeSelectionView(movie), "SHOWTIMES");
        });
        bottomPanel.add(btnBook);

        card.add(bottomPanel, BorderLayout.SOUTH);
        return card;
    }
}
