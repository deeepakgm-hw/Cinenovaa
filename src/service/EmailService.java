package service;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Premium OTP Email Dispatcher utilizing JavaMail over Gmail SMTP.
 * Incorporates a beautiful responsive HTML template, CineNova branding,
 * and a secure logging model that masks OTPs unless SMTP settings are unconfigured.
 */
public class EmailService {
    private static final Logger LOG = Logger.getLogger(EmailService.class.getName());
    private static final String LOG_FILE_PATH = "tickets/otp_sent.log";
    private static Properties smtpProperties = new Properties();

    static {
        // Load properties from db.properties
        try (InputStream is = EmailService.class.getResourceAsStream("/db.properties")) {
            if (is != null) {
                smtpProperties.load(is);
            } else {
                try (InputStream fis = new FileInputStream("src/db.properties")) {
                    smtpProperties.load(fis);
                }
            }
        } catch (IOException e) {
            LOG.warning("[EMAIL SERVICE] Failed to load db.properties: " + e.getMessage());
        }
    }

    public static void sendOTPEmail(String recipientEmail, String otpCode) {
        String host = smtpProperties.getProperty("mail.smtp.host", "smtp.gmail.com");
        String port = smtpProperties.getProperty("mail.smtp.port", "587");
        String senderEmail = smtpProperties.getProperty("mail.smtp.user", "your_email@gmail.com");
        String appPassword = smtpProperties.getProperty("mail.smtp.password", "your_app_password");

        boolean isMockMode = senderEmail.equals("your_email@gmail.com") || appPassword.equals("your_app_password");

        // Format HTML body
        String htmlContent = getHtmlTemplate(recipientEmail, otpCode);

        if (isMockMode) {
            // FALLBACK DIAGNOSTIC MODE: Credentials not set
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String secureLog = 
                "\n======================================================================\n" +
                "  [SECURE WARNING] GMAIL SMTP CREDENTIALS NOT CONFIGURED IN db.properties \n" +
                "======================================================================\n" +
                " Date: " + timestamp + "\n" +
                " To:   " + maskEmail(recipientEmail) + "\n" +
                " Status: Real OTP email cannot be dispatched.\n" +
                " Action Required: Set mail.smtp.user and mail.smtp.password in src/db.properties.\n" +
                " Local Note: Retrieve OTP code securely from MySQL 'otp_verification' table.\n" +
                "======================================================================\n";
            
            System.out.println(secureLog);

            // Log diagnostic info to file without plain text OTP
            try {
                Files.createDirectories(Paths.get("tickets"));
                try (FileWriter writer = new FileWriter(LOG_FILE_PATH, true)) {
                    writer.write(secureLog + "\n\n");
                }
                Files.deleteIfExists(Paths.get("tickets/otp_last.txt"));
            } catch (IOException e) {
                LOG.log(Level.SEVERE, "Could not write to local diagnostic log: " + e.getMessage());
            }
        } else {
            // SECURE REAL DELIVERY MODE
            System.out.println("[EMAIL SERVICE] Dispatching secure OTP verification email to: " + maskEmail(recipientEmail) + " (code is masked in logs).");

            // Setup JavaMail Properties
            Properties props = new Properties();
            props.put("mail.smtp.host", host);
            props.put("mail.smtp.port", port);
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2");

            Session session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(senderEmail, appPassword);
                }
            });

            // Dispatch mail asynchronously in a background thread to prevent UI blocking
            new Thread(() -> {
                try {
                    Message message = new MimeMessage(session);
                    message.setFrom(new InternetAddress(senderEmail, "CineNova Experience"));
                    message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail));
                    message.setSubject("Your CineNova OTP Verification Code");
                    message.setContent(htmlContent, "text/html; charset=utf-8");

                    Transport.send(message);
                    System.out.println("[EMAIL SERVICE] OTP successfully delivered to " + maskEmail(recipientEmail));
                    
                    // Clean up any old diagnostic files so we don't leak credentials
                    try {
                        Files.deleteIfExists(Paths.get("tickets/otp_last.txt"));
                    } catch (IOException ignored) {}
                } catch (Exception e) {
                    System.err.println("[EMAIL SERVICE ERROR] Real email delivery failed. Reason: " + e.getMessage());
                    System.err.println("[EMAIL SERVICE WARNING] Please verify SMTP details in db.properties and check internet connectivity. For local troubleshooting, query the MySQL 'otp_verification' table.");
                }
            }).start();
        }
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "*****";
        int idx = email.indexOf("@");
        String local = email.substring(0, idx);
        String domain = email.substring(idx);
        if (local.length() <= 3) {
            return "***" + domain;
        }
        return local.substring(0, 3) + "****" + domain;
    }

    private static String getHtmlTemplate(String email, String code) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "  <meta charset='utf-8'>" +
               "  <meta name='viewport' content='width=device-width, initial-scale=1.5'>" +
               "</head>" +
               "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #e2e8f0; margin: 0; padding: 40px;\">" +
               "  <div style=\"max-width: 500px; margin: 0 auto; background-color: #12141c; border: 1px solid #1e2230; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);\">" +
               "    <div style=\"text-align: center; margin-bottom: 30px;\">" +
               "      <span style=\"background-color: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(239, 68, 68, 0.2);\">Secure Access</span>" +
               "      <h1 style=\"color: #ffffff; font-size: 32px; font-weight: 900; margin-top: 15px; margin-bottom: 5px; letter-spacing: -0.5px;\">Cine<span style=\"color: #ef4444;\">Nova</span></h1>" +
               "      <p style=\"color: #94a3b8; font-size: 13px; margin: 0;\">Your Premium Cinema Ticket Experience</p>" +
               "    </div>" +
               "    <hr style=\"border: 0; border-top: 1px solid #1e2230; margin-bottom: 30px;\">" +
               "    <div style=\"margin-bottom: 30px;\">" +
               "      <p style=\"font-size: 15px; line-height: 1.6; color: #cbd5e1;\">Hello,</p>" +
               "      <p style=\"font-size: 15px; line-height: 1.6; color: #cbd5e1;\">We received a request to log in to your <strong>CineNova</strong> account. Use the verification code below to complete your checkout flow:</p>" +
               "      <div style=\"background-color: #0c0d12; border: 1px solid #1e2230; border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0;\">" +
               "        <span style=\"font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 8px; margin-left: 8px;\">" + code + "</span>" +
               "      </div>" +
               "      <p style=\"font-size: 12px; line-height: 1.6; color: #94a3b8; text-align: center;\">This verification code is valid for <strong>5 minutes</strong>. If you did not make this request, please ignore this email.</p>" +
               "    </div>" +
               "    <hr style=\"border: 0; border-top: 1px solid #1e2230; margin-bottom: 20px;\">" +
               "    <div style=\"text-align: center; color: #64748b; font-size: 11px;\">" +
               "      &copy; 2026 CineNova Entertainment | Premium Startup Ticket Service" +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }
}
