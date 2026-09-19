const ReportService = require('../services/ReportService');

exports.getOverview = async (req, res) => {
  try {
    const store_id = req.storeId;
    const overview = await ReportService.getOverviewReport(store_id, req.query);
    res.json({ success: true, overview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const store_id = req.storeId;
    const sales = await ReportService.getSalesReport(store_id, req.query);
    res.json({ success: true, sales });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMenuPerformance = async (req, res) => {
  try {
    const store_id = req.storeId;
    const menu = await ReportService.getMenuPerformanceReport(store_id);
    res.json({ success: true, menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGuests = async (req, res) => {
  try {
    const store_id = req.storeId;
    const guests = await ReportService.getGuestsReport(store_id);
    res.json({ success: true, guests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOperations = async (req, res) => {
  try {
    const store_id = req.storeId;
    const operations = await ReportService.getOperationsReport(store_id);
    res.json({ success: true, operations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const store_id = req.storeId;
    const inventory = await ReportService.getInventoryProfitReport(store_id);
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const store_id = req.storeId;
    const staff = await ReportService.getStaffReport(store_id);
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMarketing = async (req, res) => {
  try {
    const store_id = req.storeId;
    const marketing = await ReportService.getMarketingReport(store_id);
    res.json({ success: true, marketing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getForecastAccuracy = async (req, res) => {
  try {
    const store_id = req.storeId;
    const forecast = await ReportService.getForecastAccuracyReport(store_id);
    res.json({ success: true, forecast });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardMetrics = async (req, res) => {
  try {
    const store_id = req.storeId;
    const overview = await ReportService.getOverviewReport(store_id, req.query);
    res.json({ success: true, data: overview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersWithItems = async (req, res) => {
  try {
    const store_id = req.storeId;
    const data = await ReportService.getOrdersWithItemsReport(store_id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRevenueByCategory = async (req, res) => {
  try {
    const store_id = req.storeId;
    const days = Number(req.query.days || 90);
    const data = await ReportService.getRevenueByCategoryReport(store_id, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesByChannel = async (req, res) => {
  try {
    const store_id = req.storeId;
    const days = Number(req.query.days || 90);
    const data = await ReportService.getSalesByChannelReport(store_id, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHourlyDensity = async (req, res) => {
  try {
    const store_id = req.storeId;
    const weeks = Number(req.query.weeks || 4);
    const data = await ReportService.getHourlyDensityReport(store_id, weeks);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
