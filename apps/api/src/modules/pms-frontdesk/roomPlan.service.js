/**
 * Room Plan Service
 * Timeline view for room occupancy management
 */

import Room from '../pms-housekeeping/room.model.js'
import Stay, { STAY_STATUS } from './stay.model.js'
import Booking from '../booking/booking.model.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { emitPMSEvent, PMS_EVENTS, emitCheckIn, emitRoomStatusChange } from '../pms/pmsSocket.js'

/**
 * Get rooms with occupancy data for timeline view
 * Returns rooms grouped by floor with stays in date range
 */
export const getRoomsWithOccupancy = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { start, end } = req.query

  // Ensure partner context is set
  if (!req.partner?._id) {
    return res.status(403).json({
      success: false,
      message: 'Partner context not found'
    })
  }

  // Default to 14 days if not specified
  const startDate = start ? new Date(start) : new Date()
  startDate.setHours(0, 0, 0, 0)

  const endDate = end ? new Date(end) : new Date()
  if (!end) {
    endDate.setDate(endDate.getDate() + 14)
  }
  endDate.setHours(23, 59, 59, 999)

  // Get all rooms for hotel
  const rooms = await Room.find({
    hotel: hotelId,
    partner: req.partner._id,
    isActive: true
  })
    .populate('roomType', 'name code color')
    .sort({ floor: 1, order: 1, roomNumber: 1 })
    .lean()

  // Get stays that overlap with date range
  // A stay overlaps if: checkInDate <= endDate AND checkOutDate >= startDate
  const stays = await Stay.find({
    hotel: hotelId,
    partner: req.partner._id,
    status: { $in: [STAY_STATUS.CHECKED_IN] },
    $or: [
      // Active stays
      {
        checkInDate: { $lte: endDate },
        checkOutDate: { $gte: startDate }
      }
    ]
  })
    .select(
      'stayNumber room checkInDate checkOutDate actualCheckIn status paymentStatus guests isVip vipLevel'
    )
    .lean()

  // Get pending reservations (not yet checked in) that overlap with date range
  const reservations = await Booking.find({
    hotel: hotelId,
    partner: req.partner._id,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lte: endDate },
    checkOut: { $gte: startDate }
  })
    .select('bookingNumber rooms checkIn checkOut status guests')
    .lean()

  // Create a map of room stays
  const roomStaysMap = new Map()

  // Add checked-in stays
  for (const stay of stays) {
    const roomId = stay.room.toString()
    if (!roomStaysMap.has(roomId)) {
      roomStaysMap.set(roomId, [])
    }

    const mainGuest = stay.guests?.find(g => g.isMainGuest) || stay.guests?.[0]
    roomStaysMap.get(roomId).push({
      _id: stay._id,
      type: 'stay',
      stayNumber: stay.stayNumber,
      guestName: mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : 'N/A',
      checkInDate: stay.checkInDate,
      checkOutDate: stay.checkOutDate,
      actualCheckIn: stay.actualCheckIn,
      status: stay.status,
      paymentStatus: stay.paymentStatus,
      isVip: stay.isVip,
      vipLevel: stay.vipLevel
    })
  }

  // Add reservations (bookings that haven't checked in yet)
  for (const booking of reservations) {
    for (const roomBooking of booking.rooms || []) {
      const roomId = roomBooking.room?.toString()
      if (!roomId) continue

      if (!roomStaysMap.has(roomId)) {
        roomStaysMap.set(roomId, [])
      }

      const mainGuest = booking.guests?.find(g => g.isLead) || booking.guests?.[0]
      roomStaysMap.get(roomId).push({
        _id: booking._id,
        type: 'reservation',
        bookingNumber: booking.bookingNumber,
        guestName: mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : 'N/A',
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        status: booking.status,
        paymentStatus: 'pending',
        isVip: false
      })
    }
  }

  // Group rooms by floor
  const floorMap = new Map()

  for (const room of rooms) {
    const floor = room.floor || 0
    if (!floorMap.has(floor)) {
      floorMap.set(floor, [])
    }

    const roomStays = roomStaysMap.get(room._id.toString()) || []

    floorMap.get(floor).push({
      _id: room._id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      status: room.status,
      housekeepingStatus: room.housekeepingStatus,
      stays: roomStays.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))
    })
  }

  // Convert to sorted array
  const floors = Array.from(floorMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([floor, rooms]) => ({
      floor,
      rooms
    }))

  res.json({
    success: true,
    data: {
      floors,
      dateRange: {
        start: startDate,
        end: endDate
      },
      statistics: {
        totalRooms: rooms.length,
        activeStays: stays.length,
        pendingReservations: reservations.length
      }
    }
  })
})

/**
 * Change room dates (drag operation on timeline)
 */
export const changeStayDates = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { newCheckIn, newCheckOut, reason } = req.body
  const userId = req.user?._id

  const stay = await Stay.findOne({ _id: stayId, hotel: hotelId })

  if (!stay) {
    return res.status(404).json({
      success: false,
      message: 'Konaklama bulunamadı'
    })
  }

  // Validate dates
  const checkIn = new Date(newCheckIn)
  const checkOut = new Date(newCheckOut)

  if (checkIn >= checkOut) {
    return res.status(400).json({
      success: false,
      message: 'Çıkış tarihi giriş tarihinden sonra olmalı'
    })
  }

  // Check if room is available for new dates (excluding current stay)
  const conflictingStay = await Stay.findOne({
    _id: { $ne: stayId },
    hotel: hotelId,
    room: stay.room,
    status: STAY_STATUS.CHECKED_IN,
    $or: [
      {
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn }
      }
    ]
  })

  if (conflictingStay) {
    return res.status(409).json({
      success: false,
      message: 'Seçilen tarihler için oda müsait değil',
      conflict: {
        stayNumber: conflictingStay.stayNumber,
        checkIn: conflictingStay.checkInDate,
        checkOut: conflictingStay.checkOutDate
      }
    })
  }

  // Update stay dates
  const oldCheckIn = stay.checkInDate
  const oldCheckOut = stay.checkOutDate

  stay.checkInDate = checkIn
  stay.checkOutDate = checkOut
  stay.nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  await stay.save()

  // Update room expected checkout date
  await Room.findByIdAndUpdate(stay.room, {
    expectedCheckoutDate: checkOut
  })

  // Emit socket event for timeline refresh
  emitPMSEvent(hotelId, PMS_EVENTS.CHECK_IN, {
    stayId: stay._id,
    stayNumber: stay.stayNumber,
    action: 'dates_changed',
    roomId: stay.room,
    oldDates: { checkIn: oldCheckIn, checkOut: oldCheckOut },
    newDates: { checkIn, checkOut },
    reason,
    changedBy: userId
  })

  res.json({
    success: true,
    message: 'Konaklama tarihleri güncellendi',
    data: stay
  })
})

/**
 * Move stay to different room (drag to another room row)
 */
export const moveStayToRoom = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { newRoomId, newCheckIn, newCheckOut, reason } = req.body
  const userId = req.user?._id

  const stay = await Stay.findOne({ _id: stayId, hotel: hotelId })

  if (!stay) {
    return res.status(404).json({
      success: false,
      message: 'Konaklama bulunamadı'
    })
  }

  const newRoom = await Room.findOne({ _id: newRoomId, hotel: hotelId })

  if (!newRoom) {
    return res.status(404).json({
      success: false,
      message: 'Hedef oda bulunamadı'
    })
  }

  // Use new dates if provided, otherwise keep existing
  const checkIn = newCheckIn ? new Date(newCheckIn) : stay.checkInDate
  const checkOut = newCheckOut ? new Date(newCheckOut) : stay.checkOutDate

  // Check if new room is available
  const conflictingStay = await Stay.findOne({
    _id: { $ne: stayId },
    hotel: hotelId,
    room: newRoomId,
    status: STAY_STATUS.CHECKED_IN,
    $or: [
      {
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn }
      }
    ]
  })

  if (conflictingStay) {
    return res.status(409).json({
      success: false,
      message: 'Hedef oda seçilen tarihler için müsait değil',
      conflict: {
        stayNumber: conflictingStay.stayNumber,
        checkIn: conflictingStay.checkInDate,
        checkOut: conflictingStay.checkOutDate
      }
    })
  }

  // Use stay's changeRoom method which handles room history
  await stay.changeRoom(newRoomId, reason || 'Oda planından taşındı', userId)

  // Update dates if changed
  if (newCheckIn || newCheckOut) {
    stay.checkInDate = checkIn
    stay.checkOutDate = checkOut
    stay.nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    await stay.save()
  }

  // Emit socket event for timeline refresh
  emitPMSEvent(hotelId, PMS_EVENTS.CHECK_IN, {
    stayId: stay._id,
    stayNumber: stay.stayNumber,
    action: 'room_changed',
    oldRoomId: stay.roomHistory[stay.roomHistory.length - 1]?.room,
    roomId: newRoomId,
    reason,
    changedBy: userId
  })

  res.json({
    success: true,
    message: 'Konaklama yeni odaya taşındı',
    data: stay
  })
})

/**
 * Get room availability for date range
 */
export const checkRoomAvailability = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params
  const { checkIn, checkOut, excludeStayId } = req.query

  const startDate = new Date(checkIn)
  const endDate = new Date(checkOut)

  const query = {
    hotel: hotelId,
    room: roomId,
    status: STAY_STATUS.CHECKED_IN,
    $or: [
      {
        checkInDate: { $lt: endDate },
        checkOutDate: { $gt: startDate }
      }
    ]
  }

  if (excludeStayId) {
    query._id = { $ne: excludeStayId }
  }

  const conflictingStays = await Stay.find(query)
    .select('stayNumber checkInDate checkOutDate')
    .lean()

  res.json({
    success: true,
    data: {
      isAvailable: conflictingStays.length === 0,
      conflicts: conflictingStays
    }
  })
})

export default {
  getRoomsWithOccupancy,
  changeStayDates,
  moveStayToRoom,
  checkRoomAvailability
}
