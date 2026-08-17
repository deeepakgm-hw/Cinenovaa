package cineplex.view;

import cineplex.controller.MovieController;
import cineplex.model.Movie;
import cineplex.model.Showtime;

import javax.swing.*;
import java.awt.*;
import java.util.List;

public class ShowtimeSelectionView extends JFrame {
    private JComboBox<Showtime> cmbShowtimes;
    private Movie movie;
    private MovieController movieController;

    public ShowtimeSelectionView(Movie movie) {
        this.movie = movie;
        this.movieController = new MovieController();
        
        String theatreName = cineplex.util.NavigationManager.getInstance().getSelectedTheatreName();
        setTitle("Select Showtime - " + movie.getTitle() + " at " + theatreName);
        setSize(500, 450);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        getContentPane().setBackground(new Color(18, 18, 18));
        setLayout(new BorderLayout());

        JPanel mainPanel = new JPanel();
        mainPanel.setLayout(new BoxLayout(mainPanel, BoxLayout.Y_AXIS));
        mainPanel.setBackground(new Color(18, 18, 18));
        mainPanel.setBorder(BorderFactory.createEmptyBorder(40, 40, 40, 40));

        JLabel lblTitle = new JLabel("Select a Showtime");
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 24));
        lblTitle.setForeground(Color.WHITE);
        lblTitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        // Fetch showtimes filtered by movie AND theatre from DB
        int theatreId = cineplex.util.NavigationManager.getInstance().getSelectedTheatreId();
        List<Showtime> showtimes = new cineplex.dao.ShowtimeDAO().getShowtimesForMovieAndTheatre(movie.getId(), theatreId);
        
        cmbShowtimes = new JComboBox<>(showtimes.toArray(new Showtime[0]));
        cmbShowtimes.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        cmbShowtimes.setBackground(new Color(30, 30, 30));
        cmbShowtimes.setForeground(Color.WHITE);
        cmbShowtimes.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        cmbShowtimes.setBorder(BorderFactory.createEmptyBorder(8, 10, 8, 10));
        
        if (showtimes.isEmpty()) {
            cmbShowtimes.addItem(new Showtime(-1, 0, 0, null, 0) {
                @Override
                public String toString() { return "No showtimes available"; }
            });
            cmbShowtimes.setEnabled(false);
        }

        JButton btnNext = new JButton("CHOOSE SEATS");
        btnNext.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        btnNext.setBackground(new Color(229, 9, 20));
        btnNext.setForeground(Color.WHITE);
        btnNext.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnNext.setFocusPainted(false);
        btnNext.setBorder(BorderFactory.createEmptyBorder(10, 14, 10, 14));
        btnNext.setAlignmentX(Component.CENTER_ALIGNMENT);
        
        btnNext.addActionListener(e -> {
            Showtime selected = (Showtime) cmbShowtimes.getSelectedItem();
            if (selected != null && selected.getId() != -1) {
                // Navigate to seat selection passing both movie and showtime via NavigationManager
                cineplex.util.NavigationManager.getInstance().setSelectedShowtime(selected);
                cineplex.util.NavigationManager.getInstance().showSeatSelection(this);
            } else {
                JOptionPane.showMessageDialog(this, "Please select a valid showtime.", "Selection Error", JOptionPane.WARNING_MESSAGE);
            }
        });

        JButton btnBack = new JButton("Back to Theatres");
        btnBack.setForeground(Color.LIGHT_GRAY);
        btnBack.setBackground(new Color(18, 18, 18));
        btnBack.setBorderPainted(false);
        btnBack.setContentAreaFilled(false);
        btnBack.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnBack.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnBack.addActionListener(e -> {
            cineplex.util.NavigationManager.getInstance().showTheatreSelection(this);
        });

        mainPanel.add(lblTitle);
        mainPanel.add(Box.createRigidArea(new Dimension(0, 30)));
        mainPanel.add(cmbShowtimes);
        mainPanel.add(Box.createRigidArea(new Dimension(0, 40)));
        mainPanel.add(btnNext);
        mainPanel.add(Box.createRigidArea(new Dimension(0, 15)));
        mainPanel.add(btnBack);

        add(mainPanel, BorderLayout.CENTER);
    }
}
