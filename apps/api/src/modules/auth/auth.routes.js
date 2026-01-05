import express from 'express'
import * as authService from './auth.service.js'
import { protect } from '../../middleware/auth.js'
import { strictLimiter, loginLimiter } from '../../middleware/rateLimiter.js'

const router = express.Router()

// Public routes - with strict rate limiting to prevent brute force attacks
// Login uses both loginLimiter (IP+email based) and strictLimiter (IP+route based)
router.post('/login', loginLimiter, strictLimiter, authService.login)
router.post('/register', strictLimiter, authService.register)
router.post('/refresh-token', strictLimiter, authService.refreshToken)

// Password reset routes
router.post('/forgot-password', strictLimiter, authService.forgotPassword)
router.post('/reset-password', strictLimiter, authService.resetPassword)

// Protected routes
router.post('/logout', protect, authService.logout)
router.get('/me', protect, authService.me)
router.put('/notification-preferences', protect, authService.updateNotificationPreferences)
router.put('/change-password', protect, strictLimiter, authService.changePassword)

export default router
