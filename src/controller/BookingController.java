package controller;

import dao.BookingDAO;
import model.Booking;
import model.Payment;

public class BookingController {
    
    private BookingDAO bookingDAO;

    public BookingController() {
        this.bookingDAO = new BookingDAO();
    }

    /**
     * Attempts to process the complete booking transaction.
     * @param booking The booking details with snacks
     * @param payment The payment details
     * @param pointsEarned Loyalty points to add
     * @param pointsRedeemed Loyalty points to deduct
     * @return true if atomic transaction is successful, false otherwise
     */
    public boolean processBooking(Booking booking, Payment payment, int pointsEarned, int pointsRedeemed) {
        return bookingDAO.processBookingTransaction(booking, payment, pointsEarned, pointsRedeemed);
    }
}
