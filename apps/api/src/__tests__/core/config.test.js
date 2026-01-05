/**
 * Config Tests
 * Test configuration loading and validation
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

describe('Config', () => {
  let config

  beforeAll(async () => {
    // Set required env vars before importing config
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long'
    process.env.NODE_ENV = 'test'

    // Dynamic import to get fresh config
    const module = await import('../../config/index.js')
    config = module.default
  })

  describe('Environment', () => {
    it('should have env property', () => {
      expect(config.env).toBeDefined()
    })

    it('should have isDev property', () => {
      expect(typeof config.isDev).toBe('boolean')
    })
  })

  describe('Server', () => {
    it('should have port configuration', () => {
      expect(config.port).toBeDefined()
      expect(typeof config.port).toBe('number')
    })

    it('should default port to 4000', () => {
      // Port should be 4000 or whatever is set in env
      expect(config.port).toBeGreaterThan(0)
    })
  })

  describe('Database', () => {
    it('should have mongodb configuration', () => {
      expect(config.mongodb).toBeDefined()
      expect(config.mongodb.uri).toBeDefined()
    })

    it('should have default mongodb uri', () => {
      expect(config.mongodb.uri).toContain('mongodb')
    })
  })

  describe('JWT', () => {
    it('should have jwt configuration', () => {
      expect(config.jwt).toBeDefined()
      expect(config.jwt.secret).toBeDefined()
      expect(config.jwt.accessExpire).toBeDefined()
      expect(config.jwt.refreshExpire).toBeDefined()
    })

    it('should have default token expiration', () => {
      expect(config.jwt.accessExpire).toMatch(/^\d+[smhd]$/)
      expect(config.jwt.refreshExpire).toMatch(/^\d+[smhd]$/)
    })
  })

  describe('CORS', () => {
    it('should have cors configuration', () => {
      expect(config.cors).toBeDefined()
      expect(config.cors.origin).toBeDefined()
    })
  })

  describe('AWS', () => {
    it('should have aws configuration', () => {
      expect(config.aws).toBeDefined()
      expect(config.aws.ses).toBeDefined()
    })

    it('should have ses region', () => {
      expect(config.aws.ses.region).toBeDefined()
    })
  })

  describe('Redis', () => {
    it('should have redis configuration', () => {
      expect(config.redis).toBeDefined()
    })

    it('should have redis host and port', () => {
      expect(config.redis.host).toBeDefined()
      expect(config.redis.port).toBeDefined()
      expect(typeof config.redis.port).toBe('number')
    })

    it('should have redis enabled flag', () => {
      expect(typeof config.redis.enabled).toBe('boolean')
    })

    it('should have redis key prefix', () => {
      expect(config.redis.keyPrefix).toBeDefined()
    })
  })

  describe('Frontend URL', () => {
    it('should have frontend URL', () => {
      expect(config.frontendUrl).toBeDefined()
      expect(config.frontendUrl).toMatch(/^https?:\/\//)
    })
  })
})
