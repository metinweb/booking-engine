<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col min-h-0"
  >
    <!-- Header -->
    <div
      class="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-purple-500">apartment</span>
        <span class="font-medium text-gray-900 dark:text-white text-sm">
          {{ hotels.length }} {{ $t('booking.hotelsFound') }}
          <span
            v-if="unavailableHotels.length > 0 && hotels.length === 0"
            class="text-gray-400 font-normal"
          >
            ({{ unavailableHotels.length }} {{ $t('booking.unavailable') }})
          </span>
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <span class="material-icons text-3xl text-purple-500 animate-spin">refresh</span>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-2">
          {{ $t('booking.searchingHotels') }}
        </p>
      </div>
    </div>

    <!-- Empty State with Unavailable Hotels -->
    <div
      v-else-if="hotels.length === 0 && unavailableHotels.length > 0"
      class="flex-1 overflow-y-auto p-3 space-y-2"
    >
      <!-- Info Banner -->
      <div
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3"
      >
        <div class="flex items-start gap-2">
          <span class="material-icons text-amber-500 text-lg flex-shrink-0">info</span>
          <div class="text-sm text-amber-700 dark:text-amber-300">
            {{ $t('booking.noAvailabilityInfo') }}
          </div>
        </div>
      </div>

      <!-- Unavailable Hotels -->
      <div
        v-for="hotel in unavailableHotels"
        :key="hotel.hotelId"
        class="flex items-stretch bg-gray-50 dark:bg-slate-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 opacity-75"
      >
        <!-- Hotel Image Placeholder -->
        <div
          class="relative w-28 h-24 flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 flex items-center justify-center"
        >
          <span class="material-icons text-2xl text-gray-400 dark:text-slate-400">hotel</span>
          <!-- No Availability Badge -->
          <div class="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            <span class="material-icons text-xs align-middle">block</span>
          </div>
        </div>

        <!-- Hotel Info -->
        <div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
          <h4 class="font-semibold text-gray-700 dark:text-slate-300 truncate text-sm">
            {{ getLocalizedName(hotel.name) }}
          </h4>

          <!-- Reason -->
          <div class="mt-2">
            <span
              v-for="issue in hotel.issues"
              :key="issue"
              class="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded mr-1"
            >
              <span class="material-icons text-xs">{{ getIssueIcon(issue) }}</span>
              {{ $t(`booking.issues.${issue}`) }}
            </span>
          </div>

          <!-- Room Types with errors (collapsible) -->
          <div v-if="hotel.priceErrors && hotel.priceErrors.length > 0" class="mt-2">
            <button
              class="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 flex items-center gap-1"
              @click="toggleHotelDetails(hotel.hotelId)"
            >
              <span class="material-icons text-xs">{{
                expandedHotels.includes(hotel.hotelId) ? 'expand_less' : 'expand_more'
              }}</span>
              {{ hotel.roomTypeCount }} {{ $t('booking.roomTypes') }}
            </button>
            <div
              v-if="expandedHotels.includes(hotel.hotelId)"
              class="mt-1 text-xs text-gray-500 dark:text-slate-400 pl-4 space-y-0.5"
            >
              <div
                v-for="err in hotel.priceErrors.slice(0, 5)"
                :key="err.roomType + err.mealPlan"
                class="flex items-center gap-1"
              >
                <span>{{ err.roomType }} / {{ err.mealPlan }}:</span>
                <span class="text-red-500">{{ $t(`booking.errors.${err.error}`) }}</span>
              </div>
              <div v-if="hotel.priceErrors.length > 5" class="text-gray-400">
                +{{ hotel.priceErrors.length - 5 }} {{ $t('common.more') }}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Completely Empty State -->
    <div v-else-if="hotels.length === 0" class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">hotel</span>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-2">
          {{ $t('booking.noHotelsFound') }}
        </p>
      </div>
    </div>

    <!-- Hotel List with Available Hotels -->
    <div v-else class="flex-1 overflow-y-auto p-3 space-y-2">
      <HotelListItem
        v-for="hotel in hotels"
        :key="hotel._id"
        :hotel="hotel"
        :selected="selectedHotelId === hotel._id"
        @click="$emit('select', hotel._id)"
        @show-info="showHotelInfo(hotel)"
      />

      <!-- Show unavailable hotels at bottom if there are available ones too -->
      <template v-if="unavailableHotels.length > 0">
        <div class="border-t border-gray-200 dark:border-slate-700 pt-3 mt-3">
          <div class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <span class="material-icons text-xs">info</span>
            {{ unavailableHotels.length }} {{ $t('booking.hotelsNoAvailability') }}
          </div>
          <div
            v-for="hotel in unavailableHotels"
            :key="hotel.hotelId"
            class="flex items-center gap-2 py-2 px-3 bg-gray-50 dark:bg-slate-700/30 rounded text-sm text-gray-500 dark:text-slate-400"
          >
            <span class="material-icons text-gray-400 text-sm">block</span>
            <span class="flex-1 truncate">{{ getLocalizedName(hotel.name) }}</span>
            <span class="text-xs text-red-500 dark:text-red-400">{{
              $t(`booking.issues.${hotel.issues[0]}`)
            }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Hotel Detail Modal -->
    <HotelDetailModal
      v-model="showDetailModal"
      :hotel="selectedHotelForModal"
      @select="handleSelectFromModal"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HotelListItem from './HotelListItem.vue'
import HotelDetailModal from './HotelDetailModal.vue'

defineProps({
  hotels: {
    type: Array,
    required: true
  },
  unavailableHotels: {
    type: Array,
    default: () => []
  },
  selectedHotelId: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const { locale } = useI18n()

// Modal state
const showDetailModal = ref(false)
const selectedHotelForModal = ref(null)

// Expanded hotels for showing price errors
const expandedHotels = ref([])

// Toggle hotel details
const toggleHotelDetails = hotelId => {
  const index = expandedHotels.value.indexOf(hotelId)
  if (index > -1) {
    expandedHotels.value.splice(index, 1)
  } else {
    expandedHotels.value.push(hotelId)
  }
}

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Get issue icon
const getIssueIcon = issue => {
  const icons = {
    NO_AVAILABLE_PRICE: 'money_off',
    NO_ALLOTMENT: 'event_busy',
    NO_RATES_FOUND: 'price_check',
    STOP_SALE: 'block',
    MIN_STAY: 'schedule',
    CLOSED: 'lock'
  }
  return icons[issue] || 'warning'
}

// Show hotel info modal
const showHotelInfo = hotel => {
  selectedHotelForModal.value = hotel
  showDetailModal.value = true
}

// Handle select from modal
const handleSelectFromModal = hotel => {
  emit('select', hotel._id)
}
</script>
