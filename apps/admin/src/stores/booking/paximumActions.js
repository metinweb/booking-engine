/**
 * Booking Store - Paximum Actions
 * External OTA (Paximum) integration
 */

import paximumService from '@/services/paximumService'
import { storeLogger } from '@/utils/logger'

/**
 * Create Paximum actions with store state refs
 */
export function createPaximumActions(state, helpers) {
  const {
    activeProvider,
    search,
    cart,
    guests,
    invoiceDetails,
    paximumEnabled,
    paximumDefaultMarkup,
    paximumSearch,
    paximumResults,
    paximumTransaction,
    bookingResult,
    loading,
    error
  } = state
  const { initializeRoomGuests } = helpers

  /**
   * Set active provider
   */
  function setProvider(provider) {
    activeProvider.value = provider
  }

  /**
   * Check Paximum status
   */
  async function checkPaximumStatus() {
    try {
      const status = await paximumService.getStatus()
      paximumEnabled.value = status.enabled
      paximumDefaultMarkup.value = status.defaultMarkup || 10
      return status
    } catch (err) {
      storeLogger.error('Paximum status check failed:', err)
      paximumEnabled.value = false
      return null
    }
  }

  /**
   * Paximum location autocomplete
   */
  async function paximumAutocomplete(query) {
    if (!query || query.length < 2) return []

    try {
      return await paximumService.autocomplete(query)
    } catch (err) {
      storeLogger.error('Paximum autocomplete error:', err)
      return []
    }
  }

  /**
   * Search Paximum hotels
   */
  async function searchPaximumHotels() {
    if (!paximumSearch.value.location) {
      error.value = 'Lütfen lokasyon seçin'
      return false
    }

    if (!paximumSearch.value.checkIn) {
      error.value = 'Lütfen giriş tarihi seçin'
      return false
    }

    loading.value.paximum = true
    error.value = null
    paximumResults.value.searchPerformed = false
    paximumResults.value.noResults = false

    try {
      // Build room criteria
      const roomCriteria = paximumSearch.value.rooms.map(room => ({
        adult: room.adults,
        childAges: room.childAges || []
      }))

      const results = await paximumService.searchHotels({
        arrivalLocations: [
          {
            id: paximumSearch.value.location.id,
            type: paximumSearch.value.location.type || 2
          }
        ],
        checkIn: paximumSearch.value.checkIn,
        nights: paximumSearch.value.nights,
        roomCriteria,
        nationality: paximumSearch.value.nationality,
        currency: paximumSearch.value.currency,
        culture: paximumSearch.value.culture,
        markupPercent: paximumDefaultMarkup.value
      })

      storeLogger.debug('[Paximum] Search results:', results)
      storeLogger.debug('[Paximum] Hotels count:', results?.hotels?.length || 0)
      storeLogger.debug('[Paximum] SearchId:', results?.searchId)

      paximumResults.value.hotels = results?.hotels || []
      paximumResults.value.searchId = results?.searchId || null
      paximumResults.value.searchPerformed = true
      paximumResults.value.noResults = paximumResults.value.hotels.length === 0

      storeLogger.debug('[Paximum] Store hotels updated:', paximumResults.value.hotels.length)
      return true
    } catch (err) {
      storeLogger.error('[Paximum] Search error:', err)
      error.value = err.response?.data?.error || err.message
      return false
    } finally {
      loading.value.paximum = false
    }
  }

  /**
   * Select Paximum hotel - offers are already in the hotel object from priceSearch
   */
  function selectPaximumHotel(hotel) {
    storeLogger.debug('[Paximum] selectPaximumHotel called', hotel.name)
    storeLogger.debug('[Paximum] Hotel offers count:', hotel.offers?.length || 0)

    paximumResults.value.selectedHotel = hotel
    // Use offers from the hotel object (priceSearch returns ALL offers with GetOnlyBestOffers: false)
    paximumResults.value.selectedHotelOffers = hotel.offers || []
    paximumResults.value.selectedOffer = null
    error.value = null

    return true
  }

  /**
   * Select Paximum offer (room)
   */
  function selectPaximumOffer(offer) {
    paximumResults.value.selectedOffer = offer
  }

  /**
   * Add Paximum offer to cart
   */
  function addPaximumToCart(offer) {
    const hotel = paximumResults.value.selectedHotel

    // Calculate checkout date from checkIn + nights
    const checkInDate = new Date(paximumSearch.value.checkIn)
    const checkOutDate = new Date(checkInDate)
    checkOutDate.setDate(checkOutDate.getDate() + paximumSearch.value.nights)
    const checkOut = checkOutDate.toISOString().split('T')[0]

    // Sync dates to search.dateRange for UI consistency
    search.value.dateRange.start = paximumSearch.value.checkIn
    search.value.dateRange.end = checkOut

    const cartItem = {
      source: 'paximum',
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomType: {
        name: offer.rooms?.[0]?.roomName || offer.roomName || 'Oda',
        code: offer.rooms?.[0]?.roomCode || ''
      },
      mealPlan: {
        name: offer.rooms?.[0]?.boardName || offer.boardName || '',
        code: offer.rooms?.[0]?.boardCode || ''
      },
      adults: paximumSearch.value.rooms.reduce((sum, r) => sum + r.adults, 0),
      children: paximumSearch.value.rooms.flatMap(r => r.childAges || []),
      pricing: {
        currency: offer.price?.currency || paximumSearch.value.currency,
        finalTotal: offer.price?.amount || 0,
        originalTotal: offer.price?.amount || 0,
        totalDiscount: 0
      },
      paximumData: {
        offerId: offer.offerId,
        hotelId: hotel.id,
        checkIn: paximumSearch.value.checkIn,
        checkOut: checkOut,
        nights: paximumSearch.value.nights,
        rooms: paximumSearch.value.rooms
      }
    }

    cart.value.push(cartItem)

    // Initialize guest array for this room
    initializeRoomGuests(cart.value.length - 1)
  }

  /**
   * Reset Paximum state
   */
  function resetPaximum() {
    paximumSearch.value = {
      location: null,
      checkIn: null,
      nights: 7,
      rooms: [{ adults: 2, childAges: [] }],
      nationality: 'TR',
      currency: 'TRY',
      culture: 'tr-TR'
    }
    paximumResults.value = {
      hotels: [],
      selectedHotel: null,
      selectedHotelOffers: [],
      selectedOffer: null
    }
    paximumTransaction.value = {
      transactionId: null,
      reservationNumber: null
    }
  }

  /**
   * Check if cart has Paximum items
   */
  function hasPaximumItems() {
    return cart.value.some(item => item.source === 'paximum')
  }

  /**
   * Create Paximum booking
   */
  async function createPaximumBooking() {
    const paximumItems = cart.value.filter(item => item.source === 'paximum')
    if (paximumItems.length === 0) {
      error.value = 'Sepette Paximum ürünü bulunamadı'
      return null
    }

    loading.value.booking = true
    error.value = null

    try {
      // Step 1: Begin transaction with offer IDs
      const offerIds = paximumItems.map(item => item.paximumData?.offerId).filter(Boolean)
      if (offerIds.length === 0) {
        throw new Error('Geçerli offer ID bulunamadı')
      }

      storeLogger.debug('[Paximum] Beginning transaction with offers:', offerIds)
      const transactionResult = await paximumService.beginTransaction(
        offerIds,
        paximumSearch.value.currency,
        paximumSearch.value.culture
      )

      const transactionId = transactionResult?.transactionId
      if (!transactionId) {
        throw new Error('Transaction başlatılamadı')
      }

      paximumTransaction.value.transactionId = transactionId
      storeLogger.debug('[Paximum] Transaction started:', transactionId)

      // Step 2: Build travellers array from guests
      const travellers = []
      const lead = guests.value.leadGuest

      // Add lead guest as first traveller
      travellers.push({
        travellerId: '1',
        type: 1, // Adult
        title: lead.title === 'mr' ? 1 : 2, // 1=Mr, 2=Mrs
        name: lead.firstName,
        surname: lead.lastName,
        isLeader: true,
        birthDate: lead.birthDate || null,
        nationality: lead.nationality || 'TR',
        identityNumber: lead.tcNumber || null,
        passportNumber: lead.passportNumber || null
      })

      // Add room guests
      let travellerIndex = 2
      guests.value.roomGuests.forEach((room, roomIndex) => {
        room.forEach((guest, guestIndex) => {
          // Skip first guest of first room (already added as lead)
          if (roomIndex === 0 && guestIndex === 0) return

          travellers.push({
            travellerId: String(travellerIndex++),
            type: guest.type === 'adult' ? 1 : guest.type === 'child' ? 2 : 3, // 1=Adult, 2=Child, 3=Infant
            title: guest.title === 'mr' ? 1 : 2,
            name: guest.firstName,
            surname: guest.lastName,
            isLeader: false,
            birthDate: guest.birthDate || null,
            nationality: guest.nationality || 'TR',
            identityNumber: guest.tcNumber || null,
            passportNumber: guest.passportNumber || null
          })
        })
      })

      // Customer info
      const customerInfo = {
        email: lead.email,
        mobilePhone: lead.phone?.replace(/\D/g, '') || '',
        address: invoiceDetails.value?.individual?.address?.street || '',
        city: invoiceDetails.value?.individual?.address?.city || '',
        country: lead.nationality || 'TR'
      }

      storeLogger.debug('[Paximum] Setting reservation info:', {
        travellers: travellers.length,
        customerInfo
      })
      await paximumService.setReservationInfo(
        transactionId,
        travellers,
        customerInfo,
        null // agencyReservationNumber
      )

      // Step 3: Commit transaction
      storeLogger.debug('[Paximum] Committing transaction...')
      const commitResult = await paximumService.commitTransaction(transactionId)

      const reservationNumber = commitResult?.reservation?.reservationNumber
      paximumTransaction.value.reservationNumber = reservationNumber

      storeLogger.debug('[Paximum] Booking completed:', reservationNumber)

      // Build booking result
      bookingResult.value = {
        source: 'paximum',
        bookingNumber: reservationNumber,
        paximumReservationNumber: reservationNumber,
        transactionId: transactionId,
        hotel: paximumItems[0]?.hotelName,
        checkIn: paximumSearch.value.checkIn,
        nights: paximumSearch.value.nights,
        totalAmount: paximumItems.reduce((sum, item) => sum + (item.pricing?.finalTotal || 0), 0),
        currency: paximumSearch.value.currency
      }

      return bookingResult.value
    } catch (err) {
      storeLogger.error('[Paximum] Booking error:', err)
      error.value = err.response?.data?.error || err.message || 'Paximum rezervasyon hatası'
      return null
    } finally {
      loading.value.booking = false
    }
  }

  return {
    setProvider,
    checkPaximumStatus,
    paximumAutocomplete,
    searchPaximumHotels,
    selectPaximumHotel,
    selectPaximumOffer,
    addPaximumToCart,
    resetPaximum,
    hasPaximumItems,
    createPaximumBooking
  }
}
