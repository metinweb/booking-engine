/**
 * Cache Service Tests
 * Test in-memory caching functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  get,
  set,
  del,
  deleteByPattern,
  clear,
  getStats,
  generateCacheKey,
  CACHE_PREFIXES,
  CACHE_TTL
} from '../../services/cacheService.js'

describe('Cache Service', () => {
  beforeEach(() => {
    clear()
  })

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      set('test-key', { data: 'test-value' })
      const result = get('test-key')

      expect(result).toEqual({ data: 'test-value' })
    })

    it('should return null for non-existent key', () => {
      const result = get('non-existent')

      expect(result).toBeNull()
    })

    it('should delete a value', () => {
      set('test-key', 'test-value')
      del('test-key')
      const result = get('test-key')

      expect(result).toBeNull()
    })

    it('should handle different value types', () => {
      // String
      set('string-key', 'hello')
      expect(get('string-key')).toBe('hello')

      // Number
      set('number-key', 42)
      expect(get('number-key')).toBe(42)

      // Object
      set('object-key', { foo: 'bar' })
      expect(get('object-key')).toEqual({ foo: 'bar' })

      // Array
      set('array-key', [1, 2, 3])
      expect(get('array-key')).toEqual([1, 2, 3])

      // Boolean
      set('bool-key', true)
      expect(get('bool-key')).toBe(true)
    })
  })

  describe('TTL (Time To Live)', () => {
    it('should expire value after TTL', async () => {
      // Set with very short TTL
      set('short-ttl', 'value', 50) // 50ms

      // Should exist immediately
      expect(get('short-ttl')).toBe('value')

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should be expired
      expect(get('short-ttl')).toBeNull()
    })

    it('should not expire before TTL', async () => {
      set('long-ttl', 'value', 1000) // 1 second

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should still exist
      expect(get('long-ttl')).toBe('value')
    })
  })

  describe('Pattern Deletion', () => {
    it('should delete keys by pattern/prefix', () => {
      set('prefix:key1', 'value1')
      set('prefix:key2', 'value2')
      set('other:key3', 'value3')

      const deleted = deleteByPattern('prefix:')

      expect(deleted).toBe(2)
      expect(get('prefix:key1')).toBeNull()
      expect(get('prefix:key2')).toBeNull()
      expect(get('other:key3')).toBe('value3')
    })

    it('should return 0 when no keys match pattern', () => {
      set('key1', 'value1')
      const deleted = deleteByPattern('nonexistent:')

      expect(deleted).toBe(0)
    })
  })

  describe('Clear', () => {
    it('should clear all cached values', () => {
      set('key1', 'value1')
      set('key2', 'value2')
      set('key3', 'value3')

      clear()

      expect(get('key1')).toBeNull()
      expect(get('key2')).toBeNull()
      expect(get('key3')).toBeNull()
    })
  })

  describe('Statistics', () => {
    it('should track cache hits', () => {
      set('hit-test', 'value')
      get('hit-test')
      get('hit-test')

      const stats = getStats()
      expect(stats.hits).toBeGreaterThanOrEqual(2)
    })

    it('should track cache misses', () => {
      get('miss-test-1')
      get('miss-test-2')

      const stats = getStats()
      expect(stats.misses).toBeGreaterThanOrEqual(2)
    })

    it('should track sets and deletes', () => {
      const statsBefore = getStats()

      set('stat-test', 'value')
      del('stat-test')

      const statsAfter = getStats()
      expect(statsAfter.sets).toBeGreaterThan(statsBefore.sets)
      expect(statsAfter.deletes).toBeGreaterThan(statsBefore.deletes)
    })

    it('should return size information', () => {
      set('size-test-1', 'value1')
      set('size-test-2', 'value2')

      const stats = getStats()
      expect(stats.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('generateCacheKey', () => {
    it('should generate key from string params', () => {
      const key = generateCacheKey('prefix:', 'simple-value')
      expect(key).toBe('prefix:simple-value')
    })

    it('should generate key from object params with sorted keys', () => {
      const key1 = generateCacheKey('test:', { b: 2, a: 1 })
      const key2 = generateCacheKey('test:', { a: 1, b: 2 })

      // Keys should be the same regardless of property order
      expect(key1).toBe(key2)
      expect(key1).toContain('a:1')
      expect(key1).toContain('b:2')
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15')
      const key = generateCacheKey('date:', { checkIn: date })

      expect(key).toContain('2024-01-15')
    })

    it('should ignore null and undefined values', () => {
      const key = generateCacheKey('test:', {
        valid: 'value',
        nullVal: null,
        undefinedVal: undefined
      })

      expect(key).toContain('valid:value')
      expect(key).not.toContain('nullVal')
      expect(key).not.toContain('undefinedVal')
    })

    it('should handle nested objects', () => {
      const key = generateCacheKey('test:', {
        nested: { foo: 'bar' }
      })

      expect(key).toContain('nested:')
    })
  })

  describe('Cache Prefixes and TTL', () => {
    it('should have defined cache prefixes', () => {
      expect(CACHE_PREFIXES.PRICE_CALCULATION).toBe('price:')
      expect(CACHE_PREFIXES.EXCHANGE_RATE).toBe('exchange:')
      expect(CACHE_PREFIXES.HOTEL_INFO).toBe('hotel:')
      expect(CACHE_PREFIXES.ROOM_TYPES).toBe('roomtypes:')
      expect(CACHE_PREFIXES.AVAILABILITY).toBe('availability:')
    })

    it('should have defined TTL values', () => {
      expect(CACHE_TTL.PRICE_CALCULATION).toBe(5 * 60 * 1000) // 5 minutes
      expect(CACHE_TTL.EXCHANGE_RATE).toBe(6 * 60 * 60 * 1000) // 6 hours
      expect(CACHE_TTL.AVAILABILITY).toBe(1 * 60 * 1000) // 1 minute
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string keys', () => {
      set('', 'empty-key-value')
      expect(get('')).toBe('empty-key-value')
    })

    it('should handle special characters in keys', () => {
      set('key:with:colons', 'value1')
      set('key|with|pipes', 'value2')
      set('key/with/slashes', 'value3')

      expect(get('key:with:colons')).toBe('value1')
      expect(get('key|with|pipes')).toBe('value2')
      expect(get('key/with/slashes')).toBe('value3')
    })

    it('should handle overwriting existing keys', () => {
      set('overwrite-key', 'original')
      set('overwrite-key', 'updated')

      expect(get('overwrite-key')).toBe('updated')
    })

    it('should handle large values', () => {
      const largeArray = Array(10000).fill({ data: 'test' })
      set('large-key', largeArray)

      const result = get('large-key')
      expect(result).toHaveLength(10000)
    })
  })
})
