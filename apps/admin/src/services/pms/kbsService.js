/**
 * PMS KBS (Kimlik Bildirim Sistemi) Service
 * Turkish police/gendarmerie guest notification system
 */

import pmsApiClient from './pmsApi'

// ==========================================
// CONSTANTS
// ==========================================

export const KBS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  NOT_REQUIRED: 'not_required'
}

export const KBS_STATUS_INFO = {
  pending: { label: 'Bekliyor', color: 'amber', icon: 'pending' },
  sent: { label: 'Gonderildi', color: 'green', icon: 'check_circle' },
  failed: { label: 'Basarisiz', color: 'red', icon: 'error' },
  not_required: { label: 'Gerekli Degil', color: 'gray', icon: 'remove_circle' }
}

export const ID_TYPES = {
  TC_KIMLIK: 'tc_kimlik',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  NATIONAL_ID: 'national_id',
  OTHER: 'other'
}

export const ID_TYPE_INFO = {
  tc_kimlik: { label: 'TC Kimlik', icon: 'badge' },
  passport: { label: 'Pasaport', icon: 'flight' },
  driving_license: { label: 'Ehliyet', icon: 'drive_eta' },
  national_id: { label: 'Ulusal Kimlik', icon: 'card_membership' },
  other: { label: 'Diger', icon: 'description' }
}

// Required fields for KBS by nationality
export const KBS_REQUIRED_FIELDS = {
  turkish: ['firstName', 'lastName', 'idNumber', 'dateOfBirth'],
  foreign: ['firstName', 'lastName', 'idNumber', 'dateOfBirth', 'nationality', 'birthPlace', 'fatherName', 'motherName']
}

export const KBS_FIELD_LABELS = {
  firstName: 'Ad',
  lastName: 'Soyad',
  idNumber: 'Kimlik No',
  dateOfBirth: 'Dogum Tarihi',
  nationality: 'Uyruk',
  birthPlace: 'Dogum Yeri',
  fatherName: 'Baba Adi',
  motherName: 'Ana Adi',
  tcKimlikInvalid: 'TC Kimlik gecersiz (11 hane olmali)'
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Get pending KBS notifications
 * @param {string} hotelId - Hotel ID
 * @param {object} params - Query params (startDate, endDate)
 */
export const getPending = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/kbs/pending`, { params })
  return response.data
}

/**
 * Generate KBS XML file
 * @param {string} hotelId - Hotel ID
 * @param {string[]} guestIds - Array of guest IDs to include
 * @returns {Blob} XML file as blob
 */
export const generateXML = async (hotelId, guestIds) => {
  const response = await pmsApiClient.post(
    `/pms/hotels/${hotelId}/kbs/generate-xml`,
    { guestIds },
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * Download KBS XML file
 * @param {string} hotelId - Hotel ID
 * @param {string[]} guestIds - Array of guest IDs to include
 */
export const downloadXML = async (hotelId, guestIds) => {
  const blob = await generateXML(hotelId, guestIds)

  // Create download link
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  // Generate filename with date
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  link.download = `kbs_${dateStr}.xml`

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Cleanup
  window.URL.revokeObjectURL(url)
}

/**
 * Mark guests as sent to KBS
 * @param {string} hotelId - Hotel ID
 * @param {string[]} guestIds - Array of guest IDs
 * @param {string} kbsReference - Optional reference number from KBS
 */
export const markAsSent = async (hotelId, guestIds, kbsReference = null) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/kbs/mark-sent`, {
    guestIds,
    kbsReference
  })
  return response.data
}

/**
 * Get KBS report for date range
 * @param {string} hotelId - Hotel ID
 * @param {object} params - Query params (startDate, endDate)
 */
export const getReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/kbs/report`, { params })
  return response.data
}

/**
 * Update guest KBS fields
 * @param {string} hotelId - Hotel ID
 * @param {string} stayId - Stay ID
 * @param {string} guestId - Guest ID
 * @param {object} fields - Fields to update
 */
export const updateGuestFields = async (hotelId, stayId, guestId, fields) => {
  const response = await pmsApiClient.put(
    `/pms/hotels/${hotelId}/kbs/stays/${stayId}/guests/${guestId}`,
    fields
  )
  return response.data
}

/**
 * Test KBS web service connection
 * @param {string} hotelId - Hotel ID
 */
export const testConnection = async (hotelId) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/kbs/test-connection`)
  return response.data
}

/**
 * Send single guest notification to KBS
 * @param {string} hotelId - Hotel ID
 * @param {object} data - { stayId, guestId, action: 'checkin' | 'checkout' | 'roomchange' }
 */
export const sendToKBS = async (hotelId, data) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/kbs/send`, data)
  return response.data
}

/**
 * Send all guests in a stay to KBS
 * @param {string} hotelId - Hotel ID
 * @param {object} data - { stayId, action: 'checkin' | 'checkout' }
 */
export const sendStayToKBS = async (hotelId, data) => {
  const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/kbs/send-stay`, data)
  return response.data
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if guest is Turkish citizen
 * @param {object} guest - Guest object
 */
export const isTurkishCitizen = (guest) => {
  return guest.nationality === 'TR' || guest.idType === ID_TYPES.TC_KIMLIK
}

/**
 * Validate KBS fields for a guest
 * @param {object} guest - Guest object
 * @returns {object} { isValid, missingFields, isTurkish }
 */
export const validateKBSFields = (guest) => {
  const isTurkish = isTurkishCitizen(guest)
  const requiredFields = isTurkish ? KBS_REQUIRED_FIELDS.turkish : KBS_REQUIRED_FIELDS.foreign
  const missingFields = []

  for (const field of requiredFields) {
    if (!guest[field]) {
      missingFields.push(field)
    }
  }

  // TC Kimlik validation for Turkish citizens
  if (isTurkish && guest.idNumber && !/^\d{11}$/.test(guest.idNumber)) {
    missingFields.push('tcKimlikInvalid')
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    isTurkish
  }
}

/**
 * Get missing field labels for display
 * @param {string[]} missingFields - Array of missing field names
 */
export const getMissingFieldLabels = (missingFields) => {
  return missingFields.map(field => KBS_FIELD_LABELS[field] || field)
}

/**
 * Format date for KBS display
 * @param {Date|string} date - Date to format
 */
export const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR')
}

export default {
  // Constants
  KBS_STATUS,
  KBS_STATUS_INFO,
  ID_TYPES,
  ID_TYPE_INFO,
  KBS_REQUIRED_FIELDS,
  KBS_FIELD_LABELS,

  // API
  getPending,
  generateXML,
  downloadXML,
  markAsSent,
  getReport,
  updateGuestFields,
  testConnection,
  sendToKBS,
  sendStayToKBS,

  // Utilities
  isTurkishCitizen,
  validateKBSFields,
  getMissingFieldLabels,
  formatDate
}
