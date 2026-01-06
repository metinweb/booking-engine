/**
 * @module helpers/asyncHandler
 * @description Express async handler wrapper for automatic error catching.
 */

/**
 * Express request handler function type
 * @callback RequestHandler
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>|void}
 */

/**
 * Wraps async route handlers to automatically catch errors and pass them to Express error middleware.
 * Eliminates the need for try-catch blocks in every async route handler.
 *
 * @param {RequestHandler} fn - Async route handler function
 * @returns {RequestHandler} Wrapped handler that catches promise rejections
 * @example
 * // In route file:
 * import { asyncHandler } from '#helpers'
 *
 * router.get('/hotels', asyncHandler(async (req, res) => {
 *   const hotels = await hotelService.getAll()
 *   res.json({ success: true, data: hotels })
 * }))
 *
 * @example
 * // Errors are automatically passed to error middleware:
 * router.post('/booking', asyncHandler(async (req, res) => {
 *   // If this throws, error middleware will handle it
 *   const booking = await bookingService.create(req.body)
 *   res.status(201).json({ success: true, data: booking })
 * }))
 */
export const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
