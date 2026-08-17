package model;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Booking {
    private String bookingId;
    private String userId;
    private int showtimeId;
    private String movieName;
    private String theatreName;
    private Timestamp showTime;
    private String seats; // e.g., "A1,A2"
    private double totalAmount;
    private String bookingStatus; // "PENDING", "CONFIRMED", "FAILED"
    private Timestamp createdAt;

    public int getShowtimeId() { return showtimeId; }
    public void setShowtimeId(int showtimeId) { this.showtimeId = showtimeId; }
    
    // Associations
    private List<SnackOrder> snackOrders;

    public Booking() {
        this.snackOrders = new ArrayList<>();
    }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getMovieName() { return movieName; }
    public void setMovieName(String movieName) { this.movieName = movieName; }

    public String getTheatreName() { return theatreName; }
    public void setTheatreName(String theatreName) { this.theatreName = theatreName; }

    public Timestamp getShowTime() { return showTime; }
    public void setShowTime(Timestamp showTime) { this.showTime = showTime; }

    public String getSeats() { return seats; }
    public void setSeats(String seats) { this.seats = seats; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public String getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(String bookingStatus) { this.bookingStatus = bookingStatus; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public List<SnackOrder> getSnackOrders() { return snackOrders; }
    public void setSnackOrders(List<SnackOrder> snackOrders) { this.snackOrders = snackOrders; }
    
    public void addSnackOrder(SnackOrder order) {
        this.snackOrders.add(order);
    }
}
