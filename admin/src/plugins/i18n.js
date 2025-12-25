import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import tr from '@/locales/tr.json'

const messages = {
  en,
  tr
}

// Get stored language or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLanguage,
  fallbackLocale: 'en',
  messages
})

export default i18n
