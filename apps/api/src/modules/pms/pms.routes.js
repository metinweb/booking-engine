import express from 'express'
import * as pmsAuthService from './pmsAuth.service.js'
import * as pmsUserService from './pmsUser.service.js'
import * as roomService from './room.service.js'
import * as stayService from './stay.service.js'
import * as reservationService from './reservation.service.js'
import * as guestService from './guest.service.js'
import * as cashierService from './cashier.service.js'
import * as reportsService from './reports.service.js'
import * as settingsService from './settings.service.js'
import nightAuditRoutes from './nightAudit.routes.js'
import kbsRoutes from './kbs.routes.js'
import roomPlanRoutes from './roomPlan.routes.js'
import {
  pmsProtect,
  pmsRequirePermission,
  pmsRequireRole,
  pmsDualAuth,
  pmsDualRequirePartnerOrAdmin,
  pmsSetPartnerFromHotel
} from './pmsAuth.middleware.js'
import { protect, requirePartnerOrAdmin, setPartnerFromHotel } from '../../middleware/auth.js'

const router = express.Router()

// ===========================================
// PUBLIC PMS AUTH ROUTES (No auth required)
// ===========================================

// Get partner by domain (for auto-detecting partner on login page)
router.get('/auth/partner-by-domain', pmsAuthService.getPartnerByDomain)

// PMS Login
router.post('/auth/login', pmsAuthService.login)

// Select hotel after login (for multi-hotel users)
router.post('/auth/select-hotel', pmsAuthService.selectHotel)

// ===========================================
// PROTECTED PMS AUTH ROUTES (PMS token required)
// ===========================================

// Get current PMS user
router.get('/auth/me', pmsProtect, pmsAuthService.me)

// Switch hotel
router.post('/auth/switch-hotel', pmsProtect, pmsAuthService.switchHotel)

// Logout
router.post('/auth/logout', pmsProtect, pmsAuthService.logout)

// Change password
router.post('/auth/change-password', pmsProtect, pmsAuthService.changePassword)

// ===========================================
// PMS USER MANAGEMENT ROUTES
// These can be accessed either by:
// 1. PMS admin users (with PMS token)
// 2. Partner/Platform admins (with regular token)
// ===========================================

// PMS User CRUD - For PMS admins
router.get('/users',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.getAll
)

router.get('/users/:id',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.getOne
)

router.post('/users',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.create
)

router.put('/users/:id',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.update
)

router.delete('/users/:id',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.remove
)

// Reset user password (admin only)
router.post('/users/:id/reset-password',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.resetPassword
)

// Hotel assignment management
router.post('/users/:id/assign-hotel',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.assignHotel
)

router.delete('/users/:id/hotels/:hotelId',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.removeHotel
)

router.put('/users/:id/hotels/:hotelId/permissions',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.updatePermissions
)

// Get users by hotel
router.get('/hotels/:hotelId/users',
  pmsProtect,
  pmsRequirePermission('settings.users'),
  pmsUserService.getByHotel
)

// ===========================================
// ADMIN ROUTES (For Partner/Platform admins)
// Uses regular auth, not PMS auth
// ===========================================

// These routes allow partner admins to manage PMS users
// without needing to log into PMS

router.get('/admin/users',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.getAll
)

router.get('/admin/users/:id',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.getOne
)

router.post('/admin/users',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.create
)

router.put('/admin/users/:id',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.update
)

router.delete('/admin/users/:id',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.remove
)

router.post('/admin/users/:id/reset-password',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.resetPassword
)

router.post('/admin/users/:id/assign-hotel',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.assignHotel
)

router.delete('/admin/users/:id/hotels/:hotelId',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.removeHotel
)

router.put('/admin/users/:id/hotels/:hotelId/permissions',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.updatePermissions
)

// ===========================================
// HOTEL-SCOPED PMS ROUTES
// Dual-auth: Both PMS users and Partner/Platform admins can access
// ===========================================

// Apply dual-auth middleware for all hotel routes
// This allows both PMS staff (pmsToken) and Partner admins (regular token)
router.use('/hotels/:hotelId', pmsDualAuth, pmsDualRequirePartnerOrAdmin, pmsSetPartnerFromHotel)

// ===========================================
// ROOM TYPE ROUTES
// ===========================================

// Get room types for hotel
router.get('/hotels/:hotelId/room-types',
  roomService.getRoomTypes
)

// ===========================================
// ROOM MANAGEMENT ROUTES
// ===========================================

// Get all rooms for a hotel
router.get('/hotels/:hotelId/rooms',
  roomService.getRooms
)

// Get room statistics
router.get('/hotels/:hotelId/rooms/statistics',
  roomService.getRoomStatistics
)

// Get rooms needing cleaning
router.get('/hotels/:hotelId/rooms/needs-cleaning',
  roomService.getRoomsNeedingCleaning
)

// Get rooms by floor
router.get('/hotels/:hotelId/rooms/floor/:floor',
  roomService.getRoomsByFloor
)

// Get single room
router.get('/hotels/:hotelId/rooms/:roomId',
  roomService.getRoom
)

// Create room
router.post('/hotels/:hotelId/rooms',
  roomService.createRoom
)

// Create rooms in bulk
router.post('/hotels/:hotelId/rooms/bulk',
  roomService.createRoomsBulk
)

// Update room
router.put('/hotels/:hotelId/rooms/:roomId',
  roomService.updateRoom
)

// Delete room
router.delete('/hotels/:hotelId/rooms/:roomId',
  roomService.deleteRoom
)

// Update room status
router.patch('/hotels/:hotelId/rooms/:roomId/status',
  roomService.updateRoomStatus
)

// Update housekeeping status
router.patch('/hotels/:hotelId/rooms/:roomId/housekeeping',
  roomService.updateHousekeepingStatus
)

// Bulk update housekeeping
router.patch('/hotels/:hotelId/rooms/bulk/housekeeping',
  roomService.bulkUpdateHousekeeping
)

// ===========================================
// HOUSEKEEPING ROUTES
// ===========================================

// Get housekeeping dashboard
router.get('/hotels/:hotelId/housekeeping',
  roomService.getHousekeeping
)

// ===========================================
// FRONT DESK ROUTES (Alias for compatibility)
// ===========================================

// Today's arrivals (alias for reports)
router.get('/hotels/:hotelId/front-desk/arrivals', reportsService.getArrivalsReport)

// Today's departures (alias for reports)
router.get('/hotels/:hotelId/front-desk/departures', reportsService.getDeparturesReport)

// In-house guests (alias for reports)
router.get('/hotels/:hotelId/front-desk/in-house', reportsService.getInHouseReport)

// ===========================================
// STAY MANAGEMENT ROUTES (Front Desk)
// ===========================================

// Get all stays
router.get('/hotels/:hotelId/stays', stayService.getStays)

// Create new stay directly
router.post('/hotels/:hotelId/stays', stayService.createStay)

// Get front desk statistics
router.get('/hotels/:hotelId/stays/stats', stayService.getFrontDeskStats)

// Get today's activity (arrivals, departures)
router.get('/hotels/:hotelId/stays/today', stayService.getTodayActivity)

// Get active stays
router.get('/hotels/:hotelId/stays/active', stayService.getActiveStays)

// Get available rooms for check-in
router.get('/hotels/:hotelId/stays/available-rooms', stayService.getAvailableRooms)

// Get single stay
router.get('/hotels/:hotelId/stays/:stayId', stayService.getStay)

// Walk-in check-in
router.post('/hotels/:hotelId/stays/walk-in', stayService.walkInCheckIn)

// Check-in from booking
router.post('/hotels/:hotelId/stays/check-in', stayService.checkInFromBooking)

// Check-in from pending stay (PMS reservation or auto-created from booking)
router.patch('/hotels/:hotelId/stays/:stayId/check-in', stayService.checkInFromStay)

// Check-out
router.post('/hotels/:hotelId/stays/:stayId/check-out', stayService.checkOut)

// Add extra charge
router.post('/hotels/:hotelId/stays/:stayId/extras', stayService.addExtra)

// Add payment
router.post('/hotels/:hotelId/stays/:stayId/payments', stayService.addPayment)

// Change room
router.post('/hotels/:hotelId/stays/:stayId/change-room', stayService.changeRoom)

// Extend stay
router.post('/hotels/:hotelId/stays/:stayId/extend', stayService.extendStay)

// Update notes
router.patch('/hotels/:hotelId/stays/:stayId/notes', stayService.updateNotes)

// ===========================================
// RESERVATION MANAGEMENT ROUTES
// ===========================================

// Get all reservations for a hotel
router.get('/hotels/:hotelId/reservations', reservationService.getReservations)

// Get reservations by date range (calendar view)
router.get('/hotels/:hotelId/reservations/calendar', reservationService.getReservationsByDateRange)

// Get today's arrivals
router.get('/hotels/:hotelId/reservations/arrivals', reservationService.getTodayArrivals)

// Get today's departures
router.get('/hotels/:hotelId/reservations/departures', reservationService.getTodayDepartures)

// Get reservation statistics
router.get('/hotels/:hotelId/reservations/stats', reservationService.getReservationStats)

// Get single reservation
router.get('/hotels/:hotelId/reservations/:reservationId', reservationService.getReservation)

// Create new reservation
router.post('/hotels/:hotelId/reservations', reservationService.createReservation)

// Update reservation
router.put('/hotels/:hotelId/reservations/:reservationId', reservationService.updateReservation)

// Confirm reservation
router.post('/hotels/:hotelId/reservations/:reservationId/confirm', reservationService.confirmReservation)

// Cancel reservation
router.post('/hotels/:hotelId/reservations/:reservationId/cancel', reservationService.cancelReservation)

// Mark as no-show
router.post('/hotels/:hotelId/reservations/:reservationId/no-show', reservationService.markNoShow)

// Add note to reservation
router.post('/hotels/:hotelId/reservations/:reservationId/notes', reservationService.addNote)

// Add payment to reservation
router.post('/hotels/:hotelId/reservations/:reservationId/payments', reservationService.addPayment)

// ===========================================
// GUEST MANAGEMENT ROUTES
// ===========================================

// Get all guests
router.get('/hotels/:hotelId/guests', guestService.getGuests)

// Get guest statistics
router.get('/hotels/:hotelId/guests/stats', guestService.getGuestStats)

// Get VIP guests
router.get('/hotels/:hotelId/guests/vip', guestService.getVipGuests)

// Get blacklisted guests
router.get('/hotels/:hotelId/guests/blacklisted', guestService.getBlacklistedGuests)

// Get recent guests
router.get('/hotels/:hotelId/guests/recent', guestService.getRecentGuests)

// Get single guest
router.get('/hotels/:hotelId/guests/:guestId', guestService.getGuest)

// Create new guest
router.post('/hotels/:hotelId/guests', guestService.createGuest)

// Update guest
router.put('/hotels/:hotelId/guests/:guestId', guestService.updateGuest)

// Delete guest
router.delete('/hotels/:hotelId/guests/:guestId', guestService.deleteGuest)

// Set VIP level
router.patch('/hotels/:hotelId/guests/:guestId/vip', guestService.setVipLevel)

// Blacklist guest
router.post('/hotels/:hotelId/guests/:guestId/blacklist', guestService.blacklistGuest)

// Remove from blacklist
router.delete('/hotels/:hotelId/guests/:guestId/blacklist', guestService.removeFromBlacklist)

// Add note to guest
router.post('/hotels/:hotelId/guests/:guestId/notes', guestService.addNote)

// Delete note from guest
router.delete('/hotels/:hotelId/guests/:guestId/notes/:noteId', guestService.deleteNote)

// Update guest tags
router.patch('/hotels/:hotelId/guests/:guestId/tags', guestService.updateTags)

// Get guest stay history
router.get('/hotels/:hotelId/guests/:guestId/stays', guestService.getStayHistory)

// Merge guests
router.post('/hotels/:hotelId/guests/merge', guestService.mergeGuests)

// ===========================================
// CASHIER / POS ROUTES
// ===========================================

// --- Shift Management ---

// Get cashier statistics dashboard
router.get('/hotels/:hotelId/cashier/stats', cashierService.getCashierStats)

// Get transaction types and categories (for dropdowns)
router.get('/hotels/:hotelId/cashier/types', cashierService.getTransactionTypes)

// Get daily summary
router.get('/hotels/:hotelId/cashier/daily-summary', cashierService.getDailySummary)

// Get daily summary by currency (multi-currency)
router.get('/hotels/:hotelId/cashier/daily-summary-by-currency', cashierService.getDailySummaryByCurrency)

// Get available currencies and exchange rates
router.get('/hotels/:hotelId/cashier/currencies', cashierService.getCurrencies)

// Get active shift
router.get('/hotels/:hotelId/cashier/shifts/active', cashierService.getActiveShift)

// Get all shifts
router.get('/hotels/:hotelId/cashier/shifts', cashierService.getShifts)

// Get single shift
router.get('/hotels/:hotelId/cashier/shifts/:shiftId', cashierService.getShift)

// Open new shift
router.post('/hotels/:hotelId/cashier/shifts', cashierService.openShift)
router.post('/hotels/:hotelId/cashier/shifts/open', cashierService.openShift) // Alias

// Close shift
router.post('/hotels/:hotelId/cashier/shifts/:shiftId/close', cashierService.closeShift)

// Add cash movement to shift
router.post('/hotels/:hotelId/cashier/shifts/:shiftId/movements', cashierService.addCashMovement)

// --- Transaction Management ---

// Get all transactions
router.get('/hotels/:hotelId/cashier/transactions', cashierService.getTransactions)

// Create transaction
router.post('/hotels/:hotelId/cashier/transactions', cashierService.createTransaction)

// Void transaction
router.post('/hotels/:hotelId/cashier/transactions/:transactionId/void', cashierService.voidTransaction)

// Refund transaction
router.post('/hotels/:hotelId/cashier/transactions/:transactionId/refund', cashierService.refundTransaction)

// ===========================================
// REPORTS ROUTES
// ===========================================

// Dashboard summary report
router.get('/hotels/:hotelId/reports/dashboard', reportsService.getDashboardReport)

// Occupancy reports
router.get('/hotels/:hotelId/reports/occupancy', reportsService.getOccupancyReport)
router.get('/hotels/:hotelId/reports/occupancy/room-types', reportsService.getRoomTypeOccupancy)

// Arrival/Departure reports
router.get('/hotels/:hotelId/reports/arrivals', reportsService.getArrivalsReport)
router.get('/hotels/:hotelId/reports/departures', reportsService.getDeparturesReport)
router.get('/hotels/:hotelId/reports/in-house', reportsService.getInHouseReport)

// Financial reports
router.get('/hotels/:hotelId/reports/revenue', reportsService.getRevenueReport)
router.get('/hotels/:hotelId/reports/shifts', reportsService.getShiftReport)

// Housekeeping report
router.get('/hotels/:hotelId/reports/housekeeping', reportsService.getHousekeepingReport)

// Guest reports
router.get('/hotels/:hotelId/reports/guests/nationality', reportsService.getGuestNationalityReport)
router.get('/hotels/:hotelId/reports/guests/vip', reportsService.getVipGuestsReport)

// ===========================================
// SETTINGS ROUTES
// ===========================================

// Utility endpoints (static data) - these need their own middleware as they're not under /hotels/:hotelId
router.get('/settings/timezones', protect, requirePartnerOrAdmin, settingsService.getTimezones)
router.get('/settings/currencies', protect, requirePartnerOrAdmin, settingsService.getCurrencies)

// Get all settings for hotel
router.get('/hotels/:hotelId/settings', settingsService.getSettings)

// Update all settings
router.put('/hotels/:hotelId/settings', settingsService.updateAllSettings)

// Reset settings
router.post('/hotels/:hotelId/settings/reset', settingsService.resetSettings)

// Section-specific updates
router.put('/hotels/:hotelId/settings/general', settingsService.updateGeneralSettings)
router.put('/hotels/:hotelId/settings/front-desk', settingsService.updateFrontDeskSettings)
router.put('/hotels/:hotelId/settings/taxes', settingsService.updateTaxSettings)
router.put('/hotels/:hotelId/settings/invoicing', settingsService.updateInvoicingSettings)
router.put('/hotels/:hotelId/settings/housekeeping', settingsService.updateHousekeepingSettings)
router.put('/hotels/:hotelId/settings/cashier', settingsService.updateCashierSettings)

router.put('/hotels/:hotelId/settings/notifications', settingsService.updateNotificationSettings)
router.put('/hotels/:hotelId/settings/reservations', settingsService.updateReservationSettings)
router.put('/hotels/:hotelId/settings/guests', settingsService.updateGuestSettings)
router.put('/hotels/:hotelId/settings/kbs', settingsService.updateKbsSettings)

// Utility: Generate invoice/receipt numbers
router.post('/hotels/:hotelId/settings/invoice-number', settingsService.getNextInvoiceNumber)
router.post('/hotels/:hotelId/settings/receipt-number', settingsService.getNextReceiptNumber)

// ===========================================
// NIGHT AUDIT ROUTES
// ===========================================

router.use('/hotels/:hotelId/night-audit', nightAuditRoutes)

// ===========================================
// KBS (Kimlik Bildirim Sistemi) ROUTES
// Turkish police/gendarmerie guest notification
// ===========================================

router.use('/hotels/:hotelId/kbs', kbsRoutes)

// ===========================================
// ROOM PLAN ROUTES
// Timeline view for room occupancy management
// ===========================================

router.use('/hotels/:hotelId/room-plan', roomPlanRoutes)

export default router
