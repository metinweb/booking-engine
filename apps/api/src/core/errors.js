/**
 * @module core/errors
 * @description Custom error classes for standardized error handling.
 * All errors extend AppError and include HTTP status codes for API responses.
 */

/**
 * Base application error class
 * All custom errors should extend this class
 * @extends Error
 * @example
 * throw new AppError('Something went wrong', 500, { context: 'details' })
 */
export class AppError extends Error {
  /**
   * Create an application error
   * @param {string} message - Error message (i18n key or human-readable)
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Object|null} [details=null] - Additional error details
   */
  constructor(message, statusCode = 500, details = null) {
    super(message)
    /** @type {number} HTTP status code */
    this.statusCode = statusCode
    /** @type {boolean} Flag to identify operational errors */
    this.isOperational = true
    /** @type {Object|null} Additional error context */
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 400 Bad Request Error
 * Use for invalid client input or malformed requests
 * @extends AppError
 * @example
 * throw new BadRequestError('INVALID_INPUT')
 * throw new BadRequestError('VALIDATION_FAILED', { field: 'email' })
 */
export class BadRequestError extends AppError {
  /**
   * @param {string} [message='BAD_REQUEST'] - Error message
   * @param {Object|null} [details=null] - Validation details or context
   */
  constructor(message = 'BAD_REQUEST', details = null) {
    super(message, 400, details)
  }
}

/**
 * 401 Unauthorized Error
 * Use when authentication is required but not provided or invalid
 * @extends AppError
 * @example
 * throw new UnauthorizedError('INVALID_TOKEN')
 * throw new UnauthorizedError('SESSION_EXPIRED')
 */
export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message='UNAUTHORIZED'] - Error message
   * @param {Object|null} [details=null] - Additional context
   */
  constructor(message = 'UNAUTHORIZED', details = null) {
    super(message, 401, details)
  }
}

/**
 * 403 Forbidden Error
 * Use when user is authenticated but lacks permission
 * @extends AppError
 * @example
 * throw new ForbiddenError('INSUFFICIENT_PERMISSIONS')
 * throw new ForbiddenError('ACCESS_DENIED', { resource: 'booking' })
 */
export class ForbiddenError extends AppError {
  /**
   * @param {string} [message='FORBIDDEN'] - Error message
   * @param {Object|null} [details=null] - Permission details
   */
  constructor(message = 'FORBIDDEN', details = null) {
    super(message, 403, details)
  }
}

/**
 * 404 Not Found Error
 * Use when requested resource doesn't exist
 * @extends AppError
 * @example
 * throw new NotFoundError('HOTEL_NOT_FOUND')
 * throw new NotFoundError('BOOKING_NOT_FOUND', { bookingId: '123' })
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} [message='NOT_FOUND'] - Error message
   * @param {Object|null} [details=null] - Resource identification details
   */
  constructor(message = 'NOT_FOUND', details = null) {
    super(message, 404, details)
  }
}

/**
 * 409 Conflict Error
 * Use for state conflicts like duplicate entries or version mismatches
 * @extends AppError
 * @example
 * throw new ConflictError('DUPLICATE_EMAIL')
 * throw new ConflictError('BOOKING_ALREADY_CANCELLED')
 */
export class ConflictError extends AppError {
  /**
   * @param {string} [message='CONFLICT'] - Error message
   * @param {Object|null} [details=null] - Conflict details
   */
  constructor(message = 'CONFLICT', details = null) {
    super(message, 409, details)
  }
}

/**
 * 422 Validation Error
 * Use for semantic validation failures (syntactically correct but invalid)
 * @extends AppError
 * @example
 * throw new ValidationError('INVALID_DATE_RANGE')
 * throw new ValidationError('VALIDATION_ERROR', { errors: [...] })
 */
export class ValidationError extends AppError {
  /**
   * @param {string} [message='VALIDATION_ERROR'] - Error message
   * @param {Object|null} [details=null] - Validation error details
   */
  constructor(message = 'VALIDATION_ERROR', details = null) {
    super(message, 422, details)
  }
}

/**
 * 429 Too Many Requests Error
 * Use for rate limiting
 * @extends AppError
 * @example
 * throw new TooManyRequestsError('RATE_LIMIT_EXCEEDED')
 * throw new TooManyRequestsError('TOO_MANY_REQUESTS', { retryAfter: 60 })
 */
export class TooManyRequestsError extends AppError {
  /**
   * @param {string} [message='TOO_MANY_REQUESTS'] - Error message
   * @param {Object|null} [details=null] - Rate limit details (e.g., retryAfter)
   */
  constructor(message = 'TOO_MANY_REQUESTS', details = null) {
    super(message, 429, details)
  }
}

/**
 * 503 Service Unavailable Error
 * Use when service or dependency is temporarily unavailable
 * @extends AppError
 * @example
 * throw new ServiceUnavailableError('DATABASE_UNAVAILABLE')
 * throw new ServiceUnavailableError('SERVICE_UNAVAILABLE', { service: 'payment' })
 */
export class ServiceUnavailableError extends AppError {
  /**
   * @param {string} [message='SERVICE_UNAVAILABLE'] - Error message
   * @param {Object|null} [details=null] - Service availability details
   */
  constructor(message = 'SERVICE_UNAVAILABLE', details = null) {
    super(message, 503, details)
  }
}
