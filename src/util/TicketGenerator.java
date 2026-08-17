package util;

import model.Booking;
import model.SnackOrder;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Generates a text-based e-ticket file after a successful booking.
 * Fix: replaced System.err.println/printStackTrace with proper Logger.
 */
public class TicketGenerator {
    private static final Logger LOG = Logger.getLogger(TicketGenerator.class.getName());
    private static final String TICKET_DIR = "tickets";

    public static boolean generateTicket(Booking booking, String paymentMethod, int loyaltyEarned) {
        File dir = new File(TICKET_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String filename = TICKET_DIR + File.separator
                + "Ticket_" + booking.getBookingId() + "_" + timestamp + ".txt";

        StringBuilder sb = new StringBuilder();
        sb.append("====================================\n");
        sb.append("        CINEPLEX E-TICKET           \n");
        sb.append("====================================\n\n");

        sb.append("Booking ID:     ").append(booking.getBookingId()).append("\n");
        sb.append("Movie:          ").append(booking.getMovieName()).append("\n");
        sb.append("Theatre:        ").append(booking.getTheatreName()).append("\n");

        if (booking.getShowTime() != null) {
            String showTimeStr = new SimpleDateFormat("dd MMM yyyy, hh:mm a").format(booking.getShowTime());
            sb.append("Showtime:       ").append(showTimeStr).append("\n");
        }

        sb.append("Seats:          ").append(booking.getSeats()).append("\n");

        sb.append("\n--- Snacks Ordered ---\n");
        if (booking.getSnackOrders() == null || booking.getSnackOrders().isEmpty()) {
            sb.append("None\n");
        } else {
            for (SnackOrder order : booking.getSnackOrders()) {
                String snackName = (order.getSnack() != null)
                        ? order.getSnack().getName()
                        : "Snack #" + order.getSnackId();
                sb.append(String.format("%-20s x%-2d  ₹%.2f\n",
                        snackName, order.getQuantity(), order.getTotalPrice()));
            }
        }

        sb.append("\n------------------------------------\n");
        sb.append("Total Paid:     ₹").append(String.format("%.2f", booking.getTotalAmount())).append("\n");
        sb.append("Payment Method: ").append(paymentMethod).append("\n");
        sb.append("Loyalty Earned: ").append(loyaltyEarned).append(" pts\n");

        String printDate = new SimpleDateFormat("dd MMM yyyy HH:mm:ss").format(new Date());
        sb.append("Date Printed:   ").append(printDate).append("\n");
        sb.append("====================================\n");
        sb.append("      Thank you for choosing        \n");
        sb.append("             CinePlex!              \n");
        sb.append("====================================\n");

        try (FileWriter writer = new FileWriter(filename)) {
            writer.write(sb.toString());
            LOG.info("Ticket generated: " + filename);
            return true;
        } catch (IOException e) {
            LOG.log(Level.SEVERE, "Failed to generate ticket file: " + filename, e);
            return false;
        }
    }
}
