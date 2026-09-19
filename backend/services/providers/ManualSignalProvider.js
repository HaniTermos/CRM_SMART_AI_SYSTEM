const BaseSignalProvider = require('./BaseSignalProvider');

class ManualSignalProvider extends BaseSignalProvider {
  getProviderName() {
    return 'Manual Store Observation';
  }

  normalizeSignal(rawSignal) {
    const normalized = super.normalizeSignal(rawSignal);
    normalized.source_name = rawSignal.source_name || 'Manual Store Observation';
    return normalized;
  }
}

module.exports = ManualSignalProvider;
