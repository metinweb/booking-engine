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

// ===== HotelBase Functions =====

/**
 * Get available base hotels for partner to link
 */
const getAvailableBases = async (params = {}) => {
	try {
		const response = await apiClient.get('/hotels/available-bases', { params })
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get available bases failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Link partner to a base hotel
 */
const linkToBase = async (baseId) => {
	try {
		const response = await apiClient.post(`/hotels/link/${baseId}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Link to base failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Unlink hotel from base (convert to partner hotel)
 */
const unlinkFromBase = async (hotelId) => {
	try {
		const response = await apiClient.post(`/hotels/${hotelId}/unlink`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Unlink from base failed', error.response?.data || error.message)
		throw error
	}
}

// ===== SuperAdmin HotelBase Functions =====

/**
 * Get all base hotels (SuperAdmin)
 */
const getBaseHotels = async (params = {}) => {
	try {
		const response = await apiClient.get('/hotels/base', { params })
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get base hotels failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Get single base hotel (SuperAdmin)
 */
const getBaseHotel = async (id) => {
	try {
		const response = await apiClient.get(`/hotels/base/${id}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get base hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Get linked partners for a base hotel (SuperAdmin)
 */
const getLinkedPartners = async (id) => {
	try {
		const response = await apiClient.get(`/hotels/base/${id}/linked-partners`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get linked partners failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Create base hotel (SuperAdmin)
 */
const createBaseHotel = async (data) => {
	try {
		const response = await apiClient.post('/hotels/base', data)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Create base hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Update base hotel (SuperAdmin)
 */
const updateBaseHotel = async (id, data) => {
	try {
		const response = await apiClient.put(`/hotels/base/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Update base hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Delete base hotel (SuperAdmin)
 */
const deleteBaseHotel = async (id) => {
	try {
		const response = await apiClient.delete(`/hotels/base/${id}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Delete base hotel failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Promote partner hotel to base (SuperAdmin)
 */
const promoteToBase = async (hotelId) => {
	try {
		const response = await apiClient.post(`/hotels/${hotelId}/promote`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Promote to base failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Extract hotel data using AI (SuperAdmin)
 * @param {Object} params - { content, contentType, url }
 * @param {string} params.content - Text or PDF content
 * @param {string} params.contentType - 'text', 'pdf', or 'url'
 * @param {string} params.url - URL to extract data from (when contentType is 'url')
 */
const aiExtractHotelData = async (params) => {
	try {
		const response = await apiClient.post('/hotels/ai-extract', params)
		return response.data
	} catch (error) {
		console.error('Hotel Service: AI extract failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Start async AI extraction with progress tracking
 * Returns operation ID for socket progress tracking
 */
const startAiExtraction = async (params) => {
	try {
		const response = await apiClient.post('/hotels/ai-extract/start', params)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Start AI extraction failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Get extraction result by operation ID
 */
const getExtractionResult = async (operationId) => {
	try {
		const response = await apiClient.get(`/hotels/ai-extract/${operationId}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get extraction result failed', error.response?.data || error.message)
		throw error
	}
}

// ===== Room Template Functions (SuperAdmin) =====

/**
 * Get room templates for a base hotel
 */
const getRoomTemplates = async (hotelId) => {
	try {
		const response = await apiClient.get(`/hotels/base/${hotelId}/room-templates`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get room templates failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Create room template
 */
const createRoomTemplate = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`/hotels/base/${hotelId}/room-templates`, data)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Create room template failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Update room template
 */
const updateRoomTemplate = async (hotelId, code, data) => {
	try {
		const response = await apiClient.put(`/hotels/base/${hotelId}/room-templates/${code}`, data)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Update room template failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Delete room template
 */
const deleteRoomTemplate = async (hotelId, code) => {
	try {
		const response = await apiClient.delete(`/hotels/base/${hotelId}/room-templates/${code}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Delete room template failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Upload room template image
 */
const uploadRoomTemplateImage = async (hotelId, code, file, caption = {}) => {
	try {
		const formData = new FormData()
		formData.append('image', file)
		formData.append('caption', JSON.stringify(caption))

		const response = await apiClient.post(`/hotels/base/${hotelId}/room-templates/${code}/images`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
		return response.data
	} catch (error) {
		console.error('Hotel Service: Upload room template image failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Delete room template image
 */
const deleteRoomTemplateImage = async (hotelId, code, imageId) => {
	try {
		const response = await apiClient.delete(`/hotels/base/${hotelId}/room-templates/${code}/images/${imageId}`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Delete room template image failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Set room template main image
 */
const setRoomTemplateMainImage = async (hotelId, code, imageId) => {
	try {
		const response = await apiClient.patch(`/hotels/base/${hotelId}/room-templates/${code}/images/${imageId}/main`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Set room template main image failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Reorder room template images
 */
const reorderRoomTemplateImages = async (hotelId, code, imageIds) => {
	try {
		const response = await apiClient.patch(`/hotels/base/${hotelId}/room-templates/${code}/images/reorder`, { imageIds })
		return response.data
	} catch (error) {
		console.error('Hotel Service: Reorder room template images failed', error.response?.data || error.message)
		throw error
	}
}

/**
 * Get importable room templates for partner (from linked base hotel)
 */
const getImportableRooms = async (hotelId) => {
	try {
		const response = await apiClient.get(`/hotels/${hotelId}/importable-rooms`)
		return response.data
	} catch (error) {
		console.error('Hotel Service: Get importable rooms failed', error.response?.data || error.message)
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
	getCities,
	// HotelBase functions
	getAvailableBases,
	linkToBase,
	unlinkFromBase,
	// SuperAdmin functions
	getBaseHotels,
	getBaseHotel,
	getLinkedPartners,
	createBaseHotel,
	updateBaseHotel,
	deleteBaseHotel,
	promoteToBase,
	aiExtractHotelData,
	startAiExtraction,
	getExtractionResult,
	// Room template functions
	getRoomTemplates,
	createRoomTemplate,
	updateRoomTemplate,
	deleteRoomTemplate,
	uploadRoomTemplateImage,
	deleteRoomTemplateImage,
	setRoomTemplateMainImage,
	reorderRoomTemplateImages,
	getImportableRooms
}
