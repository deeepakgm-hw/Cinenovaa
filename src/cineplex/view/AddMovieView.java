package cineplex.view;

import cineplex.controller.AdminController;
import cineplex.model.Movie;

import javax.swing.*;
import java.awt.*;
import java.sql.Date;

public class AddMovieView extends JFrame {
    private JTextField txtTitle, txtDuration, txtGenre, txtReleaseDate, txtPosterUrl, txtRating, txtCastMembers, txtTrailerUrl, txtMovieApiId, txtBackdropUrl;
    private JComboBox<String> cmbStatus;
    private JComboBox<Object> cmbMovieSelect;
    private JTextArea txtDescription;
    private JLabel lblPreview;
    private JButton btnSubmit;
    private AdminController adminController;

    public AddMovieView() {
        adminController = new AdminController();
        setTitle("Movie Management - Admin | CinePlex Studio");
        setSize(950, 780);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        getContentPane().setBackground(new Color(18, 18, 18));
        setLayout(new BorderLayout());

        // Live Preview Panel on the right
        JPanel previewPanel = new JPanel(new BorderLayout(5, 5));
        previewPanel.setBackground(new Color(25, 25, 25));
        previewPanel.setBorder(BorderFactory.createTitledBorder(
            BorderFactory.createLineBorder(new Color(50, 50, 50)),
            "POSTER PREVIEW",
            javax.swing.border.TitledBorder.CENTER,
            javax.swing.border.TitledBorder.TOP,
            new Font("Segoe UI", Font.BOLD, 12),
            Color.LIGHT_GRAY
        ));
        previewPanel.setPreferredSize(new Dimension(200, 300));
        
        lblPreview = new JLabel("No Preview", SwingConstants.CENTER);
        lblPreview.setForeground(Color.GRAY);
        lblPreview.setPreferredSize(new Dimension(150, 220));
        previewPanel.add(lblPreview, BorderLayout.CENTER);
        
        JPanel previewContainer = new JPanel(new GridBagLayout());
        previewContainer.setBackground(new Color(18, 18, 18));
        previewContainer.setBorder(BorderFactory.createEmptyBorder(20, 10, 20, 20));
        previewContainer.add(previewPanel);
        add(previewContainer, BorderLayout.EAST);

        // Form Panel
        JPanel formPanel = new JPanel(new GridLayout(0, 2, 10, 12));
        formPanel.setBackground(new Color(18, 18, 18));
        formPanel.setBorder(BorderFactory.createEmptyBorder(20, 30, 20, 10));

        txtTitle = createStyledTextField();
        txtDuration = createStyledTextField();
        txtGenre = createStyledTextField();
        txtReleaseDate = createStyledTextField();
        txtReleaseDate.setText("2024-05-15"); // Example
        txtPosterUrl = createStyledTextField();
        txtRating = createStyledTextField();
        txtRating.setText("8.5");
        txtCastMembers = createStyledTextField();
        txtTrailerUrl = createStyledTextField();
        txtMovieApiId = createStyledTextField();
        txtBackdropUrl = createStyledTextField();

        cmbStatus = new JComboBox<>(new String[]{"NOW_SHOWING", "COMING_SOON", "EXPIRED"});
        cmbStatus.setBackground(new Color(30, 30, 30));
        cmbStatus.setForeground(Color.WHITE);

        txtDescription = new JTextArea(3, 20);
        txtDescription.setBackground(new Color(30, 30, 30));
        txtDescription.setForeground(Color.WHITE);
        txtDescription.setCaretColor(Color.WHITE);
        txtDescription.setLineWrap(true);

        // Movie Selection for Editing / Adding
        cmbMovieSelect = new JComboBox<>();
        cmbMovieSelect.setBackground(new Color(30, 30, 30));
        cmbMovieSelect.setForeground(Color.WHITE);
        cmbMovieSelect.addItem("--- ADD NEW MOVIE ---");
        for (Movie m : adminController.getAllMovies()) {
            cmbMovieSelect.addItem(m);
        }

        formPanel.add(createStyledLabel("Management Mode:"));
        formPanel.add(cmbMovieSelect);
        formPanel.add(createStyledLabel("Title:"));
        formPanel.add(txtTitle);
        formPanel.add(createStyledLabel("Description:"));
        formPanel.add(new JScrollPane(txtDescription));
        formPanel.add(createStyledLabel("Duration (mins):"));
        formPanel.add(txtDuration);
        formPanel.add(createStyledLabel("Genre:"));
        formPanel.add(txtGenre);
        formPanel.add(createStyledLabel("Release Date (YYYY-MM-DD):"));
        formPanel.add(txtReleaseDate);
        formPanel.add(createStyledLabel("Poster Path / URL:"));
        formPanel.add(txtPosterUrl);
        formPanel.add(createStyledLabel("Rating (0.0 - 10.0):"));
        formPanel.add(txtRating);
        formPanel.add(createStyledLabel("Starring (Cast):"));
        formPanel.add(txtCastMembers);
        formPanel.add(createStyledLabel("Trailer URL:"));
        formPanel.add(txtTrailerUrl);
        formPanel.add(createStyledLabel("Movie API ID (TMDB):"));
        formPanel.add(txtMovieApiId);
        formPanel.add(createStyledLabel("Backdrop URL:"));
        formPanel.add(txtBackdropUrl);
        formPanel.add(createStyledLabel("Status:"));
        formPanel.add(cmbStatus);

        btnSubmit = new JButton("SAVE MOVIE");
        btnSubmit.setBackground(new Color(229, 9, 20));
        btnSubmit.setForeground(Color.WHITE);
        btnSubmit.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnSubmit.setFocusPainted(false);
        btnSubmit.addActionListener(e -> saveMovie());

        // Live Preview update as they type or select
        txtPosterUrl.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            private void updatePreview() {
                String path = txtPosterUrl.getText().trim();
                new Thread(() -> {
                    ImageIcon icon = MovieListView.getScaledPoster(path, 150, 220);
                    SwingUtilities.invokeLater(() -> {
                        lblPreview.setIcon(icon);
                        lblPreview.setText("");
                    });
                }).start();
            }
            public void insertUpdate(javax.swing.event.DocumentEvent e) { updatePreview(); }
            public void removeUpdate(javax.swing.event.DocumentEvent e) { updatePreview(); }
            public void changedUpdate(javax.swing.event.DocumentEvent e) { updatePreview(); }
        });

        // Mode switch action
        cmbMovieSelect.addActionListener(e -> {
            Object selected = cmbMovieSelect.getSelectedItem();
            if (selected instanceof Movie) {
                Movie m = (Movie) selected;
                txtTitle.setText(m.getTitle());
                txtDescription.setText(m.getDescription());
                txtDuration.setText(String.valueOf(m.getDuration()));
                txtGenre.setText(m.getGenre());
                txtReleaseDate.setText(m.getReleaseDate().toString());
                txtPosterUrl.setText(m.getPosterUrl() != null ? m.getPosterUrl() : "");
                txtRating.setText(m.getRating());
                txtCastMembers.setText(m.getCastMembers() != null ? m.getCastMembers() : "");
                txtTrailerUrl.setText(m.getTrailerUrl() != null ? m.getTrailerUrl() : "");
                txtMovieApiId.setText(m.getMovieApiId() != null ? m.getMovieApiId() : "");
                txtBackdropUrl.setText(m.getBackdropUrl() != null ? m.getBackdropUrl() : "");
                cmbStatus.setSelectedItem(m.getStatus());
                btnSubmit.setText("UPDATE MOVIE");
            } else {
                txtTitle.setText("");
                txtDescription.setText("");
                txtDuration.setText("");
                txtGenre.setText("");
                txtReleaseDate.setText("2024-05-15");
                txtPosterUrl.setText("");
                txtRating.setText("8.5");
                txtCastMembers.setText("");
                txtTrailerUrl.setText("");
                txtMovieApiId.setText("");
                txtBackdropUrl.setText("");
                cmbStatus.setSelectedIndex(0);
                btnSubmit.setText("SAVE MOVIE");
            }
        });
        
        JPanel bottomPanel = new JPanel();
        bottomPanel.setBackground(new Color(18, 18, 18));
        bottomPanel.add(btnSubmit);

        JLabel lblHeading = new JLabel("Movie Management Dashboard", SwingConstants.CENTER);
        lblHeading.setFont(new Font("Segoe UI", Font.BOLD, 22));
        lblHeading.setForeground(Color.WHITE);
        lblHeading.setBorder(BorderFactory.createEmptyBorder(20, 0, 10, 0));

        add(lblHeading, BorderLayout.NORTH);
        add(formPanel, BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JLabel createStyledLabel(String text) {
        JLabel lbl = new JLabel(text);
        lbl.setForeground(Color.LIGHT_GRAY);
        return lbl;
    }

    private JTextField createStyledTextField() {
        JTextField field = new JTextField();
        field.setBackground(new Color(30, 30, 30));
        field.setForeground(Color.WHITE);
        field.setCaretColor(Color.WHITE);
        field.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(50, 50, 50)),
            BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        return field;
    }

    private void saveMovie() {
        String title = txtTitle.getText().trim();
        String description = txtDescription.getText().trim();
        String genre = txtGenre.getText().trim();
        String posterUrl = txtPosterUrl.getText().trim();
        String releaseDateStr = txtReleaseDate.getText().trim();
        String durationStr = txtDuration.getText().trim();
        String ratingStr = txtRating.getText().trim();
        String status = (String) cmbStatus.getSelectedItem();
        String castMembers = txtCastMembers.getText().trim();
        String trailerUrl = txtTrailerUrl.getText().trim();
        String movieApiId = txtMovieApiId.getText().trim();
        String backdropUrl = txtBackdropUrl.getText().trim();

        if (title.isEmpty() || description.isEmpty() || genre.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill in all basic fields.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        try {
            int duration = Integer.parseInt(durationStr);
            String rating = ratingStr;
            Date releaseDate = Date.valueOf(releaseDateStr);

            Object selectedMode = cmbMovieSelect.getSelectedItem();
            boolean isEdit = selectedMode instanceof Movie;
            
            if (isEdit) {
                Movie existing = (Movie) selectedMode;
                existing.setTitle(title);
                existing.setDescription(description);
                existing.setDuration(duration);
                existing.setGenre(genre);
                existing.setReleaseDate(releaseDate);
                existing.setPosterUrl(posterUrl);
                existing.setRating(rating);
                existing.setStatus(status);
                existing.setCastMembers(castMembers);
                existing.setTrailerUrl(trailerUrl);
                existing.setMovieApiId(movieApiId.isEmpty() ? null : movieApiId);
                existing.setBackdropUrl(backdropUrl.isEmpty() ? null : backdropUrl);

                if (adminController.updateMovie(existing)) {
                    JOptionPane.showMessageDialog(this, "Movie Updated Successfully!", "Success", JOptionPane.INFORMATION_MESSAGE);
                    dispose();
                } else {
                    JOptionPane.showMessageDialog(this, "Failed to update movie in database.", "Error", JOptionPane.ERROR_MESSAGE);
                }
            } else {
                Movie movie = new Movie(0, title, description, duration, genre, "English", releaseDate, posterUrl, rating, status, castMembers, trailerUrl, movieApiId.isEmpty() ? null : movieApiId, backdropUrl.isEmpty() ? null : backdropUrl);

                if (adminController.addMovie(movie)) {
                    JOptionPane.showMessageDialog(this, "Movie Added Successfully!", "Success", JOptionPane.INFORMATION_MESSAGE);
                    dispose();
                } else {
                    JOptionPane.showMessageDialog(this, "Failed to save movie to database.", "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(this, "Duration must be a whole number.", "Format Error", JOptionPane.ERROR_MESSAGE);
        } catch (IllegalArgumentException e) {
            JOptionPane.showMessageDialog(this, "Release Date must be in YYYY-MM-DD format (e.g., 2024-05-15).", "Format Error", JOptionPane.ERROR_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "An unexpected error occurred: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}


