import logger from '../../core/logger.js'
import { generateContent, languageNames } from './client.js'

/**
 * Translate text using Gemini AI
 */
export const translateText = async (text, sourceLang, targetLang) => {
  if (!text || text.trim() === '') {
    return ''
  }

  const sourceLangName = languageNames[sourceLang] || sourceLang
  const targetLangName = languageNames[targetLang] || targetLang

  const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.
Only return the translated text, nothing else. Do not add quotes or explanations.
If the text contains HTML tags, preserve them.

Text to translate:
${text}`

  try {
    const result = await generateContent(prompt, { temperature: 0.3 })
    return result?.trim() || ''
  } catch (error) {
    logger.error('Translation error:', error.message)
    throw error
  }
}

/**
 * Translate multiple fields to multiple languages in a SINGLE API call
 */
export const translateFields = async (fields, sourceLang, targetLangs) => {
  const results = {}

  // Initialize results
  for (const lang of targetLangs) {
    results[lang] = {}
  }

  // Get non-empty fields
  const fieldsToTranslate = {}
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (fieldValue && fieldValue.trim()) {
      fieldsToTranslate[fieldName] = fieldValue
    } else {
      // Empty fields stay empty in all languages
      for (const lang of targetLangs) {
        results[lang][fieldName] = ''
      }
    }
  }

  // If no fields to translate, return early
  if (Object.keys(fieldsToTranslate).length === 0) {
    return results
  }

  // Filter out source language from targets
  const actualTargets = targetLangs.filter(lang => lang !== sourceLang)

  // Add source language values directly
  results[sourceLang] = { ...fieldsToTranslate }

  if (actualTargets.length === 0) {
    return results
  }

  // Build target languages list with names
  const targetLangsList = actualTargets
    .map(code => {
      const name = languageNames[code] || code
      return `"${code}": "${name}"`
    })
    .join(', ')

  const sourceLangName = languageNames[sourceLang] || sourceLang

  // Build fields list for prompt
  const fieldsJson = JSON.stringify(fieldsToTranslate, null, 2)

  const prompt = `You are a professional translator. Translate the following fields from ${sourceLangName} to multiple languages.

IMPORTANT RULES:
1. Return ONLY a valid JSON object, nothing else
2. Top-level keys are language codes
3. Each language contains the translated fields with same field names
4. Preserve any HTML tags if present
5. Keep translations natural and contextually appropriate

Source fields (${sourceLangName}):
${fieldsJson}

Target languages: {${targetLangsList}}

Return JSON format:
{
  "${actualTargets[0]}": {"fieldName": "translation", ...},
  "${actualTargets[1] || actualTargets[0]}": {"fieldName": "translation", ...}
}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 8000
    })

    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Clean up response
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Try to extract JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    const translations = JSON.parse(cleanedResponse)

    // Merge translations into results
    for (const lang of actualTargets) {
      if (translations[lang]) {
        results[lang] = { ...results[lang], ...translations[lang] }
      }
    }

    logger.info(
      `Fields translation completed: ${Object.keys(fieldsToTranslate).length} fields to ${actualTargets.length} languages`
    )
    return results
  } catch (error) {
    logger.error('Fields translation error:', error.message)
    return results
  }
}

/**
 * Batch translate content object to all target languages in a SINGLE API call
 * Much faster than translating each language separately
 */
export const batchTranslate = async (content, sourceLang, allLangs) => {
  const sourceContent = content[sourceLang]

  if (!sourceContent || sourceContent.trim() === '') {
    return content
  }

  // Filter out source language
  const targetLangs = allLangs.filter(lang => lang !== sourceLang)

  if (targetLangs.length === 0) {
    return content
  }

  // Build target languages list with names for better context
  const targetLangsList = targetLangs
    .map(code => {
      const name = languageNames[code] || code
      return `"${code}": "${name}"`
    })
    .join(', ')

  const sourceLangName = languageNames[sourceLang] || sourceLang

  const prompt = `You are a professional translator. Translate the following text from ${sourceLangName} to multiple languages.

IMPORTANT RULES:
1. Return ONLY a valid JSON object, nothing else
2. Keys must be the language codes exactly as provided
3. Values must be the translated text
4. Preserve any HTML tags if present
5. Do not add quotes around the JSON, just return raw JSON
6. Keep translations natural and contextually appropriate

Source text (${sourceLangName}):
"${sourceContent}"

Target languages: {${targetLangsList}}

Return JSON format:
{"${targetLangs[0]}": "translation", "${targetLangs[1] || targetLangs[0]}": "translation", ...}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 8000
    })

    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Try to extract JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    const translations = JSON.parse(cleanedResponse)

    // Build result with source content and translations
    const result = { ...content }
    result[sourceLang] = sourceContent

    for (const lang of targetLangs) {
      if (translations[lang]) {
        result[lang] = translations[lang]
      }
    }

    logger.info(`Batch translation completed: ${targetLangs.length} languages in single call`)
    return result
  } catch (error) {
    logger.error('Batch translation error:', error.message)

    // Fallback: return original content with source
    const result = { ...content }
    result[sourceLang] = sourceContent
    return result
  }
}
