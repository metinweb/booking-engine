import apiClient from './api'
import { apiLogger } from '@/utils/logger'

/**
 * Translate single text
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>}
 */
const translateText = async (text, sourceLang, targetLang) => {
  try {
    const response = await apiClient.post('/translation/translate', {
      text,
      sourceLang,
      targetLang
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Translation Service: Failed to translate text',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Translate multiple fields to multiple languages
 * @param {Object} fields - Object with field names and their values
 * @param {string} sourceLang - Source language code
 * @param {string[]} targetLangs - Array of target language codes
 * @returns {Promise<Object>}
 */
const translateFields = async (fields, sourceLang, targetLangs) => {
  try {
    const response = await apiClient.post('/translation/translate-fields', {
      fields,
      sourceLang,
      targetLangs
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Translation Service: Failed to translate fields',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Batch translate content object
 * @param {Object} content - Object where keys are language codes and values are content
 * @param {string} sourceLang - Source language code
 * @param {string[]} allLangs - All language codes to translate to
 * @returns {Promise<Object>}
 */
const batchTranslate = async (content, sourceLang, allLangs) => {
  try {
    const response = await apiClient.post('/translation/batch', {
      content,
      sourceLang,
      allLangs
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Translation Service: Failed to batch translate',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Translate SEO fields (title + description) to all languages
 * @param {Object} siteTitle - Object with language codes as keys
 * @param {Object} siteDescription - Object with language codes as keys
 * @param {string} sourceLang - Source language code
 * @param {string[]} targetLangs - All language codes to translate to
 * @returns {Promise<Object>}
 */
const translateSeo = async (siteTitle, siteDescription, sourceLang, targetLangs) => {
  try {
    const response = await apiClient.post('/translation/translate-seo', {
      siteTitle,
      siteDescription,
      sourceLang,
      targetLangs
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Translation Service: Failed to translate SEO',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  translateText,
  translateFields,
  batchTranslate,
  translateSeo
}
