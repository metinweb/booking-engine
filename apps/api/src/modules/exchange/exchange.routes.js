/**
 * Exchange Rate Routes
 * Endpoints for currency exchange rates
 */

import { Router } from 'express'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { protect, requireAdmin } from '../../middleware/auth.js'
import { getSchedulerStatus, forceFetchRates } from '../../services/exchangeScheduler.js'
import {
  getExchangeRates,
  setManualRate,
  convertCurrency,
  getRateHistory,
  SUPPORTED_CURRENCIES
} from '../../services/currencyService.js'

const router = Router()

/**
 * GET /api/exchange/rates
 * Get current exchange rates
 */
router.get(
  '/rates',
  asyncHandler(async (req, res) => {
    const rates = await getExchangeRates()

    res.json({
      success: true,
      data: rates
    })
  })
)

/**
 * GET /api/exchange/currencies
 * Get list of supported currencies
 */
router.get(
  '/currencies',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: SUPPORTED_CURRENCIES
    })
  })
)

/**
 * POST /api/exchange/convert
 * Convert amount between currencies
 */
router.post(
  '/convert',
  asyncHandler(async (req, res) => {
    const { amount, from, to } = req.body

    const result = await convertCurrency(amount, from, to)

    res.json({
      success: true,
      data: result
    })
  })
)

/**
 * GET /api/exchange/rate/:from/:to
 * Get exchange rate between two currencies
 */
router.get(
  '/rate/:from/:to',
  asyncHandler(async (req, res) => {
    const { from, to } = req.params

    const result = await convertCurrency(1, from, to)

    res.json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: result.rate
      }
    })
  })
)

/**
 * GET /api/exchange/history
 * Get exchange rate history
 * Admin only
 */
router.get(
  '/history',
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 7

    const history = await getRateHistory(days)

    res.json({
      success: true,
      data: history
    })
  })
)

/**
 * POST /api/exchange/refresh
 * Force refresh rates from TCMB
 * Admin only
 */
router.post(
  '/refresh',
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await forceFetchRates()

    res.json({
      success: true,
      message: 'Exchange rates refreshed from TCMB',
      data: {
        bulletin: result.bulletin,
        ratesCount: result.rates?.length,
        source: result.source
      }
    })
  })
)

/**
 * POST /api/exchange/manual-rate
 * Set manual exchange rate override
 * Admin only
 */
router.post(
  '/manual-rate',
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { currency, value } = req.body

    if (!currency || !value) {
      return res.status(400).json({
        success: false,
        error: 'Currency and value are required'
      })
    }

    const result = await setManualRate(currency, value)

    res.json({
      success: true,
      message: `Manual rate set for ${currency}`,
      data: result
    })
  })
)

/**
 * GET /api/exchange/scheduler-status
 * Get scheduler status
 * Admin only
 */
router.get(
  '/scheduler-status',
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = getSchedulerStatus()

    res.json({
      success: true,
      data: status
    })
  })
)

export default router
