/**
 * Paximum Booking Module
 *
 * Handles booking transactions, reservations, and cancellations
 */

import axios from 'axios'
import { makeRequest, getEndpoint, getToken } from './auth.js'

// API paths
const BOOKING_SERVICE = '/api/bookingservice'
const PAYMENT_SERVICE = '/api/paymentservice'

/**
 * Begin a booking transaction
 */
export async function beginTransaction(offerIds, currency = 'TRY', culture = 'tr-TR') {
  const result = await makeRequest(`${BOOKING_SERVICE}/begintransaction`, {
    OfferIds: offerIds,
    Currency: currency,
    Culture: culture
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Islem baslatilamadi')
  }

  return result.body
}

/**
 * Add services to transaction
 */
export async function addServices(transactionId, offers, currency = 'TRY', culture = 'tr-TR') {
  const result = await makeRequest(`${BOOKING_SERVICE}/addservices`, {
    TransactionId: transactionId,
    Offers: offers,
    Currency: currency,
    Culture: culture
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Servis eklenemedi')
  }

  return result.body
}

/**
 * Set reservation info (travelers and customer)
 */
export async function setReservationInfo(
  transactionId,
  travellers,
  customerInfo,
  agencyReservationNumber
) {
  const result = await makeRequest(`${BOOKING_SERVICE}/setreservationinfo`, {
    TransactionId: transactionId,
    Travellers: travellers,
    CustomerInfo: customerInfo,
    AgencyReservationNumber: agencyReservationNumber
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon bilgileri kaydedilemedi')
  }

  return result.body
}

/**
 * Commit transaction (finalize booking)
 */
export async function commitTransaction(transactionId) {
  const endpoint = await getEndpoint()
  const token = await getToken()

  // First, begin payment transaction
  const paymentResult = await axios.post(
    `${endpoint}${PAYMENT_SERVICE}/beginpaymenttransaction`,
    {
      TransactionId: transactionId,
      PaymentOption: 2 // Credit to agency account
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  )

  // Then commit the transaction
  const commitResult = await makeRequest(`${BOOKING_SERVICE}/committransaction`, {
    TransactionId: transactionId,
    PaymentOption: 2
  })

  if (!commitResult.header?.success) {
    throw new Error(commitResult.header?.messages?.[0]?.message || 'Rezervasyon onaylanamadi')
  }

  return {
    payment: paymentResult.data?.body,
    reservation: commitResult.body
  }
}

/**
 * Get reservation details
 */
export async function getReservationDetail(reservationNumber) {
  const result = await makeRequest(`${BOOKING_SERVICE}/getreservationdetail`, {
    ReservationNumber: reservationNumber
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon bulunamadi')
  }

  return result.body
}

/**
 * Get reservation list
 */
export async function getReservationList(params) {
  const result = await makeRequest(`${BOOKING_SERVICE}/getreservationlist`, params)

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon listesi alinamadi')
  }

  return result.body
}

/**
 * Get cancellation penalties
 */
export async function getCancellationPenalty(reservationNumber) {
  const result = await makeRequest(`${BOOKING_SERVICE}/getcancellationpenalty`, {
    ReservationNumber: reservationNumber
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Iptal cezasi bilgisi alinamadi')
  }

  return result.body?.cancelPenalties || []
}

/**
 * Cancel reservation
 */
export async function cancelReservation(reservationNumber, reason = null) {
  // Get cancellation penalties to find appropriate reason
  const penalties = await getCancellationPenalty(reservationNumber)

  let reasonId = 6 // Default: NO REASON
  for (const penalty of penalties) {
    if (penalty.name === 'NO REASON') {
      reasonId = penalty.id
      break
    }
  }

  const result = await makeRequest(`${BOOKING_SERVICE}/cancelreservation`, {
    ReservationNumber: reservationNumber,
    Reason: reason || reasonId
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon iptal edilemedi')
  }

  return result.body
}
