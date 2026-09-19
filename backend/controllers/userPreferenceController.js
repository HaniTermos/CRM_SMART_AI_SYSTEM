const UserPreference = require('../models/UserPreference');

exports.getPreferences = async (req, res, next) => {
  try {
    let prefs = await UserPreference.findByUserId(req.user.id);
    if (!prefs) {
      prefs = await UserPreference.createDefaults(req.user.id);
    }
    res.json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const allowed = ['dashboard_theme', 'nav_mode', 'density', 'reduced_motion', 'default_date_range', 'default_dashboard_page'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const updated = await UserPreference.update(req.user.id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
