import FirecrawlApp from '@mendable/firecrawl-js'
import { getFirecrawlApiKey } from './cache.js'

// Initialize Firecrawl client
let firecrawl = null
let firecrawlApiKeyUsed = null

/**
 * Get or create Firecrawl client (async)
 */
export const getFirecrawl = async () => {
  const apiKey = await getFirecrawlApiKey()

  if (!apiKey) {
    return null
  }

  // Re-create client if API key changed
  if (firecrawl && firecrawlApiKeyUsed === apiKey) {
    return firecrawl
  }

  firecrawl = new FirecrawlApp({ apiKey })
  firecrawlApiKeyUsed = apiKey
  return firecrawl
}

/**
 * Check if Firecrawl is configured (async)
 */
export const isConfigured = async () => {
  const apiKey = await getFirecrawlApiKey()
  return !!apiKey
}

/**
 * Reset the client (useful for testing or when API key changes)
 */
export const resetClient = () => {
  firecrawl = null
  firecrawlApiKeyUsed = null
}

export default {
  getFirecrawl,
  isConfigured,
  resetClient
}
