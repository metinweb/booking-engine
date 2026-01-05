import express from 'express'
import * as roomService from './room.service.js'
import * as planningService from '../planning/planning.service.js'
import {
  pmsDualAuth,
  pmsDualRequirePartnerOrAdmin,
  pmsSetPartnerFromHotel
} from '../pms-settings/pmsAuth.middleware.js'

const router = express.Router()

const hotelMiddleware = [pmsDualAuth, pmsDualRequirePartnerOrAdmin, pmsSetPartnerFromHotel]

// ===========================================
// ROOM TYPE ROUTES
// ===========================================

// Get room types for hotel
router.get('/hotels/:hotelId/room-types', hotelMiddleware, roomService.getRoomTypes)

// ===========================================
// MEAL PLAN ROUTES (for PMS users)
// ===========================================

// Get meal plans for hotel
router.get('/hotels/:hotelId/meal-plans', hotelMiddleware, planningService.getMealPlans)

// ===========================================
// ROOM MANAGEMENT ROUTES
// ===========================================

// Get all rooms for a hotel
router.get('/hotels/:hotelId/rooms', hotelMiddleware, roomService.getRooms)

// Get room statistics
router.get('/hotels/:hotelId/rooms/statistics', hotelMiddleware, roomService.getRoomStatistics)

// Get rooms needing cleaning
router.get(
  '/hotels/:hotelId/rooms/needs-cleaning',
  hotelMiddleware,
  roomService.getRoomsNeedingCleaning
)

// Get rooms by floor
router.get('/hotels/:hotelId/rooms/floor/:floor', hotelMiddleware, roomService.getRoomsByFloor)

// Get single room
router.get('/hotels/:hotelId/rooms/:roomId', hotelMiddleware, roomService.getRoom)

// Create room
router.post('/hotels/:hotelId/rooms', hotelMiddleware, roomService.createRoom)

// Create rooms in bulk
router.post('/hotels/:hotelId/rooms/bulk', hotelMiddleware, roomService.createRoomsBulk)

// Update room
router.put('/hotels/:hotelId/rooms/:roomId', hotelMiddleware, roomService.updateRoom)

// Delete room
router.delete('/hotels/:hotelId/rooms/:roomId', hotelMiddleware, roomService.deleteRoom)

// Update room status
router.patch('/hotels/:hotelId/rooms/:roomId/status', hotelMiddleware, roomService.updateRoomStatus)

// Update housekeeping status
router.patch(
  '/hotels/:hotelId/rooms/:roomId/housekeeping',
  hotelMiddleware,
  roomService.updateHousekeepingStatus
)

// Bulk update housekeeping
router.patch(
  '/hotels/:hotelId/rooms/bulk/housekeeping',
  hotelMiddleware,
  roomService.bulkUpdateHousekeeping
)

// ===========================================
// HOUSEKEEPING ROUTES
// ===========================================

// Get housekeeping dashboard
router.get('/hotels/:hotelId/housekeeping', hotelMiddleware, roomService.getHousekeeping)

export default router
