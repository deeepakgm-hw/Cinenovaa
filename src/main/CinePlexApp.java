package main;

import model.Booking;
import util.ThemeUtil;
import view.PaymentView;
import view.SnackView;
import view.TicketView;

import javax.swing.*;
import java.awt.*;
import java.sql.Timestamp;
import java.util.UUID;

public class CinePlexApp extends JFrame {

    private JPanel mainPanel;
    private CardLayout cardLayout;

    // Simulated Booking Session Data
    private Booking currentBooking;

    public CinePlexApp() {
        // Fallback for independent testing
        initializeMockBooking();
        initApp();
    }

    public CinePlexApp(Booking booking) {
        this.currentBooking = booking;
        initApp();
    }

    private void initApp() {
        setTitle("CinePlex - Checkout");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        
        // Apply global theme
        ThemeUtil.applyDarkTheme();

        // Initialize Layout
        cardLayout = new CardLayout();
        mainPanel = new JPanel(cardLayout);
        add(mainPanel);

        // Load Screens
        loadScreens();
    }

    private void initializeMockBooking() {
        currentBooking = new Booking();
        // Generate a random booking ID like BKG-1A2B3C
        currentBooking.setBookingId("BKG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        currentBooking.setUserId("USER_001"); // Matches the DB mock user
        currentBooking.setMovieName("Inception (Re-release)");
        currentBooking.setTheatreName("Screen 1 - IMAX");
        currentBooking.setShowTime(new Timestamp(System.currentTimeMillis() + 86400000)); // Tomorrow
        currentBooking.setSeats("F12, F13");
        currentBooking.setTotalAmount(600.00); // Base ticket price
    }

    private void loadScreens() {
        // Screen 1: Snacks
        SnackView snackView = new SnackView(currentBooking, () -> {
            // Callback to move to Payment
            showPaymentScreen();
        });
        
        mainPanel.add(snackView, "SNACKS");
        
        // Show Snacks first
        cardLayout.show(mainPanel, "SNACKS");
    }

    private void showPaymentScreen() {
        PaymentView paymentView = new PaymentView(currentBooking, () -> {
            // Callback to move to Ticket
            showTicketScreen();
        });
        mainPanel.add(paymentView, "PAYMENT");
        cardLayout.show(mainPanel, "PAYMENT");
    }

    private void showTicketScreen() {
        TicketView ticketView = new TicketView(currentBooking);
        mainPanel.add(ticketView, "TICKET");
        cardLayout.show(mainPanel, "TICKET");
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            CinePlexApp app = new CinePlexApp();
            app.setVisible(true);
        });
    }
}
