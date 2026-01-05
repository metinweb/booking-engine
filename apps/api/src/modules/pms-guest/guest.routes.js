import express from 'express'
import * as guestService from './guest.service.js'
import kbsRoutes from './kbs.routes.js'
import {
  pmsDualAuth,
  pmsDualRequirePartnerOrAdmin,
  pmsSetPartnerFromHotel
} from '../pms-settings/pmsAuth.middleware.js'

const router = express.Router()

// ===========================================
// GUEST MANAGEMENT ROUTES
// ===========================================

// Apply dual-auth middleware for all hotel routes
// Note: In pms.routes.js this was applied globally to /hotels/:hotelId,
// Since these are fragments, we should make sure we preserve that or apply it here if needed.
// However, the aggregator might not apply it if we split them.
// Best practice: Apply it to the specific routes or re-apply here.
// But wait, if I apply it here, and also in other files, is that okay? Yes.
// BUT, if the aggregator does `router.use('/', guestRoutes)`, existing middleware from aggregator might apply.
// The aggregator I planned:
// router.use('/', guestRoutes)
// The original applied middleware to `router.use('/hotels/:hotelId', ...)`
// So I should group these under `/hotels/:hotelId`.
// Simpler: Just export the router with the routes defined on it, and let the aggregator handle the `hotels/:hotelId` prefix/middleware if possible.
// BUT the routes are like `/hotels/:hotelId/guests`.
// The original did `router.use('/hotels/:hotelId', middleware)`.
// So any route starting with `/hotels/:hotelId` got it.
// I should include the middleware lines in EACH file to be safe and modular OR do it in aggregator.
// Doing it in aggregator is "God Mode" style.
// Doing it in each file is "Modular".
// Let's do it in each file for the `/hotels/:hotelId` routes.

// Common Middleware for this module's hotel routes
const hotelMiddleware = [pmsDualAuth, pmsDualRequirePartnerOrAdmin, pmsSetPartnerFromHotel]

// Get all guests
router.get('/hotels/:hotelId/guests', hotelMiddleware, guestService.getGuests)

// Get guest statistics
router.get('/hotels/:hotelId/guests/stats', hotelMiddleware, guestService.getGuestStats)

// Get VIP guests
router.get('/hotels/:hotelId/guests/vip', hotelMiddleware, guestService.getVipGuests)

// Get blacklisted guests
router.get(
  '/hotels/:hotelId/guests/blacklisted',
  hotelMiddleware,
  guestService.getBlacklistedGuests
)

// Get recent guests
router.get('/hotels/:hotelId/guests/recent', hotelMiddleware, guestService.getRecentGuests)

// Get single guest
router.get('/hotels/:hotelId/guests/:guestId', hotelMiddleware, guestService.getGuest)

// Create new guest
router.post('/hotels/:hotelId/guests', hotelMiddleware, guestService.createGuest)

// Update guest
router.put('/hotels/:hotelId/guests/:guestId', hotelMiddleware, guestService.updateGuest)

// Delete guest
router.delete('/hotels/:hotelId/guests/:guestId', hotelMiddleware, guestService.deleteGuest)

// Set VIP level
router.patch('/hotels/:hotelId/guests/:guestId/vip', hotelMiddleware, guestService.setVipLevel)

// Blacklist guest
router.post(
  '/hotels/:hotelId/guests/:guestId/blacklist',
  hotelMiddleware,
  guestService.blacklistGuest
)

// Remove from blacklist
router.delete(
  '/hotels/:hotelId/guests/:guestId/blacklist',
  hotelMiddleware,
  guestService.removeFromBlacklist
)

// Add note to guest
router.post('/hotels/:hotelId/guests/:guestId/notes', hotelMiddleware, guestService.addNote)

// Delete note from guest
router.delete(
  '/hotels/:hotelId/guests/:guestId/notes/:noteId',
  hotelMiddleware,
  guestService.deleteNote
)

// Update guest tags
router.patch('/hotels/:hotelId/guests/:guestId/tags', hotelMiddleware, guestService.updateTags)

// Get guest stay history
router.get('/hotels/:hotelId/guests/:guestId/stays', hotelMiddleware, guestService.getStayHistory)

// Merge guests
router.post('/hotels/:hotelId/guests/merge', hotelMiddleware, guestService.mergeGuests)

// ===========================================
// KBS (Kimlik Bildirim Sistemi) ROUTES
// ===========================================

router.use('/hotels/:hotelId/kbs', hotelMiddleware, kbsRoutes)

export default router
