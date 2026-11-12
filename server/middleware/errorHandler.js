// server/middleware/errorHandler.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Centralized error handling middleware.
//   Ensures all error responses conform to the uniform { message } shape.
//   Never leaks stack traces, database details, or internal errors.
// ═══════════════════════════════════════════════════════════

const errorHandler = (err, req, res, _next) => {
  const status = Number.isInteger(err.status) ? err.status : Number.isInteger(err.statusCode) ? err.statusCode : 500;

  // Log error with context for debugging
  if (status >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  // Handle common error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message || 'Validation Error' });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid resource ID format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Resource already exists with those unique fields' });
  }

  const message = status < 500 && err.message ? err.message : 'Internal Server Error';

  res.status(status).json({ message });
};

module.exports = errorHandler;
