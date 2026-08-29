const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

// Load environment variables directly
require('dotenv').config();

let EMAIL_USER = process.env.EMAIL_USER;
let EMAIL_PASS = process.env.EMAIL_PASS;
let EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
let EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
let EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';

let transporter = createTransporter();

function createTransporter() {
    return nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465 || EMAIL_SECURE,
        family: 4, // Force IPv4
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

// Function to automatically generate a free Ethereal Email test account and update .env
async function generateEtherealAccount() {
    console.log('[EMAIL SERVICE] Programmatically generating a new Ethereal.email test account...');
    try {
        const testAccount = await nodemailer.createTestAccount();
        
        EMAIL_USER = testAccount.user;
        EMAIL_PASS = testAccount.pass;
        EMAIL_HOST = 'smtp.ethereal.email';
        EMAIL_PORT = 587;
        EMAIL_SECURE = false;

        // Update .env file
        const envPath = path.join(__dirname, '../.env');
        const envContent = `EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_HOST=${EMAIL_HOST}
EMAIL_PORT=${EMAIL_PORT}
EMAIL_SECURE=${EMAIL_SECURE}
`;
        fs.writeFileSync(envPath, envContent, 'utf-8');
        console.log('[EMAIL SERVICE] Updated server/.env with generated Ethereal SMTP credentials.');

        // Recreate transporter
        transporter = createTransporter();
        return true;
    } catch (err) {
        console.error('[EMAIL SERVICE ERROR] Failed to generate Ethereal test account:', err.message);
        return false;
    }
}

// Verify connection configuration on startup
async function verifyConnection() {
    try {
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.log('[EMAIL SERVICE] Credentials missing. Triggering auto-generation...');
            await generateEtherealAccount();
        }
        await transporter.verify();
        console.log(`[EMAIL SERVICE] SMTP connection verified successfully to ${EMAIL_HOST} as ${EMAIL_USER}!`);
        return true;
    } catch (err) {
        console.warn(`[EMAIL SERVICE WARNING] SMTP verification failed: ${err.message}`);
        // Safety guard: If the user has configured a custom non-Ethereal email, do not auto-overwrite it.
        const isCustomEmail = EMAIL_USER && !EMAIL_USER.includes('ethereal.email');
        if (isCustomEmail) {
            console.error(`[EMAIL SERVICE ERROR] Custom SMTP configuration failed verification for ${EMAIL_USER}. Please check your credentials.`);
            return false;
        }
        
        // If it was a login error, automatically fallback to generating an Ethereal account
        if (err.code === 'EAUTH' || err.message.includes('Username and Password not accepted') || err.message.includes('Invalid credentials')) {
            const success = await generateEtherealAccount();
            if (success) {
                try {
                    await transporter.verify();
                    console.log(`[EMAIL SERVICE] Connection verified successfully to Ethereal SMTP.`);
                    return true;
                } catch (verifyErr) {
                    console.error('[EMAIL SERVICE ERROR] Re-verification of Ethereal SMTP failed:', verifyErr.message);
                }
            }
        }
        return false;
    }
}

// Send OTP email with premium HTML design
async function sendOTPEmail(toEmail, otpCode, expiresMinutes = 5) {
    const mailOptions = {
        from: `"CineNova Premium" <${EMAIL_USER}>`,
        to: toEmail,
        subject: 'CineNova Verification Code',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CineNova Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; margin: 40px auto; background-color: #0d0e14; border-radius: 24px; border: 1px solid #1e2230; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <!-- Header Banner -->
                <tr>
                    <td style="padding: 40px 0 30px 0; text-align: center; background: linear-gradient(135deg, #1e1b4b 0%, #03001e 100%);">
                        <div style="display: inline-block; padding: 6px 14px; background-color: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.2); border-radius: 50px; font-size: 10px; font-weight: 800; color: #fb7185; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
                            Premium Verification Portal
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                            Cine<span style="color: #e11d48;">Nova</span>
                        </h1>
                    </td>
                </tr>
                <!-- Content -->
                <tr>
                    <td style="padding: 40px 30px 30px 30px;">
                        <h2 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 24px;">
                            Verify Your Identity
                        </h2>
                        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center; margin-bottom: 30px;">
                            Welcome to CineNova. Use the secure 6-digit verification code below to complete your login or registration process.
                        </p>
                        
                        <!-- OTP Box -->
                        <div style="background-color: #07070a; border: 1px solid #1e2230; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 30px;">
                            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #e11d48; letter-spacing: 8px; margin-bottom: 8px;">
                                ${otpCode}
                            </div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                Verification Code
                            </div>
                        </div>

                        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 10px;">
                            This code is valid for <strong style="color: #ffffff;">${expiresMinutes} minutes</strong>.
                        </p>
                        <p style="font-size: 12px; color: #ef4444; font-weight: 600; text-align: center; margin-top: 0;">
                            For security reasons, do not share this code with anyone.
                        </p>
                    </td>
                </tr>
                <!-- Footer -->
                <tr>
                    <td style="padding: 30px; border-top: 1px solid #1e2230; background-color: #0a0b0f; text-align: center; font-size: 11px; color: #475569;">
                        <p style="margin: 0 0 8px 0;">This email was sent automatically by CineNova. Please do not reply.</p>
                        <p style="margin: 0;">&copy; 2026 CineNova Movie Booking Systems. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
        
        // If Ethereal email, log the web link to view the actual HTML message
        if (EMAIL_HOST.includes('ethereal')) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`\n============================================================`);
            console.log(`[EMAIL SERVICE] Ethereal email captured!`);
            console.log(`[EMAIL SERVICE] View the HTML inbox message here:`);
            console.log(`👉 ${previewUrl}`);
            console.log(`============================================================\n`);
        }
        
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${toEmail}:`, err.message);
        throw err;
    }
}

module.exports = {
    verifyConnection,
    sendOTPEmail
};
