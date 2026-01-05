/**
 * Redis Client
 * Provides Redis connection with automatic fallback to in-memory storage
 */

import Redis from 'ioredis'
import logger from './logger.js'
import config from '../config/index.js'

let redisClient = null
let isConnected = false

/**
 * Initialize Redis connection
 * @returns {Promise<Redis|null>} Redis client or null if connection fails
 */
export async function initRedis() {
  if (!config.redis?.enabled) {
    logger.info('Redis is disabled in config, using in-memory storage')
    return null
  }

  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db || 0,
      keyPrefix: config.redis.keyPrefix || 'booking:',
      retryStrategy: times => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries, falling back to in-memory')
          return null // Stop retrying
        }
        return Math.min(times * 200, 2000) // Retry delay
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    })

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connected')
    })

    redisClient.on('ready', () => {
      isConnected = true
      logger.info('Redis client ready')
    })

    redisClient.on('error', err => {
      logger.error('Redis client error:', err.message)
      isConnected = false
    })

    redisClient.on('close', () => {
      isConnected = false
      logger.warn('Redis connection closed')
    })

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...')
    })

    // Connect
    await redisClient.connect()

    // Test connection
    await redisClient.ping()
    isConnected = true
    logger.info('Redis connection established successfully')

    return redisClient
  } catch (error) {
    logger.warn(`Redis connection failed: ${error.message}. Using in-memory storage.`)
    redisClient = null
    isConnected = false
    return null
  }
}

/**
 * Get Redis client
 * @returns {Redis|null} Redis client or null if not connected
 */
export function getRedisClient() {
  return isConnected ? redisClient : null
}

/**
 * Check if Redis is connected
 * @returns {boolean} Connection status
 */
export function isRedisConnected() {
  return isConnected && redisClient !== null
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit()
      logger.info('Redis connection closed gracefully')
    } catch (error) {
      logger.error('Error closing Redis connection:', error.message)
      redisClient.disconnect()
    }
    redisClient = null
    isConnected = false
  }
}

/**
 * Redis-backed rate limiter store operations
 */
export const redisRateLimitStore = {
  /**
   * Get rate limit data for a key
   * @param {string} key - Rate limit key
   * @returns {Promise<Object|null>} Rate limit data or null
   */
  async get(key) {
    if (!isConnected || !redisClient) return null

    try {
      const data = await redisClient.get(`ratelimit:${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error.message)
      return null
    }
  },

  /**
   * Set rate limit data for a key
   * @param {string} key - Rate limit key
   * @param {Object} data - Rate limit data
   * @param {number} ttlMs - TTL in milliseconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, ttlMs) {
    if (!isConnected || !redisClient) return false

    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000)
      await redisClient.setex(`ratelimit:${key}`, ttlSeconds, JSON.stringify(data))
      return true
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error.message)
      return false
    }
  },

  /**
   * Increment rate limit counter atomically
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Window in milliseconds
   * @param {number} maxRequests - Max requests allowed
   * @returns {Promise<Object>} { count, remaining, resetTime, isNew }
   */
  async increment(key, windowMs, maxRequests) {
    if (!isConnected || !redisClient) return null

    try {
      const fullKey = `ratelimit:${key}`
      const now = Date.now()
      const ttlSeconds = Math.ceil(windowMs / 1000)

      // Use Lua script for atomic increment with TTL check
      const script = `
        local current = redis.call('GET', KEYS[1])
        local count = 1
        local resetTime = tonumber(ARGV[1])
        local isNew = 0

        if current then
          local data = cjson.decode(current)
          if tonumber(ARGV[2]) > data.resetTime then
            -- Window expired, reset
            count = 1
            resetTime = tonumber(ARGV[1])
            isNew = 1
          else
            count = data.count + 1
            resetTime = data.resetTime
          end
        else
          isNew = 1
        end

        local newData = cjson.encode({count = count, resetTime = resetTime, firstRequest = tonumber(ARGV[2])})
        redis.call('SETEX', KEYS[1], tonumber(ARGV[3]), newData)

        return cjson.encode({count = count, resetTime = resetTime, isNew = isNew})
      `

      const resetTime = now + windowMs
      const result = await redisClient.eval(script, 1, fullKey, resetTime, now, ttlSeconds)
      const parsed = JSON.parse(result)

      return {
        count: parsed.count,
        remaining: Math.max(0, maxRequests - parsed.count),
        resetTime: parsed.resetTime,
        isNew: parsed.isNew === 1
      }
    } catch (error) {
      logger.error(`Redis increment error for key ${key}:`, error.message)
      return null
    }
  },

  /**
   * Delete a key
   * @param {string} key - Rate limit key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!isConnected || !redisClient) return false

    try {
      await redisClient.del(`ratelimit:${key}`)
      return true
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error.message)
      return false
    }
  },

  /**
   * Get statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    if (!isConnected || !redisClient) {
      return { connected: false, keys: 0 }
    }

    try {
      const keys = await redisClient.keys('ratelimit:*')
      const info = await redisClient.info('memory')
      const memoryMatch = info.match(/used_memory_human:(\S+)/)

      return {
        connected: true,
        keys: keys.length,
        memory: memoryMatch ? memoryMatch[1] : 'unknown'
      }
    } catch (error) {
      logger.error('Redis stats error:', error.message)
      return { connected: false, keys: 0, error: error.message }
    }
  }
}

export default {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
  redisRateLimitStore
}
