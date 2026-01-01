import express from 'express'
import * as authService from './auth.service.js'
import { protect } from '../../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/login', authService.login)
router.post('/register', authService.register)
router.post('/refresh-token', authService.refreshToken)

// Protected routes
router.post('/logout', protect, authService.logout)
router.get('/me', protect, authService.me)
router.put('/notification-preferences', protect, authService.updateNotificationPreferences)
router.put('/change-password', protect, authService.changePassword)

export default router
