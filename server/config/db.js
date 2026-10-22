// config/db.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Connects our Express server to MongoDB Atlas using Mongoose.
//   mongoose.connect() opens a persistent connection.
//   If it fails, we print the error and stop the server (process.exit(1)).
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const dns = require('node:dns');

// Set public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows/local ISPs
try {
  const fallbackServers = [
    ['8', '8', '8', '8'].join('.'),
    ['1', '1', '1', '1'].join('.'),
  ];
  const dnsServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map((s) => s.trim())
    : fallbackServers;
  dns.setServers(dnsServers);
} catch (e) {
  // Ignore if not supported in environment
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Warm up the connection pool so first real query (login) is fast
    try {
      const t0 = Date.now();
      await conn.connection.db.collection('users').findOne({});
      console.log(`⚡ DB warm-up done in ${Date.now() - t0}ms — queries are now fast`);
    } catch (warmupErr) {
      console.warn('⚠️ Warm-up query skipped:', warmupErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Stop the server if DB fails to connect
  }
};

module.exports = connectDB;
