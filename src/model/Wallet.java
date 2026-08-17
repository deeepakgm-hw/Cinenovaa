package model;

public class Wallet {
    private int walletId;
    private String userId;
    private double balance;
    private int loyaltyPoints;

    public Wallet() {
    }

    public Wallet(int walletId, String userId, double balance, int loyaltyPoints) {
        this.walletId = walletId;
        this.userId = userId;
        this.balance = balance;
        this.loyaltyPoints = loyaltyPoints;
    }

    public int getWalletId() { return walletId; }
    public void setWalletId(int walletId) { this.walletId = walletId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
}
