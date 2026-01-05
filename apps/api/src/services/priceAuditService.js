/**
 * Price Audit Service
 * Tracks all price calculations and changes for auditing purposes
 */

import mongoose from 'mongoose'
import logger from '../core/logger.js'

// Price Audit Schema
const priceAuditSchema = new mongoose.Schema(
  {
    // Reference data
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },

    // Audit type
    type: {
      type: String,
      enum: [
        'price_calculation', // Price was calculated
        'price_quote', // Quote was generated for booking
        'rate_change', // Rate was modified
        'campaign_applied', // Campaign discount applied
        'currency_conversion', // Currency conversion performed
        'allotment_reserved', // Allotment was reserved
        'allotment_released' // Allotment was released
      ],
      required: true,
      index: true
    },

    // Request context
    requestId: { type: String }, // Unique request identifier
    source: {
      type: String,
      enum: ['api', 'public', 'admin', 'system', 'import'],
      default: 'api'
    },

    // Actor information
    actor: {
      type: { type: String, enum: ['user', 'system', 'public'] },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String },
      ip: { type: String }
    },

    // Query parameters
    query: {
      roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
      mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
      marketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Market' },
      checkInDate: { type: Date },
      checkOutDate: { type: Date },
      nights: { type: Number },
      adults: { type: Number },
      children: [
        {
          age: { type: Number },
          ageGroup: { type: String }
        }
      ]
    },

    // Calculation result
    result: {
      success: { type: Boolean },
      currency: { type: String },
      originalTotal: { type: Number },
      totalDiscount: { type: Number },
      finalTotal: { type: Number },
      avgPerNight: { type: Number },
      pricingType: { type: String },
      fromCache: { type: Boolean, default: false }
    },

    // Applied campaigns
    campaigns: [
      {
        campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
        code: { type: String },
        name: { type: String },
        discountType: { type: String },
        discountAmount: { type: Number }
      }
    ],

    // Daily breakdown (summary only for audit)
    dailyPrices: [
      {
        date: { type: Date },
        basePrice: { type: Number },
        finalPrice: { type: Number },
        hasDiscount: { type: Boolean }
      }
    ],

    // Rate changes (for rate_change type)
    rateChange: {
      rateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rate' },
      field: { type: String },
      oldValue: { type: mongoose.Schema.Types.Mixed },
      newValue: { type: mongoose.Schema.Types.Mixed },
      changeType: { type: String, enum: ['create', 'update', 'delete'] }
    },

    // Currency conversion (for currency_conversion type)
    currencyConversion: {
      fromCurrency: { type: String },
      toCurrency: { type: String },
      rate: { type: Number },
      originalAmount: { type: Number },
      convertedAmount: { type: Number }
    },

    // Allotment (for allotment types)
    allotment: {
      dates: [{ type: Date }],
      rooms: { type: Number },
      previousAllotment: { type: Number },
      newAllotment: { type: Number }
    },

    // Error information (if failed)
    error: {
      code: { type: String },
      message: { type: String }
    },

    // Metadata
    duration: { type: Number }, // Calculation duration in ms
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
)

// Indexes for efficient querying
priceAuditSchema.index({ createdAt: -1 })
priceAuditSchema.index({ partner: 1, hotel: 1, createdAt: -1 })
priceAuditSchema.index({ type: 1, createdAt: -1 })
priceAuditSchema.index({ 'query.checkInDate': 1, 'query.checkOutDate': 1 })
priceAuditSchema.index({ 'actor.userId': 1, createdAt: -1 })

// TTL index - auto-delete after 90 days
priceAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

const PriceAudit = mongoose.model('PriceAudit', priceAuditSchema)

// Generate unique request ID
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log a price calculation
 * @param {Object} data - Audit data
 * @returns {Promise<Object>} Created audit record
 */
export async function logPriceCalculation(data) {
  try {
    const audit = new PriceAudit({
      partner: data.partnerId,
      hotel: data.hotelId,
      type: 'price_calculation',
      requestId: data.requestId || generateRequestId(),
      source: data.source || 'api',
      actor: data.actor || { type: 'system' },
      query: {
        roomTypeId: data.roomTypeId,
        mealPlanId: data.mealPlanId,
        marketId: data.marketId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        nights: data.nights,
        adults: data.adults,
        children: data.children
      },
      result: {
        success: data.success,
        currency: data.currency,
        originalTotal: data.originalTotal,
        totalDiscount: data.totalDiscount,
        finalTotal: data.finalTotal,
        avgPerNight: data.avgPerNight,
        pricingType: data.pricingType,
        fromCache: data.fromCache
      },
      campaigns: data.campaigns || [],
      dailyPrices: data.dailyPrices || [],
      error: data.error,
      duration: data.duration,
      metadata: data.metadata
    })

    await audit.save()
    return audit
  } catch (error) {
    logger.error('Failed to log price calculation audit', { error: error.message, data })
    return null
  }
}

/**
 * Log a price quote (booking intent)
 * @param {Object} data - Audit data
 * @returns {Promise<Object>} Created audit record
 */
export async function logPriceQuote(data) {
  return logPriceCalculation({
    ...data,
    type: 'price_quote'
  })
}

/**
 * Log a rate change
 * @param {Object} data - Audit data
 * @returns {Promise<Object>} Created audit record
 */
export async function logRateChange(data) {
  try {
    const audit = new PriceAudit({
      partner: data.partnerId,
      hotel: data.hotelId,
      type: 'rate_change',
      requestId: data.requestId || generateRequestId(),
      source: data.source || 'admin',
      actor: data.actor,
      rateChange: {
        rateId: data.rateId,
        field: data.field,
        oldValue: data.oldValue,
        newValue: data.newValue,
        changeType: data.changeType
      },
      metadata: data.metadata
    })

    await audit.save()
    return audit
  } catch (error) {
    logger.error('Failed to log rate change audit', { error: error.message, data })
    return null
  }
}

/**
 * Log currency conversion
 * @param {Object} data - Audit data
 * @returns {Promise<Object>} Created audit record
 */
export async function logCurrencyConversion(data) {
  try {
    const audit = new PriceAudit({
      partner: data.partnerId,
      hotel: data.hotelId,
      type: 'currency_conversion',
      requestId: data.requestId || generateRequestId(),
      source: data.source || 'api',
      actor: data.actor || { type: 'system' },
      currencyConversion: {
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        rate: data.rate,
        originalAmount: data.originalAmount,
        convertedAmount: data.convertedAmount
      },
      metadata: data.metadata
    })

    await audit.save()
    return audit
  } catch (error) {
    logger.error('Failed to log currency conversion audit', { error: error.message, data })
    return null
  }
}

/**
 * Log allotment change
 * @param {Object} data - Audit data
 * @returns {Promise<Object>} Created audit record
 */
export async function logAllotmentChange(data) {
  try {
    const audit = new PriceAudit({
      partner: data.partnerId,
      hotel: data.hotelId,
      type: data.released ? 'allotment_released' : 'allotment_reserved',
      requestId: data.requestId || generateRequestId(),
      source: data.source || 'api',
      actor: data.actor || { type: 'system' },
      allotment: {
        dates: data.dates,
        rooms: data.rooms,
        previousAllotment: data.previousAllotment,
        newAllotment: data.newAllotment
      },
      query: {
        roomTypeId: data.roomTypeId,
        mealPlanId: data.mealPlanId,
        marketId: data.marketId
      },
      metadata: data.metadata
    })

    await audit.save()
    return audit
  } catch (error) {
    logger.error('Failed to log allotment change audit', { error: error.message, data })
    return null
  }
}

/**
 * Query audit logs
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Audit records
 */
export async function queryAuditLogs(filters = {}) {
  const query = {}

  if (filters.partnerId) query.partner = filters.partnerId
  if (filters.hotelId) query.hotel = filters.hotelId
  if (filters.type) query.type = filters.type
  if (filters.userId) query['actor.userId'] = filters.userId

  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate)
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate)
  }

  const page = filters.page || 1
  const limit = Math.min(filters.limit || 50, 100)
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    PriceAudit.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PriceAudit.countDocuments(query)
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Get audit statistics
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Statistics
 */
export async function getAuditStats(filters = {}) {
  const match = {}
  if (filters.partnerId) match.partner = new mongoose.Types.ObjectId(filters.partnerId)
  if (filters.hotelId) match.hotel = new mongoose.Types.ObjectId(filters.hotelId)

  if (filters.startDate || filters.endDate) {
    match.createdAt = {}
    if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate)
    if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate)
  }

  const stats = await PriceAudit.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        successCount: {
          $sum: { $cond: ['$result.success', 1, 0] }
        },
        errorCount: {
          $sum: { $cond: ['$error.code', 1, 0] }
        },
        totalRevenue: { $sum: '$result.finalTotal' },
        avgOrderValue: { $avg: '$result.finalTotal' }
      }
    }
  ])

  return stats
}

export default {
  PriceAudit,
  logPriceCalculation,
  logPriceQuote,
  logRateChange,
  logCurrencyConversion,
  logAllotmentChange,
  queryAuditLogs,
  getAuditStats
}
