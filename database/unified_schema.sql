-- CinePlex Unified Database Schema
-- Standardized for consistent naming and relational integrity

CREATE DATABASE IF NOT EXISTS cineplex_db;
USE cineplex_db;

-- 1. User Management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'USER') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1b. OTP Verification
CREATE TABLE IF NOT EXISTS otp_verification (
    email VARCHAR(100) PRIMARY KEY,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- 2. Wallet & Loyalty (Naming standardized to 'wallet')
CREATE TABLE IF NOT EXISTS wallet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    loyalty_points INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    points_earned INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallet(id) ON DELETE CASCADE
);

-- 3. Movie & Theatre Management
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    duration INT,
    genre VARCHAR(100),
    language VARCHAR(50) DEFAULT 'English',
    release_date DATE,
    poster_url VARCHAR(255),
    rating VARCHAR(10) DEFAULT 'PG-13',
    status VARCHAR(30) DEFAULT 'NOW_SHOWING',
    cast_members TEXT,
    trailer_url VARCHAR(255),
    movie_api_id VARCHAR(50) DEFAULT NULL,
    backdrop_url VARCHAR(255) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS theatres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city_id INT NOT NULL,
    location VARCHAR(200) NOT NULL,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    theatre_id INT NOT NULL,
    screen_name VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL,
    FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE CASCADE
);

-- 4. Showtimes & Seats
CREATE TABLE IF NOT EXISTS showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    show_time DATETIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screen_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_type ENUM('STANDARD', 'PREMIUM', 'VIP') DEFAULT 'STANDARD',
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seat_locks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Bookings & Payments
CREATE TABLE IF NOT EXISTS group_booking_sessions (
    id VARCHAR(36) PRIMARY KEY,
    showtime_id INT NOT NULL,
    organiser_user_id INT NOT NULL,
    session_code VARCHAR(6) NOT NULL UNIQUE,
    participant_ids JSON,
    participant_cursors JSON,
    status VARCHAR(20) DEFAULT 'active',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (organiser_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(50) PRIMARY KEY, -- Using VARCHAR for generated IDs (e.g., BKG-123)
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    movie_name VARCHAR(100), -- Redundant but cached for performance
    theatre_name VARCHAR(100), -- Redundant but cached for performance
    show_time DATETIME, -- Redundant but cached for performance
    seats VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'PENDING',
    group_session_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id),
    FOREIGN KEY (group_session_id) REFERENCES group_booking_sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 6. Snacks & Concessions
CREATE TABLE IF NOT EXISTS snacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS snack_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    snack_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (snack_id) REFERENCES snacks(id) ON DELETE CASCADE
);

-- 7. Admin & Logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action TEXT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Live Activity Tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_history (
    ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    movie_name VARCHAR(100) NOT NULL,
    seats VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_history (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id VARCHAR(50) NULL,
    transaction_type VARCHAR(40) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    transaction_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
);

-- 9. Upcoming Movie Engagement
CREATE TABLE IF NOT EXISTS upcoming_movies (
    upcoming_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_name VARCHAR(150) NOT NULL,
    teaser_description TEXT,
    expected_release_date DATE,
    poster_url VARCHAR(255),
    trailer_url VARCHAR(255),
    notify_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'COMING_SOON'
);

CREATE TABLE IF NOT EXISTS upcoming_movie_interest (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    upcoming_id INT NOT NULL,
    interested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_upcoming_interest (user_id, upcoming_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (upcoming_id) REFERENCES upcoming_movies(upcoming_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_movie_title ON movies(title);
CREATE INDEX idx_showtime_movie ON showtimes(movie_id);
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_user_sessions_user_status ON user_sessions(user_id, status);
CREATE INDEX idx_transaction_history_user_time ON transaction_history(user_id, transaction_time);
CREATE INDEX idx_ticket_history_user_time ON ticket_history(user_id, booking_time);
CREATE INDEX idx_seat_locks_showtime_seat_status ON seat_locks(showtime_id, seat_number, status);
CREATE INDEX idx_upcoming_status_notify ON upcoming_movies(status, notify_count);

-- Sample Data
INSERT IGNORE INTO users (id, username, password, email, role) VALUES 
(1, 'admin', 'admin123', 'admin@cineplex.com', 'ADMIN'),
(2, 'johndoe', 'password123', 'john@example.com', 'USER');

INSERT IGNORE INTO wallet (id, user_id, balance, loyalty_points) VALUES 
(1, 1, 1000.00, 500),
(2, 2, 1000.00, 100);




-- Sample Cities
INSERT IGNORE INTO cities (id, name) VALUES 
(1, 'Bangalore'),
(2, 'Mumbai'),
(3, 'Delhi');

-- Sample Theatres
INSERT IGNORE INTO theatres (id, name, city_id, location) VALUES 
(1, 'PVR Orion', 1, 'Orion Mall, Bangalore'),
(2, 'INOX Forum', 1, 'Forum Mall, Bangalore'),
(3, 'Cinepolis Andheri', 2, 'Andheri West, Mumbai'),
(4, 'PVR Plaza Connaught Place', 3, 'Connaught Place, Delhi');

-- Sample Screens
INSERT IGNORE INTO screens (id, theatre_id, screen_name, total_seats) VALUES 
(1, 1, 'Screen 1', 60),
(2, 1, 'Screen 2', 60),
(3, 2, 'Screen 1', 60),
(4, 2, 'Screen 2', 60),
(5, 3, 'Screen 1', 60),
(6, 3, 'Screen 2', 60),
(7, 4, 'Screen 1', 60);




INSERT IGNORE INTO snacks (id, name, category, price, stock_quantity) VALUES 
(1, 'Large Popcorn', 'Popcorn', 250.00, 100),
(2, 'Nachos', 'Snack', 180.00, 50),
(3, 'Coke Large', 'Beverage', 120.00, 200);


