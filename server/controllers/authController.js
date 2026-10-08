// controllers/authController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles authentication and authorization:
//     - POST /api/auth/register (hashes password with bcryptjs, checks duplicate email 409)
//     - POST /api/auth/login    (validates credentials, generates 1-day JWT token)
//     - GET  /api/auth/me       (returns authenticated user details)
// ═══════════════════════════════════════════════════════════

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
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

    // If changing email, check if another account already has it
    if (email && typeof email === 'string' && email.toLowerCase().trim() !== user.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      const cleanEmail = email.toLowerCase().trim();
      if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }

      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already taken by another account' });
      }
      user.email = cleanEmail;
    }

    if (name && typeof name === 'string') user.name = name.trim().slice(0, 100);
    if (phone !== undefined && typeof phone === 'string') user.phone = phone.trim().slice(0, 30);
    if (dob !== undefined && typeof dob === 'string') user.dob = dob.trim().slice(0, 30);
    
    // SECURITY (S10-A): Only allow http(s) URLs or base64 data URLs for avatar
    if (avatar !== undefined && typeof avatar === 'string') {
      const isHttpUrl = /^https?:\/\//i.test(avatar);
      const isDataUrl = /^data:image\/[a-zA-Z]+;base64,/i.test(avatar);
      if (isHttpUrl || isDataUrl || avatar === '') {
        user.avatar = avatar;
      }
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

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
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
      },
    });
  } catch (error) {
    console.error('Create Staff Error:', error);
    res.status(500).json({ message: 'Server error creating staff account' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  createStaffAccount,
};
