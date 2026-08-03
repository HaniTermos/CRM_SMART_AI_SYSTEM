const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../config/database');

class AuthService {
  static async register({ email, password, name, role }) {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.create({ email, password, name, role });
    const token = this.generateToken(user);
    const storeCount = await db.query('SELECT COUNT(*) FROM user_roles WHERE user_id = $1', [user.id]);
    user.has_store = parseInt(storeCount.rows[0].count) > 0;

    return { user, token };
  }

  static async login({ email, password }) {
    const user = await User.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at
    };

    const token = this.generateToken(safeUser);
    const storeCount = await db.query('SELECT COUNT(*) FROM user_roles WHERE user_id = $1', [user.id]);
    safeUser.has_store = parseInt(storeCount.rows[0].count) > 0;

    return { user: safeUser, token };
  }

  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const storeCount = await db.query('SELECT COUNT(*) FROM user_roles WHERE user_id = $1', [user.id]);
    user.has_store = parseInt(storeCount.rows[0].count) > 0;
    
    return user;
  }

  static generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = AuthService;
