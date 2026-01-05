/**
 * Language Constants
 * Centralized language definitions for the booking engine
 */

// Admin panel languages (2 languages for Market, Season)
export const ADMIN_LANGUAGES = ['tr', 'en']

// B2C languages (20 languages for Hotel, RoomType, MealPlan, etc.)
export const B2C_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

// Backward compatibility alias
export const SUPPORTED_LANGUAGES = B2C_LANGUAGES

/**
 * Helper function to create multi-language schema for Mongoose
 * @param {string[]} languages - Array of language codes
 * @param {boolean} required - Whether at least one language is required
 * @returns {Object} Mongoose schema definition for multi-language field
 */
export const multiLangString = (languages = B2C_LANGUAGES, _required = false) => {
  const schema = {}
  languages.forEach(lang => {
    schema[lang] = { type: String, trim: true, default: '' }
  })
  return schema
}

/**
 * Helper for admin-only fields (2 languages: TR, EN)
 * Use for: Market name, Season name
 */
export const adminLangString = (required = false) => multiLangString(ADMIN_LANGUAGES, required)

/**
 * Helper for B2C fields (20 languages)
 * Use for: Hotel description, RoomType name, MealPlan name, etc.
 */
export const b2cLangString = (required = false) => multiLangString(B2C_LANGUAGES, required)
