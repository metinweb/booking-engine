import express from 'express'
import { asyncHandler } from '#helpers'
import { protect } from '#middleware/auth.js'
import { pmsProtect, pmsOptionalAuth } from '../pms-settings/pmsAuth.middleware.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import * as notificationService from './notification.service.js'

const router = express.Router()

/**
 * Helper to get user info from request
 * Supports both regular users and PMS users
 */
const getUserInfo = req => {
  if (req.pmsUser) {
    return {
      userId: req.pmsUser._id,
      recipientModel: 'PMSUser'
    }
  }
  if (req.user) {
    return {
      userId: req.user._id,
      recipientModel: 'User'
    }
  }
  return null
}

/**
 * Middleware that accepts both regular auth and PMS auth
 */
const flexibleAuth = async (req, res, next) => {
  // First try PMS auth
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const jwt = await import('jsonwebtoken')
      const config = await import('../../config/index.js')
      const token = authHeader.split(' ')[1]
      const decoded = jwt.default.verify(token, config.default.jwt.secret)

      if (decoded.type === 'pms') {
        // It's a PMS token, use PMS auth
        return pmsProtect(req, res, next)
      }
    } catch {
      // Not a valid PMS token, continue with regular auth
    }
  }

  // Use regular auth
  return protect(req, res, next)
}

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user
 * @access  Private (both User and PMSUser)
 */
router.get(
  '/',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    const userInfo = getUserInfo(req)
    if (!userInfo) {
      throw new BadRequestError('User not authenticated')
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query

    const result = await notificationService.getNotifications(
      userInfo.userId,
      userInfo.recipientModel,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      }
    )

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    })
  })
)

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for current user
 * @access  Private
 */
router.get(
  '/unread-count',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    const userInfo = getUserInfo(req)
    if (!userInfo) {
      throw new BadRequestError('User not authenticated')
    }

    const count = await notificationService.getUnreadCount(userInfo.userId, userInfo.recipientModel)

    res.json({
      success: true,
      data: { count }
    })
  })
)

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.post(
  '/:id/read',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    const userInfo = getUserInfo(req)
    if (!userInfo) {
      throw new BadRequestError('User not authenticated')
    }

    await notificationService.markAsRead([req.params.id], userInfo.userId)

    res.json({
      success: true,
      message: 'Notification marked as read'
    })
  })
)

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post(
  '/read-all',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    const userInfo = getUserInfo(req)
    if (!userInfo) {
      throw new BadRequestError('User not authenticated')
    }

    await notificationService.markAllAsRead(userInfo.userId, userInfo.recipientModel)

    res.json({
      success: true,
      message: 'All notifications marked as read'
    })
  })
)

/**
 * @route   POST /api/notifications/read-multiple
 * @desc    Mark multiple notifications as read
 * @access  Private
 */
router.post(
  '/read-multiple',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    const userInfo = getUserInfo(req)
    if (!userInfo) {
      throw new BadRequestError('User not authenticated')
    }

    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('ids array is required')
    }

    await notificationService.markAsRead(ids, userInfo.userId)

    res.json({
      success: true,
      message: 'Notifications marked as read'
    })
  })
)

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete(
  '/:id',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    const userInfo = getUserInfo(req)
    if (!userInfo) {
      throw new BadRequestError('User not authenticated')
    }

    const notification = await notificationService.deleteNotification(
      req.params.id,
      userInfo.userId
    )

    if (!notification) {
      throw new NotFoundError('Notification not found')
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    })
  })
)

export default router
