import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.*;
import java.util.Properties;
import java.io.FileInputStream;

public class TestBookingFlow {
    private static final String API_BASE = "http://localhost:8080/api";
    private static final HttpClient client = HttpClient.newHttpClient();

    public static void main(String[] args) {
        System.out.println("=== STARTING CINENova E2E API VERIFICATION ===");
        try {
            // 1. Send OTP Request
            String email = "testuser@example.com";
            System.out.println("1. Requesting OTP for " + email + "...");
            String sendOtpJson = "{\"email\":\"" + email + "\"}";
            HttpResponse<String> sendRes = post("/auth/otp/send", sendOtpJson);
            System.out.println("   Response Code: " + sendRes.statusCode());
            System.out.println("   Response Body: " + sendRes.body());

            if (sendRes.statusCode() != 200) {
                throw new RuntimeException("Failed to send OTP");
            }

            // 2. Fetch OTP directly from MySQL
            System.out.println("2. Fetching OTP code from MySQL...");
            String otpCode = getOtpFromDB(email);
            System.out.println("   Retrieved OTP Code: " + otpCode);

            // 3. Verify OTP
            System.out.println("3. Verifying OTP...");
            String verifyJson = "{\"email\":\"" + email + "\", \"otp\":\"" + otpCode + "\"}";
            HttpResponse<String> verifyRes = post("/auth/otp/verify", verifyJson);
            System.out.println("   Response Code: " + verifyRes.statusCode());
            System.out.println("   Response Body: " + verifyRes.body());

            if (verifyRes.statusCode() != 200) {
                throw new RuntimeException("Failed to verify OTP");
            }

            // Extract Session ID and User ID from response
            String sessionId = "";
            if (verifyRes.body().contains("sessionId")) {
                int start = verifyRes.body().indexOf("sessionId\":\"") + 12;
                int end = verifyRes.body().indexOf("\"", start);
                sessionId = verifyRes.body().substring(start, end);
            }
            System.out.println("   Authenticated Session ID: " + sessionId);

            int userId = 2; // fallback
            if (verifyRes.body().contains("\"id\":")) {
                int start = verifyRes.body().indexOf("\"id\":") + 5;
                int end = verifyRes.body().indexOf(",", start);
                if (end == -1) {
                    end = verifyRes.body().indexOf("}", start);
                }
                userId = Integer.parseInt(verifyRes.body().substring(start, end).trim());
            }
            System.out.println("   Authenticated User ID: " + userId);

            // 4. Query Cities
            System.out.println("4. Querying Cities list...");
            HttpResponse<String> citiesRes = get("/cities");
            System.out.println("   Cities count: " + (citiesRes.body().split("\"name\":").length - 1));
            System.out.println("   Response: " + citiesRes.body());

            // 5. Query Movies for Bangalore (City ID 1)
            System.out.println("5. Querying Movies running in Bangalore (City 1)...");
            HttpResponse<String> moviesRes = get("/movies?cityId=1");
            System.out.println("   Movies found: " + moviesRes.body());

            // 6. Query Theatres for Bangalore (City ID 1) & Inception (Movie ID 1)
            System.out.println("6. Querying Theatres running Inception (Movie 1) in Bangalore (City 1)...");
            HttpResponse<String> theatresRes = get("/theatres?cityId=1&movieId=1");
            System.out.println("   Theatres found: " + theatresRes.body());

            // 7. Query Showtimes for Inception (Movie 1) at PVR Orion (Theatre 1)
            System.out.println("7. Querying Showtimes for Inception at PVR Orion...");
            HttpResponse<String> showtimesRes = get("/showtimes?movieId=1&theatreId=1");
            System.out.println("   Showtimes found: " + showtimesRes.body());

            // 8. Lock Seat B4 on Showtime 1
            System.out.println("8. Locking seat B4 on Showtime 1...");
            String lockJson = "{\"showtimeId\":1,\"seats\":\"B4\",\"userId\":" + userId + "}";
            HttpResponse<String> lockRes = post("/seats/lock", lockJson);
            System.out.println("   Lock Response Code: " + lockRes.statusCode());
            System.out.println("   Lock Response Body: " + lockRes.body());

            // 9. Confirm Checkout and Process Booking
            System.out.println("9. Confirming payment & booking checkout...");
            String bookingId = "BKG-TEST-" + System.currentTimeMillis();
            String checkoutJson = "{" +
                    "\"bookingId\":\"" + bookingId + "\"," +
                    "\"userId\":\"" + userId + "\"," +
                    "\"showtimeId\":1," +
                    "\"seats\":\"B4\"," +
                    "\"totalAmount\":350.00," +
                    "\"paymentMethod\":\"WALLET\"," +
                    "\"snacks\":[]" +
                    "}";
            HttpResponse<String> checkoutRes = post("/payments/confirm", checkoutJson);
            System.out.println("   Checkout Response Code: " + checkoutRes.statusCode());
            System.out.println("   Checkout Response Body: " + checkoutRes.body());

            if (checkoutRes.statusCode() == 200 && checkoutRes.body().contains("\"success\": true")) {
                System.out.println("   [SUCCESS] Booking successfully finalized and wallet transacted!");
            } else {
                throw new RuntimeException("Checkout transaction failed!");
            }

            System.out.println("\n=== CINENova E2E API VERIFICATION PASSED SUCCESSFULLY ===");

        } catch (Exception e) {
            System.err.println("\n=== VERIFICATION FAILED ===");
            e.printStackTrace();
        }
    }

    private static HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + path))
                .header("Accept", "application/json")
                .GET()
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private static HttpResponse<String> post(String path, String json) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + path))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private static String getOtpFromDB(String email) {
        String url = "jdbc:mysql://localhost:3306/cineplex_db";
        String user = "root";
        String password = "9380";

        // Read db.properties if possible
        try (FileInputStream fis = new FileInputStream("src/db.properties")) {
            Properties props = new Properties();
            props.load(fis);
            url = props.getProperty("db.url", url);
            user = props.getProperty("db.user", user);
            password = props.getProperty("db.password", password);
        } catch (Exception e) {
            // Ignore, fallback to defaults
        }

        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT otp_code FROM otp_verification WHERE email = ? ORDER BY expires_at DESC LIMIT 1")) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("otp_code");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error retrieving OTP", e);
        }
        throw new RuntimeException("No OTP found in DB for email: " + email);
    }
}
