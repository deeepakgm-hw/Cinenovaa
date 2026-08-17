package model;

public class SnackOrder {
    private int orderId;
    private String bookingId;
    private int snackId;
    private int quantity;
    private double totalPrice;
    
    // Additional transient field for UI display convenience
    private Snack snack;

    public SnackOrder() {
    }

    public SnackOrder(int orderId, String bookingId, int snackId, int quantity, double totalPrice) {
        this.orderId = orderId;
        this.bookingId = bookingId;
        this.snackId = snackId;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public int getSnackId() {
        return snackId;
    }

    public void setSnackId(int snackId) {
        this.snackId = snackId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public Snack getSnack() {
        return snack;
    }

    public void setSnack(Snack snack) {
        this.snack = snack;
        if(snack != null) {
            this.snackId = snack.getSnackId();
        }
    }
}
