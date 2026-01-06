import logger from '../../core/logger.js'

// Cache for API key
let cachedApiKey = null
let cachedApiKeyExpiry = 0
const API_KEY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Firecrawl API key from database or environment
 * Database takes priority, with fallback to environment variable
 */
export const getFirecrawlApiKey = async () => {
  // Check cache first
  if (cachedApiKey && Date.now() < cachedApiKeyExpiry) {
    return cachedApiKey
  }

  try {
    // Try to load from database
    const { default: PlatformSettings } =
      await import('../../modules/platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()
    const credentials = settings.getFirecrawlCredentials()

    if (credentials?.apiKey) {
      cachedApiKey = credentials.apiKey
      cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
      return cachedApiKey
    }
  } catch (error) {
    logger.warn('Failed to load Firecrawl API key from database:', error.message)
  }

  // Fall back to environment variable
  if (process.env.FIRECRAWL_API_KEY) {
    cachedApiKey = process.env.FIRECRAWL_API_KEY
    cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
    return cachedApiKey
  }

  return null
}

/**
 * Clear the API key cache (useful for testing or when settings change)
 */
export const clearApiKeyCache = () => {
  cachedApiKey = null
  cachedApiKeyExpiry = 0
}

export default {
  getFirecrawlApiKey,
  clearApiKeyCache,
  API_KEY_CACHE_TTL
}
