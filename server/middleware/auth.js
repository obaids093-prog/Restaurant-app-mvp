// middleware/auth.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   protect:
//     - Checks the "Authorization: Bearer <token>" header
//     - Verifies JWT with process.env.JWT_SECRET
//     - Finds user in database and attaches to req.user (without password)
//     - Returns 401 if token is missing, expired, or invalid
//   managerOnly:
//     - Verifies req.user.role === 'manager'
//     - Returns 403 Forbidden if the user is a customer
// ═══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // SECURITY (S3-A): Explicitly pin algorithm to HS256
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists' });
      }

      if (req.user.isActive === false) {
        return res.status(401).json({ message: 'Account disabled' });
      }

      return next();
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const managerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Manager role required' });
};

module.exports = {
  protect,
  managerOnly,
};
