// controllers/authController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles authentication and authorization:
//     - POST /api/auth/register (hashes password with bcryptjs, checks duplicate email 409)
//     - POST /api/auth/login    (validates credentials, generates 1-day JWT token)
//     - GET  /api/auth/me       (returns authenticated user details)
// ═══════════════════════════════════════════════════════════

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Safe, non-backtracking email regular expression (prevents ReDoS)
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

// Helper function to generate 1-day JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
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

    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SECURITY (S2-A): Public registration is ALWAYS 'customer'.
    // Manager accounts cannot be self-assigned by clients.
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role: 'customer',
    });

    const token = generateToken(user._id);

    // Return response without password
    res.status(201).json({
      token,
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

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user (case insensitive match)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ message: 'Account disabled' });
    }

    const token = generateToken(user._id);

    // Respond with user details (never sending password)
    res.status(200).json({
      token,
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
    return { status: 400, message: 'Please provide a valid email address' };
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

// @desc    Update user profile (Name, Email, Phone, DOB, Avatar)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, dob, avatar } = req.body;
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

// @desc    Delete user account permanently from database
// @route   DELETE /api/auth/profile
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Permanently remove user from MongoDB database
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    console.log(`[AUTH] Permanently deleted user ${deletedUser.email} (${userId}) from database.`);

    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted from the database.',
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
    const { name, email, password } = req.body;

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

    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
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
      role: 'manager',
    });

    // Return 201 without the password
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
    const staff = await User.find({ role: 'manager' })
      .select('name email role isActive')
      .sort({ createdAt: -1 });

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
    }

    if (role) {
      if (!['customer', 'manager'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      targetUser.role = role;
    }

    await targetUser.save();

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

// In-memory OTP storage: phone -> { code, expiresAt, attempts }
const otpStore = new Map();
// Cooldown storage: phone -> lastSentTimestamp
const otpCooldownStore = new Map();
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes validity
const MAX_OTP_ATTEMPTS = 3;

// Normalize Pakistani phone number to standard 03XXXXXXXXX format
const normalizePakPhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const clean = rawPhone.trim().replace(/[\s-]/g, '');
  const pakRegex = /^(\+92|0092|0)?3\d{9}$/;
  if (!pakRegex.test(clean)) return null;
  // Convert +923XXXXXXXXX or 00923XXXXXXXXX to 03XXXXXXXXX
  return clean.replace(/^(\+92|0092)/, '0');
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

    // Check 30-second resend cooldown per phone number
    const lastSentAt = otpCooldownStore.get(normalizedPhone);
    const now = Date.now();
    if (lastSentAt && now - lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
      });
    }

    // Generate 4-digit numeric OTP (1000 - 9999) using cryptographically secure randomInt
    const otp = crypto.randomInt(1000, 10000).toString();
    const expiresAt = now + OTP_EXPIRY_MS;

    otpStore.set(normalizedPhone, {
      code: otp,
      expiresAt,
      attempts: 0,
    });
    otpCooldownStore.set(normalizedPhone, now);

    console.log(`[SMS OTP GATEWAY] Sent code ${otp} to ${normalizedPhone} (Valid for 5 mins)`);

    // Do NOT return otp in the response body (simulated SMS appears in server terminal)
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

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ message: 'Please provide the 4-digit verification code.' });
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

    // Validate OTP (static dev code '1234' removed completely)
    if (record.code !== otp.trim()) {
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
      const cleanName =
        name && typeof name === 'string' && name.trim().length >= 2
          ? name.trim().slice(0, 100)
          : `Customer ${normalizedPhone.slice(-4)}`;

      const autoEmail = `${normalizedPhone}@customer.aura.pk`;

      // Check if autoEmail is taken
      const existingByEmail = await User.findOne({ email: autoEmail });
      const finalEmail = existingByEmail
        ? `${normalizedPhone}_${Date.now()}@customer.aura.pk`
        : autoEmail;

      // Cryptographically secure temporary password
      const randomPass = crypto.randomBytes(8).toString('hex') + '9aA';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPass, salt);

      user = await User.create({
        name: cleanName,
        email: finalEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        role: 'customer',
      });
    }

    const token = generateToken(user._id);

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      token,
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

module.exports = {
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
};
