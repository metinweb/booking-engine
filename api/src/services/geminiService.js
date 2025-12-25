import { GoogleGenAI } from '@google/genai'
import logger from '../core/logger.js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-3-flash-preview'

// Initialize the AI client
let ai = null
const getAI = () => {
  if (!ai && GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  }
  return ai
}

// Language names for better translation context
const languageNames = {
  tr: 'Turkish',
  en: 'English',
  ru: 'Russian',
  el: 'Greek',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  fr: 'French',
  ro: 'Romanian',
  bg: 'Bulgarian',
  pt: 'Portuguese',
  da: 'Danish',
  zh: 'Chinese',
  ar: 'Arabic',
  fa: 'Persian',
  he: 'Hebrew',
  sq: 'Albanian',
  uk: 'Ukrainian',
  pl: 'Polish',
  az: 'Azerbaijani'
}

/**
 * Generate content using Gemini AI
 */
const generateContent = async (prompt, options = {}) => {
  const client = getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const config = {
    temperature: options.temperature || 0.3,
    maxOutputTokens: options.maxOutputTokens || 16000,
    ...(options.thinkingLevel && {
      thinkingConfig: {
        thinkingLevel: options.thinkingLevel
      }
    })
  }

  logger.info('Gemini request - model: ' + GEMINI_MODEL + ', config: ' + JSON.stringify(config))

  // Use streaming to collect complete response
  const response = await client.models.generateContentStream({
    model: GEMINI_MODEL,
    config,
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  })

  // Collect all chunks
  let fullText = ''
  let chunkCount = 0
  for await (const chunk of response) {
    chunkCount++
    if (chunk.text) {
      fullText += chunk.text
    }
  }

  logger.info('Gemini response - chunks: ' + chunkCount + ', totalLength: ' + fullText.length)

  return fullText
}

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
 * Translate multiple fields to multiple languages
 */
export const translateFields = async (fields, sourceLang, targetLangs) => {
  const results = {}

  for (const lang of targetLangs) {
    results[lang] = {}
  }

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (!fieldValue || fieldValue.trim() === '') {
      for (const lang of targetLangs) {
        results[lang][fieldName] = ''
      }
      continue
    }

    const translations = await Promise.all(
      targetLangs.map(async (lang) => {
        if (lang === sourceLang) {
          return { lang, text: fieldValue }
        }
        try {
          const translated = await translateText(fieldValue, sourceLang, lang)
          return { lang, text: translated }
        } catch (error) {
          logger.error(`Failed to translate ${fieldName} to ${lang}:`, error.message)
          return { lang, text: '' }
        }
      })
    )

    for (const { lang, text } of translations) {
      results[lang][fieldName] = text
    }
  }

  return results
}

/**
 * Batch translate content object to all target languages
 */
export const batchTranslate = async (content, sourceLang, allLangs) => {
  const sourceContent = content[sourceLang]

  if (!sourceContent || sourceContent.trim() === '') {
    return content
  }

  const result = { ...content }

  const translationPromises = allLangs
    .filter(lang => lang !== sourceLang)
    .map(async (lang) => {
      try {
        const translated = await translateText(sourceContent, sourceLang, lang)
        return { lang, text: translated }
      } catch (error) {
        logger.error(`Failed to translate to ${lang}:`, error.message)
        return { lang, text: content[lang] || '' }
      }
    })

  const translations = await Promise.all(translationPromises)

  for (const { lang, text } of translations) {
    result[lang] = text
  }

  return result
}

/**
 * Parse a natural language pricing command using Gemini AI
 */
export const parsePricingCommand = async (command, context = {}) => {
  if (!command || command.trim() === '') {
    throw new Error('Command is required')
  }

  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  // Build context string for AI
  const roomTypesStr = context.roomTypes?.map(rt => {
    const statusTag = rt.status === 'inactive' ? ' [inaktif]' : ''
    return `${rt.code}: ${rt.name}${statusTag}`
  }).join(', ') || 'Belirtilmemiş'
  const mealPlansStr = context.mealPlans?.map(mp => `${mp.code}: ${mp.name}`).join(', ') || 'Belirtilmemiş'
  const seasonsStr = context.seasons?.map(s => {
    const startDate = s.dateRanges?.[0]?.startDate ? new Date(s.dateRanges[0].startDate).toISOString().split('T')[0] : ''
    const endDate = s.dateRanges?.[0]?.endDate ? new Date(s.dateRanges[0].endDate).toISOString().split('T')[0] : ''
    return `${s.code}: ${s.name} (${startDate} - ${endDate})`
  }).join(', ') || 'Belirtilmemiş'

  // Build current month context
  let currentMonthStr = ''
  if (context.currentMonth?.year && context.currentMonth?.month) {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const monthName = monthNames[context.currentMonth.month - 1]
    currentMonthStr = `${monthName} ${context.currentMonth.year}`
  }

  logger.info('AI Context - Seasons: ' + seasonsStr)
  logger.info('AI Context - RoomTypes: ' + roomTypesStr)
  logger.info('AI Context - MealPlans: ' + mealPlansStr)
  logger.info('AI Context - Current Month: ' + currentMonthStr)

  // Build the current month date range for the prompt
  let currentMonthDateRange = ''
  if (context.currentMonth?.year && context.currentMonth?.month) {
    const year = context.currentMonth.year
    const month = context.currentMonth.month
    const lastDay = new Date(year, month, 0).getDate()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    currentMonthDateRange = `${startDate} ile ${endDate} arası`
  }

  const prompt = `Otel fiyatlandırma asistanısın. Komutu JSON'a çevir.

Bugün: ${today}
${currentMonthStr ? `
###############################################
# EKRANDA GÖRÜNTÜLENEN AY: ${currentMonthStr}
# TARİH ARALIĞI: ${currentMonthDateRange}
# "aşağıdaki" = BU AY = ${currentMonthStr}
###############################################
` : ''}
Odalar: ${roomTypesStr}
Pansiyonlar: ${mealPlansStr}
Sezonlar: ${seasonsStr}

Komut: "${command}"

JSON formatı (SADECE JSON döndür):
{
  "success": true,
  "actions": [{"action": "ACTION", "filters": {"roomTypes": "all", "mealPlans": "all", "daysOfWeek": "all"}, "value": 100, "valueType": "percentage"}],
  "dateRange": {"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
  "summary": {"tr": "...", "en": "..."}
}

ACTION: stop_sale, open_sale, set_price, update_price, set_supplement, update_allotment, update_min_stay, update_max_stay, close_to_arrival, close_to_departure

CTA/CTD KURALLARI (ÇOK ÖNEMLİ!):
- close_to_arrival (CTA) ve close_to_departure (CTD) için value: true veya false OLMALI
- "CTA/CTD kaldır", "CTA/CTD aç", "CTA/CTD iptal" → value: false (kısıtlamayı KALDIR)
- "CTA/CTD ekle", "CTA/CTD uygula", "CTA/CTD kapat" → value: true (kısıtlama EKLE)
- "bütün ctd'leri kaldır" = close_to_departure, value: false
- "girişe kapat" = close_to_arrival, value: true
- "çıkışa aç" = close_to_departure, value: false

TARİH BELİRLEME (ÇOK ÖNEMLİ!):
- "aşağıdaki", "aşağıda", "bu ay", "görüntülenen", "ekrandaki", "şu anki", "mevcut" kelimelerinden BİRİ VARSA:
  → MUTLAKA ${currentMonthStr ? `${currentMonthStr} (${currentMonthDateRange.replace(' ile ', ' - ').replace(' arası', '')})` : 'Görüntülenen ayı'} kullan!
  → SEZON KULLANMA! Sadece görüntülenen ayın tarihlerini kullan!
- SADECE "sezon" veya "tüm sezon" denirse → Sezonlar listesinden tarihleri al
- Tarih belirtilmemişse → ${currentMonthStr ? currentMonthStr : 'Görüntülenen ayı kullan'}

GÜN FİLTRESİ (daysOfWeek - SADECE STRING!):
- "haftasonu", "weekend", "cmt paz", "cumartesi pazar" → ["saturday", "sunday"]
- "haftaiçi", "weekday" → ["monday", "tuesday", "wednesday", "thursday", "friday"]
- "cuma", "friday" → ["friday"]
- "pazartesi salı" → ["monday", "tuesday"]
- Belirtilmemişse → "all"

İŞLEM TİPİ:
- Yeni fiyat: set_price (value: sabit TL)
- Zam/indirim: update_price (valueType: "percentage" veya "fixed")
- Stop: stop_sale, Aç: open_sale
- Pansiyon farkı: set_supplement

DİĞER:
- Birden fazla işlem → actions dizisine hepsini ekle
- summary gelecek zamanda: "uygulanacak", "girilecek"
- [inaktif] odalar dahil

ÖRNEK 1 - "aşağıdaki haftasonlarına %10 zam" (Görüntülenen: ${currentMonthStr || 'Haziran 2026'}):
NOT: "aşağıdaki" dediği için SEZON DEĞİL, görüntülenen ayı kullandık!
{"success":true,"actions":[{"action":"update_price","filters":{"roomTypes":"all","mealPlans":"all","daysOfWeek":["saturday","sunday"]},"value":10,"valueType":"percentage"}],"dateRange":{"startDate":"${context.currentMonth ? `${context.currentMonth.year}-${String(context.currentMonth.month).padStart(2,'0')}-01` : '2026-06-01'}","endDate":"${context.currentMonth ? `${context.currentMonth.year}-${String(context.currentMonth.month).padStart(2,'0')}-${new Date(context.currentMonth.year, context.currentMonth.month, 0).getDate()}` : '2026-06-30'}"},"summary":{"tr":"${currentMonthStr || 'Haziran 2026'} haftasonlarına %10 zam uygulanacak","en":"..."}}

ÖRNEK 2 - "tüm sezon için fiyatları güncelle":
NOT: "sezon" dediği için Sezonlar listesinden tarih aldık!
{"success":true,"actions":[{"action":"update_price",...}],"dateRange":{"startDate":"2026-04-01","endDate":"2026-10-31"},...}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536,
      thinkingLevel: 'HIGH'
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info('AI parsed response: ' + JSON.stringify(parsed))
      return parsed
    } catch (parseError) {
      logger.error('Failed to parse AI response: ' + cleanedResponse)
      return {
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 500)
      }
    }
  } catch (error) {
    logger.error('AI parsing error: ' + error.message)
    throw error
  }
}

export default {
  translateText,
  translateFields,
  batchTranslate,
  parsePricingCommand,
  languageNames
}
