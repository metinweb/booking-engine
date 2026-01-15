<template>
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      {{ $t('tourBooking.pricing.title') }}
    </h3>

    <!-- Tour Info -->
    <div v-if="tour" class="pb-3 border-b border-gray-200 dark:border-slate-700 mb-3">
      <p class="font-medium text-gray-900 dark:text-white">{{ getLocalizedName(tour.name) }}</p>
      <p v-if="departure" class="text-sm text-gray-500">{{ formatDate(departure.departureDate) }}</p>
    </div>

    <!-- Price Breakdown -->
    <div class="space-y-2 text-sm">
      <!-- Adults -->
      <div v-if="pricing.adults > 0" class="flex justify-between">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.pricing.adults') }} x {{ adultCount }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatCurrency(pricing.adults, currency) }}
        </span>
      </div>

      <!-- Children -->
      <div v-if="pricing.children > 0" class="flex justify-between">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.pricing.children') }} x {{ childCount }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatCurrency(pricing.children, currency) }}
        </span>
      </div>

      <!-- Infants -->
      <div v-if="pricing.infants > 0" class="flex justify-between">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.pricing.infants') }} x {{ infantCount }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatCurrency(pricing.infants, currency) }}
        </span>
      </div>

      <!-- Single Supplement -->
      <div v-if="pricing.singleSupplement > 0" class="flex justify-between">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.pricing.singleSupplement') }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatCurrency(pricing.singleSupplement, currency) }}
        </span>
      </div>

      <!-- Extras -->
      <div v-if="pricing.extras > 0" class="flex justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.pricing.extras') }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatCurrency(pricing.extras, currency) }}
        </span>
      </div>

      <!-- Subtotal -->
      <div v-if="pricing.discount > 0" class="flex justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.pricing.subtotal') }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatCurrency(subtotal, currency) }}
        </span>
      </div>

      <!-- Discount -->
      <div v-if="pricing.discount > 0" class="flex justify-between text-green-600">
        <span>{{ $t('tourBooking.pricing.discount') }}</span>
        <span>-{{ formatCurrency(pricing.discount, currency) }}</span>
      </div>
    </div>

    <!-- Grand Total -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
      <div class="flex justify-between items-center">
        <span class="text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('tourBooking.pricing.grandTotal') }}
        </span>
        <span class="text-xl font-bold text-purple-600 dark:text-purple-400">
          {{ formatCurrency(grandTotal, currency) }}
        </span>
      </div>
    </div>

    <!-- Payment Status -->
    <div v-if="showPaymentStatus && payment" class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.payment.paidAmount') }}
        </span>
        <span class="text-green-600 font-medium">
          {{ formatCurrency(payment.paidAmount || 0, currency) }}
        </span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourBooking.payment.dueAmount') }}
        </span>
        <span class="text-red-600 font-medium">
          {{ formatCurrency(payment.dueAmount || 0, currency) }}
        </span>
      </div>
    </div>

    <!-- B2B Pricing -->
    <div v-if="showB2BPricing && b2bPricing" class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {{ $t('departure.pricing.b2bPricing') }}
      </h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">
            {{ $t('departure.pricing.netPrice') }}
          </span>
          <span class="text-gray-900 dark:text-white">
            {{ formatCurrency(b2bPricing.netPrice || 0, currency) }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">
            {{ $t('departure.pricing.commission') }}
          </span>
          <span class="text-green-600">
            {{ formatCurrency(b2bPricing.commission || 0, currency) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Slot for custom content -->
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  tour: {
    type: Object,
    default: null
  },
  departure: {
    type: Object,
    default: null
  },
  pricing: {
    type: Object,
    default: () => ({
      adults: 0,
      children: 0,
      infants: 0,
      extras: 0,
      singleSupplement: 0,
      discount: 0
    })
  },
  payment: {
    type: Object,
    default: null
  },
  b2bPricing: {
    type: Object,
    default: null
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  adultCount: {
    type: Number,
    default: 0
  },
  childCount: {
    type: Number,
    default: 0
  },
  infantCount: {
    type: Number,
    default: 0
  },
  showPaymentStatus: {
    type: Boolean,
    default: false
  },
  showB2BPricing: {
    type: Boolean,
    default: false
  }
})

const { locale } = useI18n()

const subtotal = computed(() => {
  return props.pricing.adults +
    props.pricing.children +
    props.pricing.infants +
    props.pricing.extras +
    props.pricing.singleSupplement
})

const grandTotal = computed(() => {
  return subtotal.value - (props.pricing.discount || 0)
})

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
