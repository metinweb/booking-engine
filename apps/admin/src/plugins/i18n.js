import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import tr from '@/locales/tr.json'

const messages = {
  en,
  tr
}

// Get stored language or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en'

// Missing key handler for development
const missingHandler = import.meta.env.DEV
  ? (locale, key) => {
      // Dynamically import to avoid circular dependency
      import('@/stores/missingKeys').then(({ useMissingKeysStore }) => {
        const store = useMissingKeysStore()
        store.addMissingKey(locale, key)
      }).catch(() => {
        // Store might not be ready yet, ignore
      })
      return key // Return the key itself as fallback
    }
  : undefined

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLanguage,
  fallbackLocale: 'en',
  messages,
  missing: missingHandler,
  silentFallbackWarn: true,
  silentTranslationWarn: import.meta.env.PROD // Suppress warnings in production
})

export default i18n
