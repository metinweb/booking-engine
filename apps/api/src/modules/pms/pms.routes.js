import express from 'express'
import guestRoutes from '../pms-guest/guest.routes.js'
import reservationRoutes from '../pms-reservation/reservation.routes.js'
import frontdeskRoutes from '../pms-frontdesk/frontdesk.routes.js'
import housekeepingRoutes from '../pms-housekeeping/housekeeping.routes.js'
import billingRoutes from '../pms-billing/billing.routes.js'
import settingsRoutes from '../pms-settings/settings.routes.js'

const router = express.Router()

// Aggregating all PMS modules
// Note provided paths are relative to this file (apps/api/src/modules/pms/pms.routes.js)

router.use('/', settingsRoutes) // Auth & Users
router.use('/', guestRoutes)
router.use('/', reservationRoutes)
router.use('/', frontdeskRoutes)
router.use('/', housekeepingRoutes)
router.use('/', billingRoutes)

export default router
