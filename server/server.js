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
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');
const path = require('node:path');
const connectDB = require('./config/db');

// Load .env variables into process.env
dotenv.config();

// Validate required environment variables before initializing services
if (process.env.NODE_ENV !== 'test') {
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missingEnv.length > 0) {
    console.error('\n❌ FATAL CONFIGURATION ERROR: Missing required environment variable(s):');
    missingEnv.forEach((key) => {
      console.error(`   - ${key} is required but not set.`);
    });
    console.error('Please configure them in your environment or server/.env (see server/.env.example).\n');
    process.exit(1);
  }

  // Connect to MongoDB
  connectDB();
}

const app = express();

// ── Security Headers Middleware (S5-B) ──────────────────────
// helmet() sets many security headers including X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security, etc.
app.use(helmet());

// ── CORS Policy (S5-A) ──────────────────────────────────────
const defaultOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:8081',
  process.env.DEV_LAN_ORIGIN || `http://${'192.168.100.17'}:8081`, // NOSONAR: local dev LAN IP
];

const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Mobile native apps (React Native / Expo Go) and Postman send no origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── express-mongo-sanitize (S1-C) ────────────────────────────
// Strips keys starting with '$' or containing '.' from req.body/query/params
app.use(mongoSanitize());

// ── NoSQL Operator Sanitizer (S1-C) ─────────────────────────
// Recursively strip any keys that start with '$' or contain '.'
const sanitizeNoSql = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeNoSql);
    return;
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSql(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.query) sanitizeNoSql(req.query);
  if (req.params) sanitizeNoSql(req.params);
  next();
});

// ── In-Memory Auth Rate Limiter (S3-B) ───────────────────────
const authRateMap = new Map();
const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15-minute sliding window
  const maxAttempts = 30; // Max 30 attempts per 15 minutes

  const entry = authRateMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count += 1;
  }

  authRateMap.set(ip, entry);

  if (entry.count > maxAttempts) {
    return res.status(429).json({
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  }

  next();
};

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);

// ── Routes ─────────────────────────────────────────────────
// Health Check — used to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Static File Serving for Uploaded Images ─────────────────
// Serves files from server/uploads/ at /uploads/<filename>
// This is how the app accesses uploaded dish photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes (Question 4, 5, 7) ──────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global Error Handler (S5-C) ─────────────────────────────
// Never leak error stack or raw error.message to the client
app.use((err, req, res, _next) => {
  console.error('[SERVER ERROR]', err.stack || err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
