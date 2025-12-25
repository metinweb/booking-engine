import apiClient from './api'

const login = async credentials => {
	try {
		// Make POST request to the backend login endpoint
		const response = await apiClient.post('/auth/login', credentials)
		// Booking engine response: { success: true, data: { accessToken, user }, message }
		return response.data
	} catch (error) {
		console.error('Auth Service: Login failed', error.response?.data || error.message)
		// Re-throw the error so the component can handle it (e.g., show error message)
		throw error
	}
}

const me = async () => {
	try {
		const response = await apiClient.get('/auth/me')
		// Booking engine response: { success: true, data: { user }, message }
		return response.data
	} catch (error) {
		console.error('Auth Service: Failed to fetch current user', error.response?.data || error.message)
		throw error
	}
}

const changePassword = async (currentPassword, newPassword) => {
	try {
		const response = await apiClient.put('/auth/changepassword', {
			currentPassword,
			newPassword
		})
		return response.data
	} catch (error) {
		console.error('Auth Service: Change password failed', error.response?.data || error.message)
		throw error
	}
}

const verify2FA = async (credentials) => {
	try {
		// For booking engine, 2FA verification is done through the same login endpoint
		// with twoFactorToken field added to credentials
		const response = await apiClient.post('/auth/login', credentials)
		return response.data
	} catch (error) {
		console.error('Auth Service: 2FA verification failed', error.response?.data || error.message)
		throw error
	}
}

const refreshToken = async (refreshToken) => {
	try {
		const response = await apiClient.post('/auth/refresh-token', { refreshToken })
		return response.data
	} catch (error) {
		console.error('Auth Service: Token refresh failed', error.response?.data || error.message)
		throw error
	}
}

export default {
	login,
	verify2FA,
	me,
	changePassword,
	refreshToken
}
