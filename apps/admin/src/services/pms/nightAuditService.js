/**
 * PMS Night Audit Service
 * Handles end-of-day audit operations
 */

import pmsApiClient from './pmsApi'

// ==========================================
// CONSTANTS
// ==========================================

export const AUDIT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const AUDIT_STATUS_INFO = {
  in_progress: { label: 'Devam Ediyor', color: 'blue', icon: 'pending' },
  completed: { label: 'Tamamlandi', color: 'green', icon: 'check_circle' },
  cancelled: { label: 'Iptal Edildi', color: 'red', icon: 'cancel' }
}

export const STEP_NAMES = {
  1: 'preAuditCheck',
  2: 'noShowProcessing',
  3: 'roomChargePosting',
  4: 'cashierReconciliation',
  5: 'reportsAndClose'
}

export const STEP_INFO = {
  1: {
    name: 'preAuditCheck',
    label: 'On Kontrol',
    icon: 'checklist',
    activeLabel: 'Sistem kontrol ediliyor...'
  },
  2: {
    name: 'noShowProcessing',
    label: 'Gelmeyenler',
    icon: 'person_off',
    activeLabel: 'No-show isleniyor...'
  },
  3: {
    name: 'roomChargePosting',
    label: 'Oda Ucretleri',
    icon: 'payments',
    activeLabel: 'Ucretler yansitiliyor...'
  },
  4: {
    name: 'cashierReconciliation',
    label: 'Kasa Kapanisi',
    icon: 'point_of_sale',
    activeLabel: 'Kasa kapatiliyor...'
  },
  5: {
    name: 'reportsAndClose',
    label: 'Raporlar',
    icon: 'summarize',
    activeLabel: 'Raporlar hazirlaniyor...'
  }
}

export const ISSUE_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
}

export const ISSUE_SEVERITY_INFO = {
  info: { label: 'Bilgi', color: 'blue', icon: 'info' },
  warning: { label: 'Uyari', color: 'amber', icon: 'warning' },
  error: { label: 'Hata', color: 'red', icon: 'error' }
}

export const NO_SHOW_ACTIONS = {
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled',
  EXTENDED: 'extended',
  SKIPPED: 'skipped'
}

export const NO_SHOW_ACTION_INFO = {
  no_show: { label: 'No-Show Yap', color: 'red', icon: 'person_off' },
  cancelled: { label: 'Iptal Et', color: 'gray', icon: 'cancel' },
  extended: { label: 'Beklet', color: 'blue', icon: 'schedule' },
  skipped: { label: 'Atla', color: 'gray', icon: 'skip_next' }
}

export const CHARGE_TYPES = {
  NONE: 'none',
  FIRST_NIGHT: 'first_night',
  FULL_AMOUNT: 'full_amount',
  CUSTOM: 'custom'
}

export const CHARGE_TYPE_INFO = {
  none: { label: 'Ucret Yok', description: 'Misafirden ucret kesilmeyecek' },
  first_night: { label: 'Ilk Gece', description: 'Sadece ilk gece ucreti kesilecek' },
  full_amount: { label: 'Tam Tutar', description: 'Tam rezervasyon tutari kesilecek' },
  custom: { label: 'Ozel Tutar', description: 'Belirli bir tutar girilecek' }
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Start a new night audit
 */
export const startAudit = async (hotelId, auditDate = null) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/night-audit/start`, {
    auditDate
  })
  return response.data
}

/**
 * Get current in-progress audit
 */
export const getCurrentAudit = async hotelId => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/current`)
  return response.data
}

/**
 * Get audit by ID
 */
export const getAuditById = async (hotelId, auditId) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/${auditId}`)
  return response.data
}

// ==========================================
// STEP 1: PRE-AUDIT CHECK
// ==========================================

/**
 * Run pre-audit checks
 */
export const getPreAuditChecks = async hotelId => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/pre-check`)
  return response.data
}

/**
 * Complete pre-audit check step
 */
export const completePreAuditCheck = async (hotelId, data) => {
  const response = await pmsApiClient.post(
    `/pms/hotels/${hotelId}/night-audit/pre-check/complete`,
    data
  )
  return response.data
}

// ==========================================
// STEP 2: NO-SHOW PROCESSING
// ==========================================

/**
 * Get pending no-shows
 */
export const getNoShows = async hotelId => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/no-shows`)
  return response.data
}

/**
 * Process no-shows
 */
export const processNoShows = async (hotelId, actions) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/night-audit/no-shows/process`, {
    actions
  })
  return response.data
}

// ==========================================
// STEP 3: ROOM CHARGE POSTING
// ==========================================

/**
 * Get room charges to post
 */
export const getRoomCharges = async hotelId => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/room-charges`)
  return response.data
}

/**
 * Post room charges
 */
export const postRoomCharges = async (hotelId, charges) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/night-audit/room-charges/post`, {
    charges
  })
  return response.data
}

// ==========================================
// STEP 4: CASHIER RECONCILIATION
// ==========================================

/**
 * Get cashier data for reconciliation
 */
export const getCashierData = async hotelId => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/cashier`)
  return response.data
}

/**
 * Close cashier shifts
 */
export const closeCashierShifts = async (hotelId, shifts) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/night-audit/cashier/close`, {
    shifts
  })
  return response.data
}

// ==========================================
// STEP 5: REPORTS & CLOSE
// ==========================================

/**
 * Get audit summary for day close
 */
export const getAuditSummary = async hotelId => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/summary`)
  return response.data
}

/**
 * Complete audit and close day
 */
export const completeAudit = async (hotelId, data = {}) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/night-audit/complete`, data)
  return response.data
}

// ==========================================
// HISTORY
// ==========================================

/**
 * Get audit history
 */
export const getAuditHistory = async (hotelId, options = {}) => {
  const { page = 1, limit = 20 } = options
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/night-audit/history`, {
    params: { page, limit }
  })
  return response.data
}

/**
 * Cancel audit
 */
export const cancelAudit = async (hotelId, auditId, reason) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/night-audit/${auditId}/cancel`, {
    reason
  })
  return response.data
}

/**
 * Download audit report as PDF
 * @param {string} hotelId - Hotel ID
 * @param {string} auditId - Audit ID
 * @param {string} reportType - Report type: 'daily', 'revenue', 'occupancy', 'cashier'
 */
export const downloadReport = async (hotelId, auditId, reportType) => {
  const response = await pmsApiClient.get(
    `/pms/hotels/${hotelId}/night-audit/${auditId}/reports/${reportType}`,
    { responseType: 'blob' }
  )

  // Create download link
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  // Get filename from Content-Disposition header or generate one
  const contentDisposition = response.headers['content-disposition']
  let filename = `${reportType}_report.pdf`
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    if (filenameMatch) {
      filename = filenameMatch[1]
    }
  }

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  return { success: true }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

/**
 * Format percentage
 */
export const formatPercentage = value => {
  return `%${Math.round(value || 0)}`
}

/**
 * Calculate progress percentage
 */
export const calculateProgress = audit => {
  if (!audit) return 0
  let completed = 0
  if (audit.preAuditCheck?.completed) completed++
  if (audit.noShowProcessing?.completed) completed++
  if (audit.roomChargePosting?.completed) completed++
  if (audit.cashierReconciliation?.completed) completed++
  if (audit.reportsAndClose?.completed) completed++
  return Math.round((completed / 5) * 100)
}

/**
 * Get step status
 */
export const getStepStatus = (audit, stepNumber) => {
  if (!audit) return 'pending'

  const stepName = STEP_NAMES[stepNumber]
  if (!stepName) return 'pending'

  if (audit[stepName]?.completed) return 'completed'
  if (audit.currentStep === stepNumber) return 'current'
  return 'pending'
}

/**
 * Get all steps with status
 */
export const getStepsWithStatus = audit => {
  return Object.entries(STEP_INFO).map(([num, info]) => ({
    number: parseInt(num),
    ...info,
    status: getStepStatus(audit, parseInt(num)),
    completed: audit?.[info.name]?.completed || false
  }))
}

export default {
  // Constants
  AUDIT_STATUS,
  AUDIT_STATUS_INFO,
  STEP_NAMES,
  STEP_INFO,
  ISSUE_SEVERITY,
  ISSUE_SEVERITY_INFO,
  NO_SHOW_ACTIONS,
  NO_SHOW_ACTION_INFO,
  CHARGE_TYPES,
  CHARGE_TYPE_INFO,

  // API
  startAudit,
  getCurrentAudit,
  getAuditById,
  getPreAuditChecks,
  completePreAuditCheck,
  getNoShows,
  processNoShows,
  getRoomCharges,
  postRoomCharges,
  getCashierData,
  closeCashierShifts,
  getAuditSummary,
  completeAudit,
  getAuditHistory,
  cancelAudit,
  downloadReport,

  // Utilities
  formatCurrency,
  formatPercentage,
  calculateProgress,
  getStepStatus,
  getStepsWithStatus
}
