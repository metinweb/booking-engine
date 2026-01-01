/**
 * Cache Service
 * In-memory caching with TTL support
 * In production, replace with Redis for distributed caching
 */

// In-memory cache store
const cacheStore = new Map()

// Cache statistics
let stats = {
	hits: 0,
	misses: 0,
	sets: 0,
	deletes: 0
}

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000

// Cache prefixes for different data types
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

// TTL values for different cache types (in ms)
export const CACHE_TTL = {
	PRICE_CALCULATION: 5 * 60 * 1000,     // 5 minutes
	EXCHANGE_RATE: 6 * 60 * 60 * 1000,    // 6 hours
	HOTEL_INFO: 30 * 60 * 1000,           // 30 minutes
	ROOM_TYPES: 30 * 60 * 1000,           // 30 minutes
	MEAL_PLANS: 30 * 60 * 1000,           // 30 minutes
	CAMPAIGNS: 10 * 60 * 1000,            // 10 minutes
	AVAILABILITY: 1 * 60 * 1000,          // 1 minute (shorter due to real-time nature)
	RATE: 5 * 60 * 1000                   // 5 minutes
}

/**
 * Generate cache key from params
 * @param {string} prefix - Cache prefix
 * @param {Object|string} params - Parameters to generate key from
 * @returns {string} Cache key
 */
export function generateCacheKey(prefix, params) {
	if (typeof params === 'string') {
		return `${prefix}${params}`
	}

	// Sort keys for consistent key generation
	const sortedKeys = Object.keys(params).sort()
	const keyParts = sortedKeys.map(key => {
		const value = params[key]
		if (value === undefined || value === null) return null
		if (typeof value === 'object') {
			if (value instanceof Date) {
				return `${key}:${value.toISOString().split('T')[0]}`
			}
			return `${key}:${JSON.stringify(value)}`
		}
		return `${key}:${value}`
	}).filter(Boolean)

	return `${prefix}${keyParts.join('|')}`
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if not found/expired
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
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
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
 */
export function del(key) {
	stats.deletes++
	cacheStore.delete(key)
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (prefix)
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
 */
export function clear() {
	const size = cacheStore.size
	cacheStore.clear()
	stats.deletes += size
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getStats() {
	const hitRate = stats.hits + stats.misses > 0
		? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
		: 0

	return {
		...stats,
		hitRate: `${hitRate}%`,
		size: cacheStore.size,
		memoryEstimate: estimateMemoryUsage()
	}
}

/**
 * Reset statistics
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
 * @returns {string} Memory usage in human readable format
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
 * Clean up expired entries (run periodically)
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
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch value if not cached
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<*>} Cached or fetched value
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
 * @param {string} entityType - Entity type (hotel, rate, etc.)
 * @param {string} entityId - Entity ID
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

		case 'campaign':
			// Invalidate campaigns - price will be recalculated with new campaigns
			const campaignKey = `${CACHE_PREFIXES.CAMPAIGNS}${entityId}`
			del(campaignKey)
			break

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
