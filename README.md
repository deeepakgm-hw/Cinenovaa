# CineNova - Cinema Ticket Booking Platform

## Overview
CineNova is a full-stack cinema ticket booking web application built with a **React (Vite)** frontend, **Node.js (Express & Socket.IO)** backend, and a **MySQL** database. It features dynamic seat layouts, real-time seat locking with Socket.IO, collaborative group bookings, payment processing, loyalty wallets, admin dashboards, and automated movie metadata sync via TMDB.

## Stack Architecture
1. **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client (runs on port `5173`).
2. **Backend**: Node.js, Express, Socket.IO, MySQL2, Nodemailer, Razorpay, Node-Cron (runs on port `8080`).
3. **Database**: MySQL 8.x (`cineplex_db`).

## Features
- **Cinematic Movie Browsing**: Live movie synchronization, trailer views, and search across cities and theatres.
- **Seat Selection & Real-Time Locking**: Dynamic interactive seat matrix with concurrent multi-user seat locks and auto-expiry.
- **Collaborative Group Booking**: Shareable room links for group seat picking with live WebSockets.
- **Checkout & Payments**: Wallet balances, loyalty points redemption, UPI/QR and mock/Razorpay payment flows with automatic email tickets.
- **Comprehensive Admin Panel**: Real-time stats, revenue reports, movie/showtime/booking management, and wallet balance adjustments.

## How to Run

### 1. Initialize Database
Ensure MySQL Server is running on localhost:3306, then run:
```bash
# Windows
.\setup_db.bat

# Or via npm
cd server
npm run db:setup
```

### 2. Start Node.js Express Backend
```bash
cd server
npm install
npm start
```
The API server will listen on `http://localhost:8080`.

### 3. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
