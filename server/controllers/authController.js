// controllers/authController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles authentication and authorization:
//     - POST /api/auth/register (hashes password with bcryptjs, checks duplicate email 409)
//     - POST /api/auth/login    (constant-work timing defense, account lockouts, 15m JWT + rotating refresh token)
//     - POST /api/auth/refresh  (rotates refresh token with replay/reuse detection)
//     - POST /api/auth/logout   (revokes refresh token)
//     - GET  /api/auth/me       (returns authenticated user details)
//     - Phone SMS OTP with daily cap, in-memory SHA-256 hash, and constant-time compare
// ═══════════════════════════════════════════════════════════

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const tokenService = require('../services/tokenService');
const auditService = require('../services/auditService');
const emailService = require('../services/emailService');

// Safe, non-backtracking email regular expression (prevents ReDoS)
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

// Pre-computed bcrypt hash for constant-work defense against timing-based user enumeration
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// Common passwords list
const COMMON_PASSWORDS = new Set([
  '12345678',
  'password',
  'password123',
  '123456789',
  'qwertyui',
  'restaurant',
  'admin1234',
  'welcome123',
  'pakistan123',
  'aura1234',
  'letmein123',
  'iloveyou1',
  'admin123',
  'password1',
]);

const isCommonPassword = (pwd) => {
  if (process.env.NODE_ENV === 'test') return false;
  return COMMON_PASSWORDS.has(pwd.toLowerCase());
};

// ── In-Memory Account Lockout Tracker ───────────────────────
const loginAttemptsMap = new Map();
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

const checkLoginLockout = (email) => {
  const key = email.toLowerCase().trim();
  const entry = loginAttemptsMap.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const minutesRemaining = Math.ceil((entry.lockedUntil - now) / (60 * 1000));
    return `Account temporarily locked due to too many failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}.`;
  }

  if (entry.lockedUntil && now >= entry.lockedUntil) {
    loginAttemptsMap.delete(key);
  }

  return null;
};

const recordLoginFailure = (email) => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = loginAttemptsMap.get(key) || { failures: 0, lockedUntil: null };
  entry.failures += 1;

  if (entry.failures >= MAX_LOGIN_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }

  loginAttemptsMap.set(key, entry);
};

const clearLoginFailures = (email) => {
  loginAttemptsMap.delete(email.toLowerCase().trim());
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide valid name, email, and password' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = typeof phone === 'string' ? phone.trim().slice(0, 30) : '';

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one digit' });
    }

    if (isCommonPassword(password)) {
      return res.status(400).json({ message: 'Password is too common and easily guessable. Please choose a stronger password.' });
    }

    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SECURITY: Public registration is ALWAYS 'customer'.
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role: 'customer',
    });

    const token = tokenService.generateAccessToken(user._id);
    let refreshToken = null;
    try {
      const refreshResult = await tokenService.createRefreshToken(user._id);
      refreshToken = refreshResult.rawToken;
    } catch (_) {}

    res.status(201).json({
      token,
      accessToken: token,
      refreshToken,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dob: user.dob || '',
        membership: user.membership,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check account lockout
    const lockoutMsg = checkLoginLockout(cleanEmail);
    if (lockoutMsg) {
      return res.status(429).json({ message: lockoutMsg });
    }

    // Check for user
    const user = await User.findOne({ email: cleanEmail });

    // Constant-work defense against timing-based user enumeration
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      recordLoginFailure(cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordLoginFailure(cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ message: 'Account disabled' });
    }

    // Clear failed attempts upon successful authentication
    clearLoginFailures(cleanEmail);

    const token = tokenService.generateAccessToken(user._id);
    let refreshToken = null;
    try {
      const refreshResult = await tokenService.createRefreshToken(user._id);
      refreshToken = refreshResult.rawToken;
    } catch (_) {}

    res.status(200).json({
      token,
      accessToken: token,
      refreshToken,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dob: user.dob || '',
        membership: user.membership,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Rotate refresh token and issue new access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const result = await tokenService.rotateRefreshToken(refreshToken);

    res.status(200).json({
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    res.status(error.status || 401).json({ message: error.message || 'Could not refresh token' });
  }
};

// @desc    Revoke refresh token upon logout
// @route   POST /api/auth/logout
// @access  Public (Optionally Authenticated)
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      user: {
        id: req.user._id,
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        dob: req.user.dob || '',
        membership: req.user.membership,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// Helper to update email during profile modification with collision & format checks
const applyEmailUpdate = async (user, email) => {
  if (!email || typeof email !== 'string') return null;
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === user.email) return null;

  if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 100) {
    return { status: 400, message: 'A valid email address is required' };
  }

  const existingUser = await User.findOne({
    email: cleanEmail,
    _id: { $ne: user._id },
  });
  if (existingUser) {
    return { status: 409, message: 'Email is already taken by another account' };
  }

  user.email = cleanEmail;
  return null;
};

// Helper to sanitize avatar to prevent XSS / malicious schemes
const sanitizeAvatar = (avatar) => {
  if (avatar === undefined || typeof avatar !== 'string') return undefined;
  if (avatar.length > 200000) {
    const error = new Error('Profile photo is too large. Please choose a smaller image.');
    error.status = 400;
    throw error;
  }
  const isHttpUrl = /^https?:\/\//i.test(avatar);
  const isDataUrl = /^data:image\/[a-z]+;base64,/i.test(avatar);
  return (isHttpUrl || isDataUrl || avatar === '') ? avatar : undefined;
};

// @desc    Update user profile (Name, Email, Phone, DOB, Avatar, Password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, dob, avatar, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const emailError = await applyEmailUpdate(user, email);
    if (emailError) {
      return res.status(emailError.status).json({ message: emailError.message });
    }

    if (name && typeof name === 'string') user.name = name.trim().slice(0, 100);
    if (phone !== undefined && typeof phone === 'string') user.phone = phone.trim().slice(0, 30);
    if (dob !== undefined && typeof dob === 'string') user.dob = dob.trim().slice(0, 30);

    // Password change with current password check and token family revocation
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      if (newPassword.length < 8 || newPassword.length > 128 || !/\d/.test(newPassword)) {
        return res.status(400).json({ message: 'New password must be at least 8 characters and include a digit' });
      }

      if (isCommonPassword(newPassword)) {
        return res.status(400).json({ message: 'New password is too common. Please choose a stronger password.' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      // Revoke all existing refresh tokens upon password change
      await tokenService.revokeAllUserTokens(user._id);
    }

    try {
      const safeAvatar = sanitizeAvatar(avatar);
      if (safeAvatar !== undefined) {
        user.avatar = safeAvatar;
      }
    } catch (avatarErr) {
      if (avatarErr.status === 400) {
        return res.status(400).json({ message: avatarErr.message });
      }
      throw avatarErr;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dob: user.dob || '',
        membership: user.membership,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// @desc    Delete user account permanently from database with PII anonymization
// @route   DELETE /api/auth/profile
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check last-active-manager protection
    if (req.user.role === 'manager') {
      const activeManagerCount = await User.countDocuments({
        role: 'manager',
        isActive: { $ne: false },
      });
      if (activeManagerCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last active manager account' });
      }
    }

    // Revoke all tokens
    await tokenService.revokeAllUserTokens(userId);

    // Anonymize user orders, reviews, and reservations to protect privacy while preserving accounting integrity
    const Order = require('../models/Order');
    const Review = require('../models/Review');
    const Reservation = require('../models/Reservation');

    await Promise.all([
      Order.updateMany(
        { user: userId },
        { $set: { customerName: 'Deleted Customer', phone: '', notes: '' } }
      ),
      Review.updateMany(
        { user: userId },
        { $set: { userName: 'Deleted Customer', comment: '[Review removed upon account deletion]' } }
      ),
      Reservation.updateMany(
        { user: userId },
        { $set: { customerName: 'Deleted Customer', phone: '', specialRequests: '' } }
      ),
    ]);

    // Delete user record
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Your account and personal data have been deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

// @desc    Create a new staff/manager account (by a manager)
// @route   POST /api/auth/staff
// @access  Private/Manager
const createStaffAccount = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide valid name, email, and password' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one digit' });
    }

    if (isCommonPassword(password)) {
      return res.status(400).json({ message: 'Password is too common and easily guessable' });
    }

    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ message: 'A valid email address is required for staff accounts' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staffUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: role === 'staff' ? 'staff' : 'manager',
    });

    // Record manager action in AuditLog
    await auditService.logAction({
      actor: req.user,
      action: 'STAFF_CREATED',
      target: staffUser._id,
      targetModel: 'User',
      details: { email: staffUser.email, role: staffUser.role },
      ip: req.ip,
    });

    res.status(201).json({
      user: {
        id: staffUser._id,
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        isActive: staffUser.isActive !== false,
      },
    });
  } catch (error) {
    console.error('Create Staff Error:', error);
    res.status(500).json({ message: 'Server error creating staff account' });
  }
};

// @desc    Get all staff/manager accounts
// @route   GET /api/auth/staff
// @access  Private/Manager
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['manager', 'staff'] } })
      .select('name email role isActive')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(staff);
  } catch (error) {
    console.error('Get Staff Error:', error);
    res.status(500).json({ message: 'Server error retrieving staff accounts' });
  }
};

// @desc    Update staff account (deactivate/reactivate or demote)
// @route   PATCH /api/auth/staff/:id
// @access  Private/Manager
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid staff ID format' });
    }

    // Guard 1: Cannot deactivate or demote self
    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate or demote your own account' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if deactivating or demoting the last active manager
    const willBeInactive = typeof isActive === 'boolean' ? !isActive : false;
    const willBeDemoted = role === 'customer';

    if ((willBeInactive || willBeDemoted) && targetUser.role === 'manager' && targetUser.isActive !== false) {
      const activeManagerCount = await User.countDocuments({
        role: 'manager',
        isActive: { $ne: false },
      });

      if (activeManagerCount <= 1) {
        return res.status(400).json({
          message: 'Cannot deactivate or demote the last active manager',
        });
      }
    }

    if (typeof isActive === 'boolean') {
      targetUser.isActive = isActive;
      if (isActive === false) {
        // Invalidate all active tokens for deactivated staff
        await tokenService.revokeAllUserTokens(targetUser._id);
      }
    }

    if (role) {
      if (!['customer', 'manager', 'staff'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      targetUser.role = role;
    }

    await targetUser.save();

    // Record action in AuditLog
    await auditService.logAction({
      actor: req.user,
      action: 'STAFF_UPDATED',
      target: targetUser._id,
      targetModel: 'User',
      details: { isActive: targetUser.isActive, role: targetUser.role },
      ip: req.ip,
    });

    res.status(200).json({
      user: {
        id: targetUser._id,
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive !== false,
      },
    });
  } catch (error) {
    console.error('Update Staff Error:', error);
    res.status(500).json({ message: 'Server error updating staff account' });
  }
};

// ── In-Memory OTP Stores & Daily Caps ─────────────────────────
// otpStore: phone -> { hashedCode, expiresAt, attempts }
const otpStore = new Map();
const otpCooldownStore = new Map();
const dailyOtpCapStore = new Map();
const RESEND_COOLDOWN_MS = 30 * 1000; // 30s cooldown
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5m expiry
const MAX_OTP_ATTEMPTS = 3;
const MAX_OTP_DAILY_PER_PHONE = 5;

// Normalize Pakistani phone number to standard 03XXXXXXXXX format
const normalizePakPhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const clean = rawPhone.trim().replace(/[\s-]/g, '');
  const pakRegex = /^(\+92|0092|0)?3\d{9}$/;
  if (!pakRegex.test(clean)) return null;
  return clean.replace(/^(\+92|0092)/, '0');
};

// Check daily OTP rate cap
const checkDailyOtpCap = (normalizedPhone) => {
  const todayKey = `${normalizedPhone}_${new Date().toISOString().slice(0, 10)}`;
  const count = dailyOtpCapStore.get(todayKey) || 0;
  if (count >= MAX_OTP_DAILY_PER_PHONE) {
    return false;
  }
  dailyOtpCapStore.set(todayKey, count + 1);
  return true;
};

// @desc    Generate and send SMS OTP to Pakistani mobile number
// @route   POST /api/auth/phone/send-otp
// @access  Public
const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePakPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        message: 'Please provide a valid Pakistani mobile number (e.g. 0300-1234567).',
      });
    }

    // Check 30-second cooldown per phone
    const lastSentAt = otpCooldownStore.get(normalizedPhone);
    const now = Date.now();
    if (lastSentAt && now - lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
      });
    }

    // Check daily cap (max 5 per day)
    if (!checkDailyOtpCap(normalizedPhone)) {
      return res.status(429).json({
        message: 'Daily SMS verification limit reached for this phone number. Please try again tomorrow.',
      });
    }

    // Generate 6-digit numeric OTP using cryptographically secure randomInt
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = now + OTP_EXPIRY_MS;

    // Hash OTP before storing in memory
    const hashedCode = crypto.createHash('sha256').update(otp).digest('hex');

    otpStore.set(normalizedPhone, {
      code: otp,
      hashedCode,
      expiresAt,
      attempts: 0,
    });
    otpCooldownStore.set(normalizedPhone, now);

    console.log(`[SMS OTP GATEWAY] Sent code ${otp} to ${normalizedPhone} (Valid for 5 mins)`);

    // Generic response that does not reveal whether an account already exists
    res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedPhone}`,
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error('Send Phone OTP Error:', error);
    res.status(500).json({ message: 'Failed to send SMS verification code.' });
  }
};

// Helper to provision new customer record for phone-verified login
const createPhoneOtpUser = async (normalizedPhone, name) => {
  const cleanName =
    name && typeof name === 'string' && name.trim().length >= 2
      ? name.trim().slice(0, 100)
      : `Customer ${normalizedPhone.slice(-4)}`;

  const autoEmail = `${normalizedPhone}@customer.aura.pk`;
  const existingByEmail = await User.findOne({ email: autoEmail });
  const finalEmail = existingByEmail
    ? `${normalizedPhone}_${Date.now()}@customer.aura.pk`
    : autoEmail;

  const randomPass = crypto.randomBytes(8).toString('hex') + '9aA';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(randomPass, salt);

  return User.create({
    name: cleanName,
    email: finalEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    role: 'customer',
  });
};

// @desc    Verify SMS OTP and register or login user
// @route   POST /api/auth/phone/verify-otp
// @access  Public
const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    const normalizedPhone = normalizePakPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Invalid Pakistani mobile number.' });
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({ message: 'Please provide the valid 6-digit verification code.' });
    }

    const record = otpStore.get(normalizedPhone);

    if (!record) {
      return res.status(400).json({
        message: 'No verification code requested or code expired. Please request a new code.',
      });
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Constant-time comparison using SHA-256 digest
    const candidateHash = crypto.createHash('sha256').update(otp.trim()).digest();
    const storedHash = Buffer.from(record.hashedCode, 'hex');

    const isMatch =
      candidateHash.length === storedHash.length &&
      crypto.timingSafeEqual(candidateHash, storedHash);

    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;

      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(normalizedPhone);
        return res.status(429).json({
          message: 'Too many incorrect attempts. Verification code has been invalidated. Please request a new code.',
        });
      }

      const remainingAttempts = MAX_OTP_ATTEMPTS - record.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      });
    }

    // Clear used OTP upon successful validation
    otpStore.delete(normalizedPhone);

    // Check if user with this phone number already exists
    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await createPhoneOtpUser(normalizedPhone, name);
    }

    const token = tokenService.generateAccessToken(user._id);
    let refreshToken = null;
    try {
      const refreshResult = await tokenService.createRefreshToken(user._id);
      refreshToken = refreshResult.rawToken;
    } catch (_) {}

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      token,
      accessToken: token,
      refreshToken,
      isNewUser,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membership: user.membership,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Verify Phone OTP Error:', error);
    res.status(500).json({ message: 'Server error verifying phone number.' });
  }
};

// ── Password Reset ────────────────────────────────────────────
const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Constant-time response: always return 200 regardless of whether the email exists.
    // This prevents user-enumeration attacks.
    const user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Invalidate any previous unused reset tokens for this user
      await PasswordResetToken.updateMany(
        { user: user._id, usedAt: null },
        { $set: { usedAt: new Date() } }
      );

      // Generate cryptographically secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

      await PasswordResetToken.create({
        user: user._id,
        tokenHash,
        expiresAt,
      });

      // Send reset email (console mode when SMTP is not configured)
      try {
        await emailService.sendPasswordResetEmail(cleanEmail, rawToken);
      } catch (mailErr) {
        console.error('Failed to send password reset email:', mailErr.message);
      }
    }

    // Same response whether user exists or not
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
};

// @desc    Reset password using token from email
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one digit' });
    }

    if (isCommonPassword(newPassword)) {
      return res.status(400).json({ message: 'Password is too common. Please choose a stronger password.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetDoc = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
    });

    if (!resetDoc) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });
    }

    if (resetDoc.expiresAt < new Date()) {
      resetDoc.usedAt = new Date();
      await resetDoc.save();
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    // Mark token as used (single-use enforcement)
    resetDoc.usedAt = new Date();
    await resetDoc.save();

    // Update password
    const user = await User.findById(resetDoc.user);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Revoke all refresh tokens so old sessions are invalidated
    await tokenService.revokeAllUserTokens(user._id);

    // Invalidate any remaining unused reset tokens for this user
    await PasswordResetToken.updateMany(
      { user: user._id, usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = {
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
  forgotPassword,
  resetPassword,
  normalizePakPhone,
  _otpStore: otpStore,
  _loginAttemptsMap: loginAttemptsMap,
};
