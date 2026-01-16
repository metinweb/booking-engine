import logger from '../../core/logger.js'
import { generateContent } from './client.js'
import { isJsonTruncated, repairTruncatedJson } from './helpers.js'

/**
 * Extract tour data from text using Gemini AI
 * Returns structured JSON matching the tour schema with confidence scores
 */
export const extractTourData = async (content, retryCount = 0) => {
  const MAX_RETRIES = 2

  if (!content || content.trim() === '') {
    throw new Error('Content is required')
  }

  const prompt = `Sen bir tur paketi veri çıkarma uzmanısın. Aşağıdaki metinden tur bilgilerini çıkar ve JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. SADECE geçerli JSON döndür, başka bir şey ekleme
2. Bulamadığın alanları boş string "" veya null olarak bırak
3. Her alan için confidence (güven) skoru ekle (0-100 arası)
4. Çoklu dil alanlarında Türkçe (tr) ve İngilizce (en) için değer ver
5. Enum değerleri için sadece belirtilen seçenekleri kullan

TUR VERİ ŞEMASI:

{
  "code": "TUR001 (tur kodu, maksimum 20 karakter, büyük harf)",
  "name": {
    "tr": "Türkçe tur adı",
    "en": "English tour name"
  },
  "shortDescription": {
    "tr": "Kısa açıklama (1-2 cümle)",
    "en": "Short description"
  },
  "description": {
    "tr": "Detaylı açıklama",
    "en": "Detailed description"
  },
  "tourType": "package|day_trip|multi_day|cruise|cultural|adventure|religious|nature|city_break",
  "destination": {
    "country": "Ülke adı",
    "city": "Şehir adı",
    "region": "Bölge"
  },
  "departurePoints": [
    {
      "city": "İstanbul",
      "name": { "tr": "İstanbul Havalimanı", "en": "Istanbul Airport" },
      "isDefault": true
    }
  ],
  "duration": {
    "nights": 7,
    "days": 8
  },
  "transportation": [
    {
      "type": "flight|bus|ferry|car|train|combined",
      "carrier": "THY, Pegasus vb.",
      "class": "economy|business|first|standard|comfort",
      "details": { "tr": "Ulaşım detayları", "en": "Transportation details" },
      "isIncluded": true
    }
  ],
  "accommodations": [
    {
      "hotelName": "Otel adı",
      "hotelAddress": "Otel adresi",
      "nights": 3,
      "mealPlanCode": "AI|FB|HB|BB|RO",
      "mealPlanName": { "tr": "Her Şey Dahil", "en": "All Inclusive" },
      "roomType": "Standart Oda",
      "starRating": 5,
      "isMainHotel": true,
      "order": 0
    }
  ],
  "inclusions": [
    { "tr": "Uçak bileti", "en": "Flight ticket" },
    { "tr": "Otel konaklaması", "en": "Hotel accommodation" },
    { "tr": "Transfer hizmetleri", "en": "Transfer services" },
    { "tr": "Rehberlik hizmetleri", "en": "Guide services" }
  ],
  "exclusions": [
    { "tr": "Kişisel harcamalar", "en": "Personal expenses" },
    { "tr": "Ekstra turlar", "en": "Optional tours" }
  ],
  "itinerary": [
    {
      "day": 1,
      "title": { "tr": "Varış Günü", "en": "Arrival Day" },
      "description": { "tr": "Detaylı program", "en": "Detailed program" },
      "meals": ["breakfast", "dinner"],
      "activities": [
        { "tr": "Havalimanı karşılama", "en": "Airport transfer" }
      ],
      "accommodation": "5* Otel",
      "highlights": [
        { "tr": "Önemli nokta", "en": "Highlight" }
      ]
    }
  ],
  "highlights": [
    { "tr": "Turun öne çıkan özellikleri", "en": "Tour highlights" }
  ],
  "cancellationPolicy": {
    "freeCancellation": {
      "enabled": true,
      "daysBeforeDeparture": 14
    },
    "rules": [
      { "daysBeforeDeparture": 14, "refundPercent": 100 },
      { "daysBeforeDeparture": 7, "refundPercent": 50 },
      { "daysBeforeDeparture": 3, "refundPercent": 0 }
    ],
    "nonRefundable": false,
    "notes": { "tr": "İptal koşulları", "en": "Cancellation terms" }
  },
  "participants": {
    "min": 10,
    "max": 40
  },
  "ageRequirements": {
    "minAge": 0,
    "childMinAge": 2,
    "childMaxAge": 12,
    "infantMaxAge": 2
  },
  "difficulty": "easy|moderate|challenging|difficult",
  "importantNotes": [
    { "tr": "Önemli not", "en": "Important note" }
  ],
  "termsAndConditions": {
    "tr": "Genel şartlar ve koşullar",
    "en": "Terms and conditions"
  },
  "confidence": {
    "name": 95,
    "description": 80,
    "destination": 90,
    "duration": 100,
    "transportation": 85,
    "accommodations": 80,
    "itinerary": 75,
    "inclusions": 85,
    "exclusions": 80
  }
}

GÜNLÜK PROGRAM TALİMATLARI:
- Her gün için ayrı bir itinerary objesi oluştur
- Gün numarasını (day) doğru sırayla ver
- Yemekleri (meals): breakfast, lunch, dinner, snack olarak belirt
- Aktiviteleri ve öne çıkan noktaları detaylı yaz
- Konaklama bilgisini her gün için ekle

KONAKLAMA TALİMATLARI:
- Birden fazla otel varsa her birini ayrı ekle
- Ana oteli isMainHotel: true olarak işaretle
- Gece sayısını ve pansiyon tipini belirt
- Yıldız sayısını belirt

ULAŞIM TALİMATLARI:
- Ana ulaşım tipini belirt (uçak, otobüs, gemi vb.)
- Birden fazla ulaşım aracı varsa hepsini ekle
- Taşıyıcı firmaları belirt (THY, Pegasus vb.)

İÇERİK:
"""
${content}
"""

Sadece JSON döndür:`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 32768
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    logger.info(`Tour extraction - Gemini response length: ${responseText.length} chars`)

    // Clean up response
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Extract JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check for truncation
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn(`Tour extraction response truncated, retry ${retryCount + 1}/${MAX_RETRIES}`)

      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractTourData(content, retryCount + 1)
      }

      logger.warn('Max retries reached, attempting to repair truncated JSON')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info(
        'Tour data extraction completed - itinerary days: ' +
          (parsed.itinerary?.length || 0) +
          ', accommodations: ' +
          (parsed.accommodations?.length || 0)
      )
      return {
        success: true,
        data: parsed
      }
    } catch (parseError) {
      logger.error('Failed to parse tour AI response: ' + cleanedResponse.substring(0, 500))

      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying due to parse error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractTourData(content, retryCount + 1)
      }

      return {
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 1000)
      }
    }
  } catch (error) {
    logger.error('Tour data extraction error: ' + error.message)

    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('timeout') || error.message.includes('network'))
    ) {
      logger.info(`Retrying due to error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
      return extractTourData(content, retryCount + 1)
    }

    throw error
  }
}
