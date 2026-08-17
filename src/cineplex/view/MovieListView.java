package cineplex.view;

import cineplex.controller.MovieController;
import cineplex.dao.UpcomingMovieDAO;
import cineplex.model.Movie;
import cineplex.model.UpcomingMovie;
import cineplex.util.SessionManager;
import cineplex.util.NavigationManager;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class MovieListView extends JFrame {
    private MovieController movieController;
    private final UpcomingMovieDAO upcomingMovieDAO = new UpcomingMovieDAO();
    private static String lastPopupMovieName;
    private JPanel moviesGridPanel;
    private List<Movie> allMovies;
    private JTextField searchField;
    private String activeCategory = "ALL";
    private JComboBox<String> langCombo;
    private JComboBox<String> statusCombo;

    public MovieListView() {
        movieController = new MovieController();
        setTitle("CineNova - Premium Movie Grid");
        setSize(1400, 900);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        getContentPane().setBackground(new Color(10, 10, 14));
        setLayout(new BorderLayout());
        
        int cityId = NavigationManager.getInstance().getSelectedCityId();
        allMovies = new cineplex.dao.ShowtimeDAO().getMoviesByCity(cityId);

        add(createTopNavigation(), BorderLayout.NORTH);
        add(createMainDashboard(), BorderLayout.CENTER);
    }

    private JPanel createTopNavigation() {
        JPanel headerPanel = new JPanel(new BorderLayout(18, 0));
        headerPanel.setBackground(new Color(16, 18, 24));
        headerPanel.setBorder(new EmptyBorder(14, 24, 14, 24));

        JLabel lblTitle = new JLabel("CineNova");
        lblTitle.setFont(new Font("Segoe UI Black", Font.BOLD, 30));
        lblTitle.setForeground(new Color(239, 68, 68));
        headerPanel.add(lblTitle, BorderLayout.WEST);

        JPanel center = new JPanel(new BorderLayout(10, 0));
        center.setOpaque(false);
        searchField = new JTextField();
        searchField.setPreferredSize(new Dimension(380, 40));
        searchField.setBackground(new Color(28, 30, 38));
        searchField.setForeground(Color.WHITE);
        searchField.setCaretColor(Color.WHITE);
        searchField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(88, 90, 100), 1, true),
                new EmptyBorder(10, 14, 10, 14)
        ));
        searchField.setToolTipText("Search movies by title or genre");
        searchField.addCaretListener(e -> refreshMovieGrid());
        center.add(searchField, BorderLayout.CENTER);
        headerPanel.add(center, BorderLayout.CENTER);

        JPanel rightHeader = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        rightHeader.setOpaque(false);

        JLabel lblUser = new JLabel("Hi, " + SessionManager.getInstance().getCurrentUserName());
        lblUser.setForeground(new Color(242, 242, 246));
        lblUser.setFont(new Font("Segoe UI", Font.BOLD, 14));
        rightHeader.add(lblUser);

        JButton btnLocation = new JButton("📍 " + NavigationManager.getInstance().getSelectedCityName());
        btnLocation.setBackground(new Color(38, 38, 48));
        btnLocation.setForeground(Color.WHITE);
        btnLocation.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnLocation.setFocusPainted(false);
        btnLocation.setBorder(BorderFactory.createEmptyBorder(9, 14, 9, 14));
        btnLocation.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        btnLocation.addActionListener(e -> NavigationManager.getInstance().showCitySelection(this));
        rightHeader.add(btnLocation);

        JButton btnLogout = new JButton("Logout");
        btnLogout.setBackground(new Color(221, 28, 54));
        btnLogout.setForeground(Color.WHITE);
        btnLogout.setFocusPainted(false);
        btnLogout.setBorder(BorderFactory.createEmptyBorder(9, 16, 9, 16));
        btnLogout.addActionListener(e -> {
            SessionManager.getInstance().logout();
            new LoginView().setVisible(true);
            dispose();
        });
        rightHeader.add(btnLogout);

        headerPanel.add(rightHeader, BorderLayout.EAST);
        return headerPanel;
    }

    private JScrollPane mainScrollPane;
    private JPanel dashboardContentPanel;

    private JScrollPane createMainDashboard() {
        dashboardContentPanel = new JPanel();
        dashboardContentPanel.setBackground(new Color(10, 10, 14));
        dashboardContentPanel.setLayout(new BoxLayout(dashboardContentPanel, BoxLayout.Y_AXIS));
        dashboardContentPanel.setBorder(new EmptyBorder(12, 18, 18, 18));

        refreshMovieGrid();

        mainScrollPane = new JScrollPane(dashboardContentPanel);
        mainScrollPane.setBorder(null);
        mainScrollPane.getViewport().setBackground(new Color(10, 10, 14));
        mainScrollPane.getVerticalScrollBar().setUnitIncrement(24);
        return mainScrollPane;
    }

    private JPanel createHeroBanner() {
        JPanel hero = new JPanel(new BorderLayout());
        hero.setPreferredSize(new Dimension(0, 170));
        hero.setBorder(new EmptyBorder(18, 18, 18, 18));
        hero.setOpaque(false);
        hero = new JPanel(new BorderLayout()) {
            @Override protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                GradientPaint gp = new GradientPaint(0, 0, new Color(126, 16, 28), getWidth(), getHeight(), new Color(24, 24, 34));
                g2.setPaint(gp);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 26, 26);
                g2.setColor(new Color(255, 255, 255, 30));
                g2.fillOval(getWidth() - 230, -50, 280, 280);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        hero.setOpaque(false);
        hero.setBorder(new EmptyBorder(20, 22, 20, 22));

        JLabel t = new JLabel("Book Tickets, Snacks, and Premium Seats");
        t.setForeground(Color.WHITE);
        t.setFont(new Font("Segoe UI Black", Font.BOLD, 30));
        JLabel s = new JLabel("Premium multi-city cinema booking experience, powered by CineNova");
        s.setForeground(new Color(245, 220, 170));
        s.setFont(new Font("Segoe UI", Font.PLAIN, 15));

        JPanel left = new JPanel();
        left.setOpaque(false);
        left.setLayout(new BoxLayout(left, BoxLayout.Y_AXIS));
        left.add(t);
        left.add(Box.createRigidArea(new Dimension(0, 8)));
        left.add(s);
        hero.add(left, BorderLayout.WEST);
        return hero;
    }

    private JLabel sectionTitle(String text) {
        JLabel title = new JLabel(text);
        title.setFont(new Font("Segoe UI", Font.BOLD, 20));
        title.setForeground(new Color(247, 214, 122));
        return title;
    }

    private JPanel createCategoryStrip() {
        JPanel container = new JPanel(new BorderLayout(15, 0));
        container.setOpaque(false);

        // Left section: Genre Chips
        JPanel genrePanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 2));
        genrePanel.setOpaque(false);
        String[] chips = {"ALL", "SCI-FI", "ACTION", "DRAMA", "THRILLER"};
        for (String chip : chips) {
            JButton b = new JButton(chip);
            b.setFocusPainted(false);
            b.setBorder(BorderFactory.createEmptyBorder(8, 14, 8, 14));
            b.setFont(new Font("Segoe UI", Font.BOLD, 12));
            setChipStyle(b, "ALL".equals(chip));
            b.addActionListener(e -> {
                activeCategory = chip;
                for (Component c : genrePanel.getComponents()) {
                    if (c instanceof JButton) setChipStyle((JButton) c, c == b);
                }
                refreshMovieGrid();
            });
            genrePanel.add(b);
        }
        container.add(genrePanel, BorderLayout.WEST);

        // Right section: Dropdowns for Language and Status
        JPanel dropDowns = new JPanel(new FlowLayout(FlowLayout.RIGHT, 12, 2));
        dropDowns.setOpaque(false);

        JLabel lblLang = new JLabel("Language:");
        lblLang.setForeground(new Color(200, 200, 210));
        lblLang.setFont(new Font("Segoe UI", Font.BOLD, 12));
        dropDowns.add(lblLang);

        String[] langs = {"All", "English", "Hindi", "Kannada", "Tamil", "Telugu"};
        langCombo = new JComboBox<>(langs);
        langCombo.setBackground(new Color(28, 30, 38));
        langCombo.setForeground(Color.WHITE);
        langCombo.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        langCombo.setBorder(BorderFactory.createLineBorder(new Color(58, 58, 68), 1));
        langCombo.setFocusable(false);
        langCombo.addActionListener(e -> refreshMovieGrid());
        dropDowns.add(langCombo);

        JLabel lblStatus = new JLabel("Status:");
        lblStatus.setForeground(new Color(200, 200, 210));
        lblStatus.setFont(new Font("Segoe UI", Font.BOLD, 12));
        dropDowns.add(lblStatus);

        String[] statuses = {"All", "Now Showing", "Coming Soon"};
        statusCombo = new JComboBox<>(statuses);
        statusCombo.setBackground(new Color(28, 30, 38));
        statusCombo.setForeground(Color.WHITE);
        statusCombo.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        statusCombo.setBorder(BorderFactory.createLineBorder(new Color(58, 58, 68), 1));
        statusCombo.setFocusable(false);
        statusCombo.addActionListener(e -> refreshMovieGrid());
        dropDowns.add(statusCombo);

        container.add(dropDowns, BorderLayout.EAST);
        return container;
    }

    private void setChipStyle(JButton b, boolean selected) {
        if (selected) { b.setBackground(new Color(229, 36, 56)); b.setForeground(Color.WHITE); }
        else { b.setBackground(new Color(34, 34, 42)); b.setForeground(new Color(212, 212, 218)); }
    }

    private void refreshMovieGrid() {
        if (dashboardContentPanel == null) return;

        dashboardContentPanel.removeAll();

        // Get filters
        String query = searchField != null ? searchField.getText().trim().toLowerCase(Locale.ROOT) : "";
        String selectedLang = langCombo != null ? (String) langCombo.getSelectedItem() : "All";
        String selectedStatus = statusCombo != null ? (String) statusCombo.getSelectedItem() : "All";

        // Load all movies from db and city
        int cityId = NavigationManager.getInstance().getSelectedCityId();
        List<Movie> cityMovies = new cineplex.dao.ShowtimeDAO().getMoviesByCity(cityId);
        List<Movie> allDbMovies = new cineplex.dao.MovieDAO().getAllMovies();

        // Determine if we are filtering or showing the normal dashboard
        boolean isFiltering = !query.isEmpty() || !"ALL".equals(activeCategory) || !"All".equals(selectedLang) || !"All".equals(selectedStatus);

        if (isFiltering) {
            // Render a single grid for search/filter results
            List<Movie> filtered = allDbMovies.stream().filter(m -> {
                boolean catOk = "ALL".equals(activeCategory) || (m.getGenre() != null && m.getGenre().toUpperCase(Locale.ROOT).contains(activeCategory));
                boolean queryOk = query.isEmpty() 
                        || (m.getTitle() != null && m.getTitle().toLowerCase(Locale.ROOT).contains(query)) 
                        || (m.getGenre() != null && m.getGenre().toLowerCase(Locale.ROOT).contains(query))
                        || (m.getCastMembers() != null && m.getCastMembers().toLowerCase(Locale.ROOT).contains(query))
                        || (m.getLanguage() != null && m.getLanguage().toLowerCase(Locale.ROOT).contains(query));
                
                boolean langOk = "All".equals(selectedLang) 
                        || (m.getLanguage() != null && m.getLanguage().equalsIgnoreCase(selectedLang));
                
                boolean statusOk = true;
                if ("Now Showing".equals(selectedStatus)) {
                    statusOk = "NOW_SHOWING".equals(m.getStatus()) || "POPULAR".equals(m.getStatus());
                } else if ("Coming Soon".equals(selectedStatus)) {
                    statusOk = "COMING_SOON".equals(m.getStatus());
                }

                return catOk && queryOk && langOk && statusOk;
            }).collect(Collectors.toList());

            dashboardContentPanel.add(sectionTitle("Search Results (" + filtered.size() + ")"));
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 14)));

            if (filtered.isEmpty()) {
                JLabel lblEmpty = new JLabel("No movies match this filter.", SwingConstants.CENTER);
                lblEmpty.setForeground(Color.GRAY);
                lblEmpty.setFont(new Font("Segoe UI", Font.ITALIC, 16));
                lblEmpty.setAlignmentX(Component.LEFT_ALIGNMENT);
                dashboardContentPanel.add(lblEmpty);
            } else {
                JPanel resultsGrid = new JPanel(new GridLayout(0, 4, 18, 18));
                resultsGrid.setOpaque(false);
                resultsGrid.setAlignmentX(Component.LEFT_ALIGNMENT);
                for (Movie m : filtered) {
                    resultsGrid.add(createMovieCard(m));
                }
                dashboardContentPanel.add(resultsGrid);
            }
        } else {
            // Render the 4 premium dashboard sections
            
            // Section 1: 🔥 Now Showing (Movies in cityMovies with status NOW_SHOWING)
            List<Movie> nowShowing = cityMovies.stream()
                    .filter(m -> "NOW_SHOWING".equalsIgnoreCase(m.getStatus()))
                    .collect(Collectors.toList());
            
            dashboardContentPanel.add(sectionTitle("🔥 Now Showing"));
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 14)));
            if (nowShowing.isEmpty()) {
                JLabel lblEmpty = new JLabel("No movies currently showing in this city.", SwingConstants.CENTER);
                lblEmpty.setForeground(Color.GRAY);
                lblEmpty.setFont(new Font("Segoe UI", Font.ITALIC, 14));
                lblEmpty.setAlignmentX(Component.LEFT_ALIGNMENT);
                dashboardContentPanel.add(lblEmpty);
            } else {
                JPanel nowShowingGrid = new JPanel(new GridLayout(0, 4, 18, 18));
                nowShowingGrid.setOpaque(false);
                nowShowingGrid.setAlignmentX(Component.LEFT_ALIGNMENT);
                for (Movie m : nowShowing) {
                    nowShowingGrid.add(createMovieCard(m));
                }
                dashboardContentPanel.add(nowShowingGrid);
            }
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 32)));

            // Section 2: 🚀 Coming Soon (Movies in allDbMovies with status COMING_SOON)
            List<Movie> comingSoon = allDbMovies.stream()
                    .filter(m -> "COMING_SOON".equalsIgnoreCase(m.getStatus()))
                    .collect(Collectors.toList());

            dashboardContentPanel.add(sectionTitle("🚀 Upcoming"));
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 14)));
            if (comingSoon.isEmpty()) {
                JLabel lblEmpty = new JLabel("No upcoming releases registered.", SwingConstants.CENTER);
                lblEmpty.setForeground(Color.GRAY);
                lblEmpty.setFont(new Font("Segoe UI", Font.ITALIC, 14));
                lblEmpty.setAlignmentX(Component.LEFT_ALIGNMENT);
                dashboardContentPanel.add(lblEmpty);
            } else {
                JPanel comingSoonGrid = new JPanel(new GridLayout(0, 4, 18, 18));
                comingSoonGrid.setOpaque(false);
                comingSoonGrid.setAlignmentX(Component.LEFT_ALIGNMENT);
                int limit = Math.min(comingSoon.size(), 8);
                for (int i = 0; i < limit; i++) {
                    comingSoonGrid.add(createMovieCard(comingSoon.get(i)));
                }
                dashboardContentPanel.add(comingSoonGrid);
            }
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 32)));

            // Section 3: ⭐ Popular Movies (Movies in allDbMovies with status POPULAR, fallback to highest rated)
            List<Movie> popular = allDbMovies.stream()
                    .filter(m -> "POPULAR".equalsIgnoreCase(m.getStatus()))
                    .collect(Collectors.toList());
            if (popular.isEmpty()) {
                popular = allDbMovies.stream()
                        .filter(m -> "NOW_SHOWING".equalsIgnoreCase(m.getStatus()))
                        .sorted((m1, m2) -> Double.compare(getNumericRating(m2), getNumericRating(m1)))
                        .limit(8)
                        .collect(Collectors.toList());
            }

            dashboardContentPanel.add(sectionTitle("⭐ Popular"));
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 14)));
            if (popular.isEmpty()) {
                JLabel lblEmpty = new JLabel("No popular movies loaded.", SwingConstants.CENTER);
                lblEmpty.setForeground(Color.GRAY);
                lblEmpty.setFont(new Font("Segoe UI", Font.ITALIC, 14));
                lblEmpty.setAlignmentX(Component.LEFT_ALIGNMENT);
                dashboardContentPanel.add(lblEmpty);
            } else {
                JPanel popularGrid = new JPanel(new GridLayout(0, 4, 18, 18));
                popularGrid.setOpaque(false);
                popularGrid.setAlignmentX(Component.LEFT_ALIGNMENT);
                for (Movie m : popular) {
                    popularGrid.add(createMovieCard(m));
                }
                dashboardContentPanel.add(popularGrid);
            }
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 32)));

            // Section 4: 🎬 Recommended (Highly rated movies, e.g. rating >= 7.8)
            List<Movie> recommended = allDbMovies.stream()
                    .filter(m -> getNumericRating(m) >= 7.8)
                    .limit(8)
                    .collect(Collectors.toList());

            dashboardContentPanel.add(sectionTitle("🎬 Recommended"));
            dashboardContentPanel.add(Box.createRigidArea(new Dimension(0, 14)));
            if (recommended.isEmpty()) {
                JLabel lblEmpty = new JLabel("No recommendations available.", SwingConstants.CENTER);
                lblEmpty.setForeground(Color.GRAY);
                lblEmpty.setFont(new Font("Segoe UI", Font.ITALIC, 14));
                lblEmpty.setAlignmentX(Component.LEFT_ALIGNMENT);
                dashboardContentPanel.add(lblEmpty);
            } else {
                JPanel recommendedGrid = new JPanel(new GridLayout(0, 4, 18, 18));
                recommendedGrid.setOpaque(false);
                recommendedGrid.setAlignmentX(Component.LEFT_ALIGNMENT);
                for (Movie m : recommended) {
                    recommendedGrid.add(createMovieCard(m));
                }
                dashboardContentPanel.add(recommendedGrid);
            }
        }

        dashboardContentPanel.revalidate();
        dashboardContentPanel.repaint();
    }

    private double getNumericRating(Movie m) {
        if (m.getRating() == null) return 0.0;
        try {
            return Double.parseDouble(m.getRating());
        } catch (NumberFormatException e) {
            String r = m.getRating().toUpperCase();
            if (r.contains("UA") || r.contains("PG")) return 7.8;
            if (r.contains("R")) return 8.2;
            return 7.5;
        }
    }

    private JPanel createMovieCard(Movie movie) {
        JPanel card = new JPanel(new BorderLayout(8, 10));
        card.setBackground(new Color(22, 22, 30));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(58, 58, 70), 1, true),
                BorderFactory.createEmptyBorder(10, 10, 10, 10)
        ));

        JLabel lblImage = new JLabel("", SwingConstants.CENTER);
        lblImage.setPreferredSize(new Dimension(200, 280));
        new Thread(() -> {
            ImageIcon icon = getScaledPoster(movie, 200, 280);
            SwingUtilities.invokeLater(() -> lblImage.setIcon(icon));
        }).start();
        card.add(lblImage, BorderLayout.CENTER);

        JPanel info = new JPanel();
        info.setLayout(new BoxLayout(info, BoxLayout.Y_AXIS));
        info.setOpaque(false);

        // Title Row with Status Badge
        JPanel titleRow = new JPanel(new BorderLayout(5, 0));
        titleRow.setOpaque(false);

        JLabel lblTitle = new JLabel(movie.getTitle() != null ? movie.getTitle() : "Untitled");
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 15));
        lblTitle.setForeground(Color.WHITE);
        titleRow.add(lblTitle, BorderLayout.CENTER);

        String stat = movie.getStatus() != null ? movie.getStatus() : "NOW_SHOWING";
        boolean isNow = "NOW_SHOWING".equals(stat);
        JLabel lblStatus = new JLabel(" " + (isNow ? "NOW" : "SOON") + " ");
        lblStatus.setFont(new Font("Segoe UI", Font.BOLD, 8));
        lblStatus.setForeground(Color.WHITE);
        lblStatus.setBackground(isNow ? new Color(16, 185, 129) : new Color(245, 158, 11));
        lblStatus.setOpaque(true);
        lblStatus.setBorder(BorderFactory.createEmptyBorder(2, 4, 2, 4));
        titleRow.add(lblStatus, BorderLayout.EAST);

        info.add(titleRow);
        info.add(Box.createRigidArea(new Dimension(0, 4)));

        // Genre, Lang, Duration, Rating details
        String ratingText = movie.getRating() != null ? movie.getRating() : "PG-13";
        JLabel lblDetails = new JLabel((movie.getGenre() != null ? movie.getGenre() : "Genre") + "  •  " + movie.getLanguage() + "  •  " + movie.getDuration() + "m  •  " + ratingText);
        lblDetails.setForeground(new Color(156, 163, 175));
        lblDetails.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        info.add(lblDetails);
        info.add(Box.createRigidArea(new Dimension(0, 10)));

        JButton btnBook = new JButton("View Details");
        btnBook.setBackground(new Color(224, 20, 44));
        btnBook.setForeground(Color.WHITE);
        btnBook.setFocusPainted(false);
        btnBook.setBorder(BorderFactory.createEmptyBorder(8, 10, 8, 10));
        btnBook.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnBook.setMaximumSize(new Dimension(Integer.MAX_VALUE, 35));
        btnBook.addActionListener(e -> { 
            NavigationManager.getInstance().showMovieDetail(this, movie); 
        });
        info.add(btnBook);

        card.add(info, BorderLayout.SOUTH);
        return card;
    }

    public static ImageIcon getScaledPoster(Movie movie, int targetWidth, int targetHeight) {
        ImageIcon icon = null;
        if (movie == null) return null;
        
        String path = movie.getPosterUrl();
        String apiId = movie.getMovieApiId();
        
        if (path != null && !path.trim().isEmpty()) {
            // Print Debug Logging as requested
            System.out.println("Movie: " + movie.getTitle());
            System.out.println("Poster URL:");
            System.out.println(path);
            System.out.println();
            
            try {
                if (path.startsWith("http://") || path.startsWith("https://")) {
                    // Compute clean cache file name using TMDB API ID if available: movie_api_id.jpg (e.g. 550.jpg)
                    String fileName = (apiId != null && !apiId.trim().isEmpty()) ? (apiId.trim() + ".jpg") : path.replaceAll("[^a-zA-Z0-9.-]", "_");
                    java.io.File cacheDir = new java.io.File("resources/cache/posters");
                    if (!cacheDir.exists()) {
                        cacheDir.mkdirs();
                    }
                    java.io.File cacheFile = new java.io.File(cacheDir, fileName);
                    
                    if (cacheFile.exists()) {
                        icon = new ImageIcon(cacheFile.getAbsolutePath());
                    } else {
                        downloadFile(path, cacheFile);
                        if (cacheFile.exists()) {
                            icon = new ImageIcon(cacheFile.getAbsolutePath());
                        } else {
                            icon = new ImageIcon(new java.net.URL(path));
                        }
                    }
                } else {
                    java.io.File file = new java.io.File(path);
                    if (file.exists()) {
                        icon = new ImageIcon(file.getAbsolutePath());
                    } else {
                        java.net.URL resourceUrl = MovieListView.class.getResource("/" + path);
                        if (resourceUrl != null) icon = new ImageIcon(resourceUrl);
                    }
                }
            } catch (Exception ignored) {}
        }
        if (icon == null || icon.getImage() == null || icon.getIconWidth() <= 0) {
            try {
                java.io.File defaultFile = new java.io.File("resources/images/posters/default_poster.png");
                if (defaultFile.exists()) {
                    icon = new ImageIcon(defaultFile.getAbsolutePath());
                } else {
                    java.net.URL resourceUrl = MovieListView.class.getResource("/resources/images/posters/default_poster.png");
                    if (resourceUrl != null) icon = new ImageIcon(resourceUrl);
                }
            } catch (Exception ignored) {}
        }
        if (icon == null || icon.getImage() == null || icon.getIconWidth() <= 0) {
            return null; // Fallback to default_poster.png only
        }
        Image scaled = icon.getImage().getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH);
        return new ImageIcon(scaled);
    }

    public static ImageIcon getScaledPoster(String path, int targetWidth, int targetHeight) {
        Movie dummy = new Movie();
        dummy.setTitle("Poster");
        dummy.setPosterUrl(path);
        dummy.setMovieApiId("");
        return getScaledPoster(dummy, targetWidth, targetHeight);
    }

    private static void downloadFile(String urlStr, java.io.File destination) {
        try {
            java.io.File parent = destination.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestMethod("GET");
            if (conn.getResponseCode() == 200) {
                try (java.io.InputStream in = conn.getInputStream();
                     java.io.FileOutputStream out = new java.io.FileOutputStream(destination)) {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[CACHE] Failed to download poster: " + urlStr + " Error: " + e.getMessage());
        }
    }

    private JPanel createComingSoonPanel() {
        JPanel root = new JPanel(new BorderLayout());
        root.setBackground(new Color(14, 14, 18));
        root.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(56, 56, 66), 1, true),
                new EmptyBorder(10, 10, 10, 10)
        ));

        JLabel lbl = new JLabel("Coming Soon");
        lbl.setFont(new Font("Segoe UI", Font.BOLD, 18));
        lbl.setForeground(new Color(247, 214, 122));
        root.add(lbl, BorderLayout.NORTH);

        JPanel listPanel = new JPanel(new GridLayout(1, 0, 12, 12));
        listPanel.setBackground(new Color(14, 14, 18));

        for (UpcomingMovie u : upcomingMovieDAO.getTrendingUpcomingMovies()) {
            JPanel card = new JPanel(new BorderLayout(6, 6));
            card.setBackground(new Color(26, 26, 34));
            JLabel poster = new JLabel("", SwingConstants.CENTER);
            poster.setPreferredSize(new Dimension(100, 140));
            new Thread(() -> {
                Movie dummy = new Movie();
                dummy.setTitle(u.getMovieName());
                dummy.setPosterUrl(u.getPosterUrl());
                dummy.setMovieApiId(String.valueOf(u.getUpcomingId()));
                ImageIcon icon = getScaledPoster(dummy, 100, 140);
                SwingUtilities.invokeLater(() -> poster.setIcon(icon));
            }).start();
            card.add(poster, BorderLayout.WEST);

            JTextArea details = new JTextArea(u.getMovieName() + "\n" + (u.getTeaserDescription() == null ? "" : u.getTeaserDescription())
                    + "\nRelease: " + (u.getExpectedReleaseDate() == null ? "TBA" : u.getExpectedReleaseDate())
                    + "\nNotify: " + u.getNotifyCount());
            details.setLineWrap(true); details.setWrapStyleWord(true); details.setEditable(false);
            details.setBackground(new Color(26, 26, 34)); details.setForeground(Color.WHITE);
            card.add(details, BorderLayout.CENTER);

            JButton notifyBtn = new JButton("Notify Me");
            notifyBtn.addActionListener(e -> {
                boolean ok = upcomingMovieDAO.registerInterest(SessionManager.getInstance().getCurrentUserId(), u.getUpcomingId());
                JOptionPane.showMessageDialog(this, ok ? "Saved! We'll notify you." : "Already marked or failed.", "Notify Me", ok ? JOptionPane.INFORMATION_MESSAGE : JOptionPane.WARNING_MESSAGE);
                dispose(); new MovieListView().setVisible(true);
            });
            card.add(notifyBtn, BorderLayout.SOUTH);
            listPanel.add(card);
        }
        root.add(new JScrollPane(listPanel), BorderLayout.CENTER);
        return root;
    }

    private void showUpcomingPopupIfNeeded() {
        // Disabled to remove legacy fake/placeholder warnings
    }
}


