# CinePlex - Movie Ticket Booking System (Desktop App)

## Overview
CinePlex is a robust, production-level Java Swing desktop application built with MVC architecture and a MySQL backend. It features a cinematic dark mode UI and handles the complete checkout flow for a movie theatre, including snack ordering, payment processing, loyalty point management, and automated digital e-ticket generation.

## Features Completed
1. **Database Schema**: Full MySQL schema provided in `schema.sql`.
2. **Models**: Complete data structures (`Booking`, `Payment`, `Snack`, `SnackOrder`, `Wallet`).
3. **DAOs**: Fully implemented database access objects with atomic transaction logic using `setAutoCommit(false)`.
4. **Controllers**: Intermediary logic for snacks, payments, and booking flow.
5. **Views**: Dark-themed Java Swing interfaces for Snack Selection, Payment Checkout, and Ticket Display.
6. **Utils**: Database connection handling, UI theme management, validation, and e-ticket text file generation.

## 10. Sample Output Screens (Description)

- **SnackView**: A dark grey screen with a modern table showing snacks (Popcorn, Coke, Nachos). Users can adjust quantities. A summary panel displays the dynamically updated total price and a glowing "Proceed to Payment" button.
- **PaymentView**: A checkout screen showing a clear breakdown of the Ticket Cost, Snacks Cost, GST, and Total. Includes payment options (Wallet, UPI, Card), a checkbox to redeem loyalty points dynamically reducing the total, and a "Confirm Payment" button.
- **TicketView**: A sleek digital ticket interface showing a green success message. It displays the Booking ID, Movie Name, Showtime, Seats, Total Paid, and a generated E-Ticket message. In the background, a `.txt` file is generated in the `tickets/` directory.

## 11. Future Improvements
- **PDF Ticket Generation**: Integrate a library like iTextPDF or Apache PDFBox to generate visual PDF tickets with actual QR codes instead of text files.
- **Email Notifications**: Implement JavaMail API to email the digital ticket to the user upon a successful transaction.
- **Real-Time Seat Locking**: Enhance the database concurrency to lock seats for a user temporarily (e.g., 5 minutes) during the checkout process to avoid double-booking.
- **Admin Dashboard**: Add a separate module for theatre managers to update snack inventory, manage showtimes, and view revenue reports.
- **Advanced Payment Gateway**: Replace mock validations with an actual payment gateway SDK (like Stripe or Razorpay) for real transaction processing.

## How to Run
1. Initialize DB using `database/unified_schema.sql` (or run `setup_db.bat`).
2. Ensure DB credentials match in `src/util/DatabaseConnection.java`, `src/cineplex/util/DBConnection.java`, and `src/db.properties`.
3. Compile the project:
   `compile.bat`
4. Run the application:
   `run_app.bat`
