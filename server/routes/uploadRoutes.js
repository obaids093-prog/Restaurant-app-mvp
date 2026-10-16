// server/routes/uploadRoutes.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Defines the route for image uploads.
//   POST /api/upload — Manager-only, accepts a single 'image' file
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const { upload, uploadImage, handleMulterError } = require('../controllers/uploadController');

// POST /api/upload
// Only authenticated managers can upload dish images
router.post(
  '/',
  protect,
  managerOnly,
  upload.single('image'),
  handleMulterError,
  uploadImage
);

module.exports = router;
