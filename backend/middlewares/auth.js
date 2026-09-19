const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await db.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('[AUTH] Middleware error:', error);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

const requireStoreAccess = async (req, res, next) => {
  try {
    let storeId = req.storeId || req.params.storeId || req.body?.store_id || req.query?.store_id;

    if (!storeId || storeId === 'me') {
      const userStores = await db.query(
        `SELECT s.*, r.role FROM stores s
         JOIN user_roles r ON s.id = r.store_id
         WHERE r.user_id = $1
         ORDER BY s.created_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (userStores.rows.length > 0) {
        req.store = userStores.rows[0];
        req.storeId = userStores.rows[0].id;
        req.userRole = userStores.rows[0].role || 'owner';
        return next();
      }

      const ownedStore = await db.query(
        `SELECT * FROM stores WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (ownedStore.rows.length > 0) {
        req.store = ownedStore.rows[0];
        req.storeId = ownedStore.rows[0].id;
        req.userRole = 'owner';
        return next();
      }

      return res.status(404).json({ error: 'No active store found for this account.' });
    }

    req.storeId = storeId;
    const roleResult = await db.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND store_id = $2',
      [req.user.id, storeId]
    );

    if (roleResult.rows.length === 0) {
      const storeResult = await db.query(
        'SELECT id FROM stores WHERE id = $1 AND owner_user_id = $2',
        [storeId, req.user.id]
      );

      if (storeResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied. You do not have access to this store.' });
      }

      req.userRole = 'owner';
    } else {
      req.userRole = roleResult.rows[0].role;
    }

    const storeResult = await db.query(
      'SELECT * FROM stores WHERE id = $1',
      [storeId]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    req.store = storeResult.rows[0];
    next();
  } catch (error) {
    console.error('[AUTH] Store access error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

const requireStoreAdmin = async (req, res, next) => {
  try {
    let storeId = req.storeId || req.params.storeId || req.body?.store_id || req.query?.store_id;

    if (!storeId || storeId === 'me') {
      const userStores = await db.query(
        `SELECT s.*, r.role FROM stores s
         JOIN user_roles r ON s.id = r.store_id
         WHERE r.user_id = $1 AND r.role IN ('owner', 'admin')
         ORDER BY s.created_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (userStores.rows.length > 0) {
        req.store = userStores.rows[0];
        req.storeId = userStores.rows[0].id;
        req.userRole = userStores.rows[0].role || 'owner';
        return next();
      }

      const ownedStore = await db.query(
        `SELECT * FROM stores WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (ownedStore.rows.length > 0) {
        req.store = ownedStore.rows[0];
        req.storeId = ownedStore.rows[0].id;
        req.userRole = 'owner';
        return next();
      }

      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.storeId = storeId;
    const roleResult = await db.query(
      `SELECT role FROM user_roles 
       WHERE user_id = $1 AND store_id = $2 AND role IN ('owner', 'admin')`,
      [req.user.id, storeId]
    );

    if (roleResult.rows.length === 0) {
      const storeResult = await db.query(
        'SELECT id FROM stores WHERE id = $1 AND owner_user_id = $2',
        [storeId, req.user.id]
      );
      if (storeResult.rows.length === 0) {
        return res.status(403).json({ error: 'Admin access required.' });
      }
      req.userRole = 'owner';
    } else {
      req.userRole = roleResult.rows[0].role;
    }

    const storeResult = await db.query(
      'SELECT * FROM stores WHERE id = $1',
      [storeId]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    req.store = storeResult.rows[0];
    next();
  } catch (error) {
    console.error('[AUTH] Store admin check error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { authenticate, authenticateToken: authenticate, requireStoreAccess, requireStoreAdmin };
