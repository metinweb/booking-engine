/**
 * Night Audit No-Show Service
 * No-show processing operations
 */

import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'
import Booking from '../booking/booking.model.js'
import { emitAuditEvent } from './nightAuditCore.service.js'

/**
 * Get pending no-shows
 * GET /api/pms/:hotelId/night-audit/no-shows
 */
export const getNoShows = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find confirmed bookings for today that haven't checked in
  const pendingArrivals = await Booking.find({
    hotel: hotelId,
    partner: req.partner._id,
    checkIn: { $gte: today, $lt: tomorrow },
    status: 'confirmed'
  })
    .select('bookingNumber leadGuest contact rooms checkIn checkOut nights pricing source payment')
    .lean()

  const noShows = pendingArrivals.map(booking => {
    const firstNightRate = booking.rooms?.[0]?.pricing?.avgPerNight || 0
    const totalAmount = booking.pricing?.grandTotal || 0

    return {
      booking: booking._id,
      bookingNumber: booking.bookingNumber,
      guestName:
        `${booking.leadGuest?.firstName || ''} ${booking.leadGuest?.lastName || ''}`.trim(),
      email: booking.contact?.email,
      phone: booking.contact?.phone,
      roomCount: booking.rooms?.length || 1,
      nights: booking.nights,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount,
      firstNightRate,
      source: booking.source?.type || 'direct',
      paymentMethod: booking.payment?.method,
      paymentStatus: booking.payment?.status
    }
  })

  res.json({
    success: true,
    data: {
      total: noShows.length,
      noShows
    }
  })
})

/**
 * Process no-shows
 * POST /api/pms/:hotelId/night-audit/no-shows/process
 */
export const processNoShows = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { actions } = req.body // Array of { bookingId, action, chargeType, chargeAmount }

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const records = []
  let totalCharges = 0

  for (const item of actions) {
    const booking = await Booking.findById(item.bookingId)
    if (!booking) continue

    // Update booking status
    if (item.action === 'no_show') {
      booking.status = 'no_show'
      await booking.save()
    } else if (item.action === 'cancelled') {
      booking.status = 'cancelled'
      await booking.save()
    }

    const chargeAmount = item.chargeAmount || 0
    totalCharges += chargeAmount

    records.push({
      booking: booking._id,
      bookingNumber: booking.bookingNumber,
      guestName:
        `${booking.leadGuest?.firstName || ''} ${booking.leadGuest?.lastName || ''}`.trim(),
      roomCount: booking.rooms?.length || 1,
      nights: booking.nights,
      totalAmount: booking.pricing?.grandTotal || 0,
      action: item.action,
      chargeAmount,
      chargeType: item.chargeType || 'none',
      processedAt: new Date(),
      processedBy: req.user._id
    })
  }

  // Update audit
  audit.noShowProcessing = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    totalNoShows: records.length,
    processedCount: records.length,
    totalCharges,
    records
  }
  audit.currentStep = 3

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 2,
    stepName: 'noShowProcessing',
    currentStep: 3,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})
