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
  calculateCombinationMultiplier
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
})
