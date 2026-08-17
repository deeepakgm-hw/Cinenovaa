package cineplex.view;

import cineplex.controller.AdminController;
import cineplex.model.Movie;
import cineplex.model.Showtime;

import javax.swing.*;
import java.awt.*;
import java.sql.Timestamp;
import java.util.List;

public class AddShowtimeView extends JFrame {
    private JComboBox<Movie> cmbMovies;
    private JTextField txtScreenId, txtShowTime, txtPrice;
    private AdminController adminController;

    public AddShowtimeView() {
        adminController = new AdminController();
        setTitle("Add Showtime - Admin");
        setSize(560, 500);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        getContentPane().setBackground(new Color(14, 14, 14));
        setLayout(new BorderLayout());

        JPanel formPanel = new JPanel(new GridLayout(4, 2, 12, 16));
        formPanel.setBackground(new Color(14, 14, 14));
        formPanel.setBorder(BorderFactory.createEmptyBorder(30, 30, 30, 30));

        List<Movie> movies = adminController.getAllMovies();
        cmbMovies = new JComboBox<>(movies.toArray(new Movie[0]));
        cmbMovies.setBackground(new Color(30, 30, 30));
        cmbMovies.setForeground(Color.WHITE);
        
        txtScreenId = createStyledTextField();
        txtScreenId.setText("1");
        
        txtShowTime = createStyledTextField();
        txtShowTime.setText("2024-05-15 18:00:00");
        
        txtPrice = createStyledTextField();
        txtPrice.setText("12.50");

        formPanel.add(createStyledLabel("Select Movie:"));
        formPanel.add(cmbMovies);
        formPanel.add(createStyledLabel("Screen ID:"));
        formPanel.add(txtScreenId);
        formPanel.add(createStyledLabel("Show Time (YYYY-MM-DD HH:MM:SS):"));
        formPanel.add(txtShowTime);
        formPanel.add(createStyledLabel("Ticket Price ($):"));
        formPanel.add(txtPrice);

        JButton btnSubmit = new JButton("SAVE SHOWTIME");
        btnSubmit.setBackground(new Color(229, 9, 20));
        btnSubmit.setForeground(Color.WHITE);
        btnSubmit.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnSubmit.setFocusPainted(false);
        btnSubmit.addActionListener(e -> saveShowtime());
        
        JPanel bottomPanel = new JPanel();
        bottomPanel.setBackground(new Color(14, 14, 14));
        bottomPanel.add(btnSubmit);

        JLabel lblHeading = new JLabel("Add New Showtime", SwingConstants.CENTER);
        lblHeading.setFont(new Font("Segoe UI", Font.BOLD, 20));
        lblHeading.setForeground(Color.WHITE);
        lblHeading.setBorder(BorderFactory.createEmptyBorder(20, 0, 0, 0));

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

    private void saveShowtime() {
        Movie selectedMovie = (Movie) cmbMovies.getSelectedItem();
        if (selectedMovie == null) {
            JOptionPane.showMessageDialog(this, "Please select a movie.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        String screenIdStr = txtScreenId.getText().trim();
        String showTimeStr = txtShowTime.getText().trim();
        String priceStr = txtPrice.getText().trim();

        try {
            int screenId = Integer.parseInt(screenIdStr);
            double price = Double.parseDouble(priceStr);
            Timestamp showTime = Timestamp.valueOf(showTimeStr);

            Showtime st = new Showtime(0, selectedMovie.getId(), screenId, showTime, price);
            if (adminController.addShowtime(st)) {
                JOptionPane.showMessageDialog(this, "Showtime Added Successfully!", "Success", JOptionPane.INFORMATION_MESSAGE);
                dispose();
            } else {
                JOptionPane.showMessageDialog(this, "Failed to save showtime to database.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(this, "Screen ID must be a number and Price must be a decimal (e.g., 12.50).", "Format Error", JOptionPane.ERROR_MESSAGE);
        } catch (IllegalArgumentException e) {
            JOptionPane.showMessageDialog(this, "Show Time must be in 'YYYY-MM-DD HH:MM:SS' format.", "Format Error", JOptionPane.ERROR_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "An unexpected error occurred: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}



