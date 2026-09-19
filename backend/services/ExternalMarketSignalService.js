const ExternalMarketSignal = require('../models/ExternalMarketSignal');
const registry = require('./providers/ExternalSignalProviderRegistry');

class ExternalMarketSignalService {
  static isFeatureEnabled() {
    return process.env.EXTERNAL_MARKET_INTELLIGENCE_ENABLED !== 'false';
  }

  static async getSignalsForStore(storeId, filters = {}) {
    return await ExternalMarketSignal.findByStore(storeId, filters);
  }

  static async getSignalById(id, storeId) {
    return await ExternalMarketSignal.findById(id, storeId);
  }

  static async createSignal(storeId, signalData, userId = null) {
    const data = {
      ...signalData,
      store_id: storeId,
      created_by: userId
    };
    return await ExternalMarketSignal.create(data);
  }

  static async updateSignal(id, storeId, updates) {
    const updated = await ExternalMarketSignal.update(id, storeId, updates);
    if (!updated) {
      const err = new Error('Signal not found');
      err.status = 404;
      throw err;
    }
    return updated;
  }

  static async verifySignal(id, storeId) {
    return await ExternalMarketSignal.setStatus(id, storeId, 'verified');
  }

  static async rejectSignal(id, storeId) {
    return await ExternalMarketSignal.setStatus(id, storeId, 'rejected');
  }

  static async deleteSignal(id, storeId) {
    const deleted = await ExternalMarketSignal.delete(id, storeId);
    if (!deleted) {
      const err = new Error('Signal not found');
      err.status = 404;
      throw err;
    }
    return deleted;
  }

  static async getVerifiedSignalsForStrategy(storeId, period, minConfidence = 60) {
    if (!this.isFeatureEnabled()) {
      return [];
    }

    const signals = await ExternalMarketSignal.findByStore(storeId, {
      status: 'verified',
      active_only: true,
      min_confidence: minConfidence
    });

    return signals.map(s => ({
      id: s.id,
      signal_type: s.signal_type,
      title: s.title,
      description: s.description,
      source_name: s.source_name,
      source_url: s.source_url,
      observed_at: s.observed_at,
      confidence: s.confidence,
      value: s.value
    }));
  }
}

module.exports = ExternalMarketSignalService;
