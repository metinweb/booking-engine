import apiClient from './api'

/**
 * Get hotels list with optional filters
 */
const getHotels = async (params = {}) => {
	try {
		const response = await apiClient.get('/hotels', { params })
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get hotels failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Get single hotel by ID
 */
const getHotel = async (id) => {
	try {
		const response = await apiClient.get(`/hotels/${id}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Create new hotel
 */
const createHotel = async (data) => {
	try {
		const response = await apiClient.post('/hotels', data)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Create hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Update hotel
 */
const updateHotel = async (id, data) => {
	try {
		const response = await apiClient.put(`/hotels/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Update hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Delete hotel
 */
const deleteHotel = async (id) => {
	try {
		const response = await apiClient.delete(`/hotels/${id}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Delete hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Update hotel status
 */
const updateHotelStatus = async (id, status) => {
	try {
		const response = await apiClient.patch(`/hotels/${id}/status`, { status })
		return response.data
	} catch (error) {
		console.error('Hotel Service: Update status failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Upload hotel image
 */
const uploadImage = async (hotelId, file, caption = {}) => {
	try {
		const formData = new FormData()
		formData.append('image', file)
		formData.append('caption', JSON.stringify(caption))

		const response = await apiClient.post(`/hotels/${hotelId}/images`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
		return response.data
	} catch (error) {
		console.error('Hotel Service: Upload image failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Delete hotel image
 */
const deleteImage = async (hotelId, imageId) => {
	try {
		const response = await apiClient.delete(`/hotels/${hotelId}/images/${imageId}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Delete image failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Reorder hotel images
 */
const reorderImages = async (hotelId, imageIds) => {
	try {
		const response = await apiClient.patch(`/hotels/${hotelId}/images/reorder`, { imageIds })
		return response.data
	} catch (error) {
		console.error('Hotel Service: Reorder images failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Set main image
 */
const setMainImage = async (hotelId, imageId) => {
	try {
		const response = await apiClient.patch(`/hotels/${hotelId}/images/${imageId}/main`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Set main image failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Upload hotel logo
 */
const uploadLogo = async (hotelId, file) => {
	try {
		const formData = new FormData()
		formData.append('logo', file)

		const response = await apiClient.post(`/hotels/${hotelId}/logo`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
		return response.data
	} catch (error) {
		console.error('Hotel Service: Upload logo failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Delete hotel logo
 */
const deleteLogo = async (hotelId) => {
	try {
		const response = await apiClient.delete(`/hotels/${hotelId}/logo`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Delete logo failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Get cities with hotel count
 */
const getCities = async () => {
	try {
		const response = await apiClient.get('/hotels/cities')
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get cities failed', error.response?.data || error.message)
		throw error
	}
}

export default {
	getHotels,
	getHotel,
	createHotel,
	updateHotel,
	deleteHotel,
	updateHotelStatus,
	uploadImage,
	deleteImage,
	reorderImages,
	setMainImage,
	uploadLogo,
	deleteLogo,
	getCities
}
