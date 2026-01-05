/**
 * Jest Test Setup
 * Global configuration for API tests
 */

import mongoose from 'mongoose'
import { jest, afterAll } from '@jest/globals'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars'
process.env.MONGODB_URI = 'mongodb://localhost:27017/booking-engine-test'

// Increase timeout for integration tests
jest.setTimeout(30000)

// Global test utilities
global.testUtils = {
  // Generate test ObjectId
  generateId: () => new mongoose.Types.ObjectId(),

  // Create mock request object
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    partner: null,
    t: key => key, // Mock i18n translator
    ...overrides
  }),

  // Create mock response object
  mockResponse: () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    return res
  },

  // Create mock next function
  mockNext: () => jest.fn()
}

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
})
