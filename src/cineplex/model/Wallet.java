package cineplex.model;

import java.io.Serializable;

public class Wallet implements Serializable {
    private int id;
    private int userId;
    private double balance;
    private int loyaltyPoints;

    public Wallet() {}

    public Wallet(int id, int userId, double balance, int loyaltyPoints) {
        this.id = id;
        this.userId = userId;
        this.balance = balance;
        this.loyaltyPoints = loyaltyPoints;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    
    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }
    
    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
}
