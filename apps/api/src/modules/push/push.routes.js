import express from 'express'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import * as service from './push.service.js'

const router = express.Router()

// Public route - get VAPID public key
router.get('/vapid-public-key', service.getVapidPublicKey)

// Protected routes
router.use(protect)

// Subscribe to push notifications
router.post('/subscribe', service.subscribe)

// Unsubscribe from push notifications
router.delete('/unsubscribe', service.unsubscribe)

// Get user's subscriptions
router.get('/subscriptions', service.getSubscriptions)

// Admin only - cleanup old subscriptions
router.post('/cleanup', requirePlatformAdmin, service.cleanupSubscriptions)

export default router
