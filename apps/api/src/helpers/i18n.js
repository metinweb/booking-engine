import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load locales
const locales = {}
const localesDir = path.join(__dirname, '../locales')

const files = fs.readdirSync(localesDir)
files.forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '')
    locales[lang] = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'))
  }
})

// Supported languages
export const supportedLanguages = ['tr', 'en', 'de', 'ru', 'ar']

// Translate function
export const t = (key, lang = 'tr') => {
  return locales[lang]?.[key] || locales['tr']?.[key] || key
}

// i18n Middleware
export const i18nMiddleware = (req, res, next) => {
  // Get language from header, query or default to 'tr'
  const lang =
    req.headers['accept-language']?.split(',')[0]?.split('-')[0] || req.query.lang || 'tr'

  // Validate and set language
  req.lang = supportedLanguages.includes(lang) ? lang : 'tr'

  // Add translate helper to request
  req.t = key => t(key, req.lang)

  next()
}

export default { t, i18nMiddleware, supportedLanguages }
