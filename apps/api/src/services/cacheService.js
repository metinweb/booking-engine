/**
 * @module services/cacheService
 * @description In-memory caching service with TTL support.
 * Provides cache-aside pattern, statistics, and automatic cleanup.
 * In production, replace with Redis for distributed caching.
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} expiresAt - Expiration timestamp
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Cache statistics
 * @typedef {Object} CacheStats
 * @property {number} hits - Number of cache hits
 * @property {number} misses - Number of cache misses
 * @property {number} sets - Number of cache sets
 * @property {number} deletes - Number of cache deletes
 * @property {string} hitRate - Hit rate percentage
 * @property {number} size - Current cache size
 * @property {string} memoryEstimate - Estimated memory usage
 */

/** @type {Map<string, CacheEntry>} In-memory cache store */
const cacheStore = new Map()

/** @type {{hits: number, misses: number, sets: number, deletes: number}} */
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
}

/** @constant {number} Default TTL: 5 minutes (in ms) */
const DEFAULT_TTL = 5 * 60 * 1000

/**
 * Cache prefixes for different data types
 * @constant {Object.<string, string>}
 * @example
 * const key = `${CACHE_PREFIXES.HOTEL_INFO}${hotelId}`
 */
export const CACHE_PREFIXES = {
  PRICE_CALCULATION: 'price:',
  EXCHANGE_RATE: 'exchange:',
  HOTEL_INFO: 'hotel:',
  ROOM_TYPES: 'roomtypes:',
  MEAL_PLANS: 'mealplans:',
  CAMPAIGNS: 'campaigns:',
  AVAILABILITY: 'availability:',
  RATE: 'rate:'
}

/**
 * TTL values for different cache types (in milliseconds)
 * @constant {Object.<string, number>}
 * @example
 * set(key, value, CACHE_TTL.EXCHANGE_RATE) // 6 hours TTL
 */
export const CACHE_TTL = {
  PRICE_CALCULATION: 5 * 60 * 1000, // 5 minutes
  EXCHANGE_RATE: 6 * 60 * 60 * 1000, // 6 hours
  HOTEL_INFO: 30 * 60 * 1000, // 30 minutes
  ROOM_TYPES: 30 * 60 * 1000, // 30 minutes
  MEAL_PLANS: 30 * 60 * 1000, // 30 minutes
  CAMPAIGNS: 10 * 60 * 1000, // 10 minutes
  AVAILABILITY: 1 * 60 * 1000, // 1 minute (shorter due to real-time nature)
  RATE: 5 * 60 * 1000 // 5 minutes
}

/**
 * Generate cache key from parameters
 * Keys are generated consistently by sorting object keys
 * @param {string} prefix - Cache prefix from CACHE_PREFIXES
 * @param {Object|string} params - Parameters to generate key from
 * @returns {string} Cache key
 * @example
 * generateCacheKey(CACHE_PREFIXES.HOTEL_INFO, '123') // 'hotel:123'
 * generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, { hotelId: '123', date: '2024-01-15' })
 * // 'price:date:2024-01-15|hotelId:123'
 */
export function generateCacheKey(prefix, params) {
  if (typeof params === 'string') {
    return `${prefix}${params}`
  }

  // Sort keys for consistent key generation
  const sortedKeys = Object.keys(params).sort()
  const keyParts = sortedKeys
    .map(key => {
      const value = params[key]
      if (value === undefined || value === null) return null
      if (typeof value === 'object') {
        if (value instanceof Date) {
          return `${key}:${value.toISOString().split('T')[0]}`
        }
        return `${key}:${JSON.stringify(value)}`
      }
      return `${key}:${value}`
    })
    .filter(Boolean)

  return `${prefix}${keyParts.join('|')}`
}

/**
 * Get value from cache
 * Returns null if key doesn't exist or has expired
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if not found/expired
 * @example
 * const data = get('hotel:123')
 * if (data) {
 *   // Use cached data
 * }
 */
export function get(key) {
  const entry = cacheStore.get(key)

  if (!entry) {
    stats.misses++
    return null
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key)
    stats.misses++
    return null
  }

  stats.hits++
  return entry.value
}

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {*} value - Value to cache (will be stored as-is)
 * @param {number} [ttl=300000] - Time to live in milliseconds (default: 5 minutes)
 * @returns {void}
 * @example
 * set('hotel:123', hotelData, CACHE_TTL.HOTEL_INFO)
 */
export function set(key, value, ttl = DEFAULT_TTL) {
  stats.sets++
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now()
  })
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {void}
 * @example
 * del('hotel:123')
 */
export function del(key) {
  stats.deletes++
  cacheStore.delete(key)
}

/**
 * Delete all keys matching a pattern (prefix match)
 * @param {string} pattern - Pattern to match (prefix)
 * @returns {number} Number of deleted entries
 * @example
 * deleteByPattern('price:hotelId:123') // Delete all price cache for hotel 123
 */
export function deleteByPattern(pattern) {
  let count = 0
  for (const key of cacheStore.keys()) {
    if (key.startsWith(pattern)) {
      cacheStore.delete(key)
      count++
    }
  }
  stats.deletes += count
  return count
}

/**
 * Clear entire cache
 * Use with caution - removes all cached data
 * @returns {void}
 */
export function clear() {
  const size = cacheStore.size
  cacheStore.clear()
  stats.deletes += size
}

/**
 * Get cache statistics including hit rate and memory usage
 * @returns {CacheStats} Cache statistics
 * @example
 * const stats = getStats()
 * console.log(`Hit rate: ${stats.hitRate}, Size: ${stats.size}`)
 */
export function getStats() {
  const hitRate =
    stats.hits + stats.misses > 0
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
      : 0

  return {
    ...stats,
    hitRate: `${hitRate}%`,
    size: cacheStore.size,
    memoryEstimate: estimateMemoryUsage()
  }
}

/**
 * Reset cache statistics counters to zero
 * Does not clear the cache itself
 * @returns {void}
 */
export function resetStats() {
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  }
}

/**
 * Estimate memory usage (rough estimate)
 * @private
 * @returns {string} Memory usage in human readable format (B, KB, or MB)
 */
function estimateMemoryUsage() {
  let bytes = 0
  for (const [key, entry] of cacheStore) {
    bytes += key.length * 2 // UTF-16
    bytes += JSON.stringify(entry.value).length * 2
    bytes += 16 // expiresAt and createdAt
  }

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Clean up expired entries
 * Automatically runs every 5 minutes via setInterval
 * @returns {number} Number of cleaned entries
 */
export function cleanup() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of cacheStore) {
    if (now > entry.expiresAt) {
      cacheStore.delete(key)
      cleaned++
    }
  }

  return cleaned
}

/**
 * Get or set cached value (cache-aside pattern)
 * If value exists in cache, returns it. Otherwise, calls fetchFn and caches the result.
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch value if not cached
 * @param {number} [ttl=300000] - Time to live in milliseconds
 * @returns {Promise<*>} Cached or fetched value
 * @example
 * const hotel = await getOrSet(
 *   `${CACHE_PREFIXES.HOTEL_INFO}${hotelId}`,
 *   () => Hotel.findById(hotelId),
 *   CACHE_TTL.HOTEL_INFO
 * )
 */
export async function getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
  const cached = get(key)
  if (cached !== null) {
    return cached
  }

  const value = await fetchFn()
  if (value !== undefined && value !== null) {
    set(key, value, ttl)
  }

  return value
}

/**
 * Invalidate cache for specific entity
 * Clears all related cache entries when an entity is updated
 * @param {'hotel'|'rate'|'campaign'} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {void}
 * @example
 * // When a hotel is updated, invalidate all related caches
 * invalidateEntity('hotel', hotelId)
 */
export function invalidateEntity(entityType, entityId) {
  const patterns = []

  switch (entityType) {
    case 'hotel':
      patterns.push(
        `${CACHE_PREFIXES.HOTEL_INFO}${entityId}`,
        `${CACHE_PREFIXES.ROOM_TYPES}${entityId}`,
        `${CACHE_PREFIXES.MEAL_PLANS}${entityId}`,
        `${CACHE_PREFIXES.CAMPAIGNS}${entityId}`
      )
      // Also invalidate all prices for this hotel
      deleteByPattern(`${CACHE_PREFIXES.PRICE_CALCULATION}hotelId:${entityId}`)
      deleteByPattern(`${CACHE_PREFIXES.AVAILABILITY}hotelId:${entityId}`)
      break

    case 'rate':
      // Invalidate rate and related price calculations
      del(`${CACHE_PREFIXES.RATE}${entityId}`)
      // We can't easily invalidate all related prices, so we rely on TTL
      break

    case 'campaign': {
      // Invalidate campaigns - price will be recalculated with new campaigns
      const campaignKey = `${CACHE_PREFIXES.CAMPAIGNS}${entityId}`
      del(campaignKey)
      break
    }

    default:
      // Generic invalidation
      patterns.forEach(pattern => deleteByPattern(pattern))
  }

  patterns.forEach(pattern => del(pattern))
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000)

export default {
  CACHE_PREFIXES,
  CACHE_TTL,
  generateCacheKey,
  get,
  set,
  del,
  deleteByPattern,
  clear,
  getStats,
  resetStats,
  cleanup,
  getOrSet,
  invalidateEntity
}
