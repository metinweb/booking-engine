import PushSubscription from './pushSubscription.model.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import config from '../../config/index.js'

/**
 * Subscribe to push notifications
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { subscription } = req.body

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({
      success: false,
      error: 'Invalid subscription object'
    })
  }

  // Check for existing subscription
  let pushSub = await PushSubscription.findOne({
    user: req.user._id,
    'subscription.endpoint': subscription.endpoint
  })

  if (pushSub) {
    // Update existing subscription
    pushSub.subscription = subscription
    pushSub.userAgent = req.headers['user-agent']
    pushSub.isActive = true
    pushSub.failureCount = 0
    await pushSub.save()
  } else {
    // Create new subscription
    pushSub = await PushSubscription.create({
      user: req.user._id,
      partner: req.user.accountType === 'partner' ? req.user.accountId : null,
      subscription,
      userAgent: req.headers['user-agent']
    })
  }

  logger.info(`Push subscription ${pushSub.isNew ? 'created' : 'updated'} for user ${req.user._id}`)

  res.json({
    success: true,
    message: 'Push subscription saved',
    data: {
      id: pushSub._id,
      deviceType: pushSub.deviceType,
      browser: pushSub.browser
    }
  })
})

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      error: 'Endpoint is required'
    })
  }

  const result = await PushSubscription.findOneAndDelete({
    user: req.user._id,
    'subscription.endpoint': endpoint
  })

  if (result) {
    logger.info(`Push subscription removed for user ${req.user._id}`)
  }

  res.json({
    success: true,
    message: 'Push subscription removed'
  })
})

/**
 * Get user's subscriptions
 */
export const getSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await PushSubscription.find({
    user: req.user._id,
    isActive: true
  }).select('deviceType browser createdAt lastPushAt')

  res.json({
    success: true,
    data: subscriptions
  })
})

/**
 * Get VAPID public key for frontend
 */
export const getVapidPublicKey = asyncHandler(async (req, res) => {
  try {
    const { default: PlatformSettings } =
      await import('../platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()

    if (!settings.webPush?.enabled || !settings.webPush?.publicKey) {
      return res.status(404).json({
        success: false,
        error: 'Push notifications are not configured'
      })
    }

    res.json({
      success: true,
      data: {
        publicKey: settings.webPush.publicKey
      }
    })
  } catch (error) {
    logger.error('Failed to get VAPID public key:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to get push configuration'
    })
  }
})

/**
 * Send push notification to a user
 * @param {string} userId - User ID
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} payload.icon - Notification icon URL
 * @param {Object} payload.data - Additional data
 * @returns {Object} Send results
 */
export const sendPushToUser = async (userId, payload) => {
  try {
    // Get VAPID credentials
    const { default: PlatformSettings } =
      await import('../platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()
    const vapidKeys = settings.getVAPIDKeys()

    if (!vapidKeys) {
      if (config.isDev) {
        logger.warn('Push not configured, logging notification:')
        logger.info({ userId, payload })
        return { success: true, sent: 0, failed: 0, message: 'dev-mode' }
      }
      throw new Error('Push notifications are not configured')
    }

    // Dynamic import web-push
    const webpush = await import('web-push')

    webpush.default.setVapidDetails(
      `mailto:${vapidKeys.contactEmail || 'admin@booking-engine.com'}`,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    )

    // Get active subscriptions for user
    const subscriptions = await PushSubscription.findActiveByUser(userId)

    if (subscriptions.length === 0) {
      return { success: true, sent: 0, failed: 0, message: 'No subscriptions' }
    }

    let sent = 0
    let failed = 0

    for (const sub of subscriptions) {
      try {
        await webpush.default.sendNotification(sub.subscription, JSON.stringify(payload))

        await sub.markSuccess()
        sent++
      } catch (error) {
        failed++

        // Handle expired subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id })
          logger.info(`Removed expired push subscription ${sub._id}`)
        } else {
          await sub.markFailed()
          logger.error(`Push notification failed for ${sub._id}:`, error.message)
        }
      }
    }

    logger.info(`Push sent to user ${userId}: ${sent} sent, ${failed} failed`)

    return { success: true, sent, failed }
  } catch (error) {
    logger.error(`Push notification error for user ${userId}:`, error.message)
    throw error
  }
}

/**
 * Send push notification to all users of a partner
 * @param {string} partnerId - Partner ID
 * @param {Object} payload - Notification payload
 * @returns {Object} Send results
 */
export const sendPushToPartner = async (partnerId, payload) => {
  const subscriptions = await PushSubscription.findByPartner(partnerId)

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 }
  }

  // Group by user to avoid duplicates
  const userIds = [...new Set(subscriptions.map(s => s.user.toString()))]
  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    try {
      const result = await sendPushToUser(userId, payload)
      totalSent += result.sent
      totalFailed += result.failed
    } catch (error) {
      totalFailed++
    }
  }

  return { success: true, sent: totalSent, failed: totalFailed }
}

/**
 * Cleanup old/inactive subscriptions
 */
export const cleanupSubscriptions = asyncHandler(async (req, res) => {
  const result = await PushSubscription.cleanup()

  logger.info(`Cleaned up ${result.deletedCount} push subscriptions`)

  res.json({
    success: true,
    message: `Cleaned up ${result.deletedCount} subscriptions`
  })
})

export default {
  subscribe,
  unsubscribe,
  getSubscriptions,
  getVapidPublicKey,
  sendPushToUser,
  sendPushToPartner,
  cleanupSubscriptions
}
