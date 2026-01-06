/**
 * AI Pricing Assistant Service
 * Handles AI-powered pricing commands
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

export const parseAIPricingCommand = async (
  hotelId,
  command,
  currentMonth = null,
  selectionContext = null
) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/ai/parse-command`, {
      command,
      currentMonth,
      selectionContext
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Parse AI command failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const executeAIPricingCommand = async (hotelId, parsedCommand) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/ai/execute-command`, {
      parsedCommand
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Execute AI command failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  parseAIPricingCommand,
  executeAIPricingCommand
}
