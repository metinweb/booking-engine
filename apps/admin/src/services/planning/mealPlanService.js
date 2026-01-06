/**
 * Meal Plan Service
 * Handles meal plan CRUD operations and standard meal plans
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

// ==================== STANDARD MEAL PLANS ====================

export const getStandardMealPlans = async () => {
  try {
    const response = await apiClient.get(`${BASE_URL}/meal-plans/standard`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get standard meal plans failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const initStandardMealPlans = async () => {
  try {
    const response = await apiClient.post(`${BASE_URL}/meal-plans/init-standard`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Init standard meal plans failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// ==================== HOTEL MEAL PLANS ====================

export const getMealPlans = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/meal-plans`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get meal plans failed', error.response?.data || error.message)
    throw error
  }
}

export const createMealPlan = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/meal-plans`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Create meal plan failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const updateMealPlan = async (hotelId, id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/meal-plans/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update meal plan failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const deleteMealPlan = async (hotelId, id, deleteRates = true) => {
  try {
    const params = deleteRates ? { deleteRates: 'true' } : {}
    const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/meal-plans/${id}`, {
      params
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Delete meal plan failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const addStandardMealPlansToHotel = async (hotelId, codes) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/meal-plans/add-standard`, {
      codes
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Add standard meal plans failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const setBaseMealPlan = async (hotelId, mealPlanId) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/meal-plans/${mealPlanId}/set-base`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Set base meal plan failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const updateMealPlanPriceAdjustment = async (hotelId, mealPlanId, adjustment) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/hotels/${hotelId}/meal-plans/${mealPlanId}/adjustment`,
      { adjustment }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update meal plan price adjustment failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// ==================== STANDARD MEAL PLAN DATA ====================

export const getAvailableStandardMealPlans = () => {
  return [
    {
      code: 'RO',
      name: { tr: 'Sadece Oda', en: 'Room Only', de: 'Nur Zimmer', ru: 'Только номер' },
      description: {
        tr: 'Konaklama ücretine yemek dahil değildir',
        en: 'Accommodation only, no meals included'
      },
      includedMeals: {},
      displayOrder: 1
    },
    {
      code: 'BB',
      name: {
        tr: 'Oda Kahvaltı',
        en: 'Bed & Breakfast',
        de: 'Übernachtung mit Frühstück',
        ru: 'Завтрак включен'
      },
      description: {
        tr: 'Konaklama ve kahvaltı dahil',
        en: 'Accommodation with breakfast included'
      },
      includedMeals: { breakfast: true },
      displayOrder: 2
    },
    {
      code: 'HB',
      name: { tr: 'Yarım Pansiyon', en: 'Half Board', de: 'Halbpension', ru: 'Полупансион' },
      description: { tr: 'Kahvaltı ve akşam yemeği dahil', en: 'Breakfast and dinner included' },
      includedMeals: { breakfast: true, dinner: true },
      displayOrder: 3
    },
    {
      code: 'FB',
      name: { tr: 'Tam Pansiyon', en: 'Full Board', de: 'Vollpension', ru: 'Полный пансион' },
      description: {
        tr: 'Kahvaltı, öğle ve akşam yemeği dahil',
        en: 'Breakfast, lunch and dinner included'
      },
      includedMeals: { breakfast: true, lunch: true, dinner: true },
      displayOrder: 4
    },
    {
      code: 'AI',
      name: { tr: 'Her Şey Dahil', en: 'All Inclusive', de: 'All Inclusive', ru: 'Все включено' },
      description: {
        tr: 'Tüm yemekler ve yerli içecekler dahil',
        en: 'All meals and local drinks included'
      },
      includedMeals: { breakfast: true, lunch: true, dinner: true, snacks: true, drinks: true },
      displayOrder: 5
    },
    {
      code: 'UAI',
      name: {
        tr: 'Ultra Her Şey Dahil',
        en: 'Ultra All Inclusive',
        de: 'Ultra All Inclusive',
        ru: 'Ультра все включено'
      },
      description: {
        tr: 'Tüm yemekler, içecekler, alkollü içecekler ve oda servisi dahil',
        en: 'All meals, drinks, alcoholic beverages and room service included'
      },
      includedMeals: {
        breakfast: true,
        lunch: true,
        dinner: true,
        snacks: true,
        drinks: true,
        alcoholicDrinks: true,
        minibar: true,
        roomService: true
      },
      displayOrder: 6
    }
  ]
}

export default {
  getStandardMealPlans,
  initStandardMealPlans,
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  addStandardMealPlansToHotel,
  getAvailableStandardMealPlans,
  setBaseMealPlan,
  updateMealPlanPriceAdjustment
}
