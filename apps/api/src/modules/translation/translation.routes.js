import express from 'express'
import * as translationService from './translation.service.js'
import { protect } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Single text translation
router.post('/translate', translationService.translateSingle)

// Translate multiple fields to multiple languages
router.post('/translate-fields', translationService.translateFieldsHandler)

// Batch translate content object
router.post('/batch', translationService.batchTranslateHandler)

// Translate SEO fields
router.post('/translate-seo', translationService.translateSeo)

export default router
