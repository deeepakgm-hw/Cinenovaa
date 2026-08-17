package cineplex.view;

import cineplex.controller.MovieController;
import cineplex.model.Movie;
import cineplex.model.Showtime;
import dao.SeatLockDAO;
import model.Booking;

import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

public class SeatSelectionView extends JFrame {
    private MovieController movieController;
    private Movie movie;
    private Showtime showtime;
    private List<String> selectedSeats;
    private JLabel lblCapacity;
    private JLabel lblBookingSummary;
    private final SeatLockDAO seatLockDAO = new SeatLockDAO();
    private final java.util.Map<String, JButton> seatButtons = new java.util.HashMap<>();
    private int bookedSeatCount;

    private static final Color COLOR_AVAILABLE = new Color(46, 204, 113);
    private static final Color COLOR_SELECTED = new Color(255, 214, 10);
    private static final Color COLOR_BOOKED = new Color(231, 76, 60);

    public SeatSelectionView(Movie movie, Showtime showtime) {
        this.movie = movie;
        this.showtime = showtime;
        this.movieController = new MovieController();
        this.selectedSeats = new ArrayList<>();

        setTitle("Select Seats - " + movie.getTitle());
        setSize(1100, 760);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        getContentPane().setBackground(new Color(12, 12, 16));
        setLayout(new BorderLayout());

        add(createHeader(), BorderLayout.NORTH);

        List<String> bookedSeats = movieController.getBookedSeats(showtime.getId());
        bookedSeatCount = bookedSeats.size();
        java.util.Set<String> lockedSeats = seatLockDAO.getLockedSeatsByOtherUsers(
                showtime.getId(), cineplex.util.SessionManager.getInstance().getCurrentUserId());

        JPanel centerWrap = new JPanel(new BorderLayout(14, 14));
        centerWrap.setBackground(new Color(12, 12, 16));
        centerWrap.setBorder(BorderFactory.createEmptyBorder(16, 18, 10, 18));
        centerWrap.add(createLegendPanel(), BorderLayout.NORTH);

        JPanel seatGrid = new JPanel(new GridLayout(5, 10, 10, 10));
        seatGrid.setBackground(new Color(18, 18, 24));
        seatGrid.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(55, 55, 65), 1, true),
                BorderFactory.createEmptyBorder(24, 24, 24, 24)
        ));

        char rowChar = 'A';
        for (int i = 0; i < 5; i++) {
            for (int j = 1; j <= 10; j++) {
                String seatNum = rowChar + String.valueOf(j);
                JButton btnSeat = new JButton(seatNum);
                btnSeat.setFont(new Font("Segoe UI", Font.BOLD, 11));
                btnSeat.setFocusPainted(false);
                btnSeat.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
                btnSeat.setCursor(new Cursor(Cursor.HAND_CURSOR));
                seatButtons.put(seatNum, btnSeat);

                if (bookedSeats.contains(seatNum)) {
                    btnSeat.setBackground(COLOR_BOOKED);
                    btnSeat.setForeground(Color.WHITE);
                    btnSeat.setEnabled(false);
                    btnSeat.setToolTipText("Already booked");
                } else if (lockedSeats.contains(seatNum)) {
                    btnSeat.setBackground(COLOR_BOOKED);
                    btnSeat.setForeground(Color.WHITE);
                    btnSeat.setEnabled(false);
                    btnSeat.setToolTipText("Temporarily locked by another user");
                } else {
                    btnSeat.setBackground(COLOR_AVAILABLE);
                    btnSeat.setForeground(Color.BLACK);
                    btnSeat.addMouseListener(new java.awt.event.MouseAdapter() {
                        @Override
                        public void mouseEntered(java.awt.event.MouseEvent e) {
                            if (!selectedSeats.contains(seatNum)) btnSeat.setBackground(new Color(79, 226, 142));
                        }

                        @Override
                        public void mouseExited(java.awt.event.MouseEvent e) {
                            if (!selectedSeats.contains(seatNum)) btnSeat.setBackground(COLOR_AVAILABLE);
                        }
                    });

                    btnSeat.addActionListener(e -> {
                        if (selectedSeats.contains(seatNum)) {
                            seatLockDAO.releaseSeatLock(showtime.getId(), seatNum,
                                    cineplex.util.SessionManager.getInstance().getCurrentUserId());
                            selectedSeats.remove(seatNum);
                            btnSeat.setBackground(COLOR_AVAILABLE);
                        } else {
                            boolean locked = seatLockDAO.lockSeat(showtime.getId(), seatNum,
                                    cineplex.util.SessionManager.getInstance().getCurrentUserId());
                            if (locked) {
                                selectedSeats.add(seatNum);
                                btnSeat.setBackground(COLOR_SELECTED);
                            } else {
                                btnSeat.setEnabled(false);
                                btnSeat.setBackground(COLOR_BOOKED);
                                btnSeat.setForeground(Color.WHITE);
                                btnSeat.setToolTipText("Seat just became unavailable");
                                JOptionPane.showMessageDialog(this, seatNum + " is no longer available.", "Seat Unavailable", JOptionPane.WARNING_MESSAGE);
                            }
                        }
                        updateCapacityLabel(bookedSeatCount);
                    });
                }
                seatGrid.add(btnSeat);
            }
            rowChar++;
        }

        centerWrap.add(seatGrid, BorderLayout.CENTER);
        centerWrap.add(createSummaryPanel(), BorderLayout.EAST);
        add(centerWrap, BorderLayout.CENTER);

        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 18, 14));
        bottomPanel.setBackground(new Color(12, 12, 16));

        lblCapacity = new JLabel();
        lblCapacity.setForeground(Color.WHITE);
        lblCapacity.setFont(new Font("Segoe UI", Font.BOLD, 14));
        updateCapacityLabel(bookedSeatCount);

        JButton btnConfirm = new JButton("Confirm Selection");
        btnConfirm.setBackground(new Color(229, 9, 20));
        btnConfirm.setForeground(Color.WHITE);
        btnConfirm.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnConfirm.setBorder(BorderFactory.createEmptyBorder(10, 18, 10, 18));
        btnConfirm.addActionListener(e -> processToCheckout());

        JButton btnBack = new JButton("Back");
        btnBack.setBackground(new Color(40, 40, 46));
        btnBack.setForeground(Color.WHITE);
        btnBack.setBorder(BorderFactory.createEmptyBorder(10, 18, 10, 18));
        btnBack.addActionListener(e -> {
            seatLockDAO.releaseAllUserLocks(showtime.getId(),
                    cineplex.util.SessionManager.getInstance().getCurrentUserId());
            cineplex.util.NavigationManager.getInstance().showShowtimeSelection(this);
        });

        bottomPanel.add(btnBack);
        bottomPanel.add(lblCapacity);
        bottomPanel.add(btnConfirm);
        add(bottomPanel, BorderLayout.SOUTH);

        addWindowListener(new java.awt.event.WindowAdapter() {
            @Override
            public void windowClosing(java.awt.event.WindowEvent e) {
                seatLockDAO.releaseAllUserLocks(showtime.getId(),
                        cineplex.util.SessionManager.getInstance().getCurrentUserId());
            }
        });
    }

    private void processToCheckout() {
        if (selectedSeats.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please select at least one seat.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        String seatString = String.join(",", selectedSeats);
        double totalAmount = selectedSeats.size() * showtime.getPrice();

        cineplex.util.NavigationManager.getInstance().showCheckout(this, seatString, totalAmount);
    }

    private JPanel createHeader() {
        JPanel top = new JPanel(new BorderLayout());
        top.setBackground(new Color(16, 16, 22));
        top.setBorder(BorderFactory.createEmptyBorder(14, 20, 14, 20));

        JLabel lblTitle = new JLabel(movie.getTitle() + "  •  Seat Selection");
        lblTitle.setFont(new Font("Segoe UI Black", Font.BOLD, 26));
        lblTitle.setForeground(new Color(241, 209, 121));
        top.add(lblTitle, BorderLayout.WEST);

        JLabel lblScreen = new JLabel("SCREEN THIS WAY");
        lblScreen.setFont(new Font("Segoe UI", Font.BOLD, 14));
        lblScreen.setForeground(new Color(220, 220, 228));
        top.add(lblScreen, BorderLayout.EAST);
        return top;
    }

    private JPanel createLegendPanel() {
        JPanel legend = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 0));
        legend.setOpaque(false);
        legend.add(legendItem("Available", COLOR_AVAILABLE));
        legend.add(legendItem("Selected", COLOR_SELECTED));
        legend.add(legendItem("Booked / Locked", COLOR_BOOKED));
        return legend;
    }

    private JPanel legendItem(String text, Color color) {
        JPanel item = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        item.setOpaque(false);
        JLabel dot = new JLabel("  ");
        dot.setOpaque(true);
        dot.setBackground(color);
        dot.setPreferredSize(new Dimension(16, 16));
        dot.setBorder(BorderFactory.createLineBorder(new Color(30, 30, 34), 1, true));
        JLabel label = new JLabel(text);
        label.setForeground(new Color(232, 232, 240));
        label.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        item.add(dot);
        item.add(label);
        return item;
    }

    private JPanel createSummaryPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(new Color(22, 22, 30));
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(60, 60, 72), 1, true),
                BorderFactory.createEmptyBorder(16, 16, 16, 16)
        ));
        panel.setPreferredSize(new Dimension(260, 0));

        JLabel ttl = new JLabel("Booking Summary");
        ttl.setForeground(new Color(245, 211, 123));
        ttl.setFont(new Font("Segoe UI", Font.BOLD, 18));
        ttl.setAlignmentX(Component.LEFT_ALIGNMENT);
        panel.add(ttl);
        panel.add(Box.createRigidArea(new Dimension(0, 10)));

        JLabel movieInfo = new JLabel("<html><b>Movie:</b> " + movie.getTitle()
                + "<br/><b>Showtime:</b> " + (showtime.getShowTime() != null ? showtime.getShowTime().toString() : "N/A") + "</html>");
        movieInfo.setForeground(Color.WHITE);
        movieInfo.setAlignmentX(Component.LEFT_ALIGNMENT);
        panel.add(movieInfo);
        panel.add(Box.createRigidArea(new Dimension(0, 12)));

        lblBookingSummary = new JLabel();
        lblBookingSummary.setForeground(Color.WHITE);
        lblBookingSummary.setAlignmentX(Component.LEFT_ALIGNMENT);
        panel.add(lblBookingSummary);
        updateCapacityLabel(bookedSeatCount);

        return panel;
    }

    private void updateCapacityLabel(int bookedCount) {
        int total = 50;
        int selected = selectedSeats.size();
        int available = Math.max(0, total - bookedCount - selected);
        lblCapacity.setText("Total Seats: " + total + " | Booked: " + bookedCount + " | Selected: " + selected + " | Available: " + available);
        if (lblBookingSummary != null) {
            String seats = selectedSeats.isEmpty() ? "None" : String.join(", ", selectedSeats);
            lblBookingSummary.setText("<html><b>Seats:</b> " + seats + "<br/><b>Price/Seat:</b> ?" + String.format("%.2f", showtime.getPrice()) +
                    "<br/><b>Total:</b> ?" + String.format("%.2f", selected * showtime.getPrice()) + "</html>");
        }
    }
}
