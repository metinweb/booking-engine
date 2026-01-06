/**
 * Custom Errors Tests
 * Test custom error classes
 */

import { describe, it, expect } from '@jest/globals'
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  ServiceUnavailableError
} from '../../core/errors.js'

describe('Custom Errors', () => {
  describe('AppError', () => {
    it('should create error with default status code 500', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should create error with custom status code', () => {
      const error = new AppError('Custom error', 418)
      expect(error.statusCode).toBe(418)
    })

    it('should support details parameter', () => {
      const details = { field: 'email', reason: 'invalid' }
      const error = new AppError('Error with details', 400, details)
      expect(error.details).toEqual(details)
    })

    it('should have null details by default', () => {
      const error = new AppError('No details')
      expect(error.details).toBeNull()
    })
  })

  describe('BadRequestError', () => {
    it('should have status code 400', () => {
      const error = new BadRequestError('Bad request')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Bad request')
    })

    it('should have default message', () => {
      const error = new BadRequestError()
      expect(error.message).toBe('BAD_REQUEST')
    })

    it('should support details', () => {
      const error = new BadRequestError('VALIDATION_ERROR', { field: 'name' })
      expect(error.details).toEqual({ field: 'name' })
    })
  })

  describe('UnauthorizedError', () => {
    it('should have status code 401', () => {
      const error = new UnauthorizedError('Unauthorized')
      expect(error.statusCode).toBe(401)
    })

    it('should have default message', () => {
      const error = new UnauthorizedError()
      expect(error.message).toBe('UNAUTHORIZED')
    })
  })

  describe('ForbiddenError', () => {
    it('should have status code 403', () => {
      const error = new ForbiddenError('Forbidden')
      expect(error.statusCode).toBe(403)
    })

    it('should have default message', () => {
      const error = new ForbiddenError()
      expect(error.message).toBe('FORBIDDEN')
    })
  })

  describe('NotFoundError', () => {
    it('should have status code 404', () => {
      const error = new NotFoundError('Not found')
      expect(error.statusCode).toBe(404)
    })

    it('should have default message', () => {
      const error = new NotFoundError()
      expect(error.message).toBe('NOT_FOUND')
    })

    it('should support resource details', () => {
      const error = new NotFoundError('USER_NOT_FOUND', { userId: '123' })
      expect(error.details).toEqual({ userId: '123' })
    })
  })

  describe('ConflictError', () => {
    it('should have status code 409', () => {
      const error = new ConflictError('Conflict')
      expect(error.statusCode).toBe(409)
    })

    it('should have default message', () => {
      const error = new ConflictError()
      expect(error.message).toBe('CONFLICT')
    })
  })

  describe('ValidationError', () => {
    it('should have status code 422', () => {
      const error = new ValidationError('Validation failed')
      expect(error.statusCode).toBe(422)
    })

    it('should have default message', () => {
      const error = new ValidationError()
      expect(error.message).toBe('VALIDATION_ERROR')
    })

    it('should support validation details', () => {
      const error = new ValidationError('VALIDATION_ERROR', {
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' }
        ]
      })
      expect(error.details.errors).toHaveLength(2)
    })
  })

  describe('TooManyRequestsError', () => {
    it('should have status code 429', () => {
      const error = new TooManyRequestsError('Rate limited')
      expect(error.statusCode).toBe(429)
    })

    it('should have default message', () => {
      const error = new TooManyRequestsError()
      expect(error.message).toBe('TOO_MANY_REQUESTS')
    })

    it('should support retry-after details', () => {
      const error = new TooManyRequestsError('TOO_MANY_REQUESTS', { retryAfter: 60 })
      expect(error.details).toEqual({ retryAfter: 60 })
    })
  })

  describe('ServiceUnavailableError', () => {
    it('should have status code 503', () => {
      const error = new ServiceUnavailableError('Service down')
      expect(error.statusCode).toBe(503)
    })

    it('should have default message', () => {
      const error = new ServiceUnavailableError()
      expect(error.message).toBe('SERVICE_UNAVAILABLE')
    })
  })

  describe('Error inheritance', () => {
    it('all errors should be instances of AppError', () => {
      expect(new BadRequestError()).toBeInstanceOf(AppError)
      expect(new UnauthorizedError()).toBeInstanceOf(AppError)
      expect(new ForbiddenError()).toBeInstanceOf(AppError)
      expect(new NotFoundError()).toBeInstanceOf(AppError)
      expect(new ConflictError()).toBeInstanceOf(AppError)
      expect(new ValidationError()).toBeInstanceOf(AppError)
      expect(new TooManyRequestsError()).toBeInstanceOf(AppError)
      expect(new ServiceUnavailableError()).toBeInstanceOf(AppError)
    })

    it('all errors should be instances of Error', () => {
      expect(new AppError('test')).toBeInstanceOf(Error)
      expect(new BadRequestError()).toBeInstanceOf(Error)
    })
  })
})
