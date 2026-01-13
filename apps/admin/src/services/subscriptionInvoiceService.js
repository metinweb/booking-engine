import apiClient from './api'

/**
 * Get all invoices with filtering and pagination
 */
const getInvoices = async (params = {}) => {
  const response = await apiClient.get('/subscription-invoices', { params })
  return response.data
}

/**
 * Get single invoice by ID
 */
const getInvoice = async (id) => {
  const response = await apiClient.get(`/subscription-invoices/${id}`)
  return response.data
}

/**
 * Download invoice PDF
 */
const downloadPDF = async (id, invoiceNumber) => {
  const response = await apiClient.get(`/subscription-invoices/${id}/pdf`, {
    responseType: 'blob'
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${invoiceNumber || 'invoice'}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Update invoice status
 */
const updateStatus = async (id, data) => {
  const response = await apiClient.patch(`/subscription-invoices/${id}/status`, data)
  return response.data
}

/**
 * Get invoice statistics
 */
const getStats = async (params = {}) => {
  const response = await apiClient.get('/subscription-invoices/stats', { params })
  return response.data
}

/**
 * Get partner's invoices
 */
const getPartnerInvoices = async (partnerId, params = {}) => {
  const response = await apiClient.get(`/subscription-invoices/partner/${partnerId}`, { params })
  return response.data
}

/**
 * Get my invoices (for partner users viewing their own invoices)
 */
const getMyInvoices = async (params = {}) => {
  const response = await apiClient.get('/my/invoices', { params })
  return response.data
}

/**
 * Download my invoice PDF (for partner users)
 */
const downloadMyInvoicePDF = async (id, invoiceNumber) => {
  const response = await apiClient.get(`/my/invoices/${id}/pdf`, {
    responseType: 'blob'
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${invoiceNumber || 'invoice'}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default {
  getInvoices,
  getInvoice,
  downloadPDF,
  updateStatus,
  getStats,
  getPartnerInvoices,
  getMyInvoices,
  downloadMyInvoicePDF
}
