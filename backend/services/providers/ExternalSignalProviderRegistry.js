const ManualSignalProvider = require('./ManualSignalProvider');
const MockWeatherProvider = require('./MockWeatherProvider');

class ExternalSignalProviderRegistry {
  constructor() {
    this.providers = new Map();
    // Register default providers
    this.registerProvider('manual', new ManualSignalProvider());
    this.registerProvider('weather', new MockWeatherProvider());
  }

  registerProvider(name, providerInstance) {
    this.providers.set(name, providerInstance);
  }

  getProvider(name) {
    return this.providers.get(name) || null;
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  async fetchAllSignals(store, period) {
    let allSignals = [];
    for (const provider of this.providers.values()) {
      try {
        const signals = await provider.fetchSignals(store, period);
        allSignals = allSignals.concat(signals);
      } catch (err) {
        console.error(`Error fetching signals from provider ${provider.getProviderName()}:`, err.message);
      }
    }
    return allSignals;
  }
}

// Singleton registry instance
const registry = new ExternalSignalProviderRegistry();
module.exports = registry;
