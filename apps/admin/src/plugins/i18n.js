import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

// Get stored language or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en'

// Track loaded locales
const loadedLocales = new Set()

// Missing key handler for development
const missingHandler = import.meta.env.DEV
  ? (locale, key) => {
      // Dynamically import to avoid circular dependency
      import('@/stores/missingKeys')
        .then(({ useMissingKeysStore }) => {
          const store = useMissingKeysStore()
          store.addMissingKey(locale, key)
        })
        .catch(() => {
          // Store might not be ready yet, ignore
        })
      return key // Return the key itself as fallback
    }
  : undefined

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLanguage,
  fallbackLocale: 'en',
  messages: {},
  missing: missingHandler,
  silentFallbackWarn: true,
  silentTranslationWarn: import.meta.env.PROD // Suppress warnings in production
})

/**
 * Lazy load a locale's messages
 * @param {string} locale - The locale to load (e.g., 'en', 'tr')
 * @returns {Promise<void>}
 */
export async function loadLocaleMessages(locale) {
  // Return if already loaded
  if (loadedLocales.has(locale)) {
    return
  }

  // Dynamic import based on locale
  const messages = await import(`@/locales/${locale}/index.js`)

  // Set messages for the locale
  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLocales.add(locale)
}

/**
 * Set the active locale with lazy loading
 * @param {string} locale - The locale to set
 * @returns {Promise<void>}
 */
export async function setLocale(locale) {
  // Load messages if not already loaded
  await loadLocaleMessages(locale)

  // Set as current locale
  i18n.global.locale.value = locale

  // Persist to localStorage
  localStorage.setItem('language', locale)

  // Update document lang attribute
  document.documentElement.setAttribute('lang', locale)

  await nextTick()
}

/**
 * Get list of loaded locales
 * @returns {string[]}
 */
export function getLoadedLocales() {
  return Array.from(loadedLocales)
}

/**
 * Initialize i18n with the saved locale
 * Should be called before mounting the app
 * @returns {Promise<void>}
 */
export async function initI18n() {
  // Always load fallback locale first
  await loadLocaleMessages('en')

  // Load saved locale if different from fallback
  if (savedLanguage !== 'en') {
    await loadLocaleMessages(savedLanguage)
  }

  // Set initial document lang
  document.documentElement.setAttribute('lang', savedLanguage)
}

export default i18n
