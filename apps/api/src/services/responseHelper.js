/**
 * Response Helper Service
 * Standardized response formats for consistency across all endpoints
 */

/**
 * Send success response with data
 * @param {Response} res - Express response
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data
  })
}

/**
 * Send success response with message
 * @param {Response} res - Express response
 * @param {string} message - Success message
 * @param {*} data - Optional additional data
 */
export const sendMessage = (res, message, data = null) => {
  const response = {
    success: true,
    message
  }
  if (data !== null) {
    response.data = data
  }
  res.json(response)
}

/**
 * Send created response (201)
 * @param {Response} res - Express response
 * @param {*} data - Created resource data
 */
export const sendCreated = (res, data) => {
  sendSuccess(res, data, 201)
}

/**
 * Send no content response (204)
 * @param {Response} res - Express response
 */
export const sendNoContent = res => {
  res.status(204).send()
}

/**
 * Send paginated list response
 * @param {Response} res - Express response
 * @param {Array} items - List items
 * @param {Object} pagination - Pagination info
 * @param {string} itemsKey - Key name for items array
 */
export const sendList = (res, items, pagination = null, itemsKey = 'items') => {
  const response = {
    success: true,
    data: {
      [itemsKey]: items
    }
  }

  if (pagination) {
    response.data.pagination = pagination
  }

  res.json(response)
}

/**
 * Send error response
 * Note: Prefer throwing errors and using errorHandler middleware
 * This is for edge cases where you need direct response control
 * @param {Response} res - Express response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Optional error details
 */
export const sendError = (res, message, statusCode = 400, details = null) => {
  const response = {
    success: false,
    message
  }

  if (details) {
    response.details = details
  }

  res.status(statusCode).json(response)
}

/**
 * Create standard response object for use in services
 * Useful when building response before sending
 */
export const createResponse = {
  success: data => ({ success: true, data }),
  error: (message, details = null) => ({
    success: false,
    message,
    ...(details && { details })
  }),
  list: (items, pagination = null, itemsKey = 'items') => ({
    success: true,
    data: {
      [itemsKey]: items,
      ...(pagination && { pagination })
    }
  })
}

export default {
  sendSuccess,
  sendMessage,
  sendCreated,
  sendNoContent,
  sendList,
  sendError,
  createResponse
}
