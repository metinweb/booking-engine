/**
 * PMS Reports Service
 * Handles report generation API calls
 */

import pmsApiClient from './pmsApi'

// ==========================================
// REPORT TYPES
// ==========================================

export const REPORT_TYPES = {
  // Operational
  OCCUPANCY: 'occupancy',
  ARRIVALS: 'arrivals',
  DEPARTURES: 'departures',
  IN_HOUSE: 'in_house',
  HOUSEKEEPING: 'housekeeping',
  // Financial
  REVENUE: 'revenue',
  SHIFTS: 'shifts',
  // Guest
  NATIONALITY: 'nationality',
  VIP_GUESTS: 'vip_guests'
}

export const REPORT_CATEGORIES = [
  {
    id: 'operational',
    label: 'Operasyonel',
    icon: 'analytics',
    color: 'blue',
    reports: [
      { type: REPORT_TYPES.OCCUPANCY, label: 'Doluluk Raporu', icon: 'hotel', description: 'Gunluk doluluk oranlari ve oda durumlari' },
      { type: REPORT_TYPES.ARRIVALS, label: 'Giris Raporu', icon: 'login', description: 'Bugunku ve gelecek girisler' },
      { type: REPORT_TYPES.DEPARTURES, label: 'Cikis Raporu', icon: 'logout', description: 'Bugunku ve gelecek cikislar' },
      { type: REPORT_TYPES.IN_HOUSE, label: 'Konaklayan Misafirler', icon: 'people', description: 'Su an otelde bulunan misafirler' },
      { type: REPORT_TYPES.HOUSEKEEPING, label: 'Housekeeping Raporu', icon: 'cleaning_services', description: 'Oda temizlik durumlari' }
    ]
  },
  {
    id: 'financial',
    label: 'Finansal',
    icon: 'payments',
    color: 'green',
    reports: [
      { type: REPORT_TYPES.REVENUE, label: 'Gelir Raporu', icon: 'trending_up', description: 'Gelir ve odeme analizleri' },
      { type: REPORT_TYPES.SHIFTS, label: 'Vardiya Raporu', icon: 'schedule', description: 'Kasa vardiya raporlari' }
    ]
  },
  {
    id: 'guest',
    label: 'Misafir',
    icon: 'person',
    color: 'purple',
    reports: [
      { type: REPORT_TYPES.NATIONALITY, label: 'Ulke Bazli Rapor', icon: 'public', description: 'Misafirlerin ulkelere gore dagilimi' },
      { type: REPORT_TYPES.VIP_GUESTS, label: 'VIP Misafirler', icon: 'workspace_premium', description: 'VIP misafir listesi ve istatistikleri' }
    ]
  }
]

// ==========================================
// DASHBOARD
// ==========================================

/**
 * Get dashboard summary report
 */
export const getDashboardReport = async (hotelId) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/dashboard`)
  return response.data
}

// ==========================================
// OCCUPANCY REPORTS
// ==========================================

/**
 * Get occupancy report
 */
export const getOccupancyReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/occupancy`, { params })
  return response.data
}

/**
 * Get room type occupancy
 */
export const getRoomTypeOccupancy = async (hotelId, date = null) => {
  const params = date ? { date } : {}
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/occupancy/room-types`, { params })
  return response.data
}

// ==========================================
// ARRIVAL/DEPARTURE REPORTS
// ==========================================

/**
 * Get arrivals report
 */
export const getArrivalsReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/arrivals`, { params })
  return response.data
}

/**
 * Get departures report
 */
export const getDeparturesReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/departures`, { params })
  return response.data
}

/**
 * Get in-house guests report
 */
export const getInHouseReport = async (hotelId) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/in-house`)
  return response.data
}

// ==========================================
// FINANCIAL REPORTS
// ==========================================

/**
 * Get revenue report
 */
export const getRevenueReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/revenue`, { params })
  return response.data
}

/**
 * Get shift report
 */
export const getShiftReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/shifts`, { params })
  return response.data
}

// ==========================================
// HOUSEKEEPING REPORTS
// ==========================================

/**
 * Get housekeeping report
 */
export const getHousekeepingReport = async (hotelId) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/housekeeping`)
  return response.data
}

// ==========================================
// GUEST REPORTS
// ==========================================

/**
 * Get nationality report
 */
export const getNationalityReport = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/guests/nationality`, { params })
  return response.data
}

/**
 * Get VIP guests report
 */
export const getVipGuestsReport = async (hotelId) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reports/guests/vip`)
  return response.data
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount || 0)
}

/**
 * Format percentage
 */
export const formatPercentage = (value) => {
  return `%${parseFloat(value || 0).toFixed(1)}`
}

/**
 * Format date
 */
export const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Get date range for common periods
 */
export const getDateRange = (period) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  const endDate = new Date(today)

  switch (period) {
    case 'today':
      break
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1)
      endDate.setDate(endDate.getDate() - 1)
      break
    case 'this_week':
      startDate.setDate(startDate.getDate() - startDate.getDay())
      break
    case 'last_week':
      startDate.setDate(startDate.getDate() - startDate.getDay() - 7)
      endDate.setDate(endDate.getDate() - endDate.getDay() - 1)
      break
    case 'this_month':
      startDate.setDate(1)
      break
    case 'last_month':
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setDate(1)
      endDate.setDate(0) // Last day of previous month
      break
    case 'this_year':
      startDate.setMonth(0, 1)
      break
    case 'last_30_days':
      startDate.setDate(startDate.getDate() - 30)
      break
    case 'last_90_days':
      startDate.setDate(startDate.getDate() - 90)
      break
    default:
      break
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Dun' },
  { value: 'this_week', label: 'Bu Hafta' },
  { value: 'last_week', label: 'Gecen Hafta' },
  { value: 'this_month', label: 'Bu Ay' },
  { value: 'last_month', label: 'Gecen Ay' },
  { value: 'last_30_days', label: 'Son 30 Gun' },
  { value: 'last_90_days', label: 'Son 90 Gun' },
  { value: 'this_year', label: 'Bu Yil' },
  { value: 'custom', label: 'Ozel Tarih' }
]

export default {
  REPORT_TYPES,
  REPORT_CATEGORIES,
  DATE_RANGE_OPTIONS,
  getDashboardReport,
  getOccupancyReport,
  getRoomTypeOccupancy,
  getArrivalsReport,
  getDeparturesReport,
  getInHouseReport,
  getRevenueReport,
  getShiftReport,
  getHousekeepingReport,
  getNationalityReport,
  getVipGuestsReport,
  formatCurrency,
  formatPercentage,
  formatDate,
  getDateRange
}
