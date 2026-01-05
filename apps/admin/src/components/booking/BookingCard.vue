<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow cursor-pointer"
    @click="$emit('click', booking)"
  >
    <!-- Header: Confirmation & Status -->
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('booking.confirmationNumber') }}
        </p>
        <p class="font-mono font-bold text-gray-900 dark:text-white">
          {{ booking.confirmationNumber }}
        </p>
      </div>
      <BookingStatusBadge :status="booking.status" />
    </div>

    <!-- Hotel Info -->
    <div class="flex items-center space-x-3 mb-3">
      <div
        class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0"
      >
        <span class="material-icons text-purple-500">hotel</span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-medium text-gray-900 dark:text-white truncate">
          {{ booking.hotel?.name || '-' }}
        </p>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ booking.hotel?.city || '' }}
        </p>
      </div>
    </div>

    <!-- Dates & Guests -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
        <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.checkIn') }}</p>
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatDate(booking.checkIn) }}
        </p>
      </div>
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
        <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.checkOut') }}</p>
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatDate(booking.checkOut) }}
        </p>
      </div>
    </div>

    <!-- Room & Guest Summary -->
    <div class="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400 mb-3">
      <div class="flex items-center">
        <span class="material-icons text-sm mr-1">meeting_room</span>
        {{ booking.rooms?.length || 1 }} {{ $t('booking.rooms') }}
      </div>
      <div class="flex items-center">
        <span class="material-icons text-sm mr-1">nights_stay</span>
        {{ nights }} {{ $t('booking.nights') }}
      </div>
    </div>

    <!-- Lead Guest -->
    <div class="flex items-center text-sm text-gray-600 dark:text-slate-400 mb-3">
      <span class="material-icons text-sm mr-1">person</span>
      {{ guestName }}
    </div>

    <!-- Footer: Price & Created -->
    <div
      class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700"
    >
      <div>
        <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.total') }}</p>
        <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
          {{
            formatPrice(
              booking.pricing?.finalTotal || booking.pricing?.total,
              booking.pricing?.currency
            )
          }}
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.createdAt') }}</p>
        <p class="text-sm text-gray-600 dark:text-slate-400">
          {{ formatDateTime(booking.createdAt) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BookingStatusBadge from './BookingStatusBadge.vue'

const { locale } = useI18n()

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Calculate nights
const nights = computed(() => {
  if (!props.booking.checkIn || !props.booking.checkOut) return 0
  const checkIn = new Date(props.booking.checkIn)
  const checkOut = new Date(props.booking.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

// Guest name
const guestName = computed(() => {
  const guest = props.booking.leadGuest || props.booking.guests?.find(g => g.isLeadGuest)
  if (!guest) return '-'
  return `${guest.firstName} ${guest.lastName}`
})

// Format date
const formatDate = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format datetime
const formatDateTime = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format price
const formatPrice = (amount, currency) => {
  if (!amount) return '-'
  const formatter = new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return formatter.format(amount)
}
</script>
