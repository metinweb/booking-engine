/**
 * Error Handler Middleware Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler.js'
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ValidationError
} from '../../core/errors.js'

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    mockReq = {
      t: jest.fn(key => key) // Mock i18n translation function
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    mockNext = jest.fn()
  })

  describe('errorHandler', () => {
    it('should handle AppError with correct status code', () => {
      const error = new AppError('TEST_ERROR', 400)

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'TEST_ERROR'
        })
      )
    })

    it('should handle BadRequestError', () => {
      const error = new BadRequestError('INVALID_INPUT')

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'INVALID_INPUT'
        })
      )
    })

    it('should handle UnauthorizedError', () => {
      const error = new UnauthorizedError('INVALID_TOKEN')

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should include error details when present', () => {
      const error = new ValidationError('VALIDATION_ERROR', {
        errors: [{ field: 'email', message: 'Invalid' }]
      })

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {
            errors: [{ field: 'email', message: 'Invalid' }]
          }
        })
      )
    })

    it('should handle Mongoose ValidationError', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' }
        }
      }

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle Mongoose duplicate key error (11000)', () => {
      const error = {
        code: 11000,
        keyPattern: { email: 1 }
      }

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockReq.t).toHaveBeenCalledWith('DUPLICATE_EMAIL')
    })

    it('should handle Mongoose CastError', () => {
      const error = {
        name: 'CastError'
      }

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockReq.t).toHaveBeenCalledWith('INVALID_ID')
    })

    it('should handle JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError'
      }

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockReq.t).toHaveBeenCalledWith('INVALID_TOKEN')
    })

    it('should handle TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError'
      }

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockReq.t).toHaveBeenCalledWith('TOKEN_EXPIRED')
    })

    it('should default to 500 for unknown errors', () => {
      const error = new Error('Unknown error')

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should translate i18n message keys', () => {
      const error = new NotFoundError('HOTEL_NOT_FOUND')

      errorHandler(error, mockReq, mockRes, mockNext)

      expect(mockReq.t).toHaveBeenCalledWith('HOTEL_NOT_FOUND')
    })
  })

  describe('notFoundHandler', () => {
    it('should return 404 status', () => {
      notFoundHandler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should return NOT_FOUND message', () => {
      notFoundHandler(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'NOT_FOUND'
      })
    })

    it('should use i18n translation', () => {
      notFoundHandler(mockReq, mockRes)

      expect(mockReq.t).toHaveBeenCalledWith('NOT_FOUND')
    })
  })
})
