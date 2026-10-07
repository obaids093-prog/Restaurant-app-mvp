// server.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   This is the ENTRY POINT (main file) of our backend server.
//   It does 3 things:
//     1. Loads environment variables from .env (dotenv)
//     2. Connects to MongoDB (connectDB)
//     3. Starts the Express HTTP server on PORT 5000
//
// HOW EXPRESS WORKS:
//   app.use() = adds middleware (functions that run on every request)
//   app.get() = handles GET requests at a specific URL
//   express.json() = lets Express read JSON data sent in requests
//   cors() = allows our React Native app (different port) to call this server
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load .env variables into process.env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());              // Allow cross-origin requests from the app
app.use(express.json());      // Parse incoming JSON request bodies

// ── Routes ─────────────────────────────────────────────────
// Health Check — used to verify server is running
// Viva: "GET /api/health returns the current time so we can confirm server is alive"
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── API Routes (Question 4, 5, 7) ──────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));

// ── 404 Handler ─────────────────────────────────────────────
// If no route matches, return 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────
// If any route throws an error, it comes here
// "next(error)" in any controller sends it here automatically
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
