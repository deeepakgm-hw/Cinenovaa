import controller.BookingController;
import model.Booking;
import model.Payment;
import model.SnackOrder;
import util.SessionManager;

public class FlowSimulation {
  public static void main(String[] args) {
    SessionManager sm = SessionManager.getInstance();
    sm.login(2, "johndoe", "USER");

    Booking booking = new Booking();
    booking.setBookingId("BKG-SIM-" + System.currentTimeMillis());
    booking.setUserId("2");
    booking.setShowtimeId(1);
    booking.setMovieName("Inception");
    booking.setTheatreName("CinePlex Main");
    booking.setShowTime(new java.sql.Timestamp(System.currentTimeMillis()));
    booking.setSeats("A1,A2");
    booking.setBookingStatus("PENDING");

    SnackOrder snack = new SnackOrder();
    snack.setSnackId(1);
    snack.setQuantity(1);
    snack.setTotalPrice(250.00);
    booking.addSnackOrder(snack);

    booking.setTotalAmount(950.00);

    Payment payment = new Payment();
    payment.setPaymentMethod("UPI");
    payment.setPaymentStatus("SUCCESS");
    payment.setAmount(950.00);

    boolean ok = new BookingController().processBooking(booking, payment, 9, 0);
    System.out.println("BOOKING_OK=" + ok);
    System.out.println("SESSION_ID=" + sm.getCurrentSessionId());
    System.out.println("ACTIVE_USERS=" + sm.getActiveUserCount());

    sm.logout();
    System.out.println("ACTIVE_USERS_AFTER_LOGOUT=" + sm.getActiveUserCount());
  }
}
