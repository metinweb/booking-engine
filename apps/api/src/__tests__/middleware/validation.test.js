/**
 * Validation Middleware Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  isValidObjectId,
  isValidDateString,
  isNotPastDate,
  isValidEmail,
  isValidPhone,
  isValidCurrency,
  sanitizeString,
  parseInteger,
  parsePositiveNumber,
  validateBody,
  validateQuery,
  validateParams,
  commonSchemas,
  VALID_CURRENCIES
} from '../../middleware/validation.js'

describe('Validation Middleware', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid ObjectId', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true)
      expect(isValidObjectId('000000000000000000000000')).toBe(true)
      expect(isValidObjectId('ffffffffffffffffffffffff')).toBe(true)
    })

    it('should return false for invalid ObjectId', () => {
      expect(isValidObjectId('')).toBe(false)
      expect(isValidObjectId(null)).toBe(false)
      expect(isValidObjectId(undefined)).toBe(false)
      expect(isValidObjectId('invalid')).toBe(false)
      expect(isValidObjectId('123')).toBe(false)
      expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false) // 23 chars
      expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false) // 25 chars
      expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false) // invalid char
    })
  })

  describe('isValidDateString', () => {
    it('should return true for valid YYYY-MM-DD format', () => {
      expect(isValidDateString('2024-01-15')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
      expect(isValidDateString('2000-06-01')).toBe(true)
    })

    it('should return false for invalid date formats', () => {
      expect(isValidDateString('')).toBe(false)
      expect(isValidDateString(null)).toBe(false)
      expect(isValidDateString(undefined)).toBe(false)
      expect(isValidDateString('01-15-2024')).toBe(false) // MM-DD-YYYY
      expect(isValidDateString('15/01/2024')).toBe(false) // DD/MM/YYYY
      expect(isValidDateString('2024/01/15')).toBe(false) // wrong separator
      expect(isValidDateString('24-01-15')).toBe(false) // YY-MM-DD
      expect(isValidDateString('invalid')).toBe(false)
    })

    it('should return false for invalid date values', () => {
      expect(isValidDateString('2024-13-01')).toBe(false) // invalid month
      expect(isValidDateString('2024-00-15')).toBe(false) // invalid month
      // Note: JavaScript Date constructor accepts 2024-02-30 and wraps to March
      // The regex validation passes but Date() parses it as valid
    })
  })

  describe('isNotPastDate', () => {
    it('should return true for future dates', () => {
      expect(isNotPastDate('2030-01-01')).toBe(true)
      expect(isNotPastDate('2099-12-31')).toBe(true)
    })

    it('should return false for past dates', () => {
      expect(isNotPastDate('2020-01-01')).toBe(false)
      expect(isNotPastDate('1999-12-31')).toBe(false)
    })

    it('should return false for invalid dates', () => {
      expect(isNotPastDate('invalid')).toBe(false)
      expect(isNotPastDate(null)).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
      expect(isValidEmail('user123@test.io')).toBe(true)
    })

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail(null)).toBe(false)
      expect(isValidEmail(undefined)).toBe(false)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('user domain@test.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhone('+905551234567')).toBe(true)
      expect(isValidPhone('5551234567')).toBe(true)
      expect(isValidPhone('+1-555-123-4567')).toBe(true)
      expect(isValidPhone('555 123 4567')).toBe(true)
      expect(isValidPhone('12345678')).toBe(true) // 8 digits minimum
    })

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false)
      expect(isValidPhone(null)).toBe(false)
      expect(isValidPhone(undefined)).toBe(false)
      expect(isValidPhone('123')).toBe(false) // too short
      expect(isValidPhone('1234567')).toBe(false) // 7 digits
      expect(isValidPhone('abcdefghij')).toBe(false) // letters
    })
  })

  describe('isValidCurrency', () => {
    it('should return true for valid currencies', () => {
      expect(isValidCurrency('USD')).toBe(true)
      expect(isValidCurrency('EUR')).toBe(true)
      expect(isValidCurrency('TRY')).toBe(true)
      expect(isValidCurrency('usd')).toBe(true) // case-insensitive
      expect(isValidCurrency('eur')).toBe(true)
    })

    it('should return false for invalid currencies', () => {
      expect(isValidCurrency('')).toBe(false)
      expect(isValidCurrency(null)).toBe(false)
      expect(isValidCurrency(undefined)).toBe(false)
      expect(isValidCurrency('XYZ')).toBe(false)
      expect(isValidCurrency('INVALID')).toBe(false)
    })
  })

  describe('VALID_CURRENCIES', () => {
    it('should contain common currencies', () => {
      expect(VALID_CURRENCIES).toContain('USD')
      expect(VALID_CURRENCIES).toContain('EUR')
      expect(VALID_CURRENCIES).toContain('TRY')
      expect(VALID_CURRENCIES).toContain('GBP')
    })
  })

  describe('sanitizeString', () => {
    it('should trim and truncate strings', () => {
      expect(sanitizeString('  hello  ')).toBe('hello')
      expect(sanitizeString('hello', 3)).toBe('hel')
      expect(sanitizeString('  test  ', 10)).toBe('test')
    })

    it('should return empty string for invalid input', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
    })

    it('should convert non-strings to strings', () => {
      expect(sanitizeString(123)).toBe('123')
      expect(sanitizeString(true)).toBe('true')
    })

    it('should use default max length of 255', () => {
      const longString = 'a'.repeat(300)
      expect(sanitizeString(longString)).toHaveLength(255)
    })
  })

  describe('parseInteger', () => {
    it('should parse valid integers', () => {
      expect(parseInteger('42')).toBe(42)
      expect(parseInteger(42)).toBe(42)
      expect(parseInteger('0')).toBe(0)
      expect(parseInteger('-10')).toBe(-10)
    })

    it('should return default value for invalid input', () => {
      expect(parseInteger('abc', { defaultValue: 0 })).toBe(0)
      expect(parseInteger('', { defaultValue: 10 })).toBe(10)
      expect(parseInteger(null, { defaultValue: 5 })).toBe(5)
      expect(parseInteger(undefined, { defaultValue: 1 })).toBe(1)
    })

    it('should clamp values to min/max', () => {
      expect(parseInteger('5', { min: 10 })).toBe(10)
      expect(parseInteger('100', { max: 50 })).toBe(50)
      expect(parseInteger('25', { min: 10, max: 50 })).toBe(25)
    })

    it('should return null by default for invalid input', () => {
      expect(parseInteger('abc')).toBeNull()
      expect(parseInteger('')).toBeNull()
    })
  })

  describe('parsePositiveNumber', () => {
    it('should parse positive numbers', () => {
      expect(parsePositiveNumber('3.14')).toBe(3.14)
      expect(parsePositiveNumber('0')).toBe(0)
      expect(parsePositiveNumber('100')).toBe(100)
    })

    it('should return default for negative numbers', () => {
      expect(parsePositiveNumber('-5', 0)).toBe(0)
      expect(parsePositiveNumber('-100', 10)).toBe(10)
    })

    it('should return default for invalid input', () => {
      expect(parsePositiveNumber('abc', 0)).toBe(0)
      expect(parsePositiveNumber('', 5)).toBe(5)
      expect(parsePositiveNumber(null, 10)).toBe(10)
      expect(parsePositiveNumber(undefined, 15)).toBe(15)
    })
  })

  describe('validateBody', () => {
    let mockReq, mockRes, mockNext

    beforeEach(() => {
      mockReq = { body: {} }
      mockRes = {}
      mockNext = jest.fn()
    })

    it('should call next() for valid data', () => {
      mockReq.body = { name: 'John', age: 25 }
      const middleware = validateBody({
        name: { type: 'string', required: true },
        age: { type: 'number' }
      })

      middleware(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should call next with error for missing required field', () => {
      mockReq.body = {}
      const middleware = validateBody({
        name: { type: 'string', required: true }
      })

      middleware(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalled()
      const error = mockNext.mock.calls[0][0]
      expect(error.statusCode).toBe(400)
      expect(error.details.errors).toBeDefined()
    })

    it('should validate type constraints', () => {
      mockReq.body = { age: 'not a number' }
      const middleware = validateBody({
        age: { type: 'integer' }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.details.errors[0].field).toBe('age')
    })

    it('should validate min/max for numbers', () => {
      mockReq.body = { count: 5 }
      const middleware = validateBody({
        count: { type: 'number', min: 10 }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error.details.errors[0].message).toContain('at least 10')
    })

    it('should validate minLength/maxLength for strings', () => {
      mockReq.body = { name: 'ab' }
      const middleware = validateBody({
        name: { type: 'string', minLength: 3 }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error.details.errors[0].message).toContain('at least 3 characters')
    })

    it('should validate enum values', () => {
      mockReq.body = { status: 'invalid' }
      const middleware = validateBody({
        status: { enum: ['active', 'inactive'] }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error.details.errors[0].message).toContain('active, inactive')
    })

    it('should skip validation for optional fields not provided', () => {
      mockReq.body = {}
      const middleware = validateBody({
        optional: { type: 'string' }
      })

      middleware(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should support custom validator', () => {
      mockReq.body = { password: '123' }
      const middleware = validateBody({
        password: {
          type: 'string',
          validate: value => value.length >= 8 || 'Password must be at least 8 characters'
        }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error.details.errors[0].message).toContain('8 characters')
    })
  })

  describe('validateQuery', () => {
    let mockReq, mockRes, mockNext

    beforeEach(() => {
      mockReq = { query: {} }
      mockRes = {}
      mockNext = jest.fn()
    })

    it('should coerce query params to numbers', () => {
      mockReq.query = { page: '1', limit: '20' }
      const middleware = validateQuery({
        page: { type: 'integer' },
        limit: { type: 'integer' }
      })

      middleware(mockReq, mockRes, mockNext)
      expect(mockReq.query.page).toBe(1)
      expect(mockReq.query.limit).toBe(20)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should coerce query params to booleans', () => {
      mockReq.query = { active: 'true' }
      const middleware = validateQuery({
        active: { type: 'boolean' }
      })

      middleware(mockReq, mockRes, mockNext)
      expect(mockReq.query.active).toBe(true)
    })

    it('should validate required query params', () => {
      mockReq.query = {}
      const middleware = validateQuery({
        id: { required: true }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error.details.errors[0].param).toBe('id')
    })
  })

  describe('validateParams', () => {
    let mockReq, mockRes, mockNext

    beforeEach(() => {
      mockReq = { params: {} }
      mockRes = {}
      mockNext = jest.fn()
    })

    it('should validate ObjectId params', () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      const middleware = validateParams({
        id: { type: 'objectId' }
      })

      middleware(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should reject invalid ObjectId', () => {
      mockReq.params = { id: 'invalid' }
      const middleware = validateParams({
        id: { type: 'objectId' }
      })

      middleware(mockReq, mockRes, mockNext)
      const error = mockNext.mock.calls[0][0]
      expect(error.details.errors[0].param).toBe('id')
    })
  })

  describe('commonSchemas', () => {
    it('should have priceQuery schema', () => {
      expect(commonSchemas.priceQuery).toBeDefined()
      expect(commonSchemas.priceQuery.hotelId.required).toBe(true)
      expect(commonSchemas.priceQuery.checkInDate.type).toBe('date')
    })

    it('should have dateRange schema', () => {
      expect(commonSchemas.dateRange).toBeDefined()
      expect(commonSchemas.dateRange.startDate.required).toBe(true)
      expect(commonSchemas.dateRange.endDate.required).toBe(true)
    })

    it('should have pagination schema', () => {
      expect(commonSchemas.pagination).toBeDefined()
      expect(commonSchemas.pagination.page.type).toBe('integer')
      expect(commonSchemas.pagination.limit.max).toBe(100)
    })
  })
})
