const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results.
 * Returns 400 with field-level error details if validation fails.
 *
 * Usage in controllers:
 *   exports.create = [
 *     body('email').isEmail(),
 *     body('name').notEmpty(),
 *     validate,
 *     async (req, res, next) => { ... }
 *   ];
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = { validate };
