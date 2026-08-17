import cineplex.controller.AuthController;
import cineplex.dao.UserDAO;
import cineplex.model.User;
import dao.BookingDAO;
import model.Booking;
import model.Payment;
import model.SnackOrder;

public class DbValidationRun {
  public static void main(String[] args) {
    String uname = "user_" + System.currentTimeMillis();
    String email = uname + "@mail.com";
    String pass = "pass123";

    AuthController auth = new AuthController();
    boolean reg = auth.register(uname, pass, email);
    boolean login = auth.login(uname, pass);

    User created = new UserDAO().loginUser(uname, pass);
    int uid = created != null ? created.getId() : -1;

    Booking b = new Booking();
    b.setBookingId("BKG-VAL-" + System.currentTimeMillis());
    b.setUserId(String.valueOf(uid));
    b.setShowtimeId(1);
    b.setMovieName("Lee Cronin's The Mummy");
    b.setTheatreName("CinePlex Main");
    b.setShowTime(new java.sql.Timestamp(System.currentTimeMillis()));
    b.setSeats("Z" + (System.currentTimeMillis() % 1000) + ",Z" + (System.currentTimeMillis() % 1000 + 1));
    b.setTotalAmount(700.00);
    b.setBookingStatus("PENDING");

    SnackOrder so = new SnackOrder();
    so.setSnackId(1);
    so.setQuantity(1);
    so.setTotalPrice(250.00);
    b.addSnackOrder(so);
    b.setTotalAmount(950.00);

    Payment p = new Payment();
    p.setBookingId(b.getBookingId());
    p.setAmount(950.00);
    p.setPaymentMethod("UPI");
    p.setPaymentStatus("SUCCESS");

    boolean booked = new BookingDAO().processBookingTransaction(b, p, 9, 0);
    auth.logout();

    System.out.println("REGISTER=" + reg);
    System.out.println("LOGIN=" + login);
    System.out.println("USER_ID=" + uid);
    System.out.println("BOOKING_ID=" + b.getBookingId());
    System.out.println("BOOKED=" + booked);
  }
}
