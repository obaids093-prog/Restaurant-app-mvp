// routes/authRoutes.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Maps URL endpoints to authentication actions with strict Zod validation:
//     POST /api/auth/register
//     POST /api/auth/login
//     POST /api/auth/refresh
//     POST /api/auth/logout
//     GET  /api/auth/me (Protected)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
  deleteAccount,
  createStaffAccount,
  getStaff,
  updateStaff,
  sendPhoneOtp,
  verifyPhoneOtp,
} = require('../controllers/authController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  staffCreateSchema,
  staffUpdateSchema,
  phoneSendOtpSchema,
  phoneVerifyOtpSchema,
  idParamSchema,
} = require('../validators/schemas');

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/refresh', validate({ body: refreshTokenSchema }), refreshAccessToken);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.put('/profile', protect, validate({ body: updateProfileSchema }), updateProfile);
router.delete('/profile', protect, deleteAccount);

// Pakistani Mobile Phone Number OTP Auth
router.post('/phone/send-otp', validate({ body: phoneSendOtpSchema }), sendPhoneOtp);
router.post('/phone/verify-otp', validate({ body: phoneVerifyOtpSchema }), verifyPhoneOtp);

// Manager-only staff account management
router.get('/staff', protect, managerOnly, getStaff);
router.post('/staff', protect, managerOnly, validate({ body: staffCreateSchema }), createStaffAccount);
router.patch('/staff/:id', protect, managerOnly, validate({ params: idParamSchema, body: staffUpdateSchema }), updateStaff);

module.exports = router;
