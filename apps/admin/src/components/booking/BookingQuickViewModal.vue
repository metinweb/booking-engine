<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        ></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <span class="material-icons text-2xl text-purple-500">confirmation_number</span>
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ booking?.bookingNumber }}
                </h2>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                  :class="statusClass"
                >
                  {{ statusLabel }}
                </span>
              </div>
            </div>
            <button
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              @click="close"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
          </div>

          <!-- Content -->
          <div v-else-if="bookingDetails" class="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Left Column -->
              <div class="space-y-6">
                <!-- Hotel Info -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                    <span class="material-icons text-lg mr-2">hotel</span>
                    {{ $t('booking.hotel') }}
                  </h3>
                  <p class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ bookingDetails.hotelName }}
                  </p>
                  <p v-if="bookingDetails.hotelCode" class="text-sm text-gray-500 dark:text-slate-400">
                    {{ bookingDetails.hotelCode }}
                  </p>
                </div>

                <!-- Dates -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                    <span class="material-icons text-lg mr-2">event</span>
                    {{ $t('booking.dates') }}
                  </h3>
                  <div class="flex items-center gap-4">
                    <div>
                      <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.checkIn') }}</p>
                      <p class="text-lg font-semibold text-gray-900 dark:text-white">
                        {{ formatDate(bookingDetails.checkIn) }}
                      </p>
                    </div>
                    <span class="material-icons text-gray-400">arrow_forward</span>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.checkOut') }}</p>
                      <p class="text-lg font-semibold text-gray-900 dark:text-white">
                        {{ formatDate(bookingDetails.checkOut) }}
                      </p>
                    </div>
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                      <span class="material-icons text-sm">nightlight</span>
                      {{ bookingDetails.nights }} {{ $t('booking.night') }}
                    </span>
                  </div>
                </div>

                <!-- Guest Info -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                    <span class="material-icons text-lg mr-2">person</span>
                    {{ $t('booking.guest') }}
                  </h3>
                  <div v-if="bookingDetails.leadGuest">
                    <p class="text-lg font-semibold text-gray-900 dark:text-white">
                      {{ bookingDetails.leadGuest.firstName }} {{ bookingDetails.leadGuest.lastName }}
                    </p>
                    <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-slate-300">
                      <span v-if="bookingDetails.leadGuest.email" class="flex items-center gap-1">
                        <span class="material-icons text-sm">email</span>
                        {{ bookingDetails.leadGuest.email }}
                      </span>
                      <span v-if="bookingDetails.leadGuest.phone" class="flex items-center gap-1">
                        <span class="material-icons text-sm">phone</span>
                        {{ bookingDetails.leadGuest.phone }}
                      </span>
                    </div>
                  </div>
                  <p v-else class="text-gray-400 dark:text-slate-500 italic">
                    {{ $t('booking.noGuestInfo') }}
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-6">
                <!-- Rooms -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                    <span class="material-icons text-lg mr-2">king_bed</span>
                    {{ $t('booking.rooms') }}
                  </h3>
                  <div class="space-y-3">
                    <div
                      v-for="(room, idx) in bookingDetails.rooms"
                      :key="idx"
                      class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
                    >
                      <div class="flex items-start justify-between">
                        <div>
                          <p class="font-medium text-gray-900 dark:text-white">
                            {{ getLocalizedName(room.roomTypeName) }}
                          </p>
                          <p class="text-sm text-gray-500 dark:text-slate-400">
                            {{ getLocalizedName(room.mealPlanName) }}
                          </p>
                        </div>
                        <div class="flex items-center gap-1">
                          <span class="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {{ room.roomTypeCode }}
                          </span>
                          <span class="px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {{ room.mealPlanCode }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Pricing -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                    <span class="material-icons text-lg mr-2">payments</span>
                    {{ $t('booking.pricing') }}
                  </h3>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 dark:text-slate-300">{{ $t('payment.total') }}</span>
                      <span class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ formatPrice(bookingDetails.pricing?.grandTotal, bookingDetails.pricing?.currency) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 dark:text-slate-300">{{ $t('payment.paid') }}</span>
                      <span class="font-medium text-green-600 dark:text-green-400">
                        {{ formatPrice(bookingDetails.payment?.paidAmount || 0, bookingDetails.pricing?.currency) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-600">
                      <span class="text-gray-600 dark:text-slate-300">{{ $t('payment.remaining') }}</span>
                      <span class="font-semibold" :class="remainingAmount > 0 ? 'text-orange-500' : 'text-green-500'">
                        {{ formatPrice(remainingAmount, bookingDetails.pricing?.currency) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
            <button
              class="btn-secondary px-4 py-2"
              @click="close"
            >
              {{ $t('common.close') }}
            </button>
            <div class="flex items-center gap-2">
              <button
                v-if="canAmend"
                class="btn-secondary px-4 py-2 flex items-center gap-2"
                @click="$emit('amend', bookingDetails)"
              >
                <span class="material-icons text-lg">edit</span>
                {{ $t('booking.amend') }}
              </button>
              <button
                class="btn-primary px-4 py-2 flex items-center gap-2"
                @click="goToDetail"
              >
                <span class="material-icons text-lg">open_in_new</span>
                {{ $t('booking.viewFullDetails') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import { formatPrice } from '@/utils/formatters'
import bookingService from '@/services/bookingService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  booking: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'amend', 'close'])

const { locale, t } = useI18n()
const router = useRouter()
const { getStatusClass: getStatusClassHelper, getBookingStatusLabel } = useStatusHelpers()

// State
const loading = ref(false)
const bookingDetails = ref(null)

// Computed
const statusClass = computed(() => {
  if (!bookingDetails.value) return ''
  return getStatusClassHelper(bookingDetails.value.status)
})

const statusLabel = computed(() => {
  if (!bookingDetails.value) return ''
  return getBookingStatusLabel(bookingDetails.value.status)
})

const remainingAmount = computed(() => {
  if (!bookingDetails.value?.pricing?.grandTotal) return 0
  return bookingDetails.value.pricing.grandTotal - (bookingDetails.value.payment?.paidAmount || 0)
})

const canAmend = computed(() => {
  if (!bookingDetails.value) return false
  return ['pending', 'confirmed', 'checked_in'].includes(bookingDetails.value.status)
})

// Methods
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const goToDetail = () => {
  if (bookingDetails.value) {
    router.push(`/bookings/${bookingDetails.value._id}`)
  }
}

const formatDate = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

const loadBookingDetails = async () => {
  if (!props.booking?._id) return

  loading.value = true
  try {
    const response = await bookingService.getBookingById(props.booking._id)
    if (response.success) {
      bookingDetails.value = response.data
    }
  } catch (error) {
    console.error('Failed to load booking details:', error)
    // Fallback to passed booking data
    bookingDetails.value = props.booking
  } finally {
    loading.value = false
  }
}

// Watch for modal open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.booking) {
    // First show basic data from list
    bookingDetails.value = props.booking
    // Then load full details
    loadBookingDetails()
  } else {
    bookingDetails.value = null
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(-20px);
}
</style>
