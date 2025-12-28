import { GoogleGenAI } from '@google/genai'
import logger from '../core/logger.js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-3-flash-preview'

/**
 * Pre-process content to extract room information and group images
 * This helps Gemini understand room structure better
 */
const preprocessRoomContent = (content) => {
  if (!content) return { content, roomHints: null }

  // Reset used codes for this extraction
  usedCodes.clear()

  // Extract ALL hotel images - more permissive pattern
  const imagePattern = /https?:\/\/[^\s"'<>\]]+\.(jpg|jpeg|png|webp)/gi
  const rawImages = [...new Set((content.match(imagePattern) || []))]

  // Filter to keep only hotel-related images
  const allImages = rawImages.filter(img => {
    const imgLower = img.toLowerCase()
    // Must be hotel/room related
    const isHotelImage = imgLower.includes('hotel') ||
      imgLower.includes('room') ||
      imgLower.includes('oda') ||
      imgLower.includes('ets') ||
      imgLower.includes('cdn') ||
      imgLower.includes('gallery') ||
      imgLower.includes('upload') ||
      imgLower.includes('image') ||
      imgLower.includes('photo') ||
      imgLower.includes('media')
    // Skip icons, logos, social media
    const isExcluded = imgLower.includes('icon') ||
      imgLower.includes('logo') ||
      imgLower.includes('favicon') ||
      imgLower.includes('facebook') ||
      imgLower.includes('twitter') ||
      imgLower.includes('instagram') ||
      imgLower.includes('google') ||
      imgLower.includes('pixel') ||
      imgLower.includes('avatar') ||
      imgLower.includes('flag') ||
      /[-_](16|24|32|48|64|icon)[-_.]/.test(imgLower)
    return isHotelImage && !isExcluded
  })

  // Separate property images from room images
  const propertyImages = []
  const roomImages = []

  allImages.forEach(img => {
    const imgLower = img.toLowerCase()
    // Room images: contain etsrooms, /room/, /oda/ in URL
    const isRoomImage = imgLower.includes('etsrooms') ||
      imgLower.includes('/room/') ||
      imgLower.includes('/oda/') ||
      imgLower.includes('_room_') ||
      imgLower.includes('_oda_') ||
      /room[-_]?\d/i.test(imgLower)

    if (isRoomImage) {
      roomImages.push(img)
    } else {
      propertyImages.push(img)
    }
  })

  // Group ROOM images by timestamp (images with same timestamp likely belong to same room)
  const imageGroups = {}
  const ungroupedRoomImages = []

  roomImages.forEach(img => {
    // Try multiple timestamp patterns
    const timestampMatch = img.match(/_(\d{14})_(\d+)/i) ||
      img.match(/\/(\d{14})_/i) ||
      img.match(/_(\d{12,14})[_\-]/i)
    if (timestampMatch) {
      const ts = timestampMatch[1]
      if (!imageGroups[ts]) imageGroups[ts] = []
      imageGroups[ts].push(img)
    } else {
      ungroupedRoomImages.push(img)
    }
  })

  // Sort groups by image count (larger groups are likely main room types)
  const sortedGroups = Object.entries(imageGroups)
    .sort((a, b) => b[1].length - a[1].length)

  // Find room names in content - more comprehensive patterns
  const roomPatterns = [
    // ETS Tur specific - room name before "* * *" separator
    /\.(?:jpg|jpeg|png|webp)\)\n\n([^\n]+)\n\n\* \* \*/gi,
    // ETS Tur - room name with # header
    /###\s*([^\n#]+)/gi,
    // Room type with size
    /\*\*([^\*\n]+(?:Oda|Room|Suite|Villa|Bungalow)[^\*\n]*)\*\*/gi,
    // Generic room patterns - expanded
    /(?:^|\n)\s*((?:Luxury |Serenity |Laguna |Garden |Sea View |Land View |Deniz Manzaralı |Kara Manzaralı |Yandan |Pool |Beach |Mountain |City |Executive |Presidential |Premium )?(?:Suite|Superior|Süperior|Standard|Standart|Deluxe|Delüks|Family|Aile|Economy|Promo|Villa|Bungalow|Junior|King|Queen|Twin|Double|Single|Connect|Dublex|Duplex|Terrace|Penthouse|Residence)[^\n]{0,40}(?:\s*Oda|\s*Room)?)\s*\n/gi,
    // Turkish room types
    /(?:^|\n)\s*((?:Standart|Delüks|Süit|Süperior|Aile|Ekonomi|Promo|Villa|Bungalov)[^\n]{0,40}(?:\s*Oda)?)\s*\n/gi,
    // Residence types
    /(?:^|\n)\s*((?:King|Executive|Presidential|Premium|Royal)\s+(?:Residence|Suite)[^\n]{0,30})\s*\n/gi,
    // Manzaralı patterns
    /(?:^|\n)\s*((?:Luxury|Deluxe|Superior|Süperior)\s+(?:Deniz|Kara|Yandan Deniz)\s+Manzaralı[^\n]{0,20})\s*\n/gi
  ]

  const foundRooms = new Set()
  roomPatterns.forEach(pattern => {
    let match
    const patternCopy = new RegExp(pattern.source, pattern.flags) // Reset lastIndex
    while ((match = patternCopy.exec(content)) !== null) {
      let name = match[1].trim()
      // Clean up the name
      name = name.replace(/^\*+|\*+$/g, '').replace(/^#+\s*/, '').trim()
      if (name.length > 3 && name.length < 80 &&
          !name.includes('http') &&
          !name.includes('Otel') &&
          !name.includes('Hotel') &&
          !name.includes('Resort') &&
          !name.includes('Puan') &&
          !name.includes('TL') &&
          !name.includes('€') &&
          !name.includes('$')) {
        foundRooms.add(name)
      }
    }
  })

  // Also look for "Tesisin Oda Puanı" sections count as a hint
  const roomScoreCount = (content.match(/Tesisin Oda Puanı/gi) || []).length

  // Extract room sizes
  const roomSizes = [...new Set((content.match(/\d+\s*m²/g) || []))]

  // Build room hints
  const roomList = [...foundRooms]
  const roomHints = []

  // If we found room score sections but not enough rooms, note this
  const expectedRoomCount = Math.max(roomList.length, roomScoreCount, sortedGroups.length)

  roomHints.push('=== BULUNAN ODA TİPLERİ (TAM LİSTE) ===')
  roomHints.push(`Sayfada tespit edilen oda bölümü sayısı: ${roomScoreCount}`)
  roomHints.push(`Görsel grupları sayısı: ${sortedGroups.length}`)
  roomHints.push(`Oda boyutları: ${roomSizes.join(', ')}`)
  roomHints.push('')

  if (roomList.length > 0) {
    roomHints.push('Bulunan oda isimleri:')
    roomList.forEach((name, i) => {
      const code = generateRoomCode(name, i)
      roomHints.push(`${i + 1}. ${name} (Kod: ${code})`)
    })
  } else {
    roomHints.push(`DİKKAT: Oda isimleri regex ile bulunamadı ama ${roomScoreCount} oda bölümü var!`)
    roomHints.push('Lütfen içerikten oda isimlerini manuel olarak çıkar.')
  }

  roomHints.push('')
  roomHints.push(`*** TOPLAM ${allImages.length} GÖRSEL: ${propertyImages.length} otel görseli + ${roomImages.length} oda görseli ***`)
  roomHints.push('')

  // Property/Hotel images section
  if (propertyImages.length > 0) {
    roomHints.push('=== OTEL GÖRSELLERİ (images dizisine ekle, roomTemplates DEĞİL!) ===')
    roomHints.push('Bu görseller otelin genel alanları: havuz, restoran, lobi, dış cephe vb.')
    propertyImages.slice(0, 20).forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
    if (propertyImages.length > 20) {
      roomHints.push(`  ... ve ${propertyImages.length - 20} görsel daha`)
    }
    roomHints.push('')
  }

  // Room image groups section
  roomHints.push('=== ODA GÖRSELLERİ (roomTemplates içinde kullan!) ===')
  sortedGroups.forEach(([ts, imgs], i) => {
    const roomName = roomList[i] || `Bilinmeyen Oda ${i + 1}`
    roomHints.push(`\nGrup ${i + 1} - ${roomName}: ${imgs.length} görsel`)
    // Show ALL images in group
    imgs.forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
  })

  if (ungroupedRoomImages.length > 0) {
    roomHints.push(`\n=== GRUPLANMAMIŞ ODA GÖRSELLERİ (${ungroupedRoomImages.length} adet) ===`)
    roomHints.push('Bu görselleri içeriklerine göre uygun odalara dağıt:')
    ungroupedRoomImages.forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
  }

  roomHints.push('')
  roomHints.push('*** ÖNEMLİ: Otel görsellerini "images" dizisine, oda görsellerini "roomTemplates" içine koy! ***')
  roomHints.push('*** Otel görselleri ile oda görsellerini KARIŞTIRMA! ***')

  return {
    content: content,
    roomHints: roomHints.join('\n'),
    imageGroups: sortedGroups,
    roomNames: roomList,
    totalImages: allImages.length,
    propertyImageCount: propertyImages.length,
    roomImageCount: roomImages.length,
    expectedRoomCount
  }
}

/**
 * Generate unique room code from room name
 * Uses a Set to track used codes and appends numbers for duplicates
 */
const usedCodes = new Set()

const generateRoomCode = (name, index) => {
  const nameLower = name.toLowerCase()
  let baseCode = ''

  // Check for specific room types - more specific first
  if (nameLower.includes('presidential') && nameLower.includes('residence')) baseCode = 'PRE'
  else if (nameLower.includes('executive') && nameLower.includes('residence')) baseCode = 'EXE'
  else if (nameLower.includes('king') && nameLower.includes('residence')) baseCode = 'KNG'
  else if (nameLower.includes('premium') && nameLower.includes('suite')) baseCode = 'PRS'
  else if (nameLower.includes('suite') && nameLower.includes('serenity')) baseCode = 'SRN'
  else if (nameLower.includes('suite') && nameLower.includes('junior')) baseCode = 'JRS'
  else if (nameLower.includes('suite')) baseCode = 'STE'
  else if (nameLower.includes('villa') && nameLower.includes('garden')) baseCode = 'GRV'
  else if (nameLower.includes('villa')) baseCode = 'VIL'
  else if (nameLower.includes('bungalow') || nameLower.includes('bungalov')) baseCode = 'BNG'
  else if (nameLower.includes('residence')) baseCode = 'RES'
  else if (nameLower.includes('luxury') && nameLower.includes('deniz')) baseCode = 'LXD'
  else if (nameLower.includes('luxury') && nameLower.includes('kara')) baseCode = 'LXK'
  else if (nameLower.includes('luxury') && nameLower.includes('yandan')) baseCode = 'LXY'
  else if (nameLower.includes('luxury')) baseCode = 'LUX'
  else if (nameLower.includes('deluxe') && nameLower.includes('deniz')) baseCode = 'DXD'
  else if (nameLower.includes('deluxe') && nameLower.includes('kara')) baseCode = 'DXK'
  else if (nameLower.includes('deluxe') && nameLower.includes('yandan')) baseCode = 'DXY'
  else if (nameLower.includes('deluxe') || nameLower.includes('delüks')) baseCode = 'DLX'
  else if (nameLower.includes('superior') || nameLower.includes('süperior')) baseCode = 'SUP'
  else if (nameLower.includes('standard') || nameLower.includes('standart')) baseCode = 'STD'
  else if (nameLower.includes('family') || nameLower.includes('aile')) baseCode = 'FAM'
  else if (nameLower.includes('economy') || nameLower.includes('ekonomi')) baseCode = 'ECO'
  else if (nameLower.includes('promo')) baseCode = 'PRM'
  else if (nameLower.includes('deniz') || nameLower.includes('sea')) baseCode = 'SEA'
  else if (nameLower.includes('kara') || nameLower.includes('land')) baseCode = 'LND'
  else {
    // Fallback: generate from first letters
    const words = name.split(/\s+/).filter(w => w.length > 2)
    if (words.length >= 2) {
      baseCode = (words[0][0] + words[1][0] + (words[2]?.[0] || '')).toUpperCase()
    } else {
      baseCode = `RM${index + 1}`
    }
  }

  // Ensure uniqueness by appending number if needed
  let finalCode = baseCode
  let counter = 2
  while (usedCodes.has(finalCode)) {
    finalCode = `${baseCode}${counter}`
    counter++
  }
  usedCodes.add(finalCode)

  return finalCode
}

// Reset used codes for each extraction
const resetUsedCodes = () => {
  usedCodes.clear()
}

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
  const targetLangsList = actualTargets.map(code => {
    const name = languageNames[code] || code
    return `"${code}": "${name}"`
  }).join(', ')

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
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

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

    logger.info(`Fields translation completed: ${Object.keys(fieldsToTranslate).length} fields to ${actualTargets.length} languages`)
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
  const targetLangsList = targetLangs.map(code => {
    const name = languageNames[code] || code
    return `"${code}": "${name}"`
  }).join(', ')

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
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

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

  // Build selection context string for AI
  let selectionStr = ''
  if (context.selectionContext) {
    const sel = context.selectionContext
    selectionStr = `
###############################################
# SEÇİLİ HÜCRELER (KULLANICI TARAFINDAN SEÇİLDİ!)
# Hücre Sayısı: ${sel.count}
# Tarih Aralığı: ${sel.startDate} - ${sel.endDate}
# Odalar: ${sel.roomTypes?.join(', ') || 'Tümü'}
# Pansiyonlar: ${sel.mealPlans?.join(', ') || 'Tümü'}
###############################################
`
    logger.info('AI Context - Selection: ' + JSON.stringify(sel))
  }

  const prompt = `Otel fiyatlandırma asistanısın. Komutu JSON'a çevir.

Bugün: ${today}
${currentMonthStr ? `
###############################################
# EKRANDA GÖRÜNTÜLENEN AY: ${currentMonthStr}
# TARİH ARALIĞI: ${currentMonthDateRange}
# "aşağıdaki" = BU AY = ${currentMonthStr}
###############################################
` : ''}${selectionStr}
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

ACTION: stop_sale, open_sale, single_stop, open_single, set_price, update_price, set_supplement, update_allotment, update_min_stay, update_max_stay, close_to_arrival, close_to_departure

CTA/CTD KURALLARI (ÇOK ÖNEMLİ!):
- close_to_arrival (CTA) ve close_to_departure (CTD) için value: true veya false OLMALI
- "CTA/CTD kaldır", "CTA/CTD aç", "CTA/CTD iptal" → value: false (kısıtlamayı KALDIR)
- "CTA/CTD ekle", "CTA/CTD uygula", "CTA/CTD kapat" → value: true (kısıtlama EKLE)
- "bütün ctd'leri kaldır" = close_to_departure, value: false
- "girişe kapat" = close_to_arrival, value: true
- "çıkışa aç" = close_to_departure, value: false

SEÇİLİ HÜCRELER (EN ÖNCELİKLİ!):
- "seçili", "seçilen", "seçilmiş", "işaretli", "işaretlenen" kelimelerinden BİRİ VARSA VE SEÇİLİ HÜCRELER VARSA:
  → MUTLAKA seçili hücrelerin tarih aralığını kullan!
  → filters.roomTypes = seçili odalar
  → filters.mealPlans = seçili pansiyonlar
  → Kullanıcı takvimden seçtiği günlere işlem uygulamak istiyor!
- SEÇİLİ HÜCRELER YOKSA ve "seçili" denirse → Hata döndür: {"success":false,"error":"Seçili hücre yok. Önce takvimden hücre seçin."}

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
- Single Stop: single_stop (tek kişi satışı kapat), open_single (tek kişi satışı aç)
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
{"success":true,"actions":[{"action":"update_price",...}],"dateRange":{"startDate":"2026-04-01","endDate":"2026-10-31"},...}

ÖRNEK 3 - "seçili günlere stop çek" (SEÇİLİ HÜCRELER: 2026-06-15 - 2026-06-20, Odalar: STD, DBL, Pansiyonlar: AI):
NOT: "seçili" dediği için SEÇİLİ HÜCRELERİN tarih aralığını ve filtrelerini kullandık!
{"success":true,"actions":[{"action":"stop_sale","filters":{"roomTypes":["STD","DBL"],"mealPlans":["AI"],"daysOfWeek":"all"},"value":true}],"dateRange":{"startDate":"2026-06-15","endDate":"2026-06-20"},"summary":{"tr":"Seçili 6 hücreye stop sale uygulanacak","en":"Stop sale will be applied to 6 selected cells"}}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536,
      thinkingLevel: 'low'
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

/**
 * Check if JSON response is truncated (incomplete)
 */
const isJsonTruncated = (jsonStr) => {
  if (!jsonStr) return true
  const trimmed = jsonStr.trim()
  // JSON should end with } or ]
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) return true
  // Try to count braces
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false
  for (const char of trimmed) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') braceCount++
      else if (char === '}') braceCount--
      else if (char === '[') bracketCount++
      else if (char === ']') bracketCount--
    }
  }
  return braceCount !== 0 || bracketCount !== 0
}

/**
 * Attempt to repair truncated JSON by closing open brackets
 * This is a best-effort recovery for truncated responses
 */
const repairTruncatedJson = (jsonStr) => {
  if (!jsonStr) return '{}'

  let repaired = jsonStr.trim()

  // Remove any trailing incomplete property (e.g., "name": "Some incomplete)
  // Find last complete property
  const lastCompleteMatch = repaired.match(/^([\s\S]*"[^"]+"\s*:\s*(?:"[^"]*"|[\d.]+|true|false|null|\{[\s\S]*?\}|\[[\s\S]*?\]))\s*,?\s*"[^"]*$/m)
  if (lastCompleteMatch) {
    repaired = lastCompleteMatch[1]
  }

  // Remove trailing comma if present
  repaired = repaired.replace(/,\s*$/, '')

  // Count unclosed brackets
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false

  for (const char of repaired) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') braceCount++
      else if (char === '}') braceCount--
      else if (char === '[') bracketCount++
      else if (char === ']') bracketCount--
    }
  }

  // Close unclosed brackets
  while (bracketCount > 0) {
    repaired += ']'
    bracketCount--
  }
  while (braceCount > 0) {
    repaired += '}'
    braceCount--
  }

  logger.info(`Repaired JSON: added ${-braceCount} braces, ${-bracketCount} brackets`)
  return repaired
}

/**
 * Extract hotel data from text, URL content, or document using Gemini AI
 * Returns structured JSON matching the hotel schema with confidence scores
 * Includes retry logic for truncated responses
 */
export const extractHotelData = async (content, contentType = 'text', retryCount = 0) => {
  const MAX_RETRIES = 2

  if (!content || content.trim() === '') {
    throw new Error('Content is required')
  }

  // Pre-process content to extract room information
  const preprocessed = preprocessRoomContent(content)
  const roomHintsSection = preprocessed.roomHints
    ? `\n${preprocessed.roomHints}\n`
    : ''

  logger.info(`Preprocessed: ${preprocessed.roomNames?.length || 0} rooms found, ${preprocessed.totalImages || 0} images (${preprocessed.propertyImageCount || 0} property + ${preprocessed.roomImageCount || 0} room)`)

  const prompt = `Sen bir otel veri çıkarma uzmanısın. Aşağıdaki ${contentType === 'url' ? 'web sayfası içeriğinden' : contentType === 'pdf' ? 'PDF dökümanından' : 'metinden'} otel bilgilerini çıkar ve JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. SADECE geçerli JSON döndür, başka bir şey ekleme
2. Bulamadığın alanları boş string "" veya null olarak bırak
3. Her alan için confidence (güven) skoru ekle (0-100 arası)
4. Çoklu dil alanlarında Türkçe (tr) ve İngilizce (en) için değer ver, diğerlerini boş bırak
5. amenities ve profile.features için sadece belirtilen enum değerlerini kullan
6. Koordinatları ondalıklı sayı olarak ver (örn: 36.8523)
7. Resimleri çıkarırken: sadece otel fotoğraflarını al (banner, icon, reklam resimlerini alma), TAM URL kullan (https://... ile başlamalı), en az 5-10 resim bul

OTEL VERİ ŞEMASI:

{
  "name": "Otel adı (string)",
  "description": {
    "tr": "Türkçe açıklama",
    "en": "English description"
  },
  "stars": 5,
  "type": "hotel|apart|boutique|resort|hostel|villa|guesthouse|motel|pension|camping",
  "category": "economy|standard|superior|deluxe|luxury|ultra-luxury",
  "address": {
    "street": "Sokak/Cadde",
    "district": "İlçe",
    "city": "Şehir",
    "country": "Ülke",
    "postalCode": "Posta kodu",
    "coordinates": {
      "lat": 36.8523,
      "lng": 30.7233
    }
  },
  "contact": {
    "phone": "+90 xxx",
    "email": "email@hotel.com",
    "website": "https://...",
    "fax": "+90 xxx"
  },
  "amenities": [
    "wifi", "parking", "freeParking", "valetParking",
    "pool", "indoorPool", "outdoorPool", "spa", "gym", "sauna", "hammam",
    "restaurant", "bar", "roomService", "breakfast",
    "reception24h", "concierge", "laundry", "dryCleaning", "airportShuttle",
    "businessCenter", "meetingRooms", "conferenceHall",
    "kidsClub", "playground", "babysitting",
    "beachAccess", "privateBeach", "garden", "terrace",
    "wheelchairAccessible", "elevator",
    "petFriendly", "smokingArea", "nonSmoking",
    "casino", "nightclub", "cinema", "gameRoom",
    "tennis", "golf", "diving", "surfing", "skiing"
  ],
  "roomConfig": {
    "totalRooms": 100,
    "floors": 5,
    "hasElevator": true
  },
  "policies": {
    "checkIn": "14:00",
    "checkOut": "12:00",
    "maxBabyAge": 2,
    "maxChildAge": 12,
    "childPolicy": { "tr": "...", "en": "..." },
    "petPolicy": { "tr": "...", "en": "..." }
  },
  "profile": {
    "overview": {
      "content": { "tr": "...", "en": "..." },
      "establishedYear": 2010,
      "renovationYear": 2023,
      "chainBrand": "Marka adı"
    },
    "facilities": {
      "content": { "tr": "...", "en": "..." },
      "features": ["wifi", "freeWifi", "parking", "freeParking", "reception24h", "concierge", "elevator", "airConditioning", "laundry", "garden", "terrace"]
    },
    "dining": {
      "content": { "tr": "...", "en": "..." },
      "features": ["mainRestaurant", "alacarteRestaurant", "buffetRestaurant", "snackBar", "poolBar", "beachBar", "lobbyBar", "roomService", "minibar"],
      "restaurants": [{ "name": "...", "cuisine": "...", "reservationRequired": false }]
    },
    "sportsEntertainment": {
      "content": { "tr": "...", "en": "..." },
      "features": ["fitness", "tennis", "volleyball", "waterSports", "animation", "liveMusic", "disco"]
    },
    "spaWellness": {
      "content": { "tr": "...", "en": "..." },
      "features": ["spa", "hammam", "sauna", "jacuzzi", "massage"]
    },
    "familyKids": {
      "content": { "tr": "...", "en": "..." },
      "features": ["kidsClub", "playground", "babyPool", "kidsPool", "waterSlides", "babysitting", "kidsMenu"],
      "kidsClubAges": { "min": 4, "max": 12 }
    },
    "beachPool": {
      "content": { "tr": "...", "en": "..." },
      "features": ["privateBeach", "sandyBeach", "sunbeds", "outdoorPool", "indoorPool", "kidsPool", "waterSlides"],
      "beachDetails": { "distance": 0, "type": "sand|pebble|platform|mixed", "length": 500 },
      "pools": [{ "type": "outdoor|indoor|kids", "heated": false, "dimensions": "25x12m" }]
    },
    "honeymoon": {
      "content": { "tr": "...", "en": "..." },
      "features": ["romanticRoomDecoration", "champagne", "romanticDinner", "couplesSpa"],
      "available": true
    },
    "location": {
      "content": { "tr": "...", "en": "..." },
      "distances": [
        { "place": "Havalimanı", "distance": 45, "unit": "km" },
        { "place": "Şehir merkezi", "distance": 10, "unit": "km" },
        { "place": "Plaj", "distance": 0, "unit": "m" }
      ]
    }
  },
  "images": [
    {
      "url": "https://hotel.com/full-path/image.jpg (tam URL, relative path değil)",
      "alt": "Resim açıklaması",
      "category": "exterior|lobby|room|pool|beach|restaurant|spa|garden|other"
    }
  ],
  "logo": "https://hotel.com/logo.png (otel logosu tam URL, varsa)",
  "roomTemplates": [
    {
      "code": "STD|DLX|STE|FAM|SGL|DBL|TWN|SUITE|BUNG|VILLA (kısa kod)",
      "name": { "tr": "Standart Oda", "en": "Standard Room" },
      "description": { "tr": "Oda açıklaması", "en": "Room description" },
      "images": [
        { "url": "https://hotel.com/room1-image1.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image2.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image3.jpg", "caption": { "tr": "", "en": "" } }
      ],
      "amenities": [
        "wifi", "airConditioning", "heating", "tv", "satelliteTV", "smartTV", "minibar", "refrigerator", "kettle", "coffeeMachine",
        "privateBathroom", "bathtub", "shower", "rainShower", "jacuzzi", "hairdryer", "toiletries", "bathrobes", "slippers",
        "seaView", "poolView", "gardenView", "cityView", "mountainView", "balcony", "terrace", "privatePool",
        "safe", "desk", "sofa", "wardrobe", "ironingEquipment", "soundproofing",
        "roomService", "dailyHousekeeping", "wheelchairAccessible", "connectedRooms", "nonSmoking", "petFriendly"
      ],
      "size": 25,
      "bedConfiguration": [
        { "type": "single|double|queen|king|twin|sofa|bunk|extra", "count": 1 }
      ],
      "occupancy": {
        "maxAdults": 2,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ],
  "confidence": {
    "name": 95,
    "description": 80,
    "stars": 100,
    "address": 90,
    "contact": 85,
    "amenities": 75,
    "profile": 70,
    "images": 60,
    "roomTemplates": 70
  }
}

ODA ŞABLONLARI TALİMATLARI (ÇOK ÖNEMLİ!):
- "BULUNAN ODA TİPLERİ" bölümünde listelenen TÜM odalari çıkar - HİÇBİRİNİ ATLAMA!
- Her oda için BENZERSİZ kod kullan (aynı kodu iki odada kullanma!)
- Oda olanaklarını (amenities) sadece yukarıdaki listeden seç
- Oda boyutunu (m²), yatak tipini ve kapasiteyi çıkar

GÖRSEL ATAMA KURALLARI (EN ÖNEMLİ!):
- "OTEL GÖRSELLERİ" bölümündeki görseller → "images" dizisine (havuz, restoran, lobi, dış cephe)
- "ODA GÖRSELLERİ" bölümündeki görseller → "roomTemplates[].images" dizisine
- OTEL görsellerini ODA görsellerine KARIŞTIRMA!
- URL'de "etsrooms" geçen görseller SADECE odalara ait - "images" dizisine KOYMA!
- URL'de "hotelImages" geçen görseller SADECE otele ait - "roomTemplates" içine KOYMA!
- Her oda grubundaki TÜM görselleri ilgili odaya ekle
- Navbar, icon, banner, logo, sosyal medya görsellerini KULLANMA

${roomHintsSection}

İÇERİK:
"""
${content}
"""

Sadece JSON döndür:`

  try {
    // Use higher token limit for comprehensive extraction
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536  // Maximum for Gemini
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    logger.info(`Gemini raw response length: ${responseText.length} chars`)

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check if response is truncated
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn(`Gemini response appears truncated (${cleanedResponse.length} chars), retry ${retryCount + 1}/${MAX_RETRIES}`)

      if (retryCount < MAX_RETRIES) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractHotelData(content, contentType, retryCount + 1)
      }

      // Last resort: try to repair truncated JSON by closing brackets
      logger.warn('Max retries reached, attempting to repair truncated JSON')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info('Hotel data extraction completed - fields: ' + Object.keys(parsed).length + ', rooms: ' + (parsed.roomTemplates?.length || 0))
      return {
        success: true,
        data: parsed
      }
    } catch (parseError) {
      logger.error('Failed to parse AI response: ' + cleanedResponse.substring(0, 500))

      // If we haven't exhausted retries, try again
      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying due to parse error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractHotelData(content, contentType, retryCount + 1)
      }

      return {
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 1000)
      }
    }
  } catch (error) {
    logger.error('Hotel data extraction error: ' + error.message)

    // Retry on network/API errors
    if (retryCount < MAX_RETRIES && (error.message.includes('timeout') || error.message.includes('network'))) {
      logger.info(`Retrying due to error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
      return extractHotelData(content, contentType, retryCount + 1)
    }

    throw error
  }
}

/**
 * Fetch URL content using Firecrawl and extract hotel data with Gemini
 * Firecrawl crawls multiple pages (about, rooms, facilities, etc.) for comprehensive data
 * @param {string} url - Hotel URL to extract data from
 * @param {object} options - Options including progress emitter
 * @param {ProgressEmitter} options.progress - Optional progress emitter for real-time updates
 */
export const extractHotelDataFromUrl = async (url, options = {}) => {
  const { progress } = options

  if (!url || !url.trim()) {
    throw new Error('URL is required')
  }

  const client = getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  // Initialize progress steps if emitter provided
  if (progress) {
    progress.setSteps([
      { id: 'init', label: { tr: 'Başlatılıyor', en: 'Initializing' } },
      { id: 'crawl', label: { tr: 'Web sayfası taranıyor', en: 'Crawling web page' } },
      { id: 'preprocess', label: { tr: 'İçerik ön işleniyor', en: 'Preprocessing content' } },
      { id: 'extract', label: { tr: 'AI ile veri çıkarılıyor', en: 'Extracting data with AI' } },
      { id: 'validate', label: { tr: 'Veriler doğrulanıyor', en: 'Validating data' } }
    ])
    progress.startStep('init', { url })
  }

  let webContent = null
  let crawledPages = []

  // Try Firecrawl first for better content extraction
  try {
    const firecrawl = await import('./firecrawlService.js')

    if (firecrawl.isConfigured()) {
      logger.info('Using Firecrawl to crawl hotel website: ' + url)

      if (progress) {
        progress.completeStep('init')
        progress.startStep('crawl', { method: 'firecrawl', maxPages: 12 })
      }

      const crawlResult = await firecrawl.smartFetch(url, {
        maxPages: 12,
        onPageScraped: (pageInfo) => {
          // Emit progress for each scraped page
          if (progress) {
            progress.updateStep('crawl', {
              currentPage: pageInfo.url,
              pagesScraped: pageInfo.index + 1,
              totalChars: pageInfo.totalChars,
              imagesFound: pageInfo.imagesFound
            })
          }
        }
      })

      if (crawlResult && crawlResult.success && crawlResult.content) {
        webContent = crawlResult.content
        crawledPages = crawlResult.pages || []
        logger.info(`Firecrawl success: ${crawledPages.length} pages, ${webContent.length} chars`)

        if (progress) {
          progress.completeStep('crawl', {
            pagesScraped: crawledPages.length,
            totalChars: webContent.length,
            uniqueImages: crawlResult.uniqueImages || 0
          })
        }
      }
    }
  } catch (firecrawlError) {
    logger.warn('Firecrawl failed, will use Gemini direct: ' + firecrawlError.message)
    if (progress) {
      progress.updateStep('crawl', { error: firecrawlError.message, fallback: true })
    }
  }

  // If we have content from Firecrawl, use extractHotelData with that content
  if (webContent && webContent.length > 500) {
    logger.info('Extracting hotel data from Firecrawl content')

    if (progress) {
      progress.startStep('preprocess')
    }

    // Pre-process to get room hints
    const preprocessed = preprocessRoomContent(webContent)

    if (progress) {
      progress.completeStep('preprocess', {
        roomsFound: preprocessed.roomNames?.length || 0,
        imagesFound: preprocessed.totalImages || 0,
        roomNames: preprocessed.roomNames || []
      })
      progress.startStep('extract', { method: 'firecrawl_content' })
    }

    const result = await extractHotelData(webContent, 'url', 0, progress)

    if (result.success) {
      if (progress) {
        progress.completeStep('extract', {
          fieldsExtracted: Object.keys(result.data).length,
          roomTemplates: result.data.roomTemplates?.length || 0
        })
        progress.startStep('validate')
        progress.completeStep('validate', {
          valid: true,
          roomCodes: result.data.roomTemplates?.map(r => r.code) || []
        })
        progress.complete({
          success: true,
          hotelName: result.data.name,
          roomCount: result.data.roomTemplates?.length || 0,
          imageCount: result.data.images?.length || 0
        })
      }

      return {
        ...result,
        sourceUrl: url,
        crawledPages: crawledPages
      }
    }
  }

  // Fallback: Use Gemini's direct URL reading capability
  logger.info('Falling back to Gemini direct URL reading: ' + url)

  if (progress) {
    if (!progress.steps.find(s => s.id === 'crawl')?.status) {
      progress.completeStep('init')
    }
    progress.startStep('crawl', { method: 'gemini_direct' })
  }

  const prompt = `Sen bir otel veri çıkarma uzmanısın. Bu web sayfasından otel bilgilerini çıkar ve JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. SADECE geçerli JSON döndür, başka bir şey ekleme
2. Bulamadığın alanları boş string "" veya null olarak bırak
3. Her alan için confidence (güven) skoru ekle (0-100 arası)
4. Çoklu dil alanlarında - sayfanın dilinde içerik var ise o dile yaz, yoksa Türkçe ve İngilizce için tahmin et
5. amenities ve profile.features için sadece belirtilen enum değerlerini kullan
6. Koordinatları ondalıklı sayı olarak ver (örn: 36.8523)
7. Resimleri çıkarırken: sadece otel fotoğraflarını al (banner, icon, reklam resimlerini alma), TAM URL kullan (https://... ile başlamalı), en az 5-10 resim bul

OTEL VERİ ŞEMASI:

{
  "name": "Otel adı (string)",
  "description": {
    "tr": "Türkçe açıklama",
    "en": "English description"
  },
  "stars": 5,
  "type": "hotel|apart|boutique|resort|hostel|villa|guesthouse|motel|pension|camping",
  "category": "economy|standard|superior|deluxe|luxury|ultra-luxury",
  "address": {
    "street": "Sokak/Cadde",
    "district": "İlçe",
    "city": "Şehir",
    "country": "Ülke",
    "postalCode": "Posta kodu",
    "coordinates": {
      "lat": 36.8523,
      "lng": 30.7233
    }
  },
  "contact": {
    "phone": "+90 xxx",
    "email": "email@hotel.com",
    "website": "https://...",
    "fax": "+90 xxx"
  },
  "amenities": [
    "wifi", "parking", "freeParking", "valetParking",
    "pool", "indoorPool", "outdoorPool", "spa", "gym", "sauna", "hammam",
    "restaurant", "bar", "roomService", "breakfast",
    "reception24h", "concierge", "laundry", "dryCleaning", "airportShuttle",
    "businessCenter", "meetingRooms", "conferenceHall",
    "kidsClub", "playground", "babysitting",
    "beachAccess", "privateBeach", "garden", "terrace",
    "wheelchairAccessible", "elevator",
    "petFriendly", "smokingArea", "nonSmoking",
    "casino", "nightclub", "cinema", "gameRoom",
    "tennis", "golf", "diving", "surfing", "skiing"
  ],
  "roomConfig": {
    "totalRooms": 100,
    "floors": 5,
    "hasElevator": true
  },
  "policies": {
    "checkIn": "14:00",
    "checkOut": "12:00",
    "maxBabyAge": 2,
    "maxChildAge": 12,
    "childPolicy": { "tr": "...", "en": "..." },
    "petPolicy": { "tr": "...", "en": "..." }
  },
  "profile": {
    "overview": {
      "content": { "tr": "...", "en": "..." },
      "establishedYear": 2010,
      "renovationYear": 2023,
      "chainBrand": "Marka adı"
    },
    "facilities": {
      "content": { "tr": "...", "en": "..." },
      "features": ["wifi", "freeWifi", "parking", "freeParking", "reception24h", "concierge", "elevator", "airConditioning", "laundry", "garden", "terrace"]
    },
    "dining": {
      "content": { "tr": "...", "en": "..." },
      "features": ["mainRestaurant", "alacarteRestaurant", "buffetRestaurant", "snackBar", "poolBar", "beachBar", "lobbyBar", "roomService", "minibar"],
      "restaurants": [{ "name": "...", "cuisine": "...", "reservationRequired": false }]
    },
    "sportsEntertainment": {
      "content": { "tr": "...", "en": "..." },
      "features": ["fitness", "tennis", "volleyball", "waterSports", "animation", "liveMusic", "disco"]
    },
    "spaWellness": {
      "content": { "tr": "...", "en": "..." },
      "features": ["spa", "hammam", "sauna", "jacuzzi", "massage"]
    },
    "familyKids": {
      "content": { "tr": "...", "en": "..." },
      "features": ["kidsClub", "playground", "babyPool", "kidsPool", "waterSlides", "babysitting", "kidsMenu"],
      "kidsClubAges": { "min": 4, "max": 12 }
    },
    "beachPool": {
      "content": { "tr": "...", "en": "..." },
      "features": ["privateBeach", "sandyBeach", "sunbeds", "outdoorPool", "indoorPool", "kidsPool", "waterSlides"],
      "beachDetails": { "distance": 0, "type": "sand|pebble|platform|mixed", "length": 500 },
      "pools": [{ "type": "outdoor|indoor|kids", "heated": false, "dimensions": "25x12m" }]
    },
    "honeymoon": {
      "content": { "tr": "...", "en": "..." },
      "features": ["romanticRoomDecoration", "champagne", "romanticDinner", "couplesSpa"],
      "available": true
    },
    "location": {
      "content": { "tr": "...", "en": "..." },
      "distances": [
        { "place": "Havalimanı", "distance": 45, "unit": "km" },
        { "place": "Şehir merkezi", "distance": 10, "unit": "km" },
        { "place": "Plaj", "distance": 0, "unit": "m" }
      ]
    }
  },
  "images": [
    {
      "url": "https://hotel.com/full-path/image.jpg (tam URL, relative path değil)",
      "alt": "Resim açıklaması",
      "category": "exterior|lobby|room|pool|beach|restaurant|spa|garden|other"
    }
  ],
  "logo": "https://hotel.com/logo.png (otel logosu tam URL, varsa)",
  "roomTemplates": [
    {
      "code": "STD|DLX|STE|FAM|SGL|DBL|TWN|SUITE|BUNG|VILLA (kısa kod)",
      "name": { "tr": "Standart Oda", "en": "Standard Room" },
      "description": { "tr": "Oda açıklaması", "en": "Room description" },
      "images": [
        { "url": "https://hotel.com/room1-image1.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image2.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image3.jpg", "caption": { "tr": "", "en": "" } }
      ],
      "amenities": [
        "wifi", "airConditioning", "heating", "tv", "satelliteTV", "smartTV", "minibar", "refrigerator", "kettle", "coffeeMachine",
        "privateBathroom", "bathtub", "shower", "rainShower", "jacuzzi", "hairdryer", "toiletries", "bathrobes", "slippers",
        "seaView", "poolView", "gardenView", "cityView", "mountainView", "balcony", "terrace", "privatePool",
        "safe", "desk", "sofa", "wardrobe", "ironingEquipment", "soundproofing",
        "roomService", "dailyHousekeeping", "wheelchairAccessible", "connectedRooms", "nonSmoking", "petFriendly"
      ],
      "size": 25,
      "bedConfiguration": [
        { "type": "single|double|queen|king|twin|sofa|bunk|extra", "count": 1 }
      ],
      "occupancy": {
        "maxAdults": 2,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ],
  "confidence": {
    "name": 95,
    "description": 80,
    "stars": 100,
    "address": 90,
    "contact": 85,
    "amenities": 75,
    "profile": 70,
    "images": 60,
    "roomTemplates": 70
  }
}

ODA ŞABLONLARI TALİMATLARI (ÖNEMLİ!):
- Otel web sitesinden TÜM oda tiplerini çıkar (en az 3-5 farklı oda tipi bul)
- Her oda tipi için: kod (STD, DLX, STE, FAM, SGL, DBL, TWN, SUITE, BUNG, VILLA vb.), isim, açıklama bul
- ÖNEMLİ: Her oda tipi için TÜM görselleri al (oda başına 5-10 görsel olabilir). Galeri, slider veya fotoğraf koleksiyonundaki tüm resimleri dahil et!
- Oda görsellerini oda tipine göre grupla (sadece o odaya ait fotoğrafları al)
- Oda olanaklarını (amenities) sadece yukarıdaki listeden seç
- Oda boyutunu (m²), yatak tipini ve kapasiteyi çıkar
- Oda tipleri genellikle "Odalar", "Rooms", "Accommodation", "Oda Tipleri" gibi sayfalarda bulunur

Sadece JSON döndür:`

  try {
    // Use Gemini's URL fetching capability as fallback with retry
    const MAX_DIRECT_RETRIES = 2

    if (progress) {
      progress.updateStep('crawl', { usingGeminiDirect: true })
    }

    for (let attempt = 0; attempt <= MAX_DIRECT_RETRIES; attempt++) {
      try {
        if (progress && attempt > 0) {
          progress.updateStep('crawl', { retry: attempt })
        }

        const response = await client.models.generateContentStream({
          model: GEMINI_MODEL,
          config: {
            temperature: 0.1,
            maxOutputTokens: 65536  // Maximum for comprehensive extraction
          },
          contents: [{
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: url,
                  mimeType: 'text/html'
                }
              },
              { text: prompt }
            ]
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
          // Update progress every 50 chunks
          if (progress && chunkCount % 50 === 0) {
            progress.updateStep('crawl', { chunks: chunkCount, chars: fullText.length })
          }
        }

        logger.info(`Gemini direct response - chunks: ${chunkCount}, length: ${fullText.length} chars`)

        if (progress) {
          progress.completeStep('crawl', { chunks: chunkCount, chars: fullText.length })
          progress.startStep('preprocess')
          progress.completeStep('preprocess', { method: 'gemini_direct' })
          progress.startStep('extract')
        }

        if (!fullText) {
          throw new Error('No response received from AI')
        }

        // Clean up response
        let cleanedResponse = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0]
        }

        // Check for truncation
        if (isJsonTruncated(cleanedResponse)) {
          if (attempt < MAX_DIRECT_RETRIES) {
            logger.warn(`Gemini direct response truncated (attempt ${attempt + 1}), retrying...`)
            if (progress) {
              progress.updateStep('extract', { truncated: true, retry: attempt + 1 })
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
            continue
          }
          // Last attempt - try to repair
          logger.warn('Max retries reached for Gemini direct, attempting to repair JSON')
          cleanedResponse = repairTruncatedJson(cleanedResponse)
        }

        const parsed = JSON.parse(cleanedResponse)
        logger.info('Hotel data extraction from URL completed (Gemini direct) - rooms: ' + (parsed.roomTemplates?.length || 0))

        if (progress) {
          progress.completeStep('extract', {
            roomTemplates: parsed.roomTemplates?.length || 0,
            images: parsed.images?.length || 0
          })
          progress.startStep('validate')
          progress.completeStep('validate', {
            valid: true,
            roomCodes: parsed.roomTemplates?.map(r => r.code) || []
          })
          progress.complete({
            success: true,
            hotelName: parsed.name,
            roomCount: parsed.roomTemplates?.length || 0,
            imageCount: parsed.images?.length || 0
          })
        }

        return {
          success: true,
          data: parsed,
          sourceUrl: url
        }
      } catch (parseError) {
        if (attempt < MAX_DIRECT_RETRIES && parseError.message?.includes('JSON')) {
          logger.warn(`JSON parse error on attempt ${attempt + 1}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw parseError
      }
    }

    // Should not reach here, but fallback
    if (progress) {
      progress.fail('AI yanıtı parse edilemedi (tüm denemeler başarısız)')
    }
    return {
      success: false,
      error: 'AI yanıtı parse edilemedi (tüm denemeler başarısız)'
    }
  } catch (error) {
    logger.error('Hotel data extraction from URL error: ' + error.message)
    if (progress) {
      progress.fail(error.message)
    }
    throw error
  }
}

export default {
  translateText,
  translateFields,
  batchTranslate,
  parsePricingCommand,
  extractHotelData,
  extractHotelDataFromUrl,
  languageNames
}
