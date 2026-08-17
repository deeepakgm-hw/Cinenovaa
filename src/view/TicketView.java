package view;

import model.Booking;
import util.ThemeUtil;
import util.RoundedPanel;
import util.RoundedButton;
import util.NavigationManager;
import util.SessionManager;

import javax.swing.*;
import java.awt.*;
import java.text.SimpleDateFormat;

/**
 * Displays the confirmed e-ticket after a successful payment.
 * Fix: removed duplicate ThemeUtil import (was causing warnings).
 * Fix: "Back to Home" button now navigates to LoginView via NavigationManager
 *      instead of calling System.exit(0).
 */
public class TicketView extends JPanel {

    private Booking booking;

    public TicketView(Booking booking) {
        this.booking = booking;
        initUI();
    }

    private void initUI() {
        setLayout(new BorderLayout(20, 20));
        setBackground(ThemeUtil.BACKGROUND_DARK);
        setBorder(BorderFactory.createEmptyBorder(40, 60, 40, 60));

        RoundedPanel ticketPanel = new RoundedPanel(25, new BorderLayout());
        ticketPanel.setBackground(new Color(22, 22, 22));
        ticketPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(229, 9, 20), 2),
                BorderFactory.createEmptyBorder(8, 8, 8, 8)));

        // Ticket Header
        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setBackground(ThemeUtil.ACCENT_RED);
        headerPanel.setBorder(BorderFactory.createEmptyBorder(15, 15, 15, 15));

        JLabel lblTitle = new JLabel("CINEPLEX E-TICKET");
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 28));
        lblTitle.setForeground(Color.WHITE);
        lblTitle.setHorizontalAlignment(SwingConstants.CENTER);
        headerPanel.add(lblTitle, BorderLayout.CENTER);

        // Ticket Body
        JTextArea txtDetails = new JTextArea();
        txtDetails.setEditable(false);
        txtDetails.setFont(ThemeUtil.FONT_TICKET);
        txtDetails.setMargin(new Insets(20, 20, 20, 20));
        txtDetails.setBackground(new Color(22, 22, 22));
        txtDetails.setForeground(Color.WHITE);
        txtDetails.setCaretColor(Color.WHITE);

        StringBuilder sb = new StringBuilder();
        sb.append("BOOKING ID : ").append(nullSafe(booking.getBookingId())).append("\n\n");
        sb.append("MOVIE      : ").append(nullSafe(booking.getMovieName())).append("\n");
        sb.append("THEATRE    : ").append(nullSafe(booking.getTheatreName())).append("\n");

        if (booking.getShowTime() != null) {
            String showTime = new SimpleDateFormat("dd MMM yyyy, hh:mm a").format(booking.getShowTime());
            sb.append("SHOWTIME   : ").append(showTime).append("\n");
        } else {
            sb.append("SHOWTIME   : N/A\n");
        }

        sb.append("SEATS      : ").append(nullSafe(booking.getSeats())).append("\n\n");
        sb.append("STATUS     : ").append(nullSafe(booking.getBookingStatus())).append("\n");
        sb.append("TOTAL PAID : ₹").append(String.format("%.2f", booking.getTotalAmount())).append("\n");

        txtDetails.setText(sb.toString());

        ticketPanel.add(headerPanel, BorderLayout.NORTH);
        ticketPanel.add(txtDetails, BorderLayout.CENTER);

        // Footer
        JPanel footerPanel = new JPanel(new BorderLayout(10, 10));
        footerPanel.setBackground(ThemeUtil.BACKGROUND_DARK);

        JLabel lblFooter = new JLabel("A copy of this ticket has been saved to the 'tickets' folder.");
        lblFooter.setForeground(ThemeUtil.TEXT_SECONDARY);
        lblFooter.setHorizontalAlignment(SwingConstants.CENTER);

        RoundedButton btnHome = ThemeUtil.createSecondaryButton("Back to Home");
        btnHome.addActionListener(e -> {
            // Enforce full logout + clean navigation reset
            SessionManager.getInstance().clearSession();
            cineplex.util.SessionManager.getInstance().clearSession();

            Window currentWindow = SwingUtilities.getWindowAncestor(TicketView.this);
            if (currentWindow != null) {
                currentWindow.dispose();
            }

            NavigationManager.resetToLogin(new LoginView());
        });

        JPanel btnPanel = new JPanel();
        btnPanel.setBackground(ThemeUtil.BACKGROUND_DARK);
        btnPanel.add(btnHome);

        footerPanel.add(lblFooter, BorderLayout.NORTH);
        footerPanel.add(btnPanel, BorderLayout.CENTER);

        add(ticketPanel, BorderLayout.CENTER);
        add(footerPanel, BorderLayout.SOUTH);
    }

    /** Safely returns a placeholder if value is null. */
    private String nullSafe(String value) {
        return value != null ? value : "—";
    }
}
