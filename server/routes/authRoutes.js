// routes/authRoutes.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Maps URL endpoints to authentication actions:
//     POST /api/auth/register
//     POST /api/auth/login
//     GET  /api/auth/me (Protected)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
