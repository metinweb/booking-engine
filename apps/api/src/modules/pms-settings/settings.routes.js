import express from 'express'
import * as pmsAuthService from './pmsAuth.service.js'
import * as pmsUserService from './pmsUser.service.js'
import * as settingsService from './settings.service.js'
import {
  pmsProtect,
  pmsRequirePermission,
  pmsRequireRole,
  pmsDualAuth,
  pmsDualRequirePartnerOrAdmin,
  pmsSetPartnerFromHotel
} from './pmsAuth.middleware.js'
import { protect, requirePartnerOrAdmin } from '../../middleware/auth.js'

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
router.get('/users', pmsProtect, pmsRequireRole('pms_admin'), pmsUserService.getAll)

router.get('/users/:id', pmsProtect, pmsRequireRole('pms_admin'), pmsUserService.getOne)

router.post('/users', pmsProtect, pmsRequireRole('pms_admin'), pmsUserService.create)

router.put('/users/:id', pmsProtect, pmsRequireRole('pms_admin'), pmsUserService.update)

router.delete('/users/:id', pmsProtect, pmsRequireRole('pms_admin'), pmsUserService.remove)

// Reset user password (admin only)
router.post(
  '/users/:id/reset-password',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.resetPassword
)

// Hotel assignment management
router.post(
  '/users/:id/assign-hotel',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.assignHotel
)

router.delete(
  '/users/:id/hotels/:hotelId',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.removeHotel
)

router.put(
  '/users/:id/hotels/:hotelId/permissions',
  pmsProtect,
  pmsRequireRole('pms_admin'),
  pmsUserService.updatePermissions
)

// Get users by hotel
router.get(
  '/hotels/:hotelId/users',
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

router.get('/admin/users', protect, requirePartnerOrAdmin, pmsUserService.getAll)

router.get('/admin/users/:id', protect, requirePartnerOrAdmin, pmsUserService.getOne)

router.post('/admin/users', protect, requirePartnerOrAdmin, pmsUserService.create)

router.put('/admin/users/:id', protect, requirePartnerOrAdmin, pmsUserService.update)

router.delete('/admin/users/:id', protect, requirePartnerOrAdmin, pmsUserService.remove)

router.post(
  '/admin/users/:id/reset-password',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.resetPassword
)

router.post(
  '/admin/users/:id/assign-hotel',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.assignHotel
)

router.delete(
  '/admin/users/:id/hotels/:hotelId',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.removeHotel
)

router.put(
  '/admin/users/:id/hotels/:hotelId/permissions',
  protect,
  requirePartnerOrAdmin,
  pmsUserService.updatePermissions
)

// ===========================================
// SETTINGS ROUTES
// ===========================================

const hotelMiddleware = [pmsDualAuth, pmsDualRequirePartnerOrAdmin, pmsSetPartnerFromHotel]

// Utility endpoints (static data) - these need their own middleware as they're not under /hotels/:hotelId
router.get('/settings/timezones', protect, requirePartnerOrAdmin, settingsService.getTimezones)
router.get('/settings/currencies', protect, requirePartnerOrAdmin, settingsService.getCurrencies)

// Get all settings for hotel
router.get('/hotels/:hotelId/settings', hotelMiddleware, settingsService.getSettings)

// Update all settings
router.put('/hotels/:hotelId/settings', hotelMiddleware, settingsService.updateAllSettings)

// Reset settings
router.post('/hotels/:hotelId/settings/reset', hotelMiddleware, settingsService.resetSettings)

// Section-specific updates
router.put(
  '/hotels/:hotelId/settings/general',
  hotelMiddleware,
  settingsService.updateGeneralSettings
)
router.put(
  '/hotels/:hotelId/settings/front-desk',
  hotelMiddleware,
  settingsService.updateFrontDeskSettings
)
router.put('/hotels/:hotelId/settings/taxes', hotelMiddleware, settingsService.updateTaxSettings)
router.put(
  '/hotels/:hotelId/settings/invoicing',
  hotelMiddleware,
  settingsService.updateInvoicingSettings
)
router.put(
  '/hotels/:hotelId/settings/housekeeping',
  hotelMiddleware,
  settingsService.updateHousekeepingSettings
)
router.put(
  '/hotels/:hotelId/settings/cashier',
  hotelMiddleware,
  settingsService.updateCashierSettings
)

router.put(
  '/hotels/:hotelId/settings/notifications',
  hotelMiddleware,
  settingsService.updateNotificationSettings
)
router.put(
  '/hotels/:hotelId/settings/reservations',
  hotelMiddleware,
  settingsService.updateReservationSettings
)
router.put('/hotels/:hotelId/settings/guests', hotelMiddleware, settingsService.updateGuestSettings)
router.put('/hotels/:hotelId/settings/kbs', hotelMiddleware, settingsService.updateKbsSettings)

// Utility: Generate invoice/receipt numbers
router.post(
  '/hotels/:hotelId/settings/invoice-number',
  hotelMiddleware,
  settingsService.getNextInvoiceNumber
)
router.post(
  '/hotels/:hotelId/settings/receipt-number',
  hotelMiddleware,
  settingsService.getNextReceiptNumber
)

export default router
