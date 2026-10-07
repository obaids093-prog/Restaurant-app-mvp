// config/db.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Connects our Express server to MongoDB Atlas using Mongoose.
//   mongoose.connect() opens a persistent connection.
//   If it fails, we print the error and stop the server (process.exit(1)).
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const dns = require('dns');
// Set public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows/local ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in environment
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Stop the server if DB fails to connect
  }
};

module.exports = connectDB;
