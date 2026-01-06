import logger from '../../core/logger.js'
import { getAI, GEMINI_MODEL } from './client.js'
import { isJsonTruncated, repairTruncatedJson } from './helpers.js'

/**
 * Parse hotel pricing contract (PDF/Word/Image) using Gemini AI
 * Extracts room types, meal plans, periods, and pricing from contract documents
 * @param {Buffer|string} fileContent - File content as base64 or buffer
 * @param {string} mimeType - File MIME type (application/pdf, image/*, etc.)
 * @param {object} context - Hotel context (existing room types, meal plans, currency)
 * @returns {object} Parsed contract data with periods, rooms, meal plans, and prices
 */
export const parseHotelContract = async (fileContent, mimeType, context = {}) => {
  const client = await getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure it in Platform Settings.')
  }

  // Convert Buffer to base64 if needed
  const base64Content = Buffer.isBuffer(fileContent) ? fileContent.toString('base64') : fileContent

  // Build context string
  const existingRoomsStr =
    context.roomTypes?.map(rt => `${rt.code}: ${rt.name}`).join(', ') || 'Yok'
  const existingMealPlansStr =
    context.mealPlans?.map(mp => `${mp.code}: ${mp.name}`).join(', ') || 'Yok'
  const currency = context.currency || 'EUR'

  const prompt = `Sen Türkiye'de bir seyahat acentesinde calisan deneyimli bir KONTRAT ANALISTISIN. Yillardir otel kontratlarini okuyup sisteme giriyorsun. Türk turizm sektörünün tüm jargonlarini, kisaltmalarini ve yazili olmayan kurallarini biliyorsun.

Görevin: Bu kontrat dökümanini analiz edip TÜM fiyatlari ve kosullari JSON formatina dönüstürmek.

===============================================================
MEVCUT SISTEM VERILERI
===============================================================
Oda Tipleri: ${existingRoomsStr}
Pansiyon Tipleri: ${existingMealPlansStr}
Para Birimi: ${currency}

===============================================================
!!! EN KRITIK KURAL - TÜM PERIYOTLAR !!!
===============================================================
Kontratta fiyat tablosu genellikle su yapidadir:

TABLO YAPISI:
+-----------------+----------+----------+----------+----------+
| ODA TIPI        | Periyot1 | Periyot2 | Periyot3 | Periyot4 |
+-----------------+----------+----------+----------+----------+
| Standard Room   |   100    |   120    |   150    |   180    |
| Superior Room   |   130    |   150    |   180    |   210    |
| Deluxe Room     |   160    |   180    |   220    |   260    |
| Family Room     |   200    |   230    |   280    |   320    |
+-----------------+----------+----------+----------+----------+

YAPMAN GEREKEN:
1. Tablodaki HER SÜTUNU (her periyot) oku
2. Tablodaki HER SATIRI (her oda) oku
3. Her oda x periyot kombinasyonu icin ayri pricing kaydi olustur

ÖRNEK: 4 oda ve 4 periyot varsa -> 16 pricing kaydi olmali
- Standard + P1, Standard + P2, Standard + P3, Standard + P4
- Superior + P1, Superior + P2, Superior + P3, Superior + P4
- vs...

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!! KRITIK - EKSIKSIZ FIYAT CIKARIMI !!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

HICBIR FIYAT ATLAMA! HER ODA ICIN HER PERIYODUN FIYATI OLMALI!

- Tabloda fiyat görüyorsan MUTLAKA pricing dizisine ekle
- Bir oda icin bazi periyotlarda fiyat eksik olamaz
- Kontrol: pricing.length = oda sayisi x periyot sayisi x pansiyon sayisi
- Eksik fiyat varsa kontrat gecersiz sayilir!

SADECE ILK PERIYOT DEGIL, TÜM PERIYOTLARIN FIYATLARINI CEK!
SADECE ILK ODA DEGIL, TÜM ODALARIN FIYATLARINI CEK!

===============================================================
PERIYOT TARIHLERI
===============================================================
Periyotlarin tarihleri genelde tablonun üstünde veya ayri bir yerde yazar:
- "Dönem 1: 01.04.2025 - 31.05.2025"
- "Dönem 2: 01.06.2025 - 30.06.2025"
vs.

Her periyot icin code, name, startDate, endDate cikar.

===============================================================
CIKTI JSON FORMATI
===============================================================
{
  "success": true,
  "contractInfo": {
    "hotelName": "Otel adi",
    "validFrom": "2025-04-01",
    "validTo": "2025-10-31",
    "currency": "${currency}",
    "pricingType": "unit | per_person",
    "notes": "Önemli notlar"
  },
  "childTypes": [
    { "id": 1, "name": "Bebek", "minAge": 0, "maxAge": 2 },
    { "id": 2, "name": "1. Cocuk", "minAge": 3, "maxAge": 6 },
    { "id": 3, "name": "2. Cocuk", "minAge": 7, "maxAge": 12 }
  ],
  "periods": [
    { "code": "P1", "name": "1. Dönem", "startDate": "2025-04-01", "endDate": "2025-05-31" },
    { "code": "P2", "name": "2. Dönem", "startDate": "2025-06-01", "endDate": "2025-06-30" },
    { "code": "P3", "name": "3. Dönem", "startDate": "2025-07-01", "endDate": "2025-08-31" },
    { "code": "P4", "name": "4. Dönem", "startDate": "2025-09-01", "endDate": "2025-10-31" }
  ],
  "roomTypes": [
    {
      "contractName": "Kontrattaki oda adi",
      "contractCode": "STD",
      "matchedCode": "STD veya null",
      "isNewRoom": true/false,
      "suggestedCode": "3 harfli kod önerisi",
      "confidence": 95,
      "capacity": {
        "standardOccupancy": 2,
        "maxAdults": 2,
        "maxChildren": 2,
        "maxInfants": 1,
        "maxOccupancy": 4
      }
    }
  ],
  "mealPlans": [
    {
      "contractName": "Pansiyon adi",
      "contractCode": "AI",
      "matchedCode": "AI veya null",
      "isNewMealPlan": true/false,
      "suggestedCode": "Kod önerisi",
      "confidence": 90
    }
  ],
  "pricing": [
    // Ünite Bazli (unit) örnekler - pricingType: "unit" veya belirtilmemis
    { "periodCode": "P1", "roomCode": "STD", "mealPlanCode": "AI", "pricePerNight": 100, "extraAdult": 30, "extraChild": [20, 15], "extraInfant": 0 },
    { "periodCode": "P2", "roomCode": "STD", "mealPlanCode": "AI", "pricePerNight": 120, "extraAdult": 35, "extraChild": [25, 18], "extraInfant": 0 },
    { "periodCode": "P1", "roomCode": "VIP", "mealPlanCode": "AI", "pricePerNight": 93000, "extraAdult": 20000, "extraChild": [15000, 12000], "extraInfant": 0 },

    // Kisi Bazli (OBP) örnek - pricingType: "per_person"
    { "periodCode": "P1", "roomCode": "DLX", "mealPlanCode": "AI", "pricingType": "per_person", "occupancyPricing": { "1": 80, "2": 100, "3": 130 }, "extraChild": [30, 25] }
  ],
  "earlyBookingDiscounts": [
    {
      "name": "EB %20",
      "discountPercentage": 20,
      "salePeriod": { "startDate": "2024-11-01", "endDate": "2024-12-31" },
      "stayPeriod": { "startDate": "2025-04-01", "endDate": "2025-10-31" },
      "paymentDueDate": "2025-01-15",
      "isCumulative": false
    }
  ],
  "warnings": [],
  "confidence": { "overall": 85, "periods": 90, "rooms": 85, "pricing": 80 }
}

===============================================================
!!! KONTROL LISTESI - CIKMADAN ÖNCE MUTLAKA DOGRULA !!!
===============================================================

*** FIYAT KONTROLÜ - EN ÖNEMLI ***
- Kac periyot var? -> periods dizisinde hepsi var mi?
- Kac oda tipi var? -> roomTypes dizisinde hepsi var mi?
- pricing dizisi = periyot sayisi x oda sayisi x pansiyon sayisi mi?
- HER ODA ICIN HER PERIYODUN FIYATI VAR MI? -> EKSIK OLAMAZ!
- Tabloda gördügün her fiyati pricing dizisine ekledin mi?
- Her periyotta minStay degeri var mi?

!!! EKSIK FIYAT = GECERSIZ KONTRAT !!!
Eger tabloda 13 oda ve 10 periyot varsa -> 130 fiyat kaydi olmali!
Eksik varsa tekrar kontrol et ve ekle!

- EB indirimi var mi? -> earlyBookingDiscounts dizisine ekle!
  - salePeriod.startDate ve endDate (satis dönemi)
  - stayPeriod.startDate ve endDate (konaklama dönemi)

- Her oda icin KAPASITE bilgisi dogru mu?
  - STANDART DOLULUK: Fiyatin kac kisi icin oldugu -> standardOccupancy
    Örnek: "Ünite Fiyati (8 Kisi)" -> standardOccupancy = 8
  - MAKSIMUM YETISKIN: Ekstra kisi varsa kac kisi sigar -> maxAdults
    Örnek: "9. Kisi: 20.000 TL" varsa -> maxAdults = 9
  - MAKSIMUM KAPASITE: Toplam kapasite -> maxOccupancy
  - roomTypes[].capacity objesine ekle

- Ekstra kisi fiyatlari var mi?
  - "X. Kisi: Y TL" -> extraAdult = Y, maxAdults = X, maxOccupancy = X
  - Cocuk fiyatlarini extraChild dizisine ekle [1.cocuk, 2.cocuk]
  - pricing[] kaydina extraAdult, extraChild, extraInfant ekle

ÖRNEK HESAPLAMA:
- 5 periyot x 8 oda x 1 pansiyon = 40 pricing kaydi olmali
- 4 periyot x 6 oda x 2 pansiyon = 48 pricing kaydi olmali
- 10 periyot x 13 oda x 1 pansiyon = 130 pricing kaydi olmali

===============================================================
ESLESTIRME KURALLARI
===============================================================

PANSIYON:
- "All Inclusive", "Her Sey Dahil", "AI" -> AI
- "Ultra All Inclusive", "UAI" -> UAI
- "Full Board", "Tam Pansiyon", "FB" -> FB
- "Half Board", "Yarim Pansiyon", "HB" -> HB
- "Bed & Breakfast", "Oda Kahvalti", "BB" -> BB
- "Room Only", "Sadece Oda", "RO" -> RO

ODA TIPLERI ESLESTIRME (COK ÖNEMLI):
Mevcut oda tiplerini (${existingRoomsStr}) kontrat oda isimleriyle esletir.

ESLESTIRME MANTIGI:
1. KOD BAZLI: Kontrat kodu = Mevcut kod -> DOGRUDAN ESLESTIR
   - "STD" -> STD, "DLX" -> DLX, "SNG" -> SNG

2. ISIM BAZLI ESLESTIRME (fuzzy):
   - "Standard Room", "Standart Oda", "Standard" -> STD (varsa)
   - "Deluxe Room", "Delüks Oda" -> DLX (varsa)
   - "Single Room", "Tek Kisilik" -> SNG (varsa)
   - "Double Room", "Cift Kisilik" -> DBL (varsa)
   - "Twin Room" -> TWN (varsa)
   - "Superior Room" -> SUP (varsa)
   - "Suite", "Suit" -> SUI veya STE (varsa)
   - "Family Room", "Aile Odasi" -> FAM veya FML (varsa)
   - "Triple Room", "Üc Kisilik" -> TRP (varsa)
   - "Junior Suite" -> JSU (varsa)
   - "Economy", "Ekonomi" -> ECO (varsa)

3. ANAHTAR KELIME ARAMASI:
   - Isimde "Standard" varsa STD kodlu odayi ara
   - Isimde "Deluxe" varsa DLX kodlu odayi ara
   - Isimde "Suite" varsa SUI veya STE kodlu odayi ara
   - Isimde "Family" varsa FAM kodlu odayi ara

4. MEVCUT ISIM KARSILASTIRMASI:
   - Mevcut oda isimlerinin icinde kontrat ismini ara
   - Örnek: Mevcut "Standard Oda" -> Kontrat "Standard Room" = ESLES

5. HIC ESLESME YOKSA:
   - isNewRoom: true
   - suggestedCode: 3 harfli kod öner (örn: "Deluxe Sea View" -> "DSV")
   - matchedCode: null

!!! ÖNEMLI !!!
- matchedCode SADECE mevcut oda kodlarindan biri olabilir: ${existingRoomsStr}
- Eger mevcut listede eslesen yoksa matchedCode = null, isNewRoom = true
- Eslesme bulunursa matchedCode = o oda kodu, isNewRoom = false

COCUK YASLARI:
- "0-2.99" -> minAge:0, maxAge:2
- "3-6.99" -> minAge:3, maxAge:6
- "7-12.99" -> minAge:7, maxAge:12

===============================================================
MINIMUM KONAKLAMA SARTLARI
===============================================================

Kontratda minimum gece sartlari farkli sekillerde belirtilebilir:

ÖRNEK 1 - TARIH ARALIGI BAZLI:
"01.04 - 08.04.2025 ve 07.10 - 31.10.2025 konaklamalarda minimum 3 gece konaklama sarti bulunmaktadir. Diger tarih araliklari icin minimum 4 gece konaklama sarti bulunmaktadir."

BU METNIN YORUMU:
- P1 periyodu (01.04-08.04) -> minStay: 3
- Son periyot (07.10-31.10) -> minStay: 3
- Diger periyotlar -> minStay: 4

ÖRNEK 2 - GENEL:
"Tüm sezon icin minimum 5 gece konaklama zorunludur"
-> Tüm periyotlar icin minStay: 5

ÖRNEK 3 - PERIYOT BAZLI:
Tabloda her periyot icin ayri minStay sütunu varsa, o degerleri kullan.

HER PERIYOT ICIN minStay BELIRLE!
periods dizisinde her periyoda mutlaka minStay ekle.

===============================================================
FIYATLANDIRMA TIPI
===============================================================
- "Ünite Bazli" / "Unit Based" / "Per Room" -> pricingType: "unit"
- "Kisi Bazli" / "Per Person" / "OBP" -> pricingType: "per_person"

===============================================================
!!! KISI BAZLI FIYATLANDIRMA (OBP) - COK ÖNEMLI !!!
===============================================================

Kisi bazli (OBP - Occupancy Based Pricing) kontratlarda her yetiskin sayisi icin ayri fiyat belirlenir.

ÖRNEK OBP KONTRAT:
"Standard Oda
1 Kisi: 80 EUR
2 Kisi: 100 EUR
3 Kisi: 130 EUR"

BU METNIN YORUMU:
- pricingType: "per_person"
- occupancyPricing: { "1": 80, "2": 100, "3": 130 }
- pricePerNight: KULLANILMAZ (0 veya null)
- extraAdult: KULLANILMAZ (0)
- singleSupplement: KULLANILMAZ (0)

OBP'DE COCUK FIYATLARI:
- Cocuklar yetiskin sayisina DAHIL DEGIL
- Cocuk fiyatlari ayrica belirtilir (extraChild array)
- Örnek: "1. Cocuk: 30 EUR, 2. Cocuk: 25 EUR" -> extraChild: [30, 25]

ÜNITE BAZLI vs KISI BAZLI AYIRT ETME:
1. "X Kisi: Y TL" formatinda fiyatlar varsa -> per_person
2. "1 Kisi", "2 Kisi", "3 Kisi" seklinde ayri fiyatlar -> per_person
3. "Ünite Fiyati", "Oda Fiyati", tek bir fiyat -> unit
4. "Ekstra Yatak/Kisi" varsa -> unit

pricing dizisinde OBP icin:
{
  "periodCode": "P1",
  "roomCode": "STD",
  "mealPlanCode": "AI",
  "pricingType": "per_person",
  "occupancyPricing": {
    "1": 80,
    "2": 100,
    "3": 130
  },
  "extraChild": [30, 25]
}

===============================================================
!!! ODA KAPASITESI VE EKSTRA KISI - COK ÖNEMLI !!!
===============================================================

Türk turizm kontratlarinda kapasite ve ekstra kisi fiyatlandirmasi su sekillerde ifade edilir:

ÖRNEK 1 - VILLA/BÜYÜK ODALAR:
"VIP Villa
Ünite Fiyati (8 Kisi): 93.000 TL
9. Kisi: 20.000 TL"

BU METNIN YORUMU:
- standardOccupancy: 8 (Standart doluluk - fiyata DAHIL kisi sayisi)
- maxAdults: 9 (9. kisi fiyati VAR = odaya 9 yetiskin SIGABILIYOR!)
- maxOccupancy: 9 (maksimum toplam kapasite)
- pricePerNight: 93000 (8 kisi dahil ünite fiyati)
- extraAdult: 20000 (9. kisi icin ekstra ücret)

!!! COK ÖNEMLI MANTIK !!!
- "X Kisi" fiyati = standart doluluk = standardOccupancy = X
- "X+1. Kisi" fiyati VARSA = odaya X+1 kisi sigar = maxAdults = X+1, maxOccupancy = X+1
- "X+1. Kisi" fiyati YOKSA = maxAdults = X, maxOccupancy = X

ÖRNEK 2 - STANDART ODALAR:
"Standard Oda (2+1)
2 Yetiskin: 5.000 TL
3. Kisi (Ekstra Yatak): 1.500 TL"

BU METNIN YORUMU:
- standardOccupancy: 2 (fiyata dahil kisi sayisi)
- maxAdults: 3 (3. kisi kabul ediliyor = 3 yetiskin sigar)
- maxOccupancy: 3
- pricePerNight: 5000
- extraAdult: 1500

ÖRNEK 3 - PARANTEZ ICI KAPASITE:
"Aile Odasi (2+2)" -> standardOccupancy: 2, maxAdults: 2, maxChildren: 2, maxOccupancy: 4
"Suite (4 Kisi)" ve "5. Kisi: X TL" varsa -> standardOccupancy: 4, maxAdults: 5, maxOccupancy: 5
"Villa (6+2)" -> standardOccupancy: 6, maxAdults: 6, maxChildren: 2, maxOccupancy: 8

KAPASITE HESAPLAMA KURALLARI:
1. "Ünite Fiyati (X Kisi)" -> standardOccupancy = X (fiyata dahil kisi sayisi)
2. "X+1. Kisi: Y TL" veya "Ekstra Kisi: Y TL" varsa -> maxAdults = X+1, maxOccupancy = X+1
3. Ekstra kisi fiyati YOKSA -> maxAdults = standardOccupancy
4. "X+Y" formati -> maxAdults = X, maxChildren = Y, maxOccupancy = X+Y

COCUK FIYATLARI:
- "0-2 yas FREE/Ücretsiz" -> maxInfants: 1 veya 2
- "1. Cocuk: X TL" -> Ilk cocuk fiyati
- "2. Cocuk: Y TL" -> Ikinci cocuk fiyati

pricing dizisine sunlari ekle:
{
  "periodCode": "P1",
  "roomCode": "VIP",
  "mealPlanCode": "AI",
  "pricePerNight": 93000,
  "extraAdult": 20000,
  "extraChild": [15000, 12000],  // 1. ve 2. cocuk fiyatlari
  "extraInfant": 0
}

roomTypes dizisinde kapasite:
{
  "contractName": "VIP Villa",
  "contractCode": "VIP",
  "capacity": {
    "standardOccupancy": 8,
    "maxAdults": 9,
    "maxChildren": 2,
    "maxInfants": 2,
    "maxOccupancy": 9
  }
}

NOT: minAdults KULLANMA! standardOccupancy kullan.

===============================================================
!!! ERKEN REZERVASYON (EB) INDIRIMLERI - COK ÖNEMLI !!!
===============================================================

EB metinlerini DIKKATLIECE yorumla. Türkiye turizm sektöründe EB su sekilde ifade edilir:

ÖRNEK METIN:
"31.12.2024 tarihine kadar gönderilen tüm rezervasyonlar icin %20 erken rezervasyon indirimi uygulanacaktir."

BU METNIN YORUMU:
- SATIS DÖNEMI (salePeriod): Bugünden 31.12.2024'e kadar
  - startDate: Kontratin gecerlilik baslangici veya bugün (hangisi önceyse)
  - endDate: 31.12.2024
- KONAKLAMA DÖNEMI (stayPeriod): Tüm sezon
  - startDate: Sezonun baslangic tarihi (ilk periyodun baslangici)
  - endDate: Sezonun bitis tarihi (son periyodun bitisi)
- discountPercentage: 20

GENEL KURALLAR:
1. "X tarihine kadar gönderilen/yapilan rezervasyonlar" -> Satis bitis tarihi X
2. Satis baslangic tarihi belirtilmemisse -> Kontrat baslangici veya bugün
3. Konaklama dönemi belirtilmemisse -> Tüm sezon (validFrom - validTo)
4. "Tüm sezon icin gecerlidir" -> stayPeriod = sezon tarihleri
5. Birden fazla EB varsa hepsini ayri ayri cikar (%15, %20, %25 gibi)

DIGER EB TERIMLERI:
- "Erken Rezervasyon", "Early Bird", "EB", "E.B"
- "Ön Rezervasyon Indirimi"
- "Advance Booking Discount"

EB JSON FORMATI:
{
  "earlyBookingDiscounts": [
    {
      "name": "EB %20",
      "discountPercentage": 20,
      "salePeriod": {
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
      },
      "stayPeriod": {
        "startDate": "2025-04-01",
        "endDate": "2025-10-31"
      },
      "paymentDueDate": "2025-01-15",
      "isCumulative": false,
      "notes": "Ödeme 15.01.2025'e kadar yapilmali"
    }
  ]
}

===============================================================
SADECE GECERLI JSON DÖNDÜR - ACIKLAMA YAZMA!
===============================================================`

  try {
    logger.info(
      `Parsing hotel contract - mimeType: ${mimeType}, contentSize: ${base64Content.length} chars`
    )

    const response = await client.models.generateContentStream({
      model: GEMINI_MODEL,
      config: {
        temperature: 0.1,
        maxOutputTokens: 65536
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Content
              }
            },
            { text: prompt }
          ]
        }
      ]
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

    logger.info(
      `Contract parsing response - chunks: ${chunkCount}, length: ${fullText.length} chars`
    )

    if (!fullText) {
      throw new Error('No response received from AI')
    }

    // Clean up response
    let cleanedResponse = fullText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check for truncation and repair if needed
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn('Contract parsing response appears truncated, attempting repair')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    const parsed = JSON.parse(cleanedResponse)

    // Calculate expected vs actual prices
    const periodCount = parsed.periods?.length || 0
    const roomCount = parsed.roomTypes?.length || 0
    const mealPlanCount = parsed.mealPlans?.length || 0
    const actualPrices = parsed.pricing?.length || 0
    const expectedPrices = periodCount * roomCount * mealPlanCount

    logger.info('Contract parsing completed:')
    logger.info(`  - Periods: ${periodCount}`)
    logger.info(`  - Room types: ${roomCount}`)
    logger.info(`  - Meal plans: ${mealPlanCount}`)
    logger.info(`  - Prices: ${actualPrices} (expected: ${expectedPrices})`)

    if (actualPrices < expectedPrices) {
      const missing = expectedPrices - actualPrices
      logger.warn(
        `  - MISSING ${missing} price entries (${Math.round((missing / expectedPrices) * 100)}% incomplete)`
      )
      if (!parsed.warnings) parsed.warnings = []
      parsed.warnings.push(
        `${missing} fiyat kaydi eksik olabilir (beklenen: ${expectedPrices}, bulunan: ${actualPrices})`
      )
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error) {
    logger.error('Contract parsing error: ' + error.message)
    return {
      success: false,
      error: error.message
    }
  }
}
