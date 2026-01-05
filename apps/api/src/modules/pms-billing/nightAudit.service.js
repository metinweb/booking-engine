/**
 * Night Audit Service
 * Business logic for end-of-day audit process
 */

import { asyncHandler } from '../../helpers/asyncHandler.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import NightAudit from './nightAudit.model.js'
import Stay, { STAY_STATUS } from '../pms-frontdesk/stay.model.js'
import Room from '../pms-housekeeping/room.model.js'
import CashRegister from './cashRegister.model.js'
import Transaction from './transaction.model.js'
import Booking from '../booking/booking.model.js'
import { emitToRoom } from '../../core/socket.js'

/**
 * Emit night audit progress event via WebSocket
 * @param {string} hotelId - Hotel ID (used as room)
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitAuditEvent = (hotelId, event, data) => {
  emitToRoom(`night-audit:${hotelId}`, `night-audit:${event}`, {
    hotelId,
    timestamp: Date.now(),
    ...data
  })
}

// ==================== START AUDIT ====================

/**
 * Start a new night audit
 * POST /api/pms/:hotelId/night-audit/start
 */
export const startAudit = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { auditDate } = req.body

  // Check for existing in-progress audit
  const existingAudit = await NightAudit.getCurrentAudit(hotelId)
  if (existingAudit) {
    return res.json({
      success: true,
      data: existingAudit,
      message: 'Devam eden audit bulundu'
    })
  }

  // Determine audit date (default: today)
  const date = auditDate ? new Date(auditDate) : new Date()
  date.setHours(0, 0, 0, 0)

  // Check if audit already completed for this date
  const completedAudit = await NightAudit.getAuditForDate(hotelId, date)
  if (completedAudit && completedAudit.status === 'completed') {
    throw new BadRequestError('Bu tarih icin audit zaten tamamlanmis')
  }

  // Generate audit number
  const auditNumber = await NightAudit.generateAuditNumber(hotelId, date)

  // Create new audit
  const audit = await NightAudit.create({
    partner: req.partner._id,
    hotel: hotelId,
    auditNumber,
    auditDate: date,
    startedBy: req.user._id
  })

  // Emit WebSocket event for audit start
  emitAuditEvent(hotelId, 'started', {
    auditId: audit._id,
    auditNumber,
    auditDate: date,
    currentStep: 1
  })

  res.status(201).json({
    success: true,
    data: audit
  })
})

// ==================== GET CURRENT AUDIT ====================

/**
 * Get current audit in progress
 * GET /api/pms/:hotelId/night-audit/current
 */
export const getCurrentAudit = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const audit = await NightAudit.getCurrentAudit(hotelId)

  if (!audit) {
    return res.json({
      success: true,
      data: null,
      message: 'Devam eden audit yok'
    })
  }

  res.json({
    success: true,
    data: audit
  })
})

// ==================== PRE-AUDIT CHECK ====================

/**
 * Run pre-audit checks
 * GET /api/pms/:hotelId/night-audit/pre-check
 */
export const getPreAuditChecks = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const issues = []
  const summary = {
    totalArrivals: 0,
    checkedInArrivals: 0,
    pendingArrivals: 0,
    totalDepartures: 0,
    checkedOutDepartures: 0,
    pendingDepartures: 0,
    outstandingBalances: 0,
    outstandingAmount: 0,
    dirtyRooms: 0,
    openShifts: 0
  }

  // 1. Check arrivals (today's check-ins)
  const todayBookings = await Booking.find({
    hotel: hotelId,
    partner: req.partner._id,
    checkIn: { $gte: today, $lt: tomorrow },
    status: { $in: ['confirmed', 'checked_in'] }
  }).lean()

  summary.totalArrivals = todayBookings.length
  summary.checkedInArrivals = todayBookings.filter(b => b.status === 'checked_in').length
  summary.pendingArrivals = todayBookings.filter(b => b.status === 'confirmed').length

  if (summary.pendingArrivals > 0) {
    issues.push({
      type: 'arrivals',
      severity: 'warning',
      message: `${summary.pendingArrivals} misafir henuz check-in yapmadi`,
      details: {
        pending: summary.pendingArrivals,
        total: summary.totalArrivals
      }
    })
  }

  // 2. Check departures (today's check-outs)
  const todayDepartures = await Stay.find({
    hotel: hotelId,
    partner: req.partner._id,
    checkOutDate: { $gte: today, $lt: tomorrow },
    status: { $in: [STAY_STATUS.CHECKED_IN, STAY_STATUS.CHECKED_OUT] }
  }).lean()

  summary.totalDepartures = todayDepartures.length
  summary.checkedOutDepartures = todayDepartures.filter(
    s => s.status === STAY_STATUS.CHECKED_OUT
  ).length
  summary.pendingDepartures = todayDepartures.filter(
    s => s.status === STAY_STATUS.CHECKED_IN
  ).length

  if (summary.pendingDepartures > 0) {
    issues.push({
      type: 'departures',
      severity: 'warning',
      message: `${summary.pendingDepartures} misafir henuz check-out yapmadi`,
      details: {
        pending: summary.pendingDepartures,
        total: summary.totalDepartures
      }
    })
  }

  // 3. Check outstanding balances
  const staysWithBalance = await Stay.find({
    hotel: hotelId,
    partner: req.partner._id,
    status: STAY_STATUS.CHECKED_IN,
    balance: { $gt: 0 }
  })
    .populate('room', 'roomNumber')
    .lean()

  summary.outstandingBalances = staysWithBalance.length
  summary.outstandingAmount = staysWithBalance.reduce((sum, s) => sum + (s.balance || 0), 0)

  if (summary.outstandingBalances > 0) {
    issues.push({
      type: 'balances',
      severity: 'warning',
      message: `${summary.outstandingBalances} odada odenmemis bakiye var`,
      details: {
        count: summary.outstandingBalances,
        amount: summary.outstandingAmount,
        rooms: staysWithBalance.map(s => ({
          roomNumber: s.room?.roomNumber,
          balance: s.balance,
          guestName: s.guests?.[0]?.firstName + ' ' + s.guests?.[0]?.lastName
        }))
      }
    })
  }

  // 4. Check housekeeping status
  const dirtyRooms = await Room.find({
    hotel: hotelId,
    partner: req.partner._id,
    housekeepingStatus: { $in: ['dirty', 'cleaning'] }
  })
    .select('roomNumber floor housekeepingStatus')
    .lean()

  summary.dirtyRooms = dirtyRooms.length

  if (summary.dirtyRooms > 0) {
    issues.push({
      type: 'housekeeping',
      severity: 'info',
      message: `${summary.dirtyRooms} oda henuz temizlenmemis`,
      details: {
        count: summary.dirtyRooms,
        rooms: dirtyRooms.map(r => r.roomNumber)
      }
    })
  }

  // 5. Check open shifts
  const openShifts = await CashRegister.find({
    hotel: hotelId,
    partner: req.partner._id,
    status: 'open'
  })
    .populate('cashier', 'firstName lastName')
    .lean()

  summary.openShifts = openShifts.length

  if (summary.openShifts > 0) {
    issues.push({
      type: 'shifts',
      severity: 'warning',
      message: `${summary.openShifts} kasa henuz kapatilmamis`,
      details: {
        count: summary.openShifts,
        shifts: openShifts.map(s => ({
          shiftNumber: s.shiftNumber,
          cashierName:
            s.cashierName || `${s.cashier?.firstName || ''} ${s.cashier?.lastName || ''}`.trim(),
          openedAt: s.openedAt
        }))
      }
    })
  }

  // Determine overall status
  const hasErrors = issues.some(i => i.severity === 'error')
  const hasWarnings = issues.some(i => i.severity === 'warning')

  res.json({
    success: true,
    data: {
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      canProceed: !hasErrors,
      issues,
      summary
    }
  })
})

/**
 * Complete pre-audit check step
 * POST /api/pms/:hotelId/night-audit/pre-check/complete
 */
export const completePreAuditCheck = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { issues, summary } = req.body

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  audit.preAuditCheck = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    issues: issues || [],
    summary: summary || {}
  }
  audit.currentStep = 2

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 1,
    stepName: 'preAuditCheck',
    currentStep: 2,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})

// ==================== NO-SHOW PROCESSING ====================

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

// ==================== ROOM CHARGE POSTING ====================

/**
 * Get room charges to post
 * GET /api/pms/:hotelId/night-audit/room-charges
 */
export const getRoomCharges = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  // Get all checked-in stays
  const stays = await Stay.find({
    hotel: hotelId,
    partner: req.partner._id,
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .lean()

  const roomCharges = stays.map(stay => {
    const mainGuest = stay.guests?.find(g => g.isMainGuest) || stay.guests?.[0]
    const todayExtras = (stay.extras || [])
      .filter(e => {
        const extraDate = new Date(e.date)
        const today = new Date()
        return extraDate.toDateString() === today.toDateString()
      })
      .reduce((sum, e) => sum + e.amount * (e.quantity || 1), 0)

    return {
      stay: stay._id,
      room: stay.room?._id,
      roomNumber: stay.room?.roomNumber,
      roomType: stay.roomType?.name?.tr || stay.roomType?.code,
      guestName: `${mainGuest?.firstName || ''} ${mainGuest?.lastName || ''}`.trim(),
      checkIn: stay.checkInDate,
      checkOut: stay.checkOutDate,
      nights: stay.nights,
      roomRate: stay.roomRate || 0,
      extras: todayExtras,
      total: (stay.roomRate || 0) + todayExtras,
      balance: stay.balance || 0,
      needsReview: todayExtras > 0
    }
  })

  const summary = {
    totalRooms: roomCharges.length,
    totalRoomCharges: roomCharges.reduce((sum, r) => sum + r.roomRate, 0),
    totalExtras: roomCharges.reduce((sum, r) => sum + r.extras, 0),
    grandTotal: roomCharges.reduce((sum, r) => sum + r.total, 0),
    needsReview: roomCharges.filter(r => r.needsReview).length
  }

  res.json({
    success: true,
    data: {
      summary,
      roomCharges
    }
  })
})

/**
 * Post room charges
 * POST /api/pms/:hotelId/night-audit/room-charges/post
 */
export const postRoomCharges = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { charges } = req.body // Array of stays to post charges

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const records = []
  let totalRoomCharges = 0
  let totalExtras = 0

  for (const item of charges) {
    const stay = await Stay.findById(item.stayId).populate('room', 'roomNumber')

    if (!stay) {
      records.push({
        stay: item.stayId,
        status: 'error',
        error: 'Stay bulunamadi'
      })
      continue
    }

    // Room charges are already tracked in the stay
    // This step is mainly for verification and reporting
    const mainGuest = stay.guests?.find(g => g.isMainGuest) || stay.guests?.[0]

    records.push({
      stay: stay._id,
      room: stay.room?._id,
      roomNumber: stay.room?.roomNumber,
      guestName: `${mainGuest?.firstName || ''} ${mainGuest?.lastName || ''}`.trim(),
      roomRate: stay.roomRate || 0,
      extras: item.extras || 0,
      total: (stay.roomRate || 0) + (item.extras || 0),
      status: 'posted'
    })

    totalRoomCharges += stay.roomRate || 0
    totalExtras += item.extras || 0
  }

  // Update audit
  audit.roomChargePosting = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    totalRooms: records.length,
    postedCount: records.filter(r => r.status === 'posted').length,
    totalRoomCharges,
    totalExtras,
    grandTotal: totalRoomCharges + totalExtras,
    records
  }
  audit.currentStep = 4

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 3,
    stepName: 'roomChargePosting',
    currentStep: 4,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})

// ==================== CASHIER RECONCILIATION ====================

/**
 * Get open shifts for reconciliation
 * GET /api/pms/:hotelId/night-audit/cashier
 */
export const getCashierData = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const openShifts = await CashRegister.find({
    hotel: hotelId,
    partner: req.partner._id,
    status: { $in: ['open', 'suspended'] }
  })
    .populate('cashier', 'firstName lastName')
    .lean()

  const shifts = openShifts.map(shift => ({
    shift: shift._id,
    shiftNumber: shift.shiftNumber,
    cashierName:
      shift.cashierName ||
      `${shift.cashier?.firstName || ''} ${shift.cashier?.lastName || ''}`.trim(),
    openedAt: shift.openedAt,
    status: shift.status,
    expectedCash: shift.currentBalance?.cash || 0,
    cardTotal: shift.currentBalance?.card || 0,
    bankTotal: shift.currentBalance?.other || 0,
    transactionCount: shift.transactionCounts?.total || 0,
    openingBalance: shift.openingBalance?.cash || 0
  }))

  const summary = {
    totalShifts: shifts.length,
    totalExpectedCash: shifts.reduce((sum, s) => sum + s.expectedCash, 0),
    totalCard: shifts.reduce((sum, s) => sum + s.cardTotal, 0),
    totalBank: shifts.reduce((sum, s) => sum + s.bankTotal, 0)
  }

  res.json({
    success: true,
    data: {
      summary,
      shifts
    }
  })
})

/**
 * Close cashier shifts
 * POST /api/pms/:hotelId/night-audit/cashier/close
 */
export const closeCashierShifts = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { shifts } = req.body // Array of { shiftId, actualCash, discrepancyNote }

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const records = []
  let totalCash = 0
  let totalCard = 0
  let totalBank = 0
  let totalDiscrepancy = 0

  for (const item of shifts) {
    const shift = await CashRegister.findById(item.shiftId)
    if (!shift) continue

    const expectedCash = shift.currentBalance?.cash || 0
    const actualCash = item.actualCash || 0
    const discrepancy = actualCash - expectedCash

    // Close the shift
    shift.status = 'closed'
    shift.closedAt = new Date()
    shift.closedBy = req.user._id
    shift.closingBalance = {
      cash: actualCash,
      card: shift.currentBalance?.card || 0,
      other: shift.currentBalance?.other || 0
    }
    shift.actualCash = actualCash
    shift.expectedCash = expectedCash
    shift.discrepancy = discrepancy

    await shift.save()

    records.push({
      shift: shift._id,
      shiftNumber: shift.shiftNumber,
      cashierName: shift.cashierName,
      openedAt: shift.openedAt,
      expectedCash,
      actualCash,
      discrepancy,
      cardTotal: shift.currentBalance?.card || 0,
      bankTotal: shift.currentBalance?.other || 0,
      transactionCount: shift.transactionCounts?.total || 0,
      status: 'closed',
      closedAt: new Date(),
      closedBy: req.user._id,
      discrepancyNote: item.discrepancyNote
    })

    totalCash += actualCash
    totalCard += shift.currentBalance?.card || 0
    totalBank += shift.currentBalance?.other || 0
    totalDiscrepancy += Math.abs(discrepancy)
  }

  // Update audit
  audit.cashierReconciliation = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    totalShifts: records.length,
    closedCount: records.length,
    totalCash,
    totalCard,
    totalBank,
    totalDiscrepancy,
    shifts: records
  }
  audit.currentStep = 5

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 4,
    stepName: 'cashierReconciliation',
    currentStep: 5,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})

// ==================== REPORTS & CLOSE ====================

/**
 * Get summary for day close
 * GET /api/pms/:hotelId/night-audit/summary
 */
export const getAuditSummary = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Room statistics
  const roomStats = await Room.getStatistics(hotelId)

  // Today's transactions
  const transactions = await Transaction.find({
    hotel: hotelId,
    partner: req.partner._id,
    createdAt: { $gte: today, $lt: tomorrow },
    status: 'completed'
  }).lean()

  // Calculate revenue
  const roomRevenue = transactions
    .filter(t => t.type === 'ROOM_CHARGE')
    .reduce((sum, t) => sum + t.amount, 0)

  const extraRevenue = transactions
    .filter(t =>
      ['EXTRA_CHARGE', 'MINIBAR', 'SPA', 'LAUNDRY', 'RESTAURANT', 'BAR'].includes(t.type)
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const totalRevenue = roomRevenue + extraRevenue

  // Payment breakdown
  const cashPayments = transactions
    .filter(t => t.type === 'PAYMENT' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0)

  const cardPayments = transactions
    .filter(t => t.type === 'PAYMENT' && ['CREDIT_CARD', 'DEBIT_CARD'].includes(t.paymentMethod))
    .reduce((sum, t) => sum + t.amount, 0)

  const bankPayments = transactions
    .filter(t => t.type === 'PAYMENT' && t.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, t) => sum + t.amount, 0)

  // Guest movement
  const arrivals = await Booking.countDocuments({
    hotel: hotelId,
    checkIn: { $gte: today, $lt: tomorrow },
    status: 'checked_in'
  })

  const departures = await Stay.countDocuments({
    hotel: hotelId,
    actualCheckOut: { $gte: today, $lt: tomorrow }
  })

  const inHouseGuests = await Stay.countDocuments({
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  })

  const noShows = audit.noShowProcessing?.records?.filter(r => r.action === 'no_show').length || 0

  // Calculate metrics
  const occupancyRate =
    roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0

  const averageDailyRate = roomStats.occupied > 0 ? Math.round(roomRevenue / roomStats.occupied) : 0

  const revPar = roomStats.total > 0 ? Math.round(roomRevenue / roomStats.total) : 0

  // Update audit summary
  audit.summary = {
    totalRooms: roomStats.total,
    occupiedRooms: roomStats.occupied,
    availableRooms: roomStats.available,
    occupancyRate,
    arrivals,
    departures,
    inHouseGuests,
    noShows,
    cancellations: 0,
    walkIns: 0,
    roomRevenue,
    extraRevenue,
    totalRevenue,
    averageDailyRate,
    revPar,
    cashPayments,
    cardPayments,
    bankPayments,
    otherPayments: 0,
    totalPayments: cashPayments + cardPayments + bankPayments
  }

  await audit.save()

  res.json({
    success: true,
    data: audit.summary
  })
})

/**
 * Complete audit and close day
 * POST /api/pms/:hotelId/night-audit/complete
 */
export const completeAudit = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { emailRecipients, notes } = req.body

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  // Verify all steps completed
  if (
    !audit.preAuditCheck?.completed ||
    !audit.noShowProcessing?.completed ||
    !audit.roomChargePosting?.completed ||
    !audit.cashierReconciliation?.completed
  ) {
    throw new BadRequestError('Tum adimlar tamamlanmadan audit kapatılamaz')
  }

  // Get hotel for reports
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    throw new NotFoundError('Hotel bulunamadi')
  }

  // Generate PDF reports
  const reportTypes = ['daily', 'revenue', 'occupancy', 'cashier']
  const reportNames = {
    daily: 'Gunluk_Rapor',
    revenue: 'Gelir_Raporu',
    occupancy: 'Doluluk_Raporu',
    cashier: 'Kasa_Raporu'
  }

  const generatedReports = []
  const pdfReports = [] // For email attachments

  for (const reportType of reportTypes) {
    try {
      const data = await reportService.getReportData(hotelId, audit._id, reportType)

      let pdfBuffer
      switch (reportType) {
        case 'daily':
          pdfBuffer = await reportService.generateDailyReport(audit, hotel, data)
          break
        case 'revenue':
          pdfBuffer = await reportService.generateRevenueReport(audit, hotel, data)
          break
        case 'occupancy':
          pdfBuffer = await reportService.generateOccupancyReport(audit, hotel, data)
          break
        case 'cashier':
          pdfBuffer = await reportService.generateCashierReport(audit, hotel, data)
          break
      }

      const dateStr = new Date(audit.auditDate).toISOString().split('T')[0].replace(/-/g, '')
      const filename = `${reportNames[reportType]}_${dateStr}.pdf`

      generatedReports.push({
        type: reportType,
        filename,
        generatedAt: new Date()
      })

      pdfReports.push({
        filename,
        buffer: pdfBuffer
      })
    } catch (error) {
      logger.error(`Failed to generate ${reportType} report:`, error)
    }
  }

  // Send email with reports if recipients provided
  let emailSent = false
  if (emailRecipients && emailRecipients.length > 0 && pdfReports.length > 0) {
    try {
      await sendNightAuditReports({
        to: emailRecipients,
        hotelName: hotel.name,
        auditDate: audit.auditDate,
        summary: audit.summary,
        reports: pdfReports,
        partnerId: hotel.partner?.toString()
      })
      emailSent = true
      logger.info(`Night audit reports sent to: ${emailRecipients.join(', ')}`)
    } catch (error) {
      logger.error('Failed to send night audit email:', error)
      // Don't fail the audit completion, just log the error
    }
  }

  // Mark reports step as completed
  audit.reportsAndClose = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    reports: generatedReports,
    emailSent,
    emailRecipients: emailRecipients || [],
    dayClosed: true,
    dayClosedAt: new Date()
  }

  // Complete the audit
  audit.status = 'completed'
  audit.completedAt = new Date()
  audit.completedBy = req.user._id
  audit.notes = notes

  await audit.save()

  // Emit WebSocket event for audit completion
  emitAuditEvent(hotelId, 'completed', {
    auditId: audit._id,
    audit,
    emailSent
  })

  res.json({
    success: true,
    data: audit,
    message: emailSent
      ? 'Night audit tamamlandi ve raporlar e-posta ile gonderildi'
      : 'Night audit basariyla tamamlandi'
  })
})

// ==================== HISTORY ====================

/**
 * Get audit history
 * GET /api/pms/:hotelId/night-audit/history
 */
export const getAuditHistory = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { page = 1, limit = 20 } = req.query

  const audits = await NightAudit.getHistory(hotelId, { page, limit })

  const total = await NightAudit.countDocuments({
    hotel: hotelId,
    status: 'completed'
  })

  res.json({
    success: true,
    data: {
      audits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get specific audit details
 * GET /api/pms/:hotelId/night-audit/:auditId
 */
export const getAuditById = asyncHandler(async (req, res) => {
  const { hotelId, auditId } = req.params

  const audit = await NightAudit.findOne({
    _id: auditId,
    hotel: hotelId
  })
    .populate('startedBy', 'firstName lastName')
    .populate('completedBy', 'firstName lastName')

  if (!audit) {
    throw new NotFoundError('Audit bulunamadi')
  }

  res.json({
    success: true,
    data: audit
  })
})

/**
 * Cancel audit
 * POST /api/pms/:hotelId/night-audit/:auditId/cancel
 */
export const cancelAudit = asyncHandler(async (req, res) => {
  const { hotelId, auditId } = req.params
  const { reason } = req.body

  const audit = await NightAudit.findOne({
    _id: auditId,
    hotel: hotelId,
    status: 'in_progress'
  })

  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  await audit.cancel(req.user._id, reason)

  res.json({
    success: true,
    data: audit,
    message: 'Audit iptal edildi'
  })
})

// ==================== REPORTS ====================

import * as reportService from './nightAuditReports.service.js'
import Hotel from '../hotel/hotel.model.js'
import { sendNightAuditReports } from '../../helpers/mail.js'
import logger from '../../core/logger.js'

/**
 * Download audit report as PDF
 * GET /api/pms/:hotelId/night-audit/:auditId/reports/:reportType
 */
export const downloadReport = asyncHandler(async (req, res) => {
  const { hotelId, auditId, reportType } = req.params

  // Validate report type
  const validTypes = ['daily', 'revenue', 'occupancy', 'cashier']
  if (!validTypes.includes(reportType)) {
    throw new BadRequestError(`Gecersiz rapor tipi. Gecerli tipler: ${validTypes.join(', ')}`)
  }

  // Get audit
  const audit = await NightAudit.findOne({
    _id: auditId,
    hotel: hotelId
  })

  if (!audit) {
    throw new NotFoundError('Audit bulunamadi')
  }

  // Get hotel
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    throw new NotFoundError('Hotel bulunamadi')
  }

  // Get report data
  const data = await reportService.getReportData(hotelId, auditId, reportType)

  // Generate PDF
  let pdfBuffer
  const reportTitles = {
    daily: 'Gunluk_Rapor',
    revenue: 'Gelir_Raporu',
    occupancy: 'Doluluk_Raporu',
    cashier: 'Kasa_Raporu'
  }

  switch (reportType) {
    case 'daily':
      pdfBuffer = await reportService.generateDailyReport(audit, hotel, data)
      break
    case 'revenue':
      pdfBuffer = await reportService.generateRevenueReport(audit, hotel, data)
      break
    case 'occupancy':
      pdfBuffer = await reportService.generateOccupancyReport(audit, hotel, data)
      break
    case 'cashier':
      pdfBuffer = await reportService.generateCashierReport(audit, hotel, data)
      break
  }

  // Format filename
  const dateStr = new Date(audit.auditDate).toISOString().split('T')[0]
  const filename = `${reportTitles[reportType]}_${dateStr}.pdf`

  // Send PDF
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length', pdfBuffer.length)
  res.send(pdfBuffer)
})
