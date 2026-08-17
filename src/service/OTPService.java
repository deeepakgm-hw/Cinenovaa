package service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.Random;
import util.DatabaseConnection;

/**
 * Handles database operations for OTP creation, validation, and database storage.
 */
public class OTPService {
    private static final int EXPIRY_MINUTES = 5;

    /**
     * Generates a 6-digit OTP, stores it in the database with an expiry timestamp,
     * and sends it to the recipient's email.
     */
    public static boolean generateAndSendOTP(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        // 1. Generate 6-digit OTP code
        String otpCode = String.format("%06d", new Random().nextInt(1000000));
        Timestamp expiresAt = new Timestamp(System.currentTimeMillis() + (EXPIRY_MINUTES * 60 * 1000));

        // 2. Persist OTP in database (insert or replace)
        String deleteSql = "DELETE FROM otp_verification WHERE email = ?";
        String insertSql = "INSERT INTO otp_verification (email, otp_code, expires_at) VALUES (?, ?, ?)";

        try (Connection conn = DatabaseConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // Delete any existing OTP code for this email first
                try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                    deleteStmt.setString(1, email);
                    deleteStmt.executeUpdate();
                }
                
                // Insert new OTP record
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setString(1, email);
                    insertStmt.setString(2, otpCode);
                    insertStmt.setTimestamp(3, expiresAt);
                    insertStmt.executeUpdate();
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                System.err.println("[OTP SERVICE ERROR] Failed database transaction: " + e.getMessage());
                return false;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            System.err.println("[OTP SERVICE ERROR] Failed to connect for OTP storage: " + e.getMessage());
            return false;
        }

        // 3. Send email asynchronously or synchronously
        EmailService.sendOTPEmail(email, otpCode);
        return true;
    }

    /**
     * Verifies the OTP code against database record.
     * Deletes the OTP code from DB upon a successful verification.
     */
    public static boolean verifyOTP(String email, String enteredCode) {
        if (email == null || enteredCode == null || email.trim().isEmpty() || enteredCode.trim().isEmpty()) {
            return false;
        }

        String selectSql = "SELECT otp_code, expires_at FROM otp_verification WHERE email = ?";
        String deleteSql = "DELETE FROM otp_verification WHERE email = ?";

        try (Connection conn = DatabaseConnection.getConnection()) {
            try (PreparedStatement selectStmt = conn.prepareStatement(selectSql)) {
                selectStmt.setString(1, email);
                try (ResultSet rs = selectStmt.executeQuery()) {
                    if (rs.next()) {
                        String storedCode = rs.getString("otp_code");
                        Timestamp expiresAt = rs.getTimestamp("expires_at");

                        // Check if OTP matches and has not expired
                        if (storedCode.equals(enteredCode.trim()) && expiresAt.getTime() > System.currentTimeMillis()) {
                            // Valid OTP - clean it up immediately
                            try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                                deleteStmt.setString(1, email);
                                deleteStmt.executeUpdate();
                            }
                            return true;
                        }
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("[OTP SERVICE ERROR] Verification DB check failed: " + e.getMessage());
        }
        return false;
    }
}
