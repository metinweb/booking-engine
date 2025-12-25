import express from 'express'
import * as agencyService from './agency.service.js'
import { protect, requireAdmin } from '../../middleware/auth.js'
import { partnerContext } from '../../middlewares/partnerContext.js'

const router = express.Router()

// All routes require authentication and admin role
// Both platform admins and partner admins can access
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// CRUD routes
router.post('/', agencyService.createAgency)
router.get('/', agencyService.getAgencies)
router.get('/:id', agencyService.getAgency)
router.put('/:id', agencyService.updateAgency)
router.delete('/:id', agencyService.deleteAgency)

// Actions
router.post('/:id/activate', agencyService.activateAgency)
router.post('/:id/deactivate', agencyService.deactivateAgency)
router.post('/:id/approve', agencyService.approveAgency)

// Agency Users
router.get('/:id/users', agencyService.getAgencyUsers)
router.post('/:id/users', agencyService.createAgencyUser)
router.put('/:id/users/:userId', agencyService.updateAgencyUser)
router.delete('/:id/users/:userId', agencyService.deleteAgencyUser)

export default router
