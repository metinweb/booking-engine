import express from 'express'
import * as userService from './user.service.js'
import { protect, requireAdmin } from '../../middleware/auth.js'
import { partnerContext } from '../../middlewares/partnerContext.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(partnerContext)

// CRUD routes (admin only)
router.post('/', requireAdmin, userService.createUser)
router.get('/', requireAdmin, userService.getUsers)
router.get('/:id', requireAdmin, userService.getUser)
router.put('/:id', requireAdmin, userService.updateUser)
router.delete('/:id', requireAdmin, userService.deleteUser)

// Password change (admin or self)
router.post('/:id/change-password', userService.changePassword)

// Two-Factor Authentication (self only)
router.post('/2fa/enable', userService.enable2FA)
router.post('/2fa/verify', userService.verify2FA)
router.post('/2fa/disable', userService.disable2FA)

export default router
