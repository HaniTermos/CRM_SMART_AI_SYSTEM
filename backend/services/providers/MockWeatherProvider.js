const BaseSignalProvider = require('./BaseSignalProvider');

class MockWeatherProvider extends BaseSignalProvider {
  getProviderName() {
    return 'Regional Meteorological Weather Adapter';
  }

  async fetchSignals(store, period) {
    const now = new Date();
    return [
      this.normalizeSignal({
        store_id: store.id,
        signal_type: 'weather',
        title: 'Colder Weather Trend Expected (+15% Hot Drinks Demand)',
        description: 'Forecasted 5°C temperature drop over the upcoming weeks.',
        value: { temp_drop_celsius: 5, category_affected: 'beverages' },
        source_name: this.getProviderName(),
        source_url: 'https://weather.service.local/reports/seasonal',
        observed_at: now.toISOString(),
        confidence: 75,
        status: 'verified'
      })
    ];
  }
}

module.exports = MockWeatherProvider;
