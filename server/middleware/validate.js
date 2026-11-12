// server/middleware/validate.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Validates incoming request body, query parameters, and URL params
//   against strict Zod schemas. Unknown fields are rejected, type constraints
//   and length limits are enforced. On failure, responds with 400 and
//   uniform { message } error format without exposing internal stack traces.
// ═══════════════════════════════════════════════════════════

const { z } = require('zod');

/**
 * Creates an Express middleware to validate req.body, req.query, and/or req.params
 * @param {object} schemas - { body?: z.ZodSchema, query?: z.ZodSchema, params?: z.ZodSchema }
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldPath = firstIssue.path.length > 0 ? `${firstIssue.path.join('.')}: ` : '';
        const message = `${fieldPath}${firstIssue.message}`;
        return res.status(400).json({ message });
      }
      return res.status(400).json({ message: 'Invalid request data' });
    }
  };
};

module.exports = validate;
