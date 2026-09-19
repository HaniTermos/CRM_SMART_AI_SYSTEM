const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { unread_only, limit } = req.query;
    const notifications = await Notification.findByUser(req.user.id, {
      unreadOnly: unread_only === 'true',
      limit: parseInt(limit) || 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const updated = await Notification.markAsRead(req.params.id, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const updated = await Notification.markAllAsRead(req.user.id);
    res.json({ success: true, data: { marked: updated.length } });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
