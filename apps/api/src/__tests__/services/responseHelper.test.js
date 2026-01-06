/**
 * Response Helper Service Tests
 * Tests for standardized response utilities
 */

import { describe, it, expect, jest } from '@jest/globals'
import {
  sendSuccess,
  sendMessage,
  sendCreated,
  sendNoContent,
  sendList,
  sendError,
  createResponse
} from '../../services/responseHelper.js'

// Mock response object
const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Response Helper', () => {
  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const res = mockResponse()
      const data = { id: 1, name: 'Test' }

      sendSuccess(res, data)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: 'Test' }
      })
    })

    it('should send custom status code', () => {
      const res = mockResponse()

      sendSuccess(res, { id: 1 }, 201)

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('should handle null data', () => {
      const res = mockResponse()

      sendSuccess(res, null)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null
      })
    })

    it('should handle array data', () => {
      const res = mockResponse()
      const data = [1, 2, 3]

      sendSuccess(res, data)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [1, 2, 3]
      })
    })
  })

  describe('sendMessage', () => {
    it('should send message without data', () => {
      const res = mockResponse()

      sendMessage(res, 'Operation successful')

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation successful'
      })
    })

    it('should send message with data', () => {
      const res = mockResponse()

      sendMessage(res, 'Created', { id: 123 })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: { id: 123 }
      })
    })

    it('should not include data key if data is null', () => {
      const res = mockResponse()

      sendMessage(res, 'Deleted', null)

      const call = res.json.mock.calls[0][0]
      expect(call.data).toBeUndefined()
    })
  })

  describe('sendCreated', () => {
    it('should send 201 status with data', () => {
      const res = mockResponse()
      const data = { id: 'new-123', name: 'New Item' }

      sendCreated(res, data)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'new-123', name: 'New Item' }
      })
    })
  })

  describe('sendNoContent', () => {
    it('should send 204 status with no body', () => {
      const res = mockResponse()

      sendNoContent(res)

      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('sendList', () => {
    it('should send list without pagination', () => {
      const res = mockResponse()
      const items = [{ id: 1 }, { id: 2 }]

      sendList(res, items)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: [{ id: 1 }, { id: 2 }]
        }
      })
    })

    it('should send list with pagination', () => {
      const res = mockResponse()
      const items = [{ id: 1 }]
      const pagination = { page: 1, limit: 10, total: 100 }

      sendList(res, items, pagination)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: [{ id: 1 }],
          pagination: { page: 1, limit: 10, total: 100 }
        }
      })
    })

    it('should use custom items key', () => {
      const res = mockResponse()
      const bookings = [{ id: 'b1' }]

      sendList(res, bookings, null, 'bookings')

      const call = res.json.mock.calls[0][0]
      expect(call.data.bookings).toBeDefined()
      expect(call.data.items).toBeUndefined()
    })
  })

  describe('sendError', () => {
    it('should send error with default status 400', () => {
      const res = mockResponse()

      sendError(res, 'Bad request')

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request'
      })
    })

    it('should send error with custom status', () => {
      const res = mockResponse()

      sendError(res, 'Not found', 404)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should include error details when provided', () => {
      const res = mockResponse()
      const details = { field: 'email', error: 'Invalid format' }

      sendError(res, 'Validation failed', 422, details)

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        details: { field: 'email', error: 'Invalid format' }
      })
    })
  })

  describe('createResponse', () => {
    describe('success', () => {
      it('should create success response object', () => {
        const result = createResponse.success({ id: 1 })

        expect(result).toEqual({
          success: true,
          data: { id: 1 }
        })
      })
    })

    describe('error', () => {
      it('should create error response object', () => {
        const result = createResponse.error('Something went wrong')

        expect(result).toEqual({
          success: false,
          message: 'Something went wrong'
        })
      })

      it('should include details when provided', () => {
        const result = createResponse.error('Validation failed', { field: 'email' })

        expect(result.details).toEqual({ field: 'email' })
      })
    })

    describe('list', () => {
      it('should create list response object', () => {
        const result = createResponse.list([1, 2, 3])

        expect(result).toEqual({
          success: true,
          data: {
            items: [1, 2, 3]
          }
        })
      })

      it('should include pagination when provided', () => {
        const pagination = { page: 1, total: 50 }
        const result = createResponse.list([1], pagination)

        expect(result.data.pagination).toEqual({ page: 1, total: 50 })
      })

      it('should use custom items key', () => {
        const result = createResponse.list([1], null, 'users')

        expect(result.data.users).toBeDefined()
        expect(result.data.items).toBeUndefined()
      })
    })
  })
})
