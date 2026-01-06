/**
 * Rate Limited Client
 * Wrapper for external API calls with rate limiting and retry logic
 */

import logger from '../core/logger.js'

/**
 * Rate limiter state for different API providers
 */
const rateLimiters = new Map()

/**
 * Default rate limit configurations per provider
 */
const DEFAULT_CONFIGS = {
  gemini: {
    maxRequests: 60,
    windowMs: 60000, // 1 minute
    retryAfterMs: 5000,
    maxRetries: 3
  },
  paximum: {
    maxRequests: 100,
    windowMs: 60000,
    retryAfterMs: 2000,
    maxRetries: 3
  },
  firecrawl: {
    maxRequests: 30,
    windowMs: 60000,
    retryAfterMs: 3000,
    maxRetries: 2
  },
  tcmb: {
    maxRequests: 10,
    windowMs: 60000,
    retryAfterMs: 10000,
    maxRetries: 2
  },
  default: {
    maxRequests: 50,
    windowMs: 60000,
    retryAfterMs: 2000,
    maxRetries: 3
  }
}

/**
 * Get or create rate limiter for a provider
 * @param {string} provider - Provider name
 * @returns {Object} Rate limiter state
 */
const getRateLimiter = provider => {
  if (!rateLimiters.has(provider)) {
    const config = DEFAULT_CONFIGS[provider] || DEFAULT_CONFIGS.default
    rateLimiters.set(provider, {
      config,
      requests: [],
      queue: []
    })
  }
  return rateLimiters.get(provider)
}

/**
 * Clean old requests from the window
 * @param {Object} limiter - Rate limiter state
 */
const cleanOldRequests = limiter => {
  const now = Date.now()
  const windowStart = now - limiter.config.windowMs
  limiter.requests = limiter.requests.filter(time => time > windowStart)
}

/**
 * Check if we can make a request
 * @param {Object} limiter - Rate limiter state
 * @returns {boolean}
 */
const canMakeRequest = limiter => {
  cleanOldRequests(limiter)
  return limiter.requests.length < limiter.config.maxRequests
}

/**
 * Wait until we can make a request
 * @param {Object} limiter - Rate limiter state
 * @returns {Promise<void>}
 */
const waitForSlot = async limiter => {
  while (!canMakeRequest(limiter)) {
    const oldestRequest = limiter.requests[0]
    const waitTime = oldestRequest + limiter.config.windowMs - Date.now() + 100
    logger.debug(`Rate limit reached, waiting ${waitTime}ms`)
    await sleep(Math.max(waitTime, 100))
    cleanOldRequests(limiter)
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Execute a rate-limited request
 * @param {string} provider - Provider name (gemini, paximum, firecrawl, etc.)
 * @param {Function} requestFn - Async function that makes the actual request
 * @param {Object} options - Options
 * @param {number} options.retries - Current retry count (internal)
 * @param {string} options.operationName - Name for logging
 * @returns {Promise<any>} Request result
 */
export const rateLimitedRequest = async (provider, requestFn, options = {}) => {
  const { retries = 0, operationName = 'request' } = options
  const limiter = getRateLimiter(provider)

  // Wait for available slot
  await waitForSlot(limiter)

  // Record this request
  limiter.requests.push(Date.now())

  try {
    const result = await requestFn()
    return result
  } catch (error) {
    // Check if it's a rate limit error (429)
    const isRateLimitError =
      error.status === 429 ||
      error.response?.status === 429 ||
      error.message?.includes('rate limit') ||
      error.message?.includes('quota exceeded') ||
      error.message?.includes('too many requests')

    if (isRateLimitError && retries < limiter.config.maxRetries) {
      const retryAfter = error.retryAfter || limiter.config.retryAfterMs
      logger.warn(
        `[${provider}] Rate limit hit for ${operationName}, retry ${retries + 1}/${limiter.config.maxRetries} after ${retryAfter}ms`
      )

      await sleep(retryAfter)

      return rateLimitedRequest(provider, requestFn, {
        ...options,
        retries: retries + 1
      })
    }

    // Check for transient errors that should be retried
    const isTransientError =
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.status === 503 ||
      error.status === 502

    if (isTransientError && retries < limiter.config.maxRetries) {
      const retryAfter = limiter.config.retryAfterMs * (retries + 1) // Exponential backoff
      logger.warn(
        `[${provider}] Transient error for ${operationName}, retry ${retries + 1}/${limiter.config.maxRetries} after ${retryAfter}ms`
      )

      await sleep(retryAfter)

      return rateLimitedRequest(provider, requestFn, {
        ...options,
        retries: retries + 1
      })
    }

    // Re-throw non-retryable errors
    throw error
  }
}

/**
 * Create a rate-limited wrapper for a service
 * @param {string} provider - Provider name
 * @returns {Function} Wrapper function
 */
export const createRateLimitedWrapper = provider => {
  return (requestFn, operationName = 'request') => {
    return rateLimitedRequest(provider, requestFn, { operationName })
  }
}

/**
 * Get current rate limit status for a provider
 * @param {string} provider - Provider name
 * @returns {Object} Status object
 */
export const getRateLimitStatus = provider => {
  const limiter = getRateLimiter(provider)
  cleanOldRequests(limiter)

  return {
    provider,
    requestsInWindow: limiter.requests.length,
    maxRequests: limiter.config.maxRequests,
    windowMs: limiter.config.windowMs,
    available: limiter.config.maxRequests - limiter.requests.length,
    percentUsed: Math.round((limiter.requests.length / limiter.config.maxRequests) * 100)
  }
}

/**
 * Reset rate limiter for a provider
 * @param {string} provider - Provider name
 */
export const resetRateLimiter = provider => {
  if (rateLimiters.has(provider)) {
    const limiter = rateLimiters.get(provider)
    limiter.requests = []
    limiter.queue = []
  }
}

/**
 * Configure rate limiter for a provider
 * @param {string} provider - Provider name
 * @param {Object} config - Configuration
 */
export const configureRateLimiter = (provider, config) => {
  const limiter = getRateLimiter(provider)
  limiter.config = { ...limiter.config, ...config }
}

// Pre-configured wrappers for common providers
export const geminiRateLimited = createRateLimitedWrapper('gemini')
export const paximumRateLimited = createRateLimitedWrapper('paximum')
export const firecrawlRateLimited = createRateLimitedWrapper('firecrawl')
export const tcmbRateLimited = createRateLimitedWrapper('tcmb')

export default {
  rateLimitedRequest,
  createRateLimitedWrapper,
  getRateLimitStatus,
  resetRateLimiter,
  configureRateLimiter,
  geminiRateLimited,
  paximumRateLimited,
  firecrawlRateLimited,
  tcmbRateLimited
}
