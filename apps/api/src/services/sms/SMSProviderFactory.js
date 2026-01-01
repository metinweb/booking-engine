import logger from '../../core/logger.js'

// Lazy load providers to avoid circular dependencies
const providerModules = {
  netgsm: () => import('./providers/NetGSMProvider.js'),
  iletimerkezi: () => import('./providers/IletiMerkeziProvider.js'),
  twilio: () => import('./providers/TwilioProvider.js'),
  vonage: () => import('./providers/VonageProvider.js')
}

/**
 * SMS Provider Factory
 * Creates SMS provider instances based on provider type and configuration
 */
class SMSProviderFactory {
  constructor() {
    this.providerCache = new Map()
  }

  /**
   * Get list of available providers with their metadata
   * @returns {Array<{name: string, displayName: string, fields: Array, supportsBalance: boolean}>}
   */
  async getAvailableProviders() {
    const providers = []

    for (const [name, loader] of Object.entries(providerModules)) {
      try {
        const module = await loader()
        const Provider = module.default

        providers.push({
          name: Provider.providerName,
          displayName: Provider.displayName,
          fields: Provider.requiredFields,
          supportsBalance: Provider.supportsBalance
        })
      } catch (error) {
        logger.error(`Failed to load provider ${name}:`, error.message)
      }
    }

    return providers
  }

  /**
   * Create SMS provider instance
   * @param {string} providerType - Provider type (netgsm, iletimerkezi, twilio, vonage)
   * @param {Object} config - Provider configuration
   * @returns {Promise<ISMSProvider>}
   */
  async createProvider(providerType, config) {
    const loader = providerModules[providerType]

    if (!loader) {
      throw new Error(`Unknown SMS provider: ${providerType}`)
    }

    try {
      const module = await loader()
      const Provider = module.default
      return new Provider(config)
    } catch (error) {
      logger.error(`Failed to create provider ${providerType}:`, error.message)
      throw error
    }
  }

  /**
   * Get or create cached provider instance
   * @param {string} cacheKey - Unique cache key (e.g., partnerId or 'platform')
   * @param {string} providerType - Provider type
   * @param {Object} config - Provider configuration
   * @returns {Promise<ISMSProvider>}
   */
  async getProvider(cacheKey, providerType, config) {
    const fullKey = `${cacheKey}:${providerType}`

    if (this.providerCache.has(fullKey)) {
      return this.providerCache.get(fullKey)
    }

    const provider = await this.createProvider(providerType, config)
    this.providerCache.set(fullKey, provider)

    return provider
  }

  /**
   * Clear cached provider
   * @param {string} cacheKey - Cache key to clear
   */
  clearCache(cacheKey) {
    for (const key of this.providerCache.keys()) {
      if (key.startsWith(cacheKey + ':')) {
        this.providerCache.delete(key)
      }
    }
  }

  /**
   * Clear all cached providers
   */
  clearAllCache() {
    this.providerCache.clear()
  }

  /**
   * Get provider metadata by type
   * @param {string} providerType - Provider type
   * @returns {Promise<Object|null>}
   */
  async getProviderInfo(providerType) {
    const loader = providerModules[providerType]

    if (!loader) {
      return null
    }

    try {
      const module = await loader()
      const Provider = module.default

      return {
        name: Provider.providerName,
        displayName: Provider.displayName,
        fields: Provider.requiredFields,
        supportsBalance: Provider.supportsBalance
      }
    } catch (error) {
      logger.error(`Failed to get provider info for ${providerType}:`, error.message)
      return null
    }
  }
}

// Export singleton
const smsProviderFactory = new SMSProviderFactory()
export default smsProviderFactory

export { SMSProviderFactory }
