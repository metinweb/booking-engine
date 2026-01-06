/**
 * Query Builder Service Tests
 * Tests for pagination, filtering, and search utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  buildSearchFilter,
  buildDateFilter,
  buildStatusFilter,
  buildFilterFromQuery
} from '../../services/queryBuilder.js'

describe('Query Builder', () => {
  describe('Constants', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PAGE).toBe(1)
      expect(DEFAULT_LIMIT).toBe(20)
      expect(MAX_LIMIT).toBe(100)
    })
  })

  describe('parsePagination', () => {
    it('should return defaults for empty query', () => {
      const result = parsePagination({})

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.skip).toBe(0)
    })

    it('should parse page and limit from query', () => {
      const result = parsePagination({ page: '3', limit: '50' })

      expect(result.page).toBe(3)
      expect(result.limit).toBe(50)
      expect(result.skip).toBe(100) // (3-1) * 50
    })

    it('should enforce minimum page of 1', () => {
      const result = parsePagination({ page: '0' })
      expect(result.page).toBe(1)

      const result2 = parsePagination({ page: '-5' })
      expect(result2.page).toBe(1)
    })

    it('should enforce maximum limit', () => {
      const result = parsePagination({ limit: '500' })
      expect(result.limit).toBe(MAX_LIMIT)
    })

    it('should allow custom max limit', () => {
      const result = parsePagination({ limit: '200' }, { maxLimit: 250 })
      expect(result.limit).toBe(200)
    })

    it('should use custom defaults', () => {
      const result = parsePagination({}, { defaultPage: 2, defaultLimit: 10 })

      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
    })

    it('should handle non-numeric input', () => {
      const result = parsePagination({ page: 'abc', limit: 'xyz' })

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should calculate correct skip for different pages', () => {
      expect(parsePagination({ page: '1', limit: '10' }).skip).toBe(0)
      expect(parsePagination({ page: '2', limit: '10' }).skip).toBe(10)
      expect(parsePagination({ page: '5', limit: '20' }).skip).toBe(80)
    })
  })

  describe('buildSearchFilter', () => {
    it('should return existing filter if no search term', () => {
      const existing = { status: 'active' }
      const result = buildSearchFilter('', ['name'], existing)

      expect(result).toEqual({ status: 'active' })
    })

    it('should return existing filter if no fields', () => {
      const existing = { status: 'active' }
      const result = buildSearchFilter('test', [], existing)

      expect(result).toEqual({ status: 'active' })
    })

    it('should build $or filter for single field', () => {
      const result = buildSearchFilter('john', ['name'])

      expect(result.$or).toHaveLength(1)
      expect(result.$or[0].name.$regex).toBe('john')
      expect(result.$or[0].name.$options).toBe('i')
    })

    it('should build $or filter for multiple fields', () => {
      const result = buildSearchFilter('test', ['name', 'email', 'phone'])

      expect(result.$or).toHaveLength(3)
      expect(result.$or[0]).toHaveProperty('name')
      expect(result.$or[1]).toHaveProperty('email')
      expect(result.$or[2]).toHaveProperty('phone')
    })

    it('should merge with existing filter', () => {
      const existing = { status: 'active' }
      const result = buildSearchFilter('john', ['name'], existing)

      expect(result.status).toBe('active')
      expect(result.$or).toBeDefined()
    })

    it('should handle existing $or with $and', () => {
      const existing = { $or: [{ a: 1 }, { b: 2 }] }
      const result = buildSearchFilter('test', ['name'], existing)

      expect(result.$and).toBeDefined()
      expect(result.$and).toHaveLength(2)
    })
  })

  describe('buildDateFilter', () => {
    it('should return existing filter if no dates', () => {
      const existing = { status: 'active' }
      const result = buildDateFilter('createdAt', null, null, existing)

      expect(result).toEqual({ status: 'active' })
    })

    it('should build $gte filter for start date only', () => {
      const result = buildDateFilter('createdAt', '2024-01-01', null)

      expect(result.createdAt.$gte).toEqual(new Date('2024-01-01'))
      expect(result.createdAt.$lte).toBeUndefined()
    })

    it('should build $lte filter for end date only', () => {
      const result = buildDateFilter('createdAt', null, '2024-12-31')

      expect(result.createdAt.$lte).toBeDefined()
      expect(result.createdAt.$gte).toBeUndefined()
    })

    it('should set end date to end of day', () => {
      const result = buildDateFilter('createdAt', null, '2024-06-15')
      const endDate = result.createdAt.$lte

      expect(endDate.getHours()).toBe(23)
      expect(endDate.getMinutes()).toBe(59)
      expect(endDate.getSeconds()).toBe(59)
    })

    it('should build both $gte and $lte for date range', () => {
      const result = buildDateFilter('checkIn', '2024-06-01', '2024-06-30')

      expect(result.checkIn.$gte).toEqual(new Date('2024-06-01'))
      expect(result.checkIn.$lte).toBeDefined()
    })

    it('should merge with existing filter', () => {
      const existing = { status: 'confirmed' }
      const result = buildDateFilter('checkIn', '2024-06-01', null, existing)

      expect(result.status).toBe('confirmed')
      expect(result.checkIn.$gte).toBeDefined()
    })
  })

  describe('buildStatusFilter', () => {
    it('should return existing filter if no status', () => {
      const existing = { partner: '123' }
      const result = buildStatusFilter(null, existing)

      expect(result).toEqual({ partner: '123' })
    })

    it('should return existing filter if status is "all"', () => {
      const existing = { partner: '123' }
      const result = buildStatusFilter('all', existing)

      expect(result).toEqual({ partner: '123' })
    })

    it('should add status filter', () => {
      const result = buildStatusFilter('active')

      expect(result.status).toBe('active')
    })

    it('should use custom field name', () => {
      const result = buildStatusFilter('confirmed', {}, 'bookingStatus')

      expect(result.bookingStatus).toBe('confirmed')
      expect(result.status).toBeUndefined()
    })

    it('should merge with existing filter', () => {
      const existing = { partner: '123' }
      const result = buildStatusFilter('active', existing)

      expect(result.partner).toBe('123')
      expect(result.status).toBe('active')
    })
  })

  describe('buildFilterFromQuery', () => {
    it('should return base filter for empty query', () => {
      const result = buildFilterFromQuery({}, { baseFilter: { partner: '123' } })

      expect(result).toEqual({ partner: '123' })
    })

    it('should build search filter', () => {
      const result = buildFilterFromQuery(
        { search: 'john' },
        { searchFields: ['name', 'email'] }
      )

      expect(result.$or).toHaveLength(2)
    })

    it('should build status filter', () => {
      const result = buildFilterFromQuery({ status: 'active' })

      expect(result.status).toBe('active')
    })

    it('should build date filter', () => {
      const result = buildFilterFromQuery({
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })

      expect(result.createdAt.$gte).toBeDefined()
      expect(result.createdAt.$lte).toBeDefined()
    })

    it('should use custom date field', () => {
      const result = buildFilterFromQuery(
        { startDate: '2024-01-01' },
        { dateField: 'checkIn' }
      )

      expect(result.checkIn).toBeDefined()
      expect(result.createdAt).toBeUndefined()
    })

    it('should add additional fields', () => {
      const result = buildFilterFromQuery(
        { hotelId: '456', marketId: '789' },
        { additionalFields: ['hotelId', 'marketId'] }
      )

      expect(result.hotelId).toBe('456')
      expect(result.marketId).toBe('789')
    })

    it('should skip additional fields with "all" value', () => {
      const result = buildFilterFromQuery(
        { hotelId: 'all' },
        { additionalFields: ['hotelId'] }
      )

      expect(result.hotelId).toBeUndefined()
    })

    it('should combine all filters', () => {
      const result = buildFilterFromQuery(
        {
          search: 'test',
          status: 'active',
          startDate: '2024-01-01',
          hotelId: '123'
        },
        {
          baseFilter: { partner: 'p1' },
          searchFields: ['name'],
          additionalFields: ['hotelId']
        }
      )

      expect(result.partner).toBe('p1')
      expect(result.$or).toBeDefined()
      expect(result.status).toBe('active')
      expect(result.createdAt).toBeDefined()
      expect(result.hotelId).toBe('123')
    })
  })
})
