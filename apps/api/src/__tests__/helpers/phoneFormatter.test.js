/**
 * Phone Formatter Tests
 * Tests for phone number formatting utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  normalizePhone,
  formatPhoneForTurkey,
  formatPhoneForSMS,
  formatPhoneInternational,
  isValidTurkishPhone,
  isValidPhone,
  extractCountryCode
} from '../../helpers/phoneFormatter.js'

describe('Phone Formatter', () => {
  describe('normalizePhone', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhone('+90 (532) 123 45 67')).toBe('905321234567')
      expect(normalizePhone('0532-123-4567')).toBe('05321234567')
      expect(normalizePhone('532.123.4567')).toBe('5321234567')
    })

    it('should return empty string for falsy input', () => {
      expect(normalizePhone(null)).toBe('')
      expect(normalizePhone(undefined)).toBe('')
      expect(normalizePhone('')).toBe('')
    })

    it('should handle already normalized input', () => {
      expect(normalizePhone('5321234567')).toBe('5321234567')
    })
  })

  describe('formatPhoneForTurkey', () => {
    it('should format 10-digit mobile number', () => {
      expect(formatPhoneForTurkey('5321234567')).toBe('(532) 123 45 67')
    })

    it('should format 11-digit number with leading 0', () => {
      expect(formatPhoneForTurkey('05321234567')).toBe('(532) 123 45 67')
    })

    it('should format 12-digit number with country code', () => {
      expect(formatPhoneForTurkey('905321234567')).toBe('+90 (532) 123 45 67')
    })

    it('should handle already formatted input', () => {
      expect(formatPhoneForTurkey('+90 (532) 123 45 67')).toBe('+90 (532) 123 45 67')
    })

    it('should return original for unrecognized format', () => {
      expect(formatPhoneForTurkey('12345')).toBe('12345')
      expect(formatPhoneForTurkey('invalidphone')).toBe('invalidphone')
    })
  })

  describe('formatPhoneForSMS', () => {
    it('should convert 10-digit to E.164 format', () => {
      expect(formatPhoneForSMS('5321234567')).toBe('905321234567')
    })

    it('should convert 11-digit with leading 0', () => {
      expect(formatPhoneForSMS('05321234567')).toBe('905321234567')
    })

    it('should keep already correct format', () => {
      expect(formatPhoneForSMS('905321234567')).toBe('905321234567')
    })

    it('should handle formatted input', () => {
      expect(formatPhoneForSMS('+90 (532) 123 45 67')).toBe('905321234567')
    })

    it('should return digits for unrecognized format', () => {
      expect(formatPhoneForSMS('12345678901234')).toBe('12345678901234')
    })
  })

  describe('formatPhoneInternational', () => {
    it('should format Turkish number', () => {
      expect(formatPhoneInternational('5321234567', 'TR')).toBe('(532) 123 45 67')
    })

    it('should format generic international number', () => {
      const result = formatPhoneInternational('14155551234', 'US')
      expect(result).toContain('+')
    })

    it('should return original for short numbers', () => {
      expect(formatPhoneInternational('12345', 'US')).toBe('12345')
    })
  })

  describe('isValidTurkishPhone', () => {
    it('should validate 10-digit mobile starting with 5', () => {
      expect(isValidTurkishPhone('5321234567')).toBe(true)
      expect(isValidTurkishPhone('5551234567')).toBe(true)
    })

    it('should validate 11-digit with leading 05', () => {
      expect(isValidTurkishPhone('05321234567')).toBe(true)
    })

    it('should validate 12-digit with 90 prefix', () => {
      expect(isValidTurkishPhone('905321234567')).toBe(true)
    })

    it('should validate formatted numbers', () => {
      expect(isValidTurkishPhone('+90 (532) 123 45 67')).toBe(true)
      expect(isValidTurkishPhone('0532-123-4567')).toBe(true)
    })

    it('should reject invalid numbers', () => {
      expect(isValidTurkishPhone('1234567890')).toBe(false) // doesn't start with 5
      expect(isValidTurkishPhone('53212345')).toBe(false) // too short
      expect(isValidTurkishPhone('invalidphone')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate by length', () => {
      expect(isValidPhone('1234567890')).toBe(true) // 10 digits
      expect(isValidPhone('12345678901234')).toBe(true) // 14 digits
    })

    it('should reject too short numbers', () => {
      expect(isValidPhone('123456789')).toBe(false) // 9 digits
    })

    it('should reject too long numbers', () => {
      expect(isValidPhone('1234567890123456')).toBe(false) // 16 digits
    })

    it('should use custom length options', () => {
      expect(isValidPhone('12345', { minLength: 5, maxLength: 10 })).toBe(true)
      expect(isValidPhone('1234', { minLength: 5 })).toBe(false)
    })

    it('should validate Turkish numbers when countryCode is TR', () => {
      expect(isValidPhone('5321234567', { countryCode: 'TR' })).toBe(true)
      expect(isValidPhone('1234567890', { countryCode: 'TR' })).toBe(false)
    })
  })

  describe('extractCountryCode', () => {
    it('should extract Turkish country code', () => {
      expect(extractCountryCode('905321234567')).toBe('TR')
    })

    it('should extract US country code', () => {
      expect(extractCountryCode('14155551234')).toBe('US')
    })

    it('should extract UK country code', () => {
      expect(extractCountryCode('447911123456')).toBe('GB')
    })

    it('should extract German country code', () => {
      expect(extractCountryCode('491511234567')).toBe('DE')
    })

    it('should extract Russian country code', () => {
      expect(extractCountryCode('79161234567')).toBe('RU')
    })

    it('should return null for unknown country code', () => {
      expect(extractCountryCode('999123456789')).toBe(null)
    })

    it('should handle formatted numbers', () => {
      expect(extractCountryCode('+90 532 123 4567')).toBe('TR')
    })
  })
})
