package controller;

import dao.WalletDAO;
import model.Wallet;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class PaymentController {
    private static final Logger LOG = Logger.getLogger(PaymentController.class.getName());
    private WalletDAO walletDAO;

    public PaymentController() {
        this.walletDAO = new WalletDAO();
    }

    /**
     * Fetches the user's wallet to check balance and loyalty points.
     */
    public Wallet getUserWallet(String userId) {
        try {
            return walletDAO.getWalletByUserId(userId);
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to retrieve wallet for user ID: " + userId, e);
            return null;
        }
    }

    /**
     * Calculates the required payment amount after applying loyalty discount.
     * 1 Loyalty Point = ₹1 Discount
     */
    public double calculateFinalAmount(double totalAmount, int pointsToRedeem) {
        double discount = pointsToRedeem; // 1 point = 1 rupee
        double finalAmount = totalAmount - discount;
        return finalAmount > 0 ? finalAmount : 0;
    }

    /**
     * Calculates points earned for the current transaction.
     * Earn 1 point per ₹100 spent.
     */
    public int calculatePointsEarned(double finalAmountPaid) {
        return (int) (finalAmountPaid / 100);
    }
}
