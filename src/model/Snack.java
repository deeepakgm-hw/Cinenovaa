package model;

/**
 * Model representing a snack item in the CinePlex application.
 * Aligned with unified_schema.sql: [id, name, description, price, stock_quantity]
 */
public class Snack {
    private int id;
    private String name;
    private String description;
    private double price;
    private int stockQuantity;

    public Snack() {}

    public Snack(int id, String name, String description, double price, int stockQuantity) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
    }

    // Standard Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) {
        if (price >= 0) {
            this.price = price;
        }
    }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) {
        if (stockQuantity >= 0) {
            this.stockQuantity = stockQuantity;
        }
    }

    // Compatibility Getters/Setters (to prevent breaking legacy controllers/views)
    public int getSnackId() { return id; }
    public void setSnackId(int id) { this.id = id; }
    public String getSnackName() { return name; }
    public void setSnackName(String name) { this.name = name; }
    public int getAvailableQuantity() { return stockQuantity; }
    public void setAvailableQuantity(int availableQuantity) { this.stockQuantity = availableQuantity; }
    public String getCategory() { return description; } // Mapping category to description for now
    public void setCategory(String category) { this.description = category; }

    @Override
    public String toString() {
        return name + " - ₹" + price + " (" + (stockQuantity > 0 ? "In Stock: " + stockQuantity : "Out of Stock") + ")";
    }

    /**
     * Validation logic for stock availability.
     */
    public boolean isAvailable(int requestedQuantity) {
        return stockQuantity >= requestedQuantity;
    }
}
