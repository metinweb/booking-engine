/**
 * Shared Service Helpers
 * Barrel export for all common service utilities
 *
 * Usage:
 * import { getPartnerId, paginatedQuery, sendSuccess } from '../../services/helpers.js'
 */

// Auth context helpers
export {
  getPartnerId,
  requirePartnerId,
  getSourceInfo,
  getAuditActor,
  verifyHotelOwnership,
  getHotelWithOwnership
} from './authContext.js'

// Query builder helpers
export {
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
} from './queryBuilder.js'

// Response helpers
export {
  sendSuccess,
  sendMessage,
  sendCreated,
  sendNoContent,
  sendList,
  sendError,
  createResponse
} from './responseHelper.js'
