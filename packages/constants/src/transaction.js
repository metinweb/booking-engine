/**
 * Transaction Constants
 * Centralized transaction type definitions for the booking engine
 */

// Transaction types
export const TRANSACTION_TYPES = {
  // Income
  ROOM_CHARGE: 'room_charge',
  EXTRA_CHARGE: 'extra_charge',
  RESTAURANT: 'restaurant',
  BAR: 'bar',
  MINIBAR: 'minibar',
  SPA: 'spa',
  LAUNDRY: 'laundry',
  PARKING: 'parking',
  PHONE: 'phone',
  OTHER_INCOME: 'other_income',

  // Payments received
  PAYMENT: 'payment',
  DEPOSIT: 'deposit',
  ADVANCE: 'advance',

  // Refunds/Discounts
  REFUND: 'refund',
  DISCOUNT: 'discount',
  VOID: 'void',

  // Expenses
  EXPENSE: 'expense',
  PAYOUT: 'payout'
}

// Transaction type values as array
export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPES)

// Transaction categories for reporting
export const TRANSACTION_CATEGORIES = {
  ACCOMMODATION: 'accommodation',
  FOOD_BEVERAGE: 'food_beverage',
  SPA_WELLNESS: 'spa_wellness',
  OTHER_SERVICES: 'other_services',
  PAYMENTS: 'payments',
  ADJUSTMENTS: 'adjustments'
}

// Transaction category values as array
export const TRANSACTION_CATEGORY_VALUES = Object.values(TRANSACTION_CATEGORIES)

// Transaction type labels (Turkish)
export const TRANSACTION_TYPE_LABELS_TR = {
  [TRANSACTION_TYPES.ROOM_CHARGE]: 'Oda Ücreti',
  [TRANSACTION_TYPES.EXTRA_CHARGE]: 'Ekstra Ücret',
  [TRANSACTION_TYPES.RESTAURANT]: 'Restoran',
  [TRANSACTION_TYPES.BAR]: 'Bar',
  [TRANSACTION_TYPES.MINIBAR]: 'Minibar',
  [TRANSACTION_TYPES.SPA]: 'Spa',
  [TRANSACTION_TYPES.LAUNDRY]: 'Çamaşırhane',
  [TRANSACTION_TYPES.PARKING]: 'Otopark',
  [TRANSACTION_TYPES.PHONE]: 'Telefon',
  [TRANSACTION_TYPES.OTHER_INCOME]: 'Diğer Gelir',
  [TRANSACTION_TYPES.PAYMENT]: 'Ödeme',
  [TRANSACTION_TYPES.DEPOSIT]: 'Depozito',
  [TRANSACTION_TYPES.ADVANCE]: 'Avans',
  [TRANSACTION_TYPES.REFUND]: 'İade',
  [TRANSACTION_TYPES.DISCOUNT]: 'İndirim',
  [TRANSACTION_TYPES.VOID]: 'İptal',
  [TRANSACTION_TYPES.EXPENSE]: 'Gider',
  [TRANSACTION_TYPES.PAYOUT]: 'Ödeme Çıkışı'
}

// Transaction type labels (English)
export const TRANSACTION_TYPE_LABELS_EN = {
  [TRANSACTION_TYPES.ROOM_CHARGE]: 'Room Charge',
  [TRANSACTION_TYPES.EXTRA_CHARGE]: 'Extra Charge',
  [TRANSACTION_TYPES.RESTAURANT]: 'Restaurant',
  [TRANSACTION_TYPES.BAR]: 'Bar',
  [TRANSACTION_TYPES.MINIBAR]: 'Minibar',
  [TRANSACTION_TYPES.SPA]: 'Spa',
  [TRANSACTION_TYPES.LAUNDRY]: 'Laundry',
  [TRANSACTION_TYPES.PARKING]: 'Parking',
  [TRANSACTION_TYPES.PHONE]: 'Phone',
  [TRANSACTION_TYPES.OTHER_INCOME]: 'Other Income',
  [TRANSACTION_TYPES.PAYMENT]: 'Payment',
  [TRANSACTION_TYPES.DEPOSIT]: 'Deposit',
  [TRANSACTION_TYPES.ADVANCE]: 'Advance',
  [TRANSACTION_TYPES.REFUND]: 'Refund',
  [TRANSACTION_TYPES.DISCOUNT]: 'Discount',
  [TRANSACTION_TYPES.VOID]: 'Void',
  [TRANSACTION_TYPES.EXPENSE]: 'Expense',
  [TRANSACTION_TYPES.PAYOUT]: 'Payout'
}

// Map transaction types to categories
export const TRANSACTION_TYPE_TO_CATEGORY = {
  [TRANSACTION_TYPES.ROOM_CHARGE]: TRANSACTION_CATEGORIES.ACCOMMODATION,
  [TRANSACTION_TYPES.EXTRA_CHARGE]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
  [TRANSACTION_TYPES.RESTAURANT]: TRANSACTION_CATEGORIES.FOOD_BEVERAGE,
  [TRANSACTION_TYPES.BAR]: TRANSACTION_CATEGORIES.FOOD_BEVERAGE,
  [TRANSACTION_TYPES.MINIBAR]: TRANSACTION_CATEGORIES.FOOD_BEVERAGE,
  [TRANSACTION_TYPES.SPA]: TRANSACTION_CATEGORIES.SPA_WELLNESS,
  [TRANSACTION_TYPES.LAUNDRY]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
  [TRANSACTION_TYPES.PARKING]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
  [TRANSACTION_TYPES.PHONE]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
  [TRANSACTION_TYPES.OTHER_INCOME]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
  [TRANSACTION_TYPES.PAYMENT]: TRANSACTION_CATEGORIES.PAYMENTS,
  [TRANSACTION_TYPES.DEPOSIT]: TRANSACTION_CATEGORIES.PAYMENTS,
  [TRANSACTION_TYPES.ADVANCE]: TRANSACTION_CATEGORIES.PAYMENTS,
  [TRANSACTION_TYPES.REFUND]: TRANSACTION_CATEGORIES.ADJUSTMENTS,
  [TRANSACTION_TYPES.DISCOUNT]: TRANSACTION_CATEGORIES.ADJUSTMENTS,
  [TRANSACTION_TYPES.VOID]: TRANSACTION_CATEGORIES.ADJUSTMENTS,
  [TRANSACTION_TYPES.EXPENSE]: TRANSACTION_CATEGORIES.ADJUSTMENTS,
  [TRANSACTION_TYPES.PAYOUT]: TRANSACTION_CATEGORIES.PAYMENTS
}

/**
 * Get transaction type label
 * @param {string} type - Transaction type key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getTransactionTypeLabel(type, locale = 'tr') {
  const labels = locale === 'tr' ? TRANSACTION_TYPE_LABELS_TR : TRANSACTION_TYPE_LABELS_EN
  return labels[type] || type
}

/**
 * Get transaction category for a type
 * @param {string} type - Transaction type
 * @returns {string} - Category or 'other_services' as default
 */
export function getTransactionCategory(type) {
  return TRANSACTION_TYPE_TO_CATEGORY[type] || TRANSACTION_CATEGORIES.OTHER_SERVICES
}
