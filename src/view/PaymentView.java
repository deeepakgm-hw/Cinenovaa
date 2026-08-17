package view;

import controller.BookingController;
import controller.PaymentController;
import model.Booking;
import model.Payment;
import model.Wallet;
import util.RoundedButton;
import util.RoundedPanel;
import util.ThemeUtil;
import util.NavigationManager;
import util.TicketGenerator;

import javax.swing.*;
import javax.swing.border.TitledBorder;
import java.awt.*;
import java.sql.Timestamp;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Payment screen — allows the user to choose a payment method, optionally redeem
 * loyalty points, and confirm the booking.
 *
 * FIXES:
 * 1. DB work moved off the EDT using SwingWorker — prevents UI freeze.
 * 2. On success: TicketGenerator.generateTicket() is called, then navigates to TicketView.
 * 3. Confirm button is disabled during processing to prevent duplicate submits.
 * 4. Null-safe wallet handling.
 */
public class PaymentView extends JPanel {
    private static final Logger LOG = Logger.getLogger(PaymentView.class.getName());

    private Booking currentBooking;
    private PaymentController paymentController;
    private BookingController bookingController;
    private Wallet userWallet;

    private double initialTotalAmount;
    private double finalAmount;
    private int pointsToRedeem = 0;

    private JLabel lblFinalAmount;
    private JLabel lblWalletBalance;
    private JLabel lblLoyaltyPoints;
    private JCheckBox chkRedeem;
    private JComboBox<String> cmbPaymentMethod;
    private RoundedButton btnPay;

    private Runnable onSuccess;

    public PaymentView(Booking booking, Runnable onSuccess) {
        this.currentBooking = booking;
        this.onSuccess = onSuccess;
        this.paymentController = new PaymentController();
        this.bookingController = new BookingController();

        this.initialTotalAmount = booking.getTotalAmount();
        this.finalAmount = initialTotalAmount;

        // Fetch wallet (null-safe)
        this.userWallet = paymentController.getUserWallet(booking.getUserId());

        initUI();
    }

    private void initUI() {
        setLayout(new BorderLayout(20, 20));
        setBackground(ThemeUtil.BACKGROUND_DARK);
        setBorder(BorderFactory.createEmptyBorder(30, 30, 30, 30));

        // Header
        JLabel headerLabel = new JLabel("Checkout & Payment");
        headerLabel.setFont(ThemeUtil.FONT_HEADER);
        headerLabel.setForeground(ThemeUtil.ACCENT_GOLD);
        headerLabel.setHorizontalAlignment(SwingConstants.CENTER);
        add(headerLabel, BorderLayout.NORTH);

        // Center
        JPanel centerPanel = new JPanel(new GridLayout(1, 2, 30, 0));
        centerPanel.setBackground(ThemeUtil.BACKGROUND_DARK);

        // --- Left: Order Summary ---
        RoundedPanel summaryPanel = new RoundedPanel(20, new GridLayout(5, 1, 10, 10));
        summaryPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        TitledBorder tb1 = BorderFactory.createTitledBorder(
                BorderFactory.createLineBorder(ThemeUtil.TEXT_SECONDARY), "Order Summary");
        tb1.setTitleColor(ThemeUtil.TEXT_PRIMARY);
        summaryPanel.setBorder(BorderFactory.createCompoundBorder(tb1, BorderFactory.createEmptyBorder(15, 15, 15, 15)));

        summaryPanel.add(createSummaryRow("Movie:", nullSafe(currentBooking.getMovieName())));
        summaryPanel.add(createSummaryRow("Seats:", nullSafe(currentBooking.getSeats())));
        summaryPanel.add(createSummaryRow("Subtotal:", String.format("₹%.2f", initialTotalAmount)));

        chkRedeem = new JCheckBox("Redeem Loyalty Points");
        chkRedeem.setBackground(ThemeUtil.PANEL_BACKGROUND);
        chkRedeem.setForeground(ThemeUtil.TEXT_PRIMARY);
        chkRedeem.setFocusPainted(false);
        if (userWallet == null || userWallet.getLoyaltyPoints() < 50) {
            chkRedeem.setEnabled(false);
            chkRedeem.setToolTipText("Minimum 50 points required to redeem.");
        }
        chkRedeem.addActionListener(e -> updateCalculations());
        summaryPanel.add(chkRedeem);

        // --- Right: Payment Options ---
        RoundedPanel paymentPanel = new RoundedPanel(20, new GridLayout(5, 1, 10, 10));
        paymentPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        TitledBorder tb2 = BorderFactory.createTitledBorder(
                BorderFactory.createLineBorder(ThemeUtil.TEXT_SECONDARY), "Payment Details");
        tb2.setTitleColor(ThemeUtil.TEXT_PRIMARY);
        paymentPanel.setBorder(BorderFactory.createCompoundBorder(tb2, BorderFactory.createEmptyBorder(15, 15, 15, 15)));

        String wBalance = userWallet != null ? String.format("₹%.2f", userWallet.getBalance()) : "₹0.00";
        String lPoints = userWallet != null ? String.valueOf(userWallet.getLoyaltyPoints()) : "0";

        lblWalletBalance = new JLabel("Wallet Balance: " + wBalance);
        lblLoyaltyPoints = new JLabel("Available Points: " + lPoints);
        lblWalletBalance.setForeground(ThemeUtil.TEXT_SECONDARY);
        lblLoyaltyPoints.setForeground(ThemeUtil.TEXT_SECONDARY);

        paymentPanel.add(lblWalletBalance);
        paymentPanel.add(lblLoyaltyPoints);

        JPanel comboPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        comboPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        comboPanel.add(new JLabel("Method: "));
        cmbPaymentMethod = new JComboBox<>(new String[]{"WALLET", "CARD", "UPI"});
        cmbPaymentMethod.setBackground(new Color(35, 35, 35));
        cmbPaymentMethod.setForeground(ThemeUtil.TEXT_PRIMARY);
        cmbPaymentMethod.setFont(ThemeUtil.FONT_REGULAR);
        cmbPaymentMethod.setBorder(BorderFactory.createEmptyBorder(6, 8, 6, 8));
        comboPanel.add(cmbPaymentMethod);
        paymentPanel.add(comboPanel);

        lblFinalAmount = new JLabel(String.format("Final Pay: ₹%.2f", finalAmount));
        lblFinalAmount.setFont(ThemeUtil.FONT_SUBHEADER);
        lblFinalAmount.setForeground(ThemeUtil.ACCENT_RED);
        paymentPanel.add(lblFinalAmount);

        centerPanel.add(summaryPanel);
        centerPanel.add(paymentPanel);
        add(centerPanel, BorderLayout.CENTER);

        // Bottom Action
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        bottomPanel.setBackground(ThemeUtil.BACKGROUND_DARK);

        btnPay = ThemeUtil.createPrimaryButton("Confirm Payment");
        btnPay.setFont(ThemeUtil.FONT_SUBHEADER);
        btnPay.setBorder(BorderFactory.createEmptyBorder(12, 20, 12, 20));
        btnPay.addActionListener(e -> processPayment());
        bottomPanel.add(btnPay);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JPanel createSummaryRow(String label, String value) {
        JPanel p = new JPanel(new BorderLayout());
        p.setBackground(ThemeUtil.PANEL_BACKGROUND);
        JLabel l = new JLabel(label);
        l.setForeground(ThemeUtil.TEXT_SECONDARY);
        JLabel v = new JLabel(value);
        v.setForeground(ThemeUtil.TEXT_PRIMARY);
        v.setFont(ThemeUtil.FONT_REGULAR);
        p.add(l, BorderLayout.WEST);
        p.add(v, BorderLayout.EAST);
        return p;
    }

    private void updateCalculations() {
        if (chkRedeem.isSelected() && userWallet != null) {
            pointsToRedeem = userWallet.getLoyaltyPoints();
            finalAmount = paymentController.calculateFinalAmount(initialTotalAmount, pointsToRedeem);
        } else {
            pointsToRedeem = 0;
            finalAmount = initialTotalAmount;
        }
        lblFinalAmount.setText(String.format("Final Pay: ₹%.2f", finalAmount));
    }

    private void processPayment() {
        String method = (String) cmbPaymentMethod.getSelectedItem();

        if ("WALLET".equals(method)) {
            if (userWallet == null || userWallet.getBalance() < finalAmount) {
                JOptionPane.showMessageDialog(this,
                    "Insufficient Wallet Balance!\nRequired: ₹" + String.format("%.2f", finalAmount)
                    + (userWallet != null ? "\nAvailable: ₹" + String.format("%.2f", userWallet.getBalance()) : ""),
                    "Payment Failed", JOptionPane.ERROR_MESSAGE);
                return;
            }
        }

        // Disable button to prevent double-submit
        btnPay.setEnabled(false);
        btnPay.setText("Processing...");

        // Run DB transaction OFF the Event Dispatch Thread using SwingWorker
        SwingWorker<Boolean, Void> worker = new SwingWorker<>() {
            private int pointsEarned;

            @Override
            protected Boolean doInBackground() {
                pointsEarned = paymentController.calculatePointsEarned(finalAmount);

                Payment payment = new Payment();
                payment.setBookingId(currentBooking.getBookingId());
                payment.setAmount(finalAmount);
                payment.setPaymentMethod(method);
                payment.setPaymentStatus("SUCCESS");

                return bookingController.processBooking(currentBooking, payment, pointsEarned, pointsToRedeem);
            }

            @Override
            protected void done() {
                try {
                    boolean success = get();
                    if (success) {
                        int pointsEarnedFinal = pointsEarned;
                        // Generate physical ticket file
                        TicketGenerator.generateTicket(currentBooking, method, pointsEarnedFinal);

                        // Mark booking confirmed in model
                        currentBooking.setBookingStatus("CONFIRMED");

                        JOptionPane.showMessageDialog(PaymentView.this,
                            "Payment Successful!\nYour tickets are confirmed.",
                            "Success", JOptionPane.INFORMATION_MESSAGE);

                        // In embedded checkout flow (main.CinePlexApp), defer navigation to callback.
                        // Otherwise, fallback to NavigationManager for standalone panel flow.
                        if (onSuccess != null) {
                            onSuccess.run();
                        } else {
                            NavigationManager.navigateTo(new TicketView(currentBooking), "TICKET");
                        }
                    } else {
                        JOptionPane.showMessageDialog(PaymentView.this,
                            "Transaction Failed. Please try again.",
                            "Error", JOptionPane.ERROR_MESSAGE);
                        btnPay.setEnabled(true);
                        btnPay.setText("Confirm Payment");
                    }
                } catch (Exception ex) {
                    LOG.log(Level.SEVERE, "Payment processing error", ex);
                    JOptionPane.showMessageDialog(PaymentView.this,
                        "An unexpected error occurred:\n" + ex.getMessage(),
                        "Error", JOptionPane.ERROR_MESSAGE);
                    btnPay.setEnabled(true);
                    btnPay.setText("Confirm Payment");
                }
            }
        };
        worker.execute();
    }

    private String nullSafe(String value) {
        return value != null ? value : "—";
    }
}
