class BaseSignalProvider {
  getProviderName() {
    throw new Error('getProviderName() must be implemented by subclass');
  }

  async fetchSignals(store, period) {
    return [];
  }

  normalizeSignal(rawSignal) {
    return {
      store_id: rawSignal.store_id,
      signal_type: rawSignal.signal_type || 'market_observation',
      title: rawSignal.title,
      description: rawSignal.description || '',
      value: rawSignal.value || {},
      source_name: rawSignal.source_name || this.getProviderName(),
      source_url: rawSignal.source_url || null,
      observed_at: rawSignal.observed_at || new Date().toISOString(),
      retrieved_at: new Date().toISOString(),
      valid_until: rawSignal.valid_until || null,
      confidence: rawSignal.confidence !== undefined ? rawSignal.confidence : 60,
      status: rawSignal.status || 'draft'
    };
  }

  validateSignal(signal) {
    if (!signal.title || !signal.source_name || !signal.observed_at) {
      return false;
    }
    return true;
  }
}

module.exports = BaseSignalProvider;
