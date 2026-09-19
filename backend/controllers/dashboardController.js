const DashboardService = require('../services/DashboardService');

exports.getMetrics = async (req, res) => {
  try {
    const store_id = req.storeId;
    const user_id = req.user.id;
    const mode = req.query.mode || 'today';

    const data = await DashboardService.getDashboardMetrics(store_id, mode, user_id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.saveLayout = async (req, res) => {
  try {
    const store_id = req.storeId;
    const user_id = req.user.id;
    const { mode = 'today', layout_config = [] } = req.body;

    const saved = await DashboardService.saveUserLayout(user_id, store_id, mode, layout_config);
    res.json({ success: true, layout: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
