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
  NotFoundError
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
  })

  describe('BadRequestError', () => {
    it('should have status code 400', () => {
      const error = new BadRequestError('Bad request')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Bad request')
    })
  })

  describe('UnauthorizedError', () => {
    it('should have status code 401', () => {
      const error = new UnauthorizedError('Unauthorized')
      expect(error.statusCode).toBe(401)
    })
  })

  describe('ForbiddenError', () => {
    it('should have status code 403', () => {
      const error = new ForbiddenError('Forbidden')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('NotFoundError', () => {
    it('should have status code 404', () => {
      const error = new NotFoundError('Not found')
      expect(error.statusCode).toBe(404)
    })
  })
})
