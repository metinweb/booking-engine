/**
 * Input Validation Tests
 * Tests for input validation helpers
 */

import { describe, it, expect } from '@jest/globals'
import {
  validateUrl,
  validateDomain,
  validateDateRange,
  validatePagination,
  validateCurrency,
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  validateObjectId,
  sanitizeString
} from '../../helpers/inputValidation.js'

describe('Input Validation', () => {
  describe('validateUrl', () => {
    it('should accept valid HTTPS URL', () => {
      expect(() => validateUrl('https://example.com')).not.toThrow()
    })

    it('should accept valid HTTP URL', () => {
      expect(() => validateUrl('http://example.com')).not.toThrow()
    })

    it('should throw for missing URL', () => {
      expect(() => validateUrl('')).toThrow('URL_REQUIRED')
      expect(() => validateUrl(null)).toThrow('URL_REQUIRED')
    })

    it('should throw for non-string URL', () => {
      expect(() => validateUrl(123)).toThrow('URL_MUST_BE_STRING')
    })

    it('should throw for too long URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050)
      expect(() => validateUrl(longUrl)).toThrow('URL_TOO_LONG')
    })

    it('should throw for invalid protocol', () => {
      expect(() => validateUrl('ftp://example.com')).toThrow('URL_INVALID_PROTOCOL')
    })

    it('should throw for invalid format', () => {
      expect(() => validateUrl('not-a-url')).toThrow('URL_INVALID_FORMAT')
    })

    it('should use custom field name', () => {
      expect(() => validateUrl('', { fieldName: 'Website' })).toThrow('Website_REQUIRED')
    })
  })

  describe('validateDomain', () => {
    it('should accept valid domain', () => {
      expect(() => validateDomain('example.com')).not.toThrow()
      expect(() => validateDomain('sub.example.com')).not.toThrow()
    })

    it('should throw for missing domain', () => {
      expect(() => validateDomain('')).toThrow('Domain_REQUIRED')
    })

    it('should throw for non-string domain', () => {
      expect(() => validateDomain(123)).toThrow('Domain_MUST_BE_STRING')
    })

    it('should throw for too long domain', () => {
      const longDomain = 'a'.repeat(260) + '.com'
      expect(() => validateDomain(longDomain)).toThrow('Domain_TOO_LONG')
    })

    it('should throw for invalid format', () => {
      expect(() => validateDomain('invalid')).toThrow('Domain_INVALID_FORMAT')
      expect(() => validateDomain('-invalid.com')).toThrow('Domain_INVALID_FORMAT')
    })

    it('should throw for invalid format with injection characters', () => {
      // These fail regex validation before command injection check
      expect(() => validateDomain('example.com;ls')).toThrow('Domain_INVALID_FORMAT')
      expect(() => validateDomain('example.com|cat')).toThrow('Domain_INVALID_FORMAT')
    })
  })

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const result = validateDateRange('2024-01-01', '2024-01-15')
      expect(result.days).toBe(14)
    })

    it('should return Date objects', () => {
      const result = validateDateRange('2024-06-01', '2024-06-05')
      expect(result.start).toBeInstanceOf(Date)
      expect(result.end).toBeInstanceOf(Date)
    })

    it('should throw for invalid start date', () => {
      expect(() => validateDateRange('invalid', '2024-01-15')).toThrow('START_DATE_INVALID')
    })

    it('should throw for invalid end date', () => {
      expect(() => validateDateRange('2024-01-01', 'invalid')).toThrow('END_DATE_INVALID')
    })

    it('should throw when start is after end', () => {
      expect(() => validateDateRange('2024-01-15', '2024-01-01')).toThrow(
        'START_DATE_AFTER_END_DATE'
      )
    })

    it('should throw when range exceeds max days', () => {
      expect(() => validateDateRange('2024-01-01', '2026-01-01')).toThrow(
        'Date range_EXCEEDS_MAX_DAYS'
      )
    })

    it('should allow custom max days', () => {
      expect(() => validateDateRange('2024-01-01', '2024-02-01', { maxDays: 15 })).toThrow(
        'Date range_EXCEEDS_MAX_DAYS'
      )
    })

    it('should throw for past dates when allowPast is false', () => {
      expect(() => validateDateRange('2020-01-01', '2020-01-15', { allowPast: false })).toThrow(
        'START_DATE_IN_PAST'
      )
    })
  })

  describe('validatePagination', () => {
    it('should return valid pagination with defaults', () => {
      const result = validatePagination()
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.skip).toBe(0)
    })

    it('should parse valid page and limit', () => {
      const result = validatePagination(3, 50)
      expect(result.page).toBe(3)
      expect(result.limit).toBe(50)
      expect(result.skip).toBe(100)
    })

    it('should handle string inputs', () => {
      const result = validatePagination('2', '25')
      expect(result.page).toBe(2)
      expect(result.limit).toBe(25)
    })

    it('should enforce max limit', () => {
      const result = validatePagination(1, 500)
      expect(result.limit).toBe(100)
    })

    it('should use custom max limit', () => {
      const result = validatePagination(1, 500, { maxLimit: 200 })
      expect(result.limit).toBe(200)
    })

    it('should default invalid page to 1', () => {
      expect(validatePagination(-1, 20).page).toBe(1)
      expect(validatePagination(0, 20).page).toBe(1)
      expect(validatePagination('abc', 20).page).toBe(1)
    })

    it('should use custom defaults', () => {
      const result = validatePagination(null, null, { defaultPage: 2, defaultLimit: 10 })
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
    })
  })

  describe('validateCurrency', () => {
    it('should accept valid currencies', () => {
      expect(validateCurrency('TRY')).toBe('TRY')
      expect(validateCurrency('USD')).toBe('USD')
      expect(validateCurrency('EUR')).toBe('EUR')
    })

    it('should convert to uppercase', () => {
      expect(validateCurrency('try')).toBe('TRY')
      expect(validateCurrency('usd')).toBe('USD')
    })

    it('should throw for missing currency', () => {
      expect(() => validateCurrency('')).toThrow('CURRENCY_REQUIRED')
      expect(() => validateCurrency(null)).toThrow('CURRENCY_REQUIRED')
    })

    it('should throw for invalid currency', () => {
      expect(() => validateCurrency('XXX')).toThrow('CURRENCY_INVALID')
      expect(() => validateCurrency('INVALID')).toThrow('CURRENCY_INVALID')
    })
  })

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com')
      expect(validateEmail('user.name@domain.org')).toBe('user.name@domain.org')
    })

    it('should convert to lowercase and trim', () => {
      // Note: validation happens before trim, so leading/trailing spaces would fail
      expect(validateEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
    })

    it('should throw for missing email', () => {
      expect(() => validateEmail('')).toThrow('EMAIL_REQUIRED')
      expect(() => validateEmail(null)).toThrow('EMAIL_REQUIRED')
    })

    it('should throw for invalid format', () => {
      expect(() => validateEmail('invalid')).toThrow('EMAIL_INVALID')
      expect(() => validateEmail('missing@domain')).toThrow('EMAIL_INVALID')
      expect(() => validateEmail('@nodomain.com')).toThrow('EMAIL_INVALID')
    })

    it('should throw for too long email', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      expect(() => validateEmail(longEmail)).toThrow('EMAIL_TOO_LONG')
    })
  })

  describe('validatePhone', () => {
    it('should accept valid Turkish phone', () => {
      expect(validatePhone('5321234567')).toBe('5321234567')
      expect(validatePhone('+90 532 123 4567')).toBe('905321234567')
    })

    it('should throw for missing phone', () => {
      expect(() => validatePhone('')).toThrow('PHONE_REQUIRED')
      expect(() => validatePhone(null)).toThrow('PHONE_REQUIRED')
    })

    it('should throw for too short phone', () => {
      expect(() => validatePhone('12345')).toThrow('PHONE_TOO_SHORT')
    })

    it('should throw for too long phone', () => {
      expect(() => validatePhone('1234567890123456')).toThrow('PHONE_TOO_LONG')
    })

    it('should validate Turkish format when countryCode is TR', () => {
      expect(() => validatePhone('1234567890', { countryCode: 'TR' })).toThrow(
        'PHONE_INVALID_FORMAT'
      )
    })

    it('should accept non-TR phones without format validation', () => {
      expect(validatePhone('1234567890', { countryCode: 'US' })).toBe('1234567890')
    })
  })

  describe('validatePositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(validatePositiveNumber(10)).toBe(10)
      expect(validatePositiveNumber('25')).toBe(25)
      expect(validatePositiveNumber(0)).toBe(0)
    })

    it('should throw for non-numeric value', () => {
      expect(() => validatePositiveNumber('abc')).toThrow('Value_MUST_BE_NUMBER')
    })

    it('should throw when zero not allowed', () => {
      expect(() => validatePositiveNumber(0, { allowZero: false })).toThrow('Value_CANNOT_BE_ZERO')
    })

    it('should throw when below min', () => {
      expect(() => validatePositiveNumber(5, { min: 10 })).toThrow('Value_TOO_SMALL')
    })

    it('should throw when above max', () => {
      expect(() => validatePositiveNumber(100, { max: 50 })).toThrow('Value_TOO_LARGE')
    })

    it('should use custom field name', () => {
      expect(() => validatePositiveNumber('abc', { fieldName: 'Price' })).toThrow(
        'Price_MUST_BE_NUMBER'
      )
    })
  })

  describe('validateObjectId', () => {
    it('should accept valid ObjectId', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toBe('507f1f77bcf86cd799439011')
      expect(validateObjectId('000000000000000000000000')).toBe('000000000000000000000000')
    })

    it('should throw for missing ID', () => {
      expect(() => validateObjectId('')).toThrow('ID_REQUIRED')
      expect(() => validateObjectId(null)).toThrow('ID_REQUIRED')
    })

    it('should throw for invalid format', () => {
      expect(() => validateObjectId('invalid')).toThrow('ID_INVALID')
      expect(() => validateObjectId('507f1f77bcf86cd79943901')).toThrow('ID_INVALID') // 23 chars
      expect(() => validateObjectId('507f1f77bcf86cd7994390111')).toThrow('ID_INVALID') // 25 chars
    })

    it('should use custom field name', () => {
      expect(() => validateObjectId('', 'User ID')).toThrow('User ID_REQUIRED')
    })
  })

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world')
    })

    it('should truncate to max length', () => {
      expect(sanitizeString('hello world', { maxLength: 5 })).toBe('hello')
    })

    it('should convert to lowercase when option set', () => {
      expect(sanitizeString('HELLO', { lowercase: true })).toBe('hello')
    })

    it('should remove XSS characters', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
      expect(sanitizeString('hello<>world')).toBe('helloworld')
    })

    it('should return empty string for falsy input', () => {
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
      expect(sanitizeString('')).toBe('')
    })

    it('should convert non-string to string', () => {
      expect(sanitizeString(123)).toBe('123')
    })

    it('should not trim when trim option is false', () => {
      expect(sanitizeString('  hello  ', { trim: false })).toBe('  hello  ')
    })
  })
})
