const GrowthEngineService = require('../services/GrowthEngineService');
const PulseRecommendation = require('../models/PulseRecommendation');
const Store = require('../models/Store');

// Helper to resolve store ID from request
async function getStoreIdForRequest(req) {
  // If route is /api/stores/me/growth/...
  if (req.params.storeId === 'me' || !req.params.storeId) {
    const stores = await Store.findByUserId(req.user.id);
    if (!stores || stores.length === 0) {
      const err = new Error('No store found for this user account');
      err.status = 404;
      throw err;
    }
    return stores[0].id;
  }

  // Explicit /api/stores/:storeId/growth/...
  const targetStoreId = req.params.storeId;
  const stores = await Store.findByUserId(req.user.id);
  const userHasAccess = stores.some(s => s.id === targetStoreId);

  if (!userHasAccess) {
    const err = new Error('Access denied: You do not have permission to access this store');
    err.status = 403;
    throw err;
  }

  return targetStoreId;
}

exports.getDailyPulse = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    
    // Date override security check: only allow date parameter if explicitly in test mode or header
    let dateOverride = null;
    if (req.query.date) {
      const isTestMode = process.env.NODE_ENV === 'test' || req.headers['x-test-mode'] === 'true';
      if (!isTestMode && req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Date overrides are restricted to test mode or administrators' });
      }
      dateOverride = req.query.date;
    }

    const pulseData = await GrowthEngineService.getDailyPulse(storeId, dateOverride);
    res.json({
      success: true,
      data: pulseData
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

exports.markViewed = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const recId = req.params.id;

    const updated = await PulseRecommendation.markAsViewed(recId, storeId);
    if (!updated) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

exports.markDismissed = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const recId = req.params.id;

    const updated = await PulseRecommendation.markAsDismissed(recId, storeId);
    if (!updated) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

exports.executeAction = async (req, res, next) => {
  try {
    const GrowthActionDispatcher = require('../services/GrowthActionDispatcher');
    const storeId = await getStoreIdForRequest(req);
    const recId = req.params.id;
    const { action_type, payload, confirmed } = req.body;

    // getStoreIdForRequest already validates that req.user is the store owner or has store access
    const userRole = req.user.role || 'owner';

    const result = await GrowthActionDispatcher.executeAction({
      storeId,
      recommendationId: recId,
      actionType: action_type,
      payload: payload || {},
      confirmed: confirmed === true,
      userId: req.user.id,
      userRole
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

exports.getExperiments = async (req, res, next) => {
  try {
    const GrowthExperiment = require('../models/GrowthExperiment');
    const storeId = await getStoreIdForRequest(req);
    const experiments = await GrowthExperiment.findByStore(storeId, { status: req.query.status });
    res.json({ success: true, data: experiments });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getExperimentById = async (req, res, next) => {
  try {
    const GrowthExperiment = require('../models/GrowthExperiment');
    const storeId = await getStoreIdForRequest(req);
    const experiment = await GrowthExperiment.findById(req.params.id, storeId);
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    res.json({ success: true, data: experiment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.completeExperiment = async (req, res, next) => {
  try {
    const ImpactTrackerService = require('../services/ImpactTrackerService');
    const storeId = await getStoreIdForRequest(req);
    const experiment = await ImpactTrackerService.completeExperiment(req.params.id, storeId);
    res.json({ success: true, data: experiment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.recalculateExperiment = async (req, res, next) => {
  try {
    const ImpactTrackerService = require('../services/ImpactTrackerService');
    const storeId = await getStoreIdForRequest(req);
    const experiment = await ImpactTrackerService.recalculateExperiment(req.params.id, storeId);
    res.json({ success: true, data: experiment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getImpactSummary = async (req, res, next) => {
  try {
    const ImpactTrackerService = require('../services/ImpactTrackerService');
    const storeId = await getStoreIdForRequest(req);
    const summary = await ImpactTrackerService.getImpactSummary(storeId);
    res.json({ success: true, data: summary });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getMonthlyStrategy = async (req, res, next) => {
  try {
    const MonthlyStrategyService = require('../services/MonthlyStrategyService');
    const storeId = await getStoreIdForRequest(req);
    
    let periodOverride = null;
    if (req.query.period) {
      const isTestMode = process.env.NODE_ENV === 'test' || req.headers['x-test-mode'] === 'true';
      if (!isTestMode && req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Period overrides are restricted to test mode or administrators' });
      }
      periodOverride = req.query.period;
    }

    const options = {
      include_external: req.query.include_external === 'true' || req.query.include_external === true
    };

    const strategy = await MonthlyStrategyService.getMonthlyStrategy(storeId, periodOverride, options);
    res.json({ success: true, data: strategy });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.refreshMonthlyStrategy = async (req, res, next) => {
  try {
    const MonthlyStrategyService = require('../services/MonthlyStrategyService');
    const storeId = await getStoreIdForRequest(req);
    
    let periodOverride = null;
    if (req.query.period) {
      periodOverride = req.query.period;
    }

    const strategy = await MonthlyStrategyService.refreshMonthlyStrategy(storeId, periodOverride);
    res.json({ success: true, data: strategy });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getMonthlyStrategyHistory = async (req, res, next) => {
  try {
    const MonthlyStrategyService = require('../services/MonthlyStrategyService');
    const storeId = await getStoreIdForRequest(req);
    const history = await MonthlyStrategyService.getHistoricalStrategies(storeId);
    res.json({ success: true, data: history });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.markMonthlyRecViewed = async (req, res, next) => {
  try {
    const MonthlyStrategyRecommendation = require('../models/MonthlyStrategyRecommendation');
    const storeId = await getStoreIdForRequest(req);
    const recId = req.params.id;

    const updated = await MonthlyStrategyRecommendation.markAsViewed(recId, storeId);
    if (!updated) {
      return res.status(404).json({ error: 'Monthly strategy recommendation not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.markMonthlyRecDismissed = async (req, res, next) => {
  try {
    const MonthlyStrategyRecommendation = require('../models/MonthlyStrategyRecommendation');
    const storeId = await getStoreIdForRequest(req);
    const recId = req.params.id;

    const updated = await MonthlyStrategyRecommendation.markAsDismissed(recId, storeId);
    if (!updated) {
      return res.status(404).json({ error: 'Monthly strategy recommendation not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// External Market Signal Controllers
exports.getExternalSignals = async (req, res, next) => {
  try {
    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const storeId = await getStoreIdForRequest(req);
    const filters = {
      signal_type: req.query.signal_type,
      status: req.query.status,
      active_only: req.query.active_only === 'true',
      from: req.query.from,
      to: req.query.to
    };
    const signals = await ExternalMarketSignalService.getSignalsForStore(storeId, filters);
    res.json({ success: true, data: signals });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createExternalSignal = async (req, res, next) => {
  try {
    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const storeId = await getStoreIdForRequest(req);
    const signal = await ExternalMarketSignalService.createSignal(storeId, req.body, req.user?.id);
    res.status(201).json({ success: true, data: signal });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateExternalSignal = async (req, res, next) => {
  try {
    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const storeId = await getStoreIdForRequest(req);
    const signal = await ExternalMarketSignalService.updateSignal(req.params.id, storeId, req.body);
    res.json({ success: true, data: signal });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.verifyExternalSignal = async (req, res, next) => {
  try {
    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const storeId = await getStoreIdForRequest(req);
    const signal = await ExternalMarketSignalService.verifySignal(req.params.id, storeId);
    res.json({ success: true, data: signal });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.rejectExternalSignal = async (req, res, next) => {
  try {
    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const storeId = await getStoreIdForRequest(req);
    const signal = await ExternalMarketSignalService.rejectSignal(req.params.id, storeId);
    res.json({ success: true, data: signal });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteExternalSignal = async (req, res, next) => {
  try {
    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const storeId = await getStoreIdForRequest(req);
    await ExternalMarketSignalService.deleteSignal(req.params.id, storeId);
    res.json({ success: true, message: 'Signal deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};
