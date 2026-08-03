const { body } = require('express-validator');
const UserRole = require('../models/UserRole');
const { validate } = require('../middlewares/validate');

exports.getMembers = async (req, res, next) => {
  try {
    const members = await UserRole.findByStore(req.params.storeId);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

exports.addMember = [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'staff']),
  validate,
  async (req, res, next) => {
    try {
      const member = await UserRole.addMember({
        store_id: req.params.storeId,
        email: req.body.email,
        role: req.body.role
      });
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('already a member')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
];

exports.removeMember = async (req, res, next) => {
  try {
    const deleted = await UserRole.removeMember(req.params.storeId, req.params.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Member not found in this store' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    if (error.message.includes('Cannot remove the store owner')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
