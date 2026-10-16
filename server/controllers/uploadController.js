// server/controllers/uploadController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles image uploads from the manager's device.
//   - Accepts multipart/form-data with a single 'image' field
//   - Validates file type (JPEG, PNG, WebP only)
//   - Limits file size to 5 MB
//   - Saves to server/uploads/ folder with a unique filename
//   - Returns the public URL for the uploaded image
//
// HOW REAL-WORLD APPS DO IT (KFC, FoodPanda, McDonald's):
//   1. Manager picks photo from device camera/gallery
//   2. Client app auto-resizes & compresses (800×600, 70% quality)
//   3. Uploads to server via POST /api/upload
//   4. Server saves file, returns URL
//   5. URL stored in MenuItem.image field in MongoDB
//
//   Production apps use cloud storage (AWS S3, Google Cloud Storage,
//   Cloudinary) but the flow is identical — only the storage backend
//   differs. Our local uploads/ folder mirrors this pattern.
// ═══════════════════════════════════════════════════════════

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── Ensure uploads directory exists ─────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Multer Storage Configuration ────────────────────────────
// Each file gets a unique name: dish_<timestamp>_<random>.<ext>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `dish_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

// ── File Filter — only allow images ─────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// ── Multer Instance ─────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max (after client compression this is more than enough)
  },
});

// ── Upload Handler ──────────────────────────────────────────
// POST /api/upload
// Protected: Manager only
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  // Build the public URL for this image
  // In production, this would be a CDN URL like https://cdn.kfc.com/images/...
  const protocol = req.protocol;
  const host = req.get('host');
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  res.status(201).json({
    message: 'Image uploaded successfully',
    imageUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
};

// ── Multer Error Handler Middleware ──────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image too large. Maximum size is 5 MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = { upload, uploadImage, handleMulterError };
