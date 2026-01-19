/**
 * Payment Webhook Routes
 * Receives callbacks from Payment Service (external gateways)
 *
 * NOTE: The main webhook handler is in payment.service.js (paymentWebhook function).
 * This file is kept for backward compatibility and specific gateway integrations.
 *
 * Notification functions are centralized in payment-notifications.service.js
 */

import express from 'express'
import { asyncHandler } from '#helpers'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import logger from '#core/logger.js'
// Import shared functions to avoid duplication
import { updateBookingPayment } from './payment.service.js'
import { sendPaymentNotification } from './payment-notifications.service.js'

const router = express.Router()

// Re-export for backward compatibility (if any code imports from here)
export { sendPaymentNotification }

/**
 * POST /api/payments/webhook
 * Webhook endpoint for payment service callbacks
 *
 * Expected payload:
 * {
 *   event: 'payment.completed' | 'payment.failed' | 'payment.refunded',
 *   transactionId: string,
 *   externalId: string (our Payment _id),
 *   status: string,
 *   data: { ... }
 * }
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  const { event, transactionId, externalId, status, data } = req.body

  logger.info('[PaymentWebhook] Received event:', {
    event,
    transactionId,
    externalId,
    status
  })

  // Find payment by external ID (our payment _id) or transaction ID
  let payment = null

  if (externalId) {
    payment = await Payment.findById(externalId)
  }

  if (!payment && transactionId) {
    payment = await Payment.findByGatewayTransaction(transactionId)
  }

  if (!payment) {
    logger.warn('[PaymentWebhook] Payment not found:', { transactionId, externalId })
    // Return 200 to prevent retries - payment might have been deleted
    return res.json({
      success: false,
      message: 'Payment not found'
    })
  }

  // Fetch booking for notifications
  const booking = await Booking.findById(payment.booking)

  // Process event
  switch (event) {
    case 'payment.completed':
      if (payment.status !== 'completed') {
        await payment.completeCardPayment(data || {})
        await updateBookingPayment(payment.booking)
        logger.info('[PaymentWebhook] Payment completed:', { paymentId: payment._id })

        // Send notification
        if (booking) {
          await sendPaymentNotification(payment, booking, 'completed')
        }
      }
      break

    case 'payment.failed':
      if (!['failed', 'completed'].includes(payment.status)) {
        await payment.failCardPayment(data?.error || 'Payment failed', data || {})
        logger.info('[PaymentWebhook] Payment failed:', { paymentId: payment._id })

        // Send notification
        if (booking) {
          await sendPaymentNotification(payment, booking, 'failed')
        }
      }
      break

    case 'payment.refunded':
      if (payment.status === 'completed') {
        payment.status = 'refunded'
        payment.cardDetails.gatewayStatus = 'refunded'
        payment.cardDetails.gatewayResponse = data
        payment.refund = {
          amount: data?.amount || payment.amount,
          reason: data?.reason || 'Refunded via gateway',
          refundedAt: new Date(),
          gatewayRef: data?.refundTransactionId
        }
        await payment.save()
        await updateBookingPayment(payment.booking)
        logger.info('[PaymentWebhook] Payment refunded:', { paymentId: payment._id })

        // Send notification
        if (booking) {
          await sendPaymentNotification(payment, booking, 'refunded')
        }
      }
      break

    case 'payment.cancelled':
      if (payment.status === 'pending') {
        payment.status = 'cancelled'
        payment.cardDetails.gatewayStatus = 'cancelled'
        payment.cardDetails.gatewayResponse = data
        await payment.save()
        logger.info('[PaymentWebhook] Payment cancelled:', { paymentId: payment._id })
      }
      break

    default:
      logger.warn('[PaymentWebhook] Unknown event:', { event })
  }

  res.json({
    success: true,
    message: 'Webhook processed'
  })
}))

/**
 * GET /api/payments/webhook/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/webhook/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  })
})

export default router
