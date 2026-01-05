/**
 * Query Builder Service
 * Centralized helpers for building MongoDB queries with pagination, filtering, and search
 * Replaces 50+ duplicate implementations across modules
 */

/**
 * Default pagination options
 */
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} options - Override defaults
 * @returns {Object} Parsed pagination params
 */
export const parsePagination = (query, options = {}) => {
  const page = Math.max(1, parseInt(query.page) || options.defaultPage || DEFAULT_PAGE)
  let limit = parseInt(query.limit) || options.defaultLimit || DEFAULT_LIMIT
  limit = Math.min(limit, options.maxLimit || MAX_LIMIT)

  return {
    page,
    limit,
    skip: (page - 1) * limit
  }
}

/**
 * Execute paginated query with count
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const paginatedQuery = async (Model, filter = {}, options = {}) => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = { createdAt: -1 },
    select = '-__v',
    populate = null,
    lean = true
  } = options

  const skip = (page - 1) * limit

  // Execute count and find in parallel for better performance
  const [total, items] = await Promise.all([
    Model.countDocuments(filter),
    buildQuery(Model.find(filter), { sort, skip, limit, select, populate, lean })
  ])

  return {
    data: items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Build query with common options
 * @param {Query} query - Mongoose query
 * @param {Object} options - Query options
 * @returns {Query} Modified query
 */
const buildQuery = (query, options) => {
  const { sort, skip, limit, select, populate, lean } = options

  if (sort) query = query.sort(sort)
  if (skip !== undefined) query = query.skip(skip)
  if (limit) query = query.limit(parseInt(limit))
  if (select) query = query.select(select)

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => {
        query = query.populate(p)
      })
    } else {
      query = query.populate(populate)
    }
  }

  if (lean) query = query.lean()

  return query
}

/**
 * Build search filter for multiple fields
 * @param {string} searchTerm - Search term
 * @param {Array<string>} fields - Fields to search in
 * @param {Object} existingFilter - Existing filter to extend
 * @returns {Object} Filter with $or search condition
 */
export const buildSearchFilter = (searchTerm, fields, existingFilter = {}) => {
  if (!searchTerm || !fields?.length) {
    return existingFilter
  }

  const searchRegex = { $regex: searchTerm, $options: 'i' }
  const searchConditions = fields.map(field => ({ [field]: searchRegex }))

  // If existing filter already has $or, we need to $and them
  if (existingFilter.$or) {
    return {
      ...existingFilter,
      $and: [{ $or: existingFilter.$or }, { $or: searchConditions }]
    }
  }

  return {
    ...existingFilter,
    $or: searchConditions
  }
}

/**
 * Build date range filter
 * @param {string} field - Date field name
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {Object} existingFilter - Existing filter to extend
 * @returns {Object} Filter with date range
 */
export const buildDateFilter = (field, startDate, endDate, existingFilter = {}) => {
  const filter = { ...existingFilter }

  if (startDate || endDate) {
    filter[field] = {}
    if (startDate) {
      filter[field].$gte = new Date(startDate)
    }
    if (endDate) {
      // Set to end of day
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter[field].$lte = end
    }
  }

  return filter
}

/**
 * Build status filter with support for 'all' value
 * @param {string} status - Status value
 * @param {Object} existingFilter - Existing filter to extend
 * @param {string} fieldName - Field name (default: 'status')
 * @returns {Object} Filter with status
 */
export const buildStatusFilter = (status, existingFilter = {}, fieldName = 'status') => {
  if (!status || status === 'all') {
    return existingFilter
  }

  return {
    ...existingFilter,
    [fieldName]: status
  }
}

/**
 * Build filter from common query parameters
 * @param {Object} query - Request query
 * @param {Object} config - Filter configuration
 * @returns {Object} Built filter
 */
export const buildFilterFromQuery = (query, config = {}) => {
  let filter = { ...config.baseFilter }

  const {
    searchFields = [],
    statusField = 'status',
    dateField = 'createdAt',
    additionalFields = []
  } = config

  // Search filter
  if (query.search && searchFields.length) {
    filter = buildSearchFilter(query.search, searchFields, filter)
  }

  // Status filter
  if (query.status) {
    filter = buildStatusFilter(query.status, filter, statusField)
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    filter = buildDateFilter(dateField, query.startDate, query.endDate, filter)
  }

  // Additional simple equality filters
  additionalFields.forEach(field => {
    if (query[field] && query[field] !== 'all') {
      filter[field] = query[field]
    }
  })

  return filter
}

/**
 * Send paginated response
 * @param {Response} res - Express response
 * @param {Object} result - Result from paginatedQuery
 * @param {string} dataKey - Key name for data array (default: 'items')
 */
export const sendPaginatedResponse = (res, result, dataKey = 'items') => {
  res.json({
    success: true,
    data: {
      [dataKey]: result.data,
      pagination: result.pagination
    }
  })
}

/**
 * Send paginated response with flat structure
 * Some endpoints expect data and pagination at root level
 */
export const sendFlatPaginatedResponse = (res, result) => {
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  })
}

export default {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  paginatedQuery,
  buildSearchFilter,
  buildDateFilter,
  buildStatusFilter,
  buildFilterFromQuery,
  sendPaginatedResponse,
  sendFlatPaginatedResponse
}
