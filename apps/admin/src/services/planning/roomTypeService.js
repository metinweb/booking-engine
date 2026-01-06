/**
 * Room Type Service
 * Handles room type CRUD operations and image management
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

// ==================== ROOM TYPES ====================

export const getRoomTypes = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/room-types`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get room types failed', error.response?.data || error.message)
    throw error
  }
}

export const getRoomType = async (hotelId, id) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/room-types/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get room type failed', error.response?.data || error.message)
    throw error
  }
}

export const createRoomType = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/room-types`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Create room type failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const updateRoomType = async (hotelId, id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/room-types/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update room type failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const deleteRoomType = async (hotelId, id) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/room-types/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Delete room type failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const updateRoomTypeStatus = async (hotelId, id, status) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/hotels/${hotelId}/room-types/${id}/status`,
      { status }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update room type status failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const reorderRoomTypes = async (hotelId, ids) => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/room-types/reorder`, {
      ids
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Reorder room types failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const importRoomTypesFromBase = async (hotelId, templateCodes) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/room-types/import-from-base`,
      { templateCodes }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Import room types from base failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const setBaseRoom = async (hotelId, roomTypeId) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/set-base`
    )
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Set base room failed', error.response?.data || error.message)
    throw error
  }
}

export const updateRoomTypePriceAdjustment = async (hotelId, roomTypeId, adjustment) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/adjustment`,
      { adjustment }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update room type price adjustment failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// ==================== ROOM TYPE IMAGES ====================

export const uploadRoomTypeImage = async (hotelId, roomTypeId, file, caption = null) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    if (caption) {
      formData.append('caption', JSON.stringify(caption))
    }
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Upload room type image failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const deleteRoomTypeImage = async (hotelId, roomTypeId, imageId) => {
  try {
    const response = await apiClient.delete(
      `${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images/${imageId}`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Delete room type image failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const reorderRoomTypeImages = async (hotelId, roomTypeId, imageIds) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images/reorder`,
      { imageIds }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Reorder room type images failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const setRoomTypeMainImage = async (hotelId, roomTypeId, imageId) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images/${imageId}/main`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Set room type main image failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  getRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  updateRoomTypeStatus,
  reorderRoomTypes,
  importRoomTypesFromBase,
  setBaseRoom,
  updateRoomTypePriceAdjustment,
  uploadRoomTypeImage,
  deleteRoomTypeImage,
  reorderRoomTypeImages,
  setRoomTypeMainImage
}
