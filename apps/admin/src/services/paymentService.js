import apiClient from './api'

/**
 * Payment Service
 * API calls for payment management
 */

/**
 * Get all payments for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Payments list with summary
 */
export const getPayments = async (bookingId) => {
	const response = await apiClient.get(`/bookings/${bookingId}/payments`)
	return response.data
}

/**
 * Add new payment
 * @param {string} bookingId - Booking ID
 * @param {object} data - Payment data
 * @returns {Promise} - Created payment
 */
export const addPayment = async (bookingId, data) => {
	const response = await apiClient.post(`/bookings/${bookingId}/payments`, data)
	return response.data
}

/**
 * Update payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {object} data - Payment data to update
 * @returns {Promise} - Updated payment
 */
export const updatePayment = async (bookingId, paymentId, data) => {
	const response = await apiClient.patch(`/bookings/${bookingId}/payments/${paymentId}`, data)
	return response.data
}

/**
 * Confirm payment (for bank transfers)
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Confirmed payment
 */
export const confirmPayment = async (bookingId, paymentId) => {
	const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/confirm`)
	return response.data
}

/**
 * Cancel payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Cancelled payment
 */
export const cancelPayment = async (bookingId, paymentId) => {
	const response = await apiClient.delete(`/bookings/${bookingId}/payments/${paymentId}`)
	return response.data
}

/**
 * Refund payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {object} data - Refund data (amount, reason)
 * @returns {Promise} - Refunded payment
 */
export const refundPayment = async (bookingId, paymentId, data) => {
	const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/refund`, data)
	return response.data
}

/**
 * Upload receipt for bank transfer
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {File} file - Receipt file
 * @returns {Promise} - Updated payment
 */
export const uploadReceipt = async (bookingId, paymentId, file) => {
	const formData = new FormData()
	formData.append('receipt', file)

	const response = await apiClient.post(
		`/bookings/${bookingId}/payments/${paymentId}/upload-receipt`,
		formData,
		{
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		}
	)
	return response.data
}

export default {
	getPayments,
	addPayment,
	updatePayment,
	confirmPayment,
	cancelPayment,
	refundPayment,
	uploadReceipt
}
