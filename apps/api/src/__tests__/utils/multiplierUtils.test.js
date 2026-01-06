/**
 * Multiplier Utils Tests
 * Test OBP (Occupancy Based Pricing) multiplier utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  generateDefaultAdultMultipliers,
  generateDefaultChildMultipliers,
  generateCombinationKey,
  generateCombinationName,
  calculateCombinationMultiplier,
  generateCombinationTable,
  getEffectiveMultiplier,
  calculatePrice,
  validateCombinationTable
} from '../../utils/multiplierUtils.js'

describe('Multiplier Utils', () => {
  describe('generateDefaultAdultMultipliers', () => {
    it('should generate multipliers with base occupancy 2', () => {
      const multipliers = generateDefaultAdultMultipliers(4, 2)

      expect(multipliers[1]).toBe(0.8) // Below base: -0.2
      expect(multipliers[2]).toBe(1.0) // Base
      expect(multipliers[3]).toBe(1.2) // Above base: +0.2
      expect(multipliers[4]).toBe(1.4) // Above base: +0.4
    })

    it('should handle base occupancy of 1', () => {
      const multipliers = generateDefaultAdultMultipliers(3, 1)

      expect(multipliers[1]).toBe(1.0) // Base
      expect(multipliers[2]).toBe(1.2) // +0.2
      expect(multipliers[3]).toBe(1.4) // +0.4
    })

    it('should handle custom minAdults', () => {
      const multipliers = generateDefaultAdultMultipliers(4, 2, 2)

      expect(multipliers[1]).toBeUndefined()
      expect(multipliers[2]).toBe(1.0)
      expect(multipliers[3]).toBe(1.2)
      expect(multipliers[4]).toBe(1.4)
    })

    it('should handle large maxAdults', () => {
      const multipliers = generateDefaultAdultMultipliers(10, 2)

      expect(Object.keys(multipliers)).toHaveLength(10)
      expect(multipliers[10]).toBe(2.6) // 1.0 + (10-2) * 0.2
    })
  })

  describe('generateDefaultChildMultipliers', () => {
    const ageGroups = [
      { code: 'infant', name: { tr: 'Bebek', en: 'Infant' } },
      { code: 'first', name: { tr: '1. Çocuk', en: 'First Child' } },
      { code: 'second', name: { tr: '2. Çocuk', en: 'Second Child' } }
    ]

    it('should generate multipliers for all child orders and age groups', () => {
      const multipliers = generateDefaultChildMultipliers(3, ageGroups)

      expect(Object.keys(multipliers)).toHaveLength(3)

      // Each order should have all age groups
      expect(multipliers[1]).toHaveProperty('infant', 0)
      expect(multipliers[1]).toHaveProperty('first', 0)
      expect(multipliers[1]).toHaveProperty('second', 0)

      expect(multipliers[2]).toHaveProperty('infant', 0)
      expect(multipliers[3]).toHaveProperty('infant', 0)
    })

    it('should default all multipliers to 0', () => {
      const multipliers = generateDefaultChildMultipliers(2, ageGroups)

      for (const order of [1, 2]) {
        for (const ageGroup of ageGroups) {
          expect(multipliers[order][ageGroup.code]).toBe(0)
        }
      }
    })

    it('should handle empty age groups', () => {
      const multipliers = generateDefaultChildMultipliers(2, [])

      expect(multipliers[1]).toEqual({})
      expect(multipliers[2]).toEqual({})
    })
  })

  describe('generateCombinationKey', () => {
    it('should generate key for adults only', () => {
      expect(generateCombinationKey(1)).toBe('1')
      expect(generateCombinationKey(2)).toBe('2')
      expect(generateCombinationKey(5)).toBe('5')
    })

    it('should generate key for adults with children', () => {
      const children = [{ order: 1, ageGroup: 'infant' }]
      expect(generateCombinationKey(2, children)).toBe('2+1_infant')
    })

    it('should generate key for multiple children sorted by order', () => {
      const children = [
        { order: 2, ageGroup: 'first' },
        { order: 1, ageGroup: 'infant' }
      ]
      expect(generateCombinationKey(2, children)).toBe('2+2_infant_first')
    })

    it('should handle empty children array', () => {
      expect(generateCombinationKey(2, [])).toBe('2')
    })
  })

  describe('generateCombinationName', () => {
    const ageGroups = [
      { code: 'infant', name: { tr: 'Bebek', en: 'Infant' } },
      { code: 'first', name: { tr: 'Çocuk', en: 'Child' } }
    ]

    it('should generate Turkish name for single adult', () => {
      expect(generateCombinationName(1, [], ageGroups, 'tr')).toBe('Tek Kişilik')
    })

    it('should generate English name for single adult', () => {
      expect(generateCombinationName(1, [], ageGroups, 'en')).toBe('Single')
    })

    it('should generate Turkish name for double occupancy', () => {
      expect(generateCombinationName(2, [], ageGroups, 'tr')).toBe('Çift Kişilik')
    })

    it('should generate English name for double occupancy', () => {
      expect(generateCombinationName(2, [], ageGroups, 'en')).toBe('Double')
    })

    it('should generate name for 3+ adults', () => {
      expect(generateCombinationName(3, [], ageGroups, 'tr')).toBe('3 Yetişkin')
      expect(generateCombinationName(4, [], ageGroups, 'en')).toBe('4 Adults')
    })

    it('should generate name with children', () => {
      const children = [{ order: 1, ageGroup: 'infant' }]
      expect(generateCombinationName(2, children, ageGroups, 'tr')).toBe('2+1 (Bebek)')
    })

    it('should generate name with multiple children', () => {
      const children = [
        { order: 1, ageGroup: 'infant' },
        { order: 2, ageGroup: 'first' }
      ]
      expect(generateCombinationName(2, children, ageGroups, 'tr')).toBe('2+2 (Bebek, Çocuk)')
    })

    it('should fallback to age group code when name not found', () => {
      const children = [{ order: 1, ageGroup: 'unknown' }]
      expect(generateCombinationName(2, children, ageGroups, 'tr')).toBe('2+1 (unknown)')
    })

    it('should use tr name when locale translation not found', () => {
      const children = [{ order: 1, ageGroup: 'infant' }]
      expect(generateCombinationName(2, children, ageGroups, 'de')).toBe('2+1 (Bebek)')
    })
  })

  describe('calculateCombinationMultiplier', () => {
    const adultMultipliers = {
      1: 0.8,
      2: 1.0,
      3: 1.2,
      4: 1.4
    }

    const childMultipliers = {
      1: { infant: 0, first: 0.3, second: 0.5 },
      2: { infant: 0, first: 0.4, second: 0.6 }
    }

    it('should calculate multiplier for adults only', () => {
      expect(calculateCombinationMultiplier(1, [], adultMultipliers, childMultipliers)).toBe(0.8)
      expect(calculateCombinationMultiplier(2, [], adultMultipliers, childMultipliers)).toBe(1.0)
      expect(calculateCombinationMultiplier(3, [], adultMultipliers, childMultipliers)).toBe(1.2)
    })

    it('should calculate multiplier with one child', () => {
      const children = [{ order: 1, ageGroup: 'infant' }]
      // 1.0 (2 adults) + 0 (infant) = 1.0
      expect(calculateCombinationMultiplier(2, children, adultMultipliers, childMultipliers)).toBe(1.0)

      const children2 = [{ order: 1, ageGroup: 'first' }]
      // 1.0 (2 adults) + 0.3 (first child) = 1.3
      expect(calculateCombinationMultiplier(2, children2, adultMultipliers, childMultipliers)).toBe(1.3)
    })

    it('should calculate multiplier with multiple children', () => {
      const children = [
        { order: 1, ageGroup: 'first' },
        { order: 2, ageGroup: 'second' }
      ]
      // 1.0 (2 adults) + 0.3 (1st child first) + 0.6 (2nd child second) = 1.9
      expect(calculateCombinationMultiplier(2, children, adultMultipliers, childMultipliers)).toBe(1.9)
    })

    it('should default to 1.0 for unknown adult count', () => {
      expect(calculateCombinationMultiplier(10, [], adultMultipliers, childMultipliers)).toBe(1.0)
    })

    it('should default to 0 for unknown child age group', () => {
      const children = [{ order: 1, ageGroup: 'unknown' }]
      // 1.0 (2 adults) + 0 (unknown) = 1.0
      expect(calculateCombinationMultiplier(2, children, adultMultipliers, childMultipliers)).toBe(1.0)
    })

    it('should handle empty child multipliers', () => {
      const children = [{ order: 1, ageGroup: 'first' }]
      expect(calculateCombinationMultiplier(2, children, adultMultipliers, {})).toBe(1.0)
    })

    it('should round to 2 decimal places', () => {
      // Create scenario that might cause floating point issues
      const testAdultMults = { 1: 0.333 }
      const testChildMults = { 1: { test: 0.666 } }
      const children = [{ order: 1, ageGroup: 'test' }]

      const result = calculateCombinationMultiplier(1, children, testAdultMults, testChildMults)
      // Should be 0.333 + 0.666 = 0.999, rounded to 1.0
      expect(result).toBe(1)
    })
  })

  describe('calculatePrice', () => {
    it('should calculate raw price without rounding', () => {
      expect(calculatePrice(100, 1.5, 'none')).toBe(150)
      expect(calculatePrice(100, 0.8, 'none')).toBe(80)
      expect(calculatePrice(200, 1.25, 'none')).toBe(250)
    })

    it('should round to nearest integer', () => {
      expect(calculatePrice(100, 1.234, 'nearest')).toBe(123)
      expect(calculatePrice(100, 1.236, 'nearest')).toBe(124)
      expect(calculatePrice(100, 1.235, 'nearest')).toBe(124) // 0.5 rounds up
    })

    it('should round up (ceiling)', () => {
      expect(calculatePrice(100, 1.231, 'up')).toBe(124)
      expect(calculatePrice(100, 1.239, 'up')).toBe(124)
      expect(calculatePrice(100, 1.201, 'up')).toBe(121)
    })

    it('should round down (floor)', () => {
      expect(calculatePrice(100, 1.239, 'down')).toBe(123)
      expect(calculatePrice(100, 1.999, 'down')).toBe(199)
    })

    it('should round to nearest 5', () => {
      expect(calculatePrice(100, 1.22, 'nearest5')).toBe(120)
      expect(calculatePrice(100, 1.23, 'nearest5')).toBe(125)
      expect(calculatePrice(100, 1.27, 'nearest5')).toBe(125)
      expect(calculatePrice(100, 1.28, 'nearest5')).toBe(130)
    })

    it('should round to nearest 10', () => {
      expect(calculatePrice(100, 1.24, 'nearest10')).toBe(120)
      expect(calculatePrice(100, 1.25, 'nearest10')).toBe(130)
      expect(calculatePrice(100, 1.35, 'nearest10')).toBe(140)
    })

    it('should default to no rounding for unknown rule', () => {
      expect(calculatePrice(100, 1.234, 'invalid')).toBe(123.4)
    })
  })

  describe('getEffectiveMultiplier', () => {
    it('should return null for inactive combinations', () => {
      const combo = { isActive: false, calculatedMultiplier: 1.0, overrideMultiplier: null }
      expect(getEffectiveMultiplier(combo)).toBeNull()
    })

    it('should return calculated multiplier when no override', () => {
      const combo = { isActive: true, calculatedMultiplier: 1.2, overrideMultiplier: null }
      expect(getEffectiveMultiplier(combo)).toBe(1.2)
    })

    it('should return calculated multiplier when override is undefined', () => {
      const combo = { isActive: true, calculatedMultiplier: 1.2, overrideMultiplier: undefined }
      expect(getEffectiveMultiplier(combo)).toBe(1.2)
    })

    it('should return override multiplier when set', () => {
      const combo = { isActive: true, calculatedMultiplier: 1.2, overrideMultiplier: 1.5 }
      expect(getEffectiveMultiplier(combo)).toBe(1.5)
    })

    it('should return 0 override (free) when explicitly set', () => {
      const combo = { isActive: true, calculatedMultiplier: 1.2, overrideMultiplier: 0 }
      expect(getEffectiveMultiplier(combo)).toBe(0)
    })
  })

  describe('generateCombinationTable', () => {
    const occupancy = {
      maxAdults: 3,
      minAdults: 1,
      maxChildren: 2,
      totalMaxGuests: 4,
      baseOccupancy: 2
    }
    const ageGroups = [
      { code: 'infant' },
      { code: 'child' }
    ]

    it('should generate combinations for all adult counts', () => {
      const table = generateCombinationTable(occupancy, ageGroups)

      const adultOnly = table.filter(c => c.children.length === 0)
      expect(adultOnly).toHaveLength(3)
      expect(adultOnly.map(c => c.adults).sort()).toEqual([1, 2, 3])
    })

    it('should generate adult+child combinations', () => {
      const table = generateCombinationTable(occupancy, ageGroups)

      const twoAdultOneChild = table.filter(c => c.adults === 2 && c.children.length === 1)
      expect(twoAdultOneChild).toHaveLength(2) // infant, child
    })

    it('should respect totalMaxGuests limit', () => {
      const table = generateCombinationTable(occupancy, ageGroups)

      // 3 adults + 2 children = 5, exceeds totalMaxGuests (4)
      const threeAdultsTwoChildren = table.filter(c => c.adults === 3 && c.children.length === 2)
      expect(threeAdultsTwoChildren).toHaveLength(0)

      // 3 adults + 1 child = 4, should exist
      const threeAdultsOneChild = table.filter(c => c.adults === 3 && c.children.length === 1)
      expect(threeAdultsOneChild).toHaveLength(2)
    })

    it('should mark all combinations as active by default', () => {
      const table = generateCombinationTable(occupancy, ageGroups)
      expect(table.every(c => c.isActive === true)).toBe(true)
    })

    it('should set overrideMultiplier to null by default', () => {
      const table = generateCombinationTable(occupancy, ageGroups)
      expect(table.every(c => c.overrideMultiplier === null)).toBe(true)
    })

    it('should calculate correct multipliers', () => {
      const table = generateCombinationTable(occupancy, ageGroups)

      const single = table.find(c => c.key === '1')
      const double = table.find(c => c.key === '2')
      const triple = table.find(c => c.key === '3')

      expect(single.calculatedMultiplier).toBe(0.8)
      expect(double.calculatedMultiplier).toBe(1.0)
      expect(triple.calculatedMultiplier).toBe(1.2)
    })
  })

  describe('validateCombinationTable', () => {
    it('should pass for valid table', () => {
      const table = [
        { key: '1', adults: 1, children: [], isActive: true, calculatedMultiplier: 0.8, overrideMultiplier: null },
        { key: '2', adults: 2, children: [], isActive: true, calculatedMultiplier: 1.0, overrideMultiplier: null }
      ]

      const result = validateCombinationTable(table)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if no active combinations', () => {
      const table = [
        { key: '2', adults: 2, children: [], isActive: false, calculatedMultiplier: 1.0, overrideMultiplier: null }
      ]

      const result = validateCombinationTable(table)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('En az bir kombinasyon aktif olmalı')
    })

    it('should fail if double (2 adults) is inactive', () => {
      const table = [
        { key: '1', adults: 1, children: [], isActive: true, calculatedMultiplier: 0.8, overrideMultiplier: null },
        { key: '2', adults: 2, children: [], isActive: false, calculatedMultiplier: 1.0, overrideMultiplier: null }
      ]

      const result = validateCombinationTable(table)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Çift kişilik'))).toBe(true)
    })

    it('should skip double validation if minAdults > 2', () => {
      const table = [
        { key: '3', adults: 3, children: [], isActive: true, calculatedMultiplier: 1.0, overrideMultiplier: null }
      ]

      const result = validateCombinationTable(table, 3)
      expect(result.isValid).toBe(true)
    })

    it('should fail for negative override multipliers', () => {
      const table = [
        { key: '2', adults: 2, children: [], isActive: true, calculatedMultiplier: 1.0, overrideMultiplier: -0.5 }
      ]

      const result = validateCombinationTable(table)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('negatif çarpan'))).toBe(true)
    })

    it('should allow zero override multiplier (free)', () => {
      const table = [
        { key: '2', adults: 2, children: [], isActive: true, calculatedMultiplier: 1.0, overrideMultiplier: 0 }
      ]

      const result = validateCombinationTable(table)
      expect(result.isValid).toBe(true)
    })
  })
})
