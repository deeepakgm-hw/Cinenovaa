package util;

public class ValidationUtil {
    
    /**
     * Validates if a string is non-null and not empty.
     */
    public static boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }

    /**
     * Simulates UPI payment validation (dummy logic)
     */
    public static boolean isValidUPI(String upiId) {
        if (!isNotEmpty(upiId)) return false;
        return upiId.matches("^[a-zA-Z0-9.\\-_]+@[a-zA-Z]+$");
    }

    /**
     * Simulates Card payment validation (dummy logic)
     */
    public static boolean isValidCard(String cardNumber, String cvv, String expiry) {
        if (!isNotEmpty(cardNumber) || !isNotEmpty(cvv) || !isNotEmpty(expiry)) return false;
        
        // Very basic mock validation
        boolean validCard = cardNumber.replaceAll("\\s+", "").length() == 16;
        boolean validCvv = cvv.trim().length() == 3 || cvv.trim().length() == 4;
        boolean validExpiry = expiry.matches("^(0[1-9]|1[0-2])\\/?([0-9]{2})$");
        
        return validCard && validCvv && validExpiry;
    }
}
