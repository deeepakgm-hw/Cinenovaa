package util;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import dao.BookingDAO;
import dao.MovieDAO;
import dao.ShowtimeDAO;
import dao.WalletDAO;
import model.Booking;
import model.Payment;
import model.SnackOrder;
import model.Movie;
import service.OTPService;
import service.EmailService;
import java.util.Properties;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Embedded REST API Server for the CinePlex Web Frontend.
 * Listens on port 8080.
 * Implements CORS, JSON Parsing, and core REST APIs.
 */
public class ApiServer {
    private static HttpServer server;
    private static final int PORT = 8082;

    public static void startServer() {
        try {
            server = HttpServer.create(new InetSocketAddress(PORT), 0);
            server.createContext("/api", new ApiHandler());
            server.setExecutor(Executors.newFixedThreadPool(10));
            server.start();
            System.out.println("[API SERVER] REST API Server running on http://localhost:" + PORT + "/api");
        } catch (IOException e) {
            System.err.println("[API SERVER ERROR] Failed to start server: " + e.getMessage());
        }
    }

    public static void stopServer() {
        if (server != null) {
            server.stop(0);
            System.out.println("[API SERVER] REST API Server stopped.");
        }
    }

    private static class ApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Apply CORS headers to all responses
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");

            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            System.out.println("[API SERVER LOG] " + method + " " + path);

            try {
                if (path.startsWith("/api/auth/otp/send") && "POST".equalsIgnoreCase(method)) {
                    handleSendOTP(exchange);
                } else if (path.startsWith("/api/auth/otp/verify") && "POST".equalsIgnoreCase(method)) {
                    handleVerifyOTP(exchange);
                } else if (path.startsWith("/api/cities") && "GET".equalsIgnoreCase(method)) {
                    handleGetCities(exchange);
                } else if (path.startsWith("/api/theatres") && "GET".equalsIgnoreCase(method)) {
                    handleGetTheatres(exchange);
                } else if (path.startsWith("/api/movies/upcoming") && "GET".equalsIgnoreCase(method)) {
                    handleGetUpcomingMovies(exchange);
                } else if (path.startsWith("/api/movies/search") && "GET".equalsIgnoreCase(method)) {
                    handleSearchMovies(exchange);
                } else if (path.startsWith("/api/movies") && "GET".equalsIgnoreCase(method)) {
                    handleGetMovies(exchange);
                } else if (path.matches("/api/showtimes/\\d+/seats") && "GET".equalsIgnoreCase(method)) {
                    handleGetSeats(exchange);
                } else if (path.startsWith("/api/showtimes") && "GET".equalsIgnoreCase(method)) {
                    handleGetShowtimes(exchange);
                } else if (path.startsWith("/api/seats/lock") && "POST".equalsIgnoreCase(method)) {
                    handleLockSeats(exchange);
                } else if (path.startsWith("/api/payments/confirm") && "POST".equalsIgnoreCase(method)) {
                    handleConfirmPayment(exchange);
                } else if (path.startsWith("/api/analytics/summary") && "GET".equalsIgnoreCase(method)) {
                    handleGetAnalytics(exchange);
                } else if (path.startsWith("/api/status") && "GET".equalsIgnoreCase(method)) {
                    handleGetStatus(exchange);
                } else if (path.startsWith("/api/admin/city") && "POST".equalsIgnoreCase(method)) {
                    handleAddCity(exchange);
                } else if (path.startsWith("/api/admin/theatre") && "POST".equalsIgnoreCase(method)) {
                    handleAddTheatre(exchange);
                } else if (path.startsWith("/api/admin/screen") && "POST".equalsIgnoreCase(method)) {
                    handleAddScreen(exchange);
                } else if (path.startsWith("/api/admin/showtime") && "POST".equalsIgnoreCase(method)) {
                    handleAddShowtime(exchange);
                } else {
                    sendResponse(exchange, 404, "{\"error\": \"Route not found\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error: " + e.getMessage() + "\"}");
            }
        }

        // ==========================================
        // HANDLERS
        // ==========================================

        private void handleSendOTP(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String email = getJsonValue(body, "email");

            if (email == null || email.trim().isEmpty() || !email.contains("@")) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Valid email is required\"}");
                return;
            }

            boolean sent = OTPService.generateAndSendOTP(email);
            if (sent) {
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"OTP sent successfully\"}");
            } else {
                sendResponse(exchange, 500, "{\"success\": false, \"message\": \"Failed to generate and send OTP\"}");
            }
        }

        private void handleVerifyOTP(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String email = getJsonValue(body, "email");
            String otp = getJsonValue(body, "otp");

            if (email == null || otp == null || email.trim().isEmpty() || otp.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Email and OTP code are required\"}");
                return;
            }

            boolean verified = OTPService.verifyOTP(email, otp);
            if (!verified) {
                sendResponse(exchange, 401, "{\"success\": false, \"message\": \"Invalid or expired OTP code\"}");
                return;
            }

            // OTP verified successfully. Now, load or register user in users table.
            int userId = -1;
            String username = email.split("@")[0];
            String role = "USER";

            // If the username is "admin", let them login as ADMIN
            if ("admin".equalsIgnoreCase(username)) {
                role = "ADMIN";
            }

            try (Connection conn = DatabaseConnection.getConnection()) {
                // Check if user exists by email
                String checkSql = "SELECT id, username, role FROM users WHERE email = ?";
                try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                    checkStmt.setString(1, email);
                    try (ResultSet rs = checkStmt.executeQuery()) {
                        if (rs.next()) {
                            userId = rs.getInt("id");
                            username = rs.getString("username");
                            role = rs.getString("role");
                        }
                    }
                }

                // If user does not exist, insert new user record
                if (userId == -1) {
                    String insertSql = "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)";
                    try (PreparedStatement insertStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                        insertStmt.setString(1, username);
                        insertStmt.setString(2, "OTP_USER"); // Dummy password
                        insertStmt.setString(3, email);
                        insertStmt.setString(4, role);
                        insertStmt.executeUpdate();

                        try (ResultSet generatedKeys = insertStmt.getGeneratedKeys()) {
                            if (generatedKeys.next()) {
                                userId = generatedKeys.getInt(1);
                            }
                        }
                    }

                    // Create dynamic wallet for new user
                    String walletSql = "INSERT INTO wallet (user_id, balance, loyalty_points) VALUES (?, ?, ?)";
                    try (PreparedStatement walletStmt = conn.prepareStatement(walletSql)) {
                        walletStmt.setInt(1, userId);
                        walletStmt.setDouble(2, 100.00); // 100.00 initial balance
                        walletStmt.setInt(3, 50); // 50 initial loyalty points
                        walletStmt.executeUpdate();
                    }
                }
            }

            // Create session ID
            String sessionId = "SES-" + Long.toHexString(System.currentTimeMillis()).toUpperCase();

            // Insert into user_sessions table
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sessionSql = "INSERT INTO user_sessions (session_id, user_id, username, status) VALUES (?, ?, ?, 'ACTIVE')";
                try (PreparedStatement sessionStmt = conn.prepareStatement(sessionSql)) {
                    sessionStmt.setString(1, sessionId);
                    sessionStmt.setInt(2, userId);
                    sessionStmt.setString(3, username);
                    sessionStmt.executeUpdate();
                }
            }

            // Return user details and session ID
            String userJson = String.format(
                "{\"success\": true, \"sessionId\": \"%s\", \"user\": {\"id\": %d, \"username\": \"%s\", \"email\": \"%s\", \"role\": \"%s\"}}",
                sessionId, userId, username, email, role
            );
            sendResponse(exchange, 200, userJson);
        }

        private void handleGetMovies(HttpExchange exchange) throws Exception {
            String queryParams = exchange.getRequestURI().getQuery();
            String cityIdStr = getQueryParam(queryParams, "cityId");
            
            List<String> list = new ArrayList<>();
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql;
                boolean hasCity = cityIdStr != null && !cityIdStr.isEmpty();
                if (hasCity) {
                    sql = "SELECT DISTINCT m.* FROM movies m " +
                          "JOIN showtimes s ON m.id = s.movie_id " +
                          "JOIN screens sc ON s.screen_id = sc.id " +
                          "JOIN theatres t ON sc.theatre_id = t.id " +
                          "WHERE t.city_id = ? AND m.status = 'NOW_SHOWING'";
                } else {
                    sql = "SELECT * FROM movies WHERE status = 'NOW_SHOWING'";
                }
                
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    if (hasCity) {
                        stmt.setInt(1, Integer.parseInt(cityIdStr));
                    }
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            list.add(String.format(
                                "{\"id\": %d, \"title\": \"%s\", \"description\": \"%s\", \"duration\": %d, \"genre\": \"%s\", \"language\": \"%s\", \"release_date\": \"%s\", \"poster_url\": \"%s\", \"rating\": \"%s\", \"status\": \"%s\", \"cast\": \"%s\", \"trailer_url\": \"%s\"}",
                                rs.getInt("id"),
                                escapeJson(rs.getString("title")),
                                escapeJson(rs.getString("description")),
                                rs.getInt("duration"),
                                rs.getString("genre"),
                                escapeJson(rs.getString("language")),
                                rs.getDate("release_date"),
                                rs.getString("poster_url"),
                                escapeJson(rs.getString("rating")),
                                escapeJson(rs.getString("status")),
                                escapeJson(rs.getString("cast_members")),
                                escapeJson(rs.getString("trailer_url"))
                            ));
                        }
                    }
                }
            }
            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }

        private void handleGetUpcomingMovies(HttpExchange exchange) throws Exception {
            List<String> list = new ArrayList<>();
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT * FROM movies WHERE status = 'COMING_SOON'";
                try (PreparedStatement stmt = conn.prepareStatement(sql);
                     ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        list.add(String.format(
                            "{\"id\": %d, \"title\": \"%s\", \"description\": \"%s\", \"release_date\": \"%s\", \"poster_url\": \"%s\", \"trailer_url\": \"%s\", \"notify_count\": %d}",
                            rs.getInt("id"),
                            escapeJson(rs.getString("title")),
                            escapeJson(rs.getString("description")),
                            rs.getDate("release_date"),
                            rs.getString("poster_url"),
                            rs.getString("trailer_url"),
                            0
                        ));
                    }
                }
            }
            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }

        private void handleSearchMovies(HttpExchange exchange) throws Exception {
            String queryParams = exchange.getRequestURI().getQuery();
            String queryStr = getQueryParam(queryParams, "query");
            if (queryStr == null) {
                queryStr = "";
            } else {
                queryStr = java.net.URLDecoder.decode(queryStr, StandardCharsets.UTF_8.name());
            }

            List<Movie> results = service.MovieApiService.searchMovies(queryStr);
            List<String> list = new ArrayList<>();
            for (Movie m : results) {
                list.add(String.format(
                    "{\"id\": %d, \"title\": \"%s\", \"description\": \"%s\", \"duration\": %d, \"genre\": \"%s\", \"language\": \"%s\", \"release_date\": \"%s\", \"poster_url\": \"%s\", \"rating\": \"%s\", \"status\": \"%s\", \"cast\": \"%s\", \"trailer_url\": \"%s\", \"movieApiId\": \"%s\"}",
                    m.getMovieId(),
                    escapeJson(m.getTitle()),
                    escapeJson(m.getDescription()),
                    m.getDuration(),
                    escapeJson(m.getGenre()),
                    escapeJson(m.getLanguage()),
                    m.getReleaseDate() != null ? m.getReleaseDate().toString() : "",
                    escapeJson(m.getPosterUrl()),
                    escapeJson(m.getRating()),
                    escapeJson(m.getStatus()),
                    escapeJson(m.getCastMembers()),
                    escapeJson(m.getTrailerUrl()),
                    escapeJson(m.getMovieApiId() != null ? m.getMovieApiId() : "")
                ));
            }
            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }


        private void handleGetShowtimes(HttpExchange exchange) throws Exception {
            String queryParams = exchange.getRequestURI().getQuery();
            String movieIdStr = getQueryParam(queryParams, "movieId");
            String theatreIdStr = getQueryParam(queryParams, "theatreId");
            
            if (movieIdStr == null || movieIdStr.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"movieId parameter is required\"}");
                return;
            }

            int movieId = Integer.parseInt(movieIdStr);
            boolean hasTheatre = theatreIdStr != null && !theatreIdStr.isEmpty();
            List<String> list = new ArrayList<>();

            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT s.id, s.show_time, s.price, scr.screen_name AS screen_name, t.name AS theatre_name, t.id AS theatre_id " +
                             "FROM showtimes s " +
                             "JOIN screens scr ON s.screen_id = scr.id " +
                             "JOIN theatres t ON scr.theatre_id = t.id " +
                             "WHERE s.movie_id = ?" + (hasTheatre ? " AND t.id = ?" : "");
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, movieId);
                    if (hasTheatre) {
                        stmt.setInt(2, Integer.parseInt(theatreIdStr));
                    }
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            list.add(String.format(
                                "{\"id\": %d, \"showTime\": \"%s\", \"price\": %.2f, \"screenName\": \"%s\", \"theatreName\": \"%s\", \"theatreId\": %d}",
                                rs.getInt("id"),
                                rs.getTimestamp("show_time").toString(),
                                rs.getDouble("price"),
                                rs.getString("screen_name"),
                                rs.getString("theatre_name"),
                                rs.getInt("theatre_id")
                            ));
                        }
                    }
                }
            }
            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }

        private void handleGetSeats(HttpExchange exchange) throws Exception {
            String path = exchange.getRequestURI().getPath();
            Pattern p = Pattern.compile("/api/showtimes/(\\d+)/seats");
            Matcher m = p.matcher(path);
            if (!m.find()) {
                sendResponse(exchange, 400, "{\"error\": \"Invalid showtime ID path\"}");
                return;
            }

            int showtimeId = Integer.parseInt(m.group(1));

            // Fetch showtime details
            double basePrice = 250.0;
            int totalSeats = 60;
            try (Connection conn = DatabaseConnection.getConnection()) {
                String showtimeSql = "SELECT s.price, scr.total_seats FROM showtimes s JOIN screens scr ON s.screen_id = scr.id WHERE s.id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(showtimeSql)) {
                    stmt.setInt(1, showtimeId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            basePrice = rs.getDouble("price");
                            totalSeats = rs.getInt("total_seats");
                        }
                    }
                }
            }

            // Get booked seats for this showtime
            Set<String> bookedSeats = new HashSet<>();
            try (Connection conn = DatabaseConnection.getConnection()) {
                String bookingsSql = "SELECT seats FROM bookings WHERE showtime_id = ? AND booking_status = 'CONFIRMED'";
                try (PreparedStatement stmt = conn.prepareStatement(bookingsSql)) {
                    stmt.setInt(1, showtimeId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            String seatsStr = rs.getString("seats");
                            if (seatsStr != null) {
                                for (String seat : seatsStr.split(",")) {
                                    bookedSeats.add(seat.trim());
                                }
                            }
                        }
                    }
                }
            }

            // Get locked seats
            Set<String> lockedSeats = new HashSet<>();
            try (Connection conn = DatabaseConnection.getConnection()) {
                String locksSql = "SELECT seat_number FROM seat_locks WHERE showtime_id = ? AND expires_at > NOW() AND status = 'LOCKED'";
                try (PreparedStatement stmt = conn.prepareStatement(locksSql)) {
                    stmt.setInt(1, showtimeId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            lockedSeats.add(rs.getString("seat_number").trim());
                        }
                    }
                }
            }

            // Generate seat layout dynamically: rows A to F, columns 1 to 10
            List<String> list = new ArrayList<>();
            int rows = (int) Math.ceil((double) totalSeats / 10);
            for (int r = 0; r < rows; r++) {
                char rowChar = (char) ('A' + r);
                for (int col = 1; col <= 10; col++) {
                    String seatNum = "" + rowChar + col;
                    String type = "STANDARD";
                    double seatPrice = basePrice;

                    // Set Premium / VIP zones
                    if (rowChar >= 'E') {
                        type = "VIP";
                        seatPrice = basePrice + 150.0;
                    } else if (rowChar >= 'C') {
                        type = "PREMIUM";
                        seatPrice = basePrice + 50.0;
                    }

                    String status = "AVAILABLE";
                    if (bookedSeats.contains(seatNum)) {
                        status = "BOOKED";
                    } else if (lockedSeats.contains(seatNum)) {
                        status = "LOCKED";
                    }

                    list.add(String.format(
                        "{\"seatNumber\": \"%s\", \"type\": \"%s\", \"price\": %.2f, \"status\": \"%s\"}",
                        seatNum, type, seatPrice, status
                    ));
                }
            }

            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }

        private void handleLockSeats(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String showtimeIdStr = getJsonValue(body, "showtimeId");
            String userIdStr = getJsonValue(body, "userId");
            String seatsStr = getJsonValue(body, "seats"); // Expects comma separated e.g. "A1,A2" or bracket format

            if (showtimeIdStr.isEmpty() || userIdStr.isEmpty() || seatsStr.isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Missing parameters\"}");
                return;
            }

            int showtimeId = Integer.parseInt(showtimeIdStr);
            int userId = Integer.parseInt(userIdStr);
            // Parse seat strings
            String cleanSeats = seatsStr.replaceAll("[\\[\\]\"\\s]", ""); // Remove JSON brackets

            // Check if user exists to prevent foreign key constraint failures
            boolean userExists = false;
            try (Connection conn = DatabaseConnection.getConnection()) {
                String userSql = "SELECT 1 FROM users WHERE id = ? LIMIT 1";
                try (PreparedStatement userStmt = conn.prepareStatement(userSql)) {
                    userStmt.setInt(1, userId);
                    try (ResultSet userRs = userStmt.executeQuery()) {
                        userExists = userRs.next();
                    }
                }
            }
            if (!userExists) {
                System.out.println("[SeatLock] User " + userId + " does not exist. Rejecting lock.");
                sendResponse(exchange, 401, "{\"success\": false, \"message\": \"User session is invalid or user does not exist. Please log out and sign in again.\"}");
                return;
            }

            try (Connection conn = DatabaseConnection.getConnection()) {
                conn.setAutoCommit(false);
                try {
                    // 1. Clean up expired locks first
                    String cleanupSql = "DELETE FROM seat_locks WHERE expires_at < CURRENT_TIMESTAMP";
                    try (PreparedStatement cleanupStmt = conn.prepareStatement(cleanupSql)) {
                        cleanupStmt.executeUpdate();
                    }

                    // 2. Validate availability and locks
                    String[] seats = cleanSeats.split(",");
                    for (String seat : seats) {
                        if (seat.trim().isEmpty()) continue;
                        String cleanSeat = seat.trim().toUpperCase();

                        // Check booked
                        String bookedSql = "SELECT 1 FROM bookings WHERE showtime_id=? AND booking_status='CONFIRMED' " +
                                "AND CONCAT(',', REPLACE(seats,' ',''), ',') LIKE ? LIMIT 1";
                        try (PreparedStatement bookedStmt = conn.prepareStatement(bookedSql)) {
                            bookedStmt.setInt(1, showtimeId);
                            bookedStmt.setString(2, "%," + cleanSeat + ",%");
                            try (ResultSet rs = bookedStmt.executeQuery()) {
                                if (rs.next()) {
                                    conn.rollback();
                                    System.out.println("[SeatLock] Seat " + cleanSeat + " is already booked for showtime " + showtimeId);
                                    sendResponse(exchange, 409, "{\"success\": false, \"message\": \"Seat " + cleanSeat + " is already booked.\"}");
                                    return;
                                }
                            }
                        }

                        // Check locked by other
                        String lockedSql = "SELECT 1 FROM seat_locks WHERE showtime_id=? AND seat_number=? AND status='LOCKED' " +
                                "AND expires_at > CURRENT_TIMESTAMP AND user_id <> ? LIMIT 1";
                        try (PreparedStatement lockedStmt = conn.prepareStatement(lockedSql)) {
                            lockedStmt.setInt(1, showtimeId);
                            lockedStmt.setString(2, cleanSeat);
                            lockedStmt.setInt(3, userId);
                            try (ResultSet rs = lockedStmt.executeQuery()) {
                                if (rs.next()) {
                                    conn.rollback();
                                    System.out.println("[SeatLock] Seat " + cleanSeat + " is locked by another user for showtime " + showtimeId);
                                    sendResponse(exchange, 409, "{\"success\": false, \"message\": \"Seat " + cleanSeat + " is temporarily locked by another user.\"}");
                                    return;
                                }
                            }
                        }
                    }

                    // 3. Clear existing locks for this user + showtime + seats to avoid duplicates
                    String deleteOldSql = "DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ? AND seat_number = ?";
                    for (String seat : seats) {
                        if (seat.trim().isEmpty()) continue;
                        try (PreparedStatement deleteOldStmt = conn.prepareStatement(deleteOldSql)) {
                            deleteOldStmt.setInt(1, showtimeId);
                            deleteOldStmt.setInt(2, userId);
                            deleteOldStmt.setString(3, seat.trim().toUpperCase());
                            deleteOldStmt.executeUpdate();
                        }
                    }

                    // 4. Perform locking
                    String insertSql = "INSERT INTO seat_locks (showtime_id, seat_number, user_id, status, expires_at) " +
                            "VALUES (?, ?, ?, 'LOCKED', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE))";
                    for (String seat : seats) {
                        if (seat.trim().isEmpty()) continue;
                        String cleanSeat = seat.trim().toUpperCase();
                        try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                            stmt.setInt(1, showtimeId);
                            stmt.setString(2, cleanSeat);
                            stmt.setInt(3, userId);
                            stmt.executeUpdate();
                            System.out.println("[SeatLock] Seat " + cleanSeat + " locked successfully for user " + userId);
                        }
                    }

                    conn.commit();
                    sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Seats locked successfully\"}");
                } catch (SQLException e) {
                    conn.rollback();
                    System.err.println("[SeatLock ERROR] Transaction rolled back: " + e.getMessage());
                    sendResponse(exchange, 500, "{\"success\": false, \"message\": \"Internal transaction failure during seat locking: " + e.getMessage() + "\"}");
                } finally {
                    conn.setAutoCommit(true);
                }
            }
        }

        private void handleConfirmPayment(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String userIdStr = getJsonValue(body, "userId");
            String showtimeIdStr = getJsonValue(body, "showtimeId");
            String seatsStr = getJsonValue(body, "seats");
            String totalAmountStr = getJsonValue(body, "totalAmount");
            String paymentMethod = getJsonValue(body, "paymentMethod");

            if (userIdStr.isEmpty() || showtimeIdStr.isEmpty() || seatsStr.isEmpty() || totalAmountStr.isEmpty() || paymentMethod.isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Missing billing parameters\"}");
                return;
            }

            int userId = Integer.parseInt(userIdStr);
            // Check if user exists to prevent foreign key constraint failures
            boolean userExists = false;
            try (Connection conn = DatabaseConnection.getConnection()) {
                String userSql = "SELECT 1 FROM users WHERE id = ? LIMIT 1";
                try (PreparedStatement userStmt = conn.prepareStatement(userSql)) {
                    userStmt.setInt(1, userId);
                    try (ResultSet userRs = userStmt.executeQuery()) {
                        userExists = userRs.next();
                    }
                }
            }
            if (!userExists) {
                System.out.println("[Booking] User " + userId + " does not exist. Rejecting checkout.");
                sendResponse(exchange, 401, "{\"success\": false, \"message\": \"User session is invalid or user does not exist. Please log out and sign in again.\"}");
                return;
            }

            int showtimeId = Integer.parseInt(showtimeIdStr);
            double totalAmount = Double.parseDouble(totalAmountStr);
            String bookingId = "BKG-" + Long.toHexString(System.currentTimeMillis()).toUpperCase();

            // Load movie name and showtime details
            String movieName = "Inception";
            String theatreName = "CinePlex Main";
            Timestamp showTime = new Timestamp(System.currentTimeMillis());
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT m.title, t.name, s.show_time FROM showtimes s " +
                             "JOIN movies m ON s.movie_id = m.id " +
                             "JOIN screens scr ON s.screen_id = scr.id " +
                             "JOIN theatres t ON scr.theatre_id = t.id " +
                             "WHERE s.id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, showtimeId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            movieName = rs.getString("title");
                            theatreName = rs.getString("name");
                            showTime = rs.getTimestamp("show_time");
                        }
                    }
                }
            }

            // Create Booking Model
            Booking booking = new Booking();
            booking.setBookingId(bookingId);
            booking.setUserId(userIdStr);
            booking.setShowtimeId(showtimeId);
            booking.setMovieName(movieName);
            booking.setTheatreName(theatreName);
            booking.setShowTime(showTime);
            booking.setSeats(seatsStr.replaceAll("[\\[\\]\"\\s]", ""));
            booking.setTotalAmount(totalAmount);
            booking.setBookingStatus("PENDING");

            // Handle Snack orders if any
            // Support simple format e.g., [{"snackId":1,"quantity":2,"totalPrice":500}]
            Pattern snackPattern = Pattern.compile("\\{\\s*\"snackId\"\\s*:\\s*(\\d+)\\s*,\\s*\"quantity\"\\s*:\\s*(\\d+)\\s*,\\s*\"price\"\\s*:\\s*([\\d\\.]+)\\s*\\}");
            Matcher snackMatcher = snackPattern.matcher(body);
            while (snackMatcher.find()) {
                int snackId = Integer.parseInt(snackMatcher.group(1));
                int quantity = Integer.parseInt(snackMatcher.group(2));
                double price = Double.parseDouble(snackMatcher.group(3));

                SnackOrder order = new SnackOrder();
                order.setSnackId(snackId);
                order.setQuantity(quantity);
                order.setTotalPrice(price * quantity);
                booking.addSnackOrder(order);
            }

            // Create Payment Model
            Payment payment = new Payment();
            payment.setPaymentMethod(paymentMethod);
            payment.setPaymentStatus("SUCCESS");
            payment.setAmount(totalAmount);

            // Fetch wallet balance
            double balance = 0.0;
            int loyaltyPoints = 0;
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT balance, loyalty_points FROM wallet WHERE user_id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, userId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            balance = rs.getDouble("balance");
                            loyaltyPoints = rs.getInt("loyalty_points");
                        }
                    }
                }
            }

            // If method is WALLET, check balance
            if ("WALLET".equalsIgnoreCase(paymentMethod) && balance < totalAmount) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Insufficient wallet balance. Choose another payment option.\"}");
                return;
            }

            // Execute Transaction via BookingDAO
            System.out.println("[Booking] Starting booking transaction for user " + userId + ", showtime " + showtimeId + ", seats " + booking.getSeats());
            boolean success = new BookingDAO().processBookingTransaction(booking, payment, 20, 0);

            if (success) {
                System.out.println("[Booking] Booking transaction committed successfully for user " + userId + ". Booking ID: " + bookingId);
                // Generate e-ticket text file manually as well
                generateTicketFile(booking);
                sendResponse(exchange, 200, String.format(
                    "{\"success\": true, \"bookingId\": \"%s\", \"movieName\": \"%s\", \"seats\": \"%s\", \"totalAmount\": %.2f}",
                    bookingId, movieName, booking.getSeats(), totalAmount
                ));
            } else {
                System.err.println("[Booking ERROR] Booking transaction failed/rolled back for user " + userId);
                sendResponse(exchange, 500, "{\"success\": false, \"message\": \"Failed to process database checkout transaction\"}");
            }
        }

        private void handleGetAnalytics(HttpExchange exchange) throws Exception {
            double totalRevenue = 0.0;
            int totalBookings = 0;
            int totalUsers = 0;
            String trendingMovie = "Inception";

            try (Connection conn = DatabaseConnection.getConnection()) {
                // Users count
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM users")) {
                    if (rs.next()) totalUsers = rs.getInt(1);
                }
                // Bookings count & Revenue
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT COUNT(*), SUM(total_amount) FROM bookings WHERE booking_status = 'CONFIRMED'")) {
                    if (rs.next()) {
                        totalBookings = rs.getInt(1);
                        totalRevenue = rs.getDouble(2);
                    }
                }
                // Trending movie
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT movie_name, COUNT(*) as cnt FROM bookings GROUP BY movie_name ORDER BY cnt DESC LIMIT 1")) {
                    if (rs.next()) trendingMovie = rs.getString(1);
                }
            }

            String json = String.format(
                "{\"totalRevenue\": %.2f, \"totalBookings\": %d, \"totalUsers\": %d, \"trendingMovie\": \"%s\"}",
                totalRevenue, totalBookings, totalUsers, trendingMovie
            );
            sendResponse(exchange, 200, json);
        }

        private void handleGetStatus(HttpExchange exchange) throws Exception {
            // Check if SMTP is configured
            String senderEmail = "your_email@gmail.com";
            try (InputStream is = EmailService.class.getResourceAsStream("/db.properties")) {
                Properties props = new Properties();
                if (is != null) {
                    props.load(is);
                    senderEmail = props.getProperty("mail.smtp.user", "your_email@gmail.com");
                } else {
                    try (InputStream fis = new FileInputStream("src/db.properties")) {
                        props.load(fis);
                        senderEmail = props.getProperty("mail.smtp.user", "your_email@gmail.com");
                    }
                }
            } catch (Exception ignored) {}

            boolean isRealDeliveryActive = !senderEmail.equals("your_email@gmail.com");
            boolean dbConnected = false;
            try (Connection conn = DatabaseConnection.getConnection()) {
                dbConnected = conn != null && !conn.isClosed();
            } catch (Exception ignored) {}

            String html = "<html><body style='font-family: -apple-system, sans-serif; background: #0c0d12; color: #f1f5f9; padding: 40px;'>" +
                          "<h1>CineNova REST API Console</h1>" +
                          "<p>Server Status: <span style='color: #4ade80; font-weight: bold;'>RUNNING</span></p>" +
                          "<p>Database Connection: " + (dbConnected ? "<span style='color: #4ade80;'>CONNECTED</span>" : "<span style='color: #ef4444;'>DISCONNECTED</span>") + "</p>" +
                          "<div style='background: #12141c; padding: 30px; border-radius: 20px; max-width: 550px; border: 1px solid #1e2230; margin-top: 20px;'>" +
                          "<h3>Security & SMTP Delivery Status</h3>" +
                          (isRealDeliveryActive 
                           ? "<p style='color: #4ade80; font-weight: bold; line-height: 1.6;'>Real email delivery is ACTIVE.</p>" +
                             "<p style='color: #94a3b8; font-size: 14px;'>The verification OTP codes are dispatched securely directly to your email inbox. Diagnostic files, console logs, and screen displays are disabled to satisfy premium production security guidelines.</p>"
                           : "<p style='color: #eab308; font-weight: bold; line-height: 1.6;'>Real email delivery is INACTIVE (Gmail SMTP not configured).</p>" +
                             "<p style='color: #94a3b8; font-size: 14px;'>Please update <code>src/db.properties</code> with your Gmail address and 16-character App Password to start receiving real emails.</p>" +
                             "<p style='color: #94a3b8; font-size: 14px; margin-top: 15px;'>To retrieve the generated OTP codes locally for testing, run this query in your MySQL database console:</p>" +
                             "<pre style='background: #07070a; padding: 12px; border-radius: 8px; color: #ef4444; overflow-x: auto; font-family: monospace; border: 1px solid #1e2230;'>SELECT otp_code FROM otp_verification ORDER BY expires_at DESC LIMIT 1;</pre>") +
                          "</div>" +
                          "</body></html>";
            
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        // ==========================================
        // HELPERS
        // ==========================================

        private void generateTicketFile(Booking booking) {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String format = 
                "==================================================\n" +
                "                CINENOVA DIGITAL E-TICKET          \n" +
                "==================================================\n" +
                " Booking ID : " + booking.getBookingId() + "\n" +
                " Movie Name : " + booking.getMovieName() + "\n" +
                " Theatre    : " + booking.getTheatreName() + "\n" +
                " Showtime   : " + booking.getShowTime().toString() + "\n" +
                " Seats      : " + booking.getSeats() + "\n" +
                " Total Paid : INR " + booking.getTotalAmount() + "\n" +
                " Issued At  : " + timestamp + "\n" +
                "--------------------------------------------------\n" +
                " Scan barcode at gate. Enjoy your movie!\n" +
                "==================================================\n";
            try {
                String path = "tickets/" + booking.getBookingId() + ".txt";
                try (FileWriter writer = new FileWriter(path)) {
                    writer.write(format);
                }
                System.out.println("[API SERVER] Ticket file generated: " + path);
            } catch (IOException e) {
                System.err.println("[API SERVER ERROR] Failed to write ticket file: " + e.getMessage());
            }
        }

        private String readBody(HttpExchange exchange) throws IOException {
            try (InputStream is = exchange.getRequestBody()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        }

        private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String getJsonValue(String json, String key) {
            Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*(?:\"([^\"]*)\"|([\\d\\.\\-eE]+|true|false|\\[[^\\]]*\\]))");
            Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1) != null ? m.group(1) : m.group(2);
            }
            return "";
        }

        private String getQueryParam(String query, String key) {
            if (query == null) return null;
            for (String pair : query.split("&")) {
                String[] parts = pair.split("=");
                if (parts.length > 0 && parts[0].equalsIgnoreCase(key)) {
                    return parts.length > 1 ? parts[1] : "";
                }
            }
            return null;
        }

        private String escapeJson(String s) {
            if (s == null) return "";
            return s.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
        }

        private void handleGetCities(HttpExchange exchange) throws Exception {
            List<String> list = new ArrayList<>();
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT * FROM cities ORDER BY name ASC";
                try (PreparedStatement stmt = conn.prepareStatement(sql);
                     ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        list.add(String.format(
                            "{\"id\": %d, \"name\": \"%s\"}",
                            rs.getInt("id"),
                            escapeJson(rs.getString("name"))
                        ));
                    }
                }
            }
            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }

        private void handleGetTheatres(HttpExchange exchange) throws Exception {
            String queryParams = exchange.getRequestURI().getQuery();
            String cityIdStr = getQueryParam(queryParams, "cityId");
            String movieIdStr = getQueryParam(queryParams, "movieId");
            
            List<String> list = new ArrayList<>();
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql;
                boolean hasMovie = movieIdStr != null && !movieIdStr.isEmpty();
                boolean hasCity = cityIdStr != null && !cityIdStr.isEmpty();
                
                if (hasMovie && hasCity) {
                    sql = "SELECT DISTINCT t.* FROM theatres t " +
                          "JOIN screens scr ON t.id = scr.theatre_id " +
                          "JOIN showtimes s ON scr.id = s.screen_id " +
                          "WHERE t.city_id = ? AND s.movie_id = ? ORDER BY t.name ASC";
                } else if (hasCity) {
                    sql = "SELECT * FROM theatres WHERE city_id = ? ORDER BY name ASC";
                } else {
                    sql = "SELECT * FROM theatres ORDER BY name ASC";
                }
                
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    if (hasMovie && hasCity) {
                        stmt.setInt(1, Integer.parseInt(cityIdStr));
                        stmt.setInt(2, Integer.parseInt(movieIdStr));
                    } else if (hasCity) {
                        stmt.setInt(1, Integer.parseInt(cityIdStr));
                    }
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            list.add(String.format(
                                "{\"id\": %d, \"name\": \"%s\", \"cityId\": %d, \"location\": \"%s\"}",
                                rs.getInt("id"),
                                escapeJson(rs.getString("name")),
                                rs.getInt("city_id"),
                                escapeJson(rs.getString("location"))
                            ));
                        }
                    }
                }
            }
            sendResponse(exchange, 200, "[" + String.join(",", list) + "]");
        }

        private void handleAddCity(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String name = getJsonValue(body, "name");
            if (name == null || name.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"City name is required\"}");
                return;
            }
            try (Connection conn = DatabaseConnection.getConnection();
                 PreparedStatement stmt = conn.prepareStatement("INSERT INTO cities (name) VALUES (?)")) {
                stmt.setString(1, name.trim());
                stmt.executeUpdate();
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"City added successfully\"}");
            }
        }

        private void handleAddTheatre(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String name = getJsonValue(body, "name");
            String cityIdStr = getJsonValue(body, "cityId");
            String location = getJsonValue(body, "location");
            
            if (name == null || name.trim().isEmpty() || cityIdStr == null || cityIdStr.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Name and cityId are required\"}");
                return;
            }
            
            try (Connection conn = DatabaseConnection.getConnection();
                 PreparedStatement stmt = conn.prepareStatement("INSERT INTO theatres (name, city_id, location) VALUES (?, ?, ?)")) {
                stmt.setString(1, name.trim());
                stmt.setInt(2, Integer.parseInt(cityIdStr));
                stmt.setString(3, location != null ? location.trim() : "");
                stmt.executeUpdate();
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Theatre added successfully\"}");
            }
        }

        private void handleAddScreen(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String theatreIdStr = getJsonValue(body, "theatreId");
            String screenName = getJsonValue(body, "screenName");
            String totalSeatsStr = getJsonValue(body, "totalSeats");
            
            if (theatreIdStr == null || screenName == null || totalSeatsStr == null ||
                theatreIdStr.trim().isEmpty() || screenName.trim().isEmpty() || totalSeatsStr.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Missing parameters\"}");
                return;
            }
            
            try (Connection conn = DatabaseConnection.getConnection();
                 PreparedStatement stmt = conn.prepareStatement("INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES (?, ?, ?)")) {
                stmt.setInt(1, Integer.parseInt(theatreIdStr));
                stmt.setString(2, screenName.trim());
                stmt.setInt(3, Integer.parseInt(totalSeatsStr));
                stmt.executeUpdate();
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Screen added successfully\"}");
            }
        }

        private void handleAddShowtime(HttpExchange exchange) throws Exception {
            String body = readBody(exchange);
            String movieIdStr = getJsonValue(body, "movieId");
            String screenIdStr = getJsonValue(body, "screenId");
            String showTimeStr = getJsonValue(body, "showTime");
            String priceStr = getJsonValue(body, "price");
            
            if (movieIdStr.isEmpty() || screenIdStr.isEmpty() || showTimeStr.isEmpty() || priceStr.isEmpty()) {
                sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Missing showtime parameters\"}");
                return;
            }
            
            try (Connection conn = DatabaseConnection.getConnection();
                 PreparedStatement stmt = conn.prepareStatement("INSERT INTO showtimes (movie_id, screen_id, show_time, price) VALUES (?, ?, ?, ?)")) {
                stmt.setInt(1, Integer.parseInt(movieIdStr));
                stmt.setInt(2, Integer.parseInt(screenIdStr));
                stmt.setTimestamp(3, Timestamp.valueOf(showTimeStr));
                stmt.setDouble(4, Double.parseDouble(priceStr));
                stmt.executeUpdate();
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Showtime added successfully\"}");
            }
        }
    }
}
