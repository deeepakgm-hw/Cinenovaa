-- LEGACY SCHEMA FILE
-- Use `database/unified_schema.sql` (or `setup_db.bat`) for current CinePlex runtime.

CREATE DATABASE IF NOT EXISTS cineplex;
USE cineplex;

CREATE TABLE IF NOT EXISTS snacks (
    snack_id INT AUTO_INCREMENT PRIMARY KEY,
    snack_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    movie_name VARCHAR(100) NOT NULL,
    theatre_name VARCHAR(100) NOT NULL,
    show_time DATETIME NOT NULL,
    seats VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snack_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    snack_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (snack_id) REFERENCES snacks(snack_id)
);

CREATE TABLE IF NOT EXISTS wallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    loyalty_points INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    points_earned INT NOT NULL DEFAULT 0,
    points_redeemed INT NOT NULL DEFAULT 0,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
);

-- Insert sample snacks
INSERT IGNORE INTO snacks (snack_id, snack_name, category, price, available_quantity) VALUES 
(1, 'Large Popcorn', 'Popcorn', 250.00, 100),
(2, 'Medium Popcorn', 'Popcorn', 200.00, 100),
(3, 'Nachos with Salsa', 'Snack', 180.00, 50),
(4, 'Coke Large', 'Beverage', 120.00, 200),
(5, 'Cold Coffee', 'Beverage', 150.00, 100);

-- Insert sample wallet for a test user 'USER_001'
INSERT IGNORE INTO wallets (wallet_id, user_id, balance, loyalty_points) VALUES (1, 'USER_001', 1500.00, 120);
