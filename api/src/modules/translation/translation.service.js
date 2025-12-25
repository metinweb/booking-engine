import { asyncHandler } from '../../helpers/asyncHandler.js'
import { BadRequestError } from '../../core/errors.js'
import geminiService from '../../services/geminiService.js'

/**
 * Translate single text
 * POST /api/translation/translate
 */
export const translateSingle = asyncHandler(async (req, res) => {
  const { text, sourceLang, targetLang } = req.body

  if (!text) {
    throw new BadRequestError('TEXT_REQUIRED')
  }

  if (!sourceLang || !targetLang) {
    throw new BadRequestError('LANGUAGES_REQUIRED')
  }

  const translated = await geminiService.translateText(text, sourceLang, targetLang)

  res.json({
    success: true,
    data: {
      original: text,
      translated,
      sourceLang,
      targetLang
    }
  })
})

/**
 * Translate multiple fields to multiple languages
 * POST /api/translation/translate-fields
 */
export const translateFieldsHandler = asyncHandler(async (req, res) => {
  const { fields, sourceLang, targetLangs } = req.body

  if (!fields || typeof fields !== 'object') {
    throw new BadRequestError('FIELDS_REQUIRED')
  }

  if (!sourceLang) {
    throw new BadRequestError('SOURCE_LANG_REQUIRED')
  }

  if (!targetLangs || !Array.isArray(targetLangs) || targetLangs.length === 0) {
    throw new BadRequestError('TARGET_LANGS_REQUIRED')
  }

  const translations = await geminiService.translateFields(fields, sourceLang, targetLangs)

  res.json({
    success: true,
    data: translations
  })
})

/**
 * Batch translate content object
 * POST /api/translation/batch
 */
export const batchTranslateHandler = asyncHandler(async (req, res) => {
  const { content, sourceLang, allLangs } = req.body

  if (!content || typeof content !== 'object') {
    throw new BadRequestError('CONTENT_REQUIRED')
  }

  if (!sourceLang) {
    throw new BadRequestError('SOURCE_LANG_REQUIRED')
  }

  if (!allLangs || !Array.isArray(allLangs) || allLangs.length === 0) {
    throw new BadRequestError('ALL_LANGS_REQUIRED')
  }

  const translations = await geminiService.batchTranslate(content, sourceLang, allLangs)

  res.json({
    success: true,
    data: translations
  })
})

/**
 * Translate SEO fields (title + description) to all languages
 * POST /api/translation/translate-seo
 */
export const translateSeo = asyncHandler(async (req, res) => {
  const { siteTitle, siteDescription, sourceLang, targetLangs } = req.body

  if (!sourceLang) {
    throw new BadRequestError('SOURCE_LANG_REQUIRED')
  }

  if (!targetLangs || !Array.isArray(targetLangs) || targetLangs.length === 0) {
    throw new BadRequestError('TARGET_LANGS_REQUIRED')
  }

  const sourceTitle = siteTitle?.[sourceLang] || ''
  const sourceDescription = siteDescription?.[sourceLang] || ''

  if (!sourceTitle && !sourceDescription) {
    throw new BadRequestError('NO_CONTENT_TO_TRANSLATE')
  }

  // Translate title and description to all target languages
  const [titleTranslations, descriptionTranslations] = await Promise.all([
    sourceTitle
      ? geminiService.batchTranslate(siteTitle, sourceLang, targetLangs)
      : Promise.resolve(siteTitle || {}),
    sourceDescription
      ? geminiService.batchTranslate(siteDescription, sourceLang, targetLangs)
      : Promise.resolve(siteDescription || {})
  ])

  res.json({
    success: true,
    data: {
      siteTitle: titleTranslations,
      siteDescription: descriptionTranslations
    }
  })
})
