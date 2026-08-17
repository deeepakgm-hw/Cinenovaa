package cineplex.view;

import cineplex.model.Movie;
import cineplex.util.NavigationManager;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

public class MovieDetailView extends JFrame {
    private Movie movie;

    public MovieDetailView(Movie movie) {
        this.movie = movie;
        initUI();
    }

    private void initUI() {
        setTitle("CineNova - Movie Details: " + movie.getTitle());
        setSize(850, 600);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(10, 10, 12));
        setLayout(new BorderLayout());

        // Header Panel with title
        JPanel headerPanel = new JPanel();
        headerPanel.setBackground(new Color(16, 18, 24));
        headerPanel.setBorder(new EmptyBorder(15, 24, 15, 24));
        headerPanel.setLayout(new BorderLayout());

        JLabel lblLogo = new JLabel("CineNova Details");
        lblLogo.setFont(new Font("Segoe UI Black", Font.BOLD, 22));
        lblLogo.setForeground(new Color(239, 68, 68));
        headerPanel.add(lblLogo, BorderLayout.WEST);

        add(headerPanel, BorderLayout.NORTH);

        // Main content split
        JPanel contentPanel = new JPanel(new BorderLayout(25, 0));
        contentPanel.setOpaque(false);
        contentPanel.setBorder(new EmptyBorder(25, 25, 25, 25));

        // Left Panel (Poster)
        JPanel leftPanel = new JPanel(new BorderLayout());
        leftPanel.setOpaque(false);
        leftPanel.setPreferredSize(new Dimension(240, 360));

        JLabel lblPoster = new JLabel("", SwingConstants.CENTER);
        lblPoster.setPreferredSize(new Dimension(240, 360));
        lblPoster.setBorder(BorderFactory.createLineBorder(new Color(55, 55, 65), 1, true));

        // Safe async image scaling loading to prevent UI freeze
        new Thread(() -> {
            ImageIcon posterIcon = MovieListView.getScaledPoster(movie.getPosterUrl(), 240, 360);
            SwingUtilities.invokeLater(() -> {
                if (posterIcon != null) {
                    lblPoster.setIcon(posterIcon);
                } else {
                    lblPoster.setText("No Image Available");
                    lblPoster.setForeground(Color.GRAY);
                    lblPoster.setFont(new Font("Segoe UI", Font.ITALIC, 14));
                }
            });
        }).start();

        leftPanel.add(lblPoster, BorderLayout.CENTER);
        contentPanel.add(leftPanel, BorderLayout.WEST);

        // Right Panel (Metadata & Description)
        JPanel rightPanel = new JPanel();
        rightPanel.setLayout(new BoxLayout(rightPanel, BoxLayout.Y_AXIS));
        rightPanel.setOpaque(false);

        // Movie Title
        JLabel lblTitle = new JLabel(movie.getTitle());
        lblTitle.setFont(new Font("Segoe UI Black", Font.BOLD, 30));
        lblTitle.setForeground(Color.WHITE);
        lblTitle.setAlignmentX(Component.LEFT_ALIGNMENT);
        rightPanel.add(lblTitle);
        rightPanel.add(Box.createRigidArea(new Dimension(0, 10)));

        // Metadata badges panel
        JPanel badgesPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        badgesPanel.setOpaque(false);
        badgesPanel.setAlignmentX(Component.LEFT_ALIGNMENT);

        // Genre label
        JLabel lblGenre = createMetaBadge(movie.getGenre() != null ? movie.getGenre() : "Cinema");
        badgesPanel.add(lblGenre);

        // Duration label
        JLabel lblDuration = createMetaBadge(movie.getDuration() + " Mins");
        badgesPanel.add(lblDuration);

        // Rating label
        JLabel lblRating = createMetaBadge("Rating: " + (movie.getRating() != null ? movie.getRating() : "PG-13"));
        lblRating.setForeground(new Color(245, 158, 11)); // Amber text for age rating
        badgesPanel.add(lblRating);

        // Language label
        JLabel lblLang = createMetaBadge(movie.getLanguage() != null ? movie.getLanguage().toUpperCase() : "ENGLISH");
        badgesPanel.add(lblLang);

        rightPanel.add(badgesPanel);
        rightPanel.add(Box.createRigidArea(new Dimension(0, 20)));

        // Metadata grid (Release Date, Status, Starring)
        JPanel detailsGrid = new JPanel(new GridLayout(3, 2, 10, 8));
        detailsGrid.setOpaque(false);
        detailsGrid.setAlignmentX(Component.LEFT_ALIGNMENT);
        detailsGrid.setMaximumSize(new Dimension(500, 90));

        detailsGrid.add(createDetailsLabel("Release Date:"));
        detailsGrid.add(createDetailsValue(movie.getReleaseDate() != null ? movie.getReleaseDate().toString() : "N/A"));
        detailsGrid.add(createDetailsLabel("Status:"));
        detailsGrid.add(createDetailsValue(movie.getStatus() != null ? movie.getStatus() : "NOW_SHOWING"));
        detailsGrid.add(createDetailsLabel("Starring:"));
        detailsGrid.add(createDetailsValue(movie.getCastMembers() != null && !movie.getCastMembers().trim().isEmpty() ? movie.getCastMembers() : "N/A"));

        rightPanel.add(detailsGrid);
        rightPanel.add(Box.createRigidArea(new Dimension(0, 25)));

        // Description header
        JLabel lblDescTitle = new JLabel("Synopsis");
        lblDescTitle.setFont(new Font("Segoe UI", Font.BOLD, 15));
        lblDescTitle.setForeground(new Color(220, 220, 230));
        lblDescTitle.setAlignmentX(Component.LEFT_ALIGNMENT);
        rightPanel.add(lblDescTitle);
        rightPanel.add(Box.createRigidArea(new Dimension(0, 8)));

        // Scrollable, wrapped description text area
        JTextArea txtDesc = new JTextArea(movie.getDescription());
        txtDesc.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        txtDesc.setForeground(new Color(156, 163, 175));
        txtDesc.setBackground(new Color(22, 22, 30));
        txtDesc.setLineWrap(true);
        txtDesc.setWrapStyleWord(true);
        txtDesc.setEditable(false);
        txtDesc.setCaretColor(new Color(22, 22, 30));
        txtDesc.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JScrollPane descScroll = new JScrollPane(txtDesc);
        descScroll.setBorder(BorderFactory.createLineBorder(new Color(40, 40, 50)));
        descScroll.setAlignmentX(Component.LEFT_ALIGNMENT);
        descScroll.setMaximumSize(new Dimension(Integer.MAX_VALUE, 160));
        rightPanel.add(descScroll);

        contentPanel.add(rightPanel, BorderLayout.CENTER);
        add(contentPanel, BorderLayout.CENTER);

        // Bottom Action Bar Panel
        JPanel actionPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 18, 14));
        actionPanel.setBackground(new Color(16, 18, 24));
        actionPanel.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, new Color(40, 40, 50)));

        JButton btnBack = new JButton("← Back to Movies");
        btnBack.setBackground(new Color(30, 30, 36));
        btnBack.setForeground(Color.WHITE);
        btnBack.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnBack.setFocusPainted(false);
        btnBack.setBorder(BorderFactory.createEmptyBorder(10, 18, 10, 18));
        btnBack.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnBack.addActionListener(e -> NavigationManager.getInstance().showMovieList(this));

        JButton btnTrailer = new JButton("🎬 Watch Trailer");
        btnTrailer.setBackground(new Color(30, 41, 59));
        btnTrailer.setForeground(Color.WHITE);
        btnTrailer.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnTrailer.setFocusPainted(false);
        btnTrailer.setBorder(BorderFactory.createEmptyBorder(10, 18, 10, 18));
        btnTrailer.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnTrailer.addActionListener(e -> {
            String trailer = movie.getTrailerUrl();
            if (trailer != null && !trailer.trim().isEmpty()) {
                try {
                    java.awt.Desktop.getDesktop().browse(new java.net.URI(trailer));
                } catch (Exception ex) {
                    java.awt.datatransfer.StringSelection selection = new java.awt.datatransfer.StringSelection(trailer);
                    java.awt.Toolkit.getDefaultToolkit().getSystemClipboard().setContents(selection, null);
                    JOptionPane.showMessageDialog(this, "Trailer link copied to clipboard:\n" + trailer, "Watch Trailer", JOptionPane.INFORMATION_MESSAGE);
                }
            } else {
                JOptionPane.showMessageDialog(this, "No trailer link available for this movie.", "Watch Trailer", JOptionPane.WARNING_MESSAGE);
            }
        });

        JButton btnBook = new JButton("Book Tickets →");
        btnBook.setBackground(new Color(229, 9, 20));
        btnBook.setForeground(Color.WHITE);
        btnBook.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnBook.setFocusPainted(false);
        btnBook.setBorder(BorderFactory.createEmptyBorder(10, 22, 10, 22));
        btnBook.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnBook.addActionListener(e -> {
            NavigationManager.getInstance().setSelectedMovie(movie);
            NavigationManager.getInstance().showTheatreSelection(this);
        });

        if ("COMING_SOON".equalsIgnoreCase(movie.getStatus())) {
            btnBook.setEnabled(false);
            btnBook.setText("Tickets Coming Soon");
            btnBook.setBackground(new Color(75, 85, 99));
        }

        actionPanel.add(btnBack);
        actionPanel.add(btnTrailer);
        actionPanel.add(btnBook);
        add(actionPanel, BorderLayout.SOUTH);
    }

    private JLabel createMetaBadge(String text) {
        JLabel label = new JLabel(text);
        label.setFont(new Font("Segoe UI", Font.BOLD, 10));
        label.setForeground(new Color(156, 163, 175));
        label.setBackground(new Color(26, 26, 36));
        label.setOpaque(true);
        label.setBorder(BorderFactory.createEmptyBorder(4, 8, 4, 8));
        return label;
    }

    private JLabel createDetailsLabel(String text) {
        JLabel label = new JLabel(text);
        label.setFont(new Font("Segoe UI", Font.BOLD, 13));
        label.setForeground(new Color(110, 110, 125));
        return label;
    }

    private JLabel createDetailsValue(String text) {
        JLabel label = new JLabel("<html>" + text + "</html>");
        label.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        label.setForeground(Color.WHITE);
        return label;
    }
}
