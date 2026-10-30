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
const {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  createStaffAccount,
  getStaff,
  updateStaff,
  sendPhoneOtp,
  verifyPhoneOtp,
  socialLogin,
} = require('../controllers/authController');
const { protect, managerOnly } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteAccount);

// Pakistani Mobile Phone Number OTP Auth (Cheezious / Foodpanda style)
router.post('/phone/send-otp', sendPhoneOtp);
router.post('/phone/verify-otp', verifyPhoneOtp);

// Manager-only staff account management
router.get('/staff', protect, managerOnly, getStaff);
router.post('/staff', protect, managerOnly, createStaffAccount);
router.patch('/staff/:id', protect, managerOnly, updateStaff);

module.exports = router;
