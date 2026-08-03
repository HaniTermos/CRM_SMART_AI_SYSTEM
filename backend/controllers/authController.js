const { body } = require('express-validator');
const AuthService = require('../services/AuthService');
const { validate } = require('../middlewares/validate');

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

exports.register = [
  ...registerValidation,
  validate,
  async (req, res, next) => {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: { user, token } });
    } catch (error) {
      next(error);
    }
  }
];

exports.login = [
  ...loginValidation,
  validate,
  async (req, res, next) => {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.json({ success: true, data: { user, token } });
    } catch (error) {
      next(error);
    }
  }
];

exports.me = async (req, res, next) => {
  try {
    const user = await AuthService.getCurrentUser(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
