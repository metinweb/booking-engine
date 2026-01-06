/**
 * Planning Cache Service
 * Cache management endpoints for pricing data
 */

import { asyncHandler } from '#helpers'
import logger from '#core/logger.js'
import cache from '#services/cacheService.js'

/**
 * Get cache statistics
 */
export const getCacheStats = asyncHandler(async (req, res) => {
  const stats = cache.getStats()

  res.json({
    success: true,
    data: stats
  })
})

/**
 * Clear cache (all or by pattern)
 */
export const clearCache = asyncHandler(async (req, res) => {
  const { pattern } = req.body

  let clearedCount = 0
  if (pattern) {
    clearedCount = cache.deleteByPattern(pattern)
  } else {
    cache.clear()
    clearedCount = -1
  }

  logger.info(`Cache cleared by ${req.user.email}`, { pattern, clearedCount })

  res.json({
    success: true,
    message: pattern
      ? `Cleared ${clearedCount} cache entries matching pattern: ${pattern}`
      : 'Entire cache cleared',
    clearedCount
  })
})

/**
 * Invalidate cache for a specific entity
 */
export const invalidateCache = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params

  cache.invalidateEntity(entityType, entityId)

  logger.info(`Cache invalidated for ${entityType}:${entityId} by ${req.user.email}`)

  res.json({
    success: true,
    message: `Cache invalidated for ${entityType}:${entityId}`
  })
})
