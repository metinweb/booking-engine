<template>
  <div class="space-y-6">
    <div class="text-center mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('booking.amendment.datesRoomsTitle') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('booking.amendment.datesRoomsDescription') }}
      </p>
    </div>

    <!-- Date Selection -->
    <div
      class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-500">calendar_today</span>
        {{ $t('booking.dates') }}
      </h4>

      <BookingDateRangePicker
        :model-value="dateRange"
        :min-date="minDate"
        @update:model-value="onDateChange"
      />

      <!-- Nights change indicator -->
      <div v-if="nightsChanged" class="mt-3 flex items-center justify-center gap-2 text-sm">
        <span class="text-amber-600 dark:text-amber-400">
          <span class="material-icons text-sm align-middle">swap_horiz</span>
          {{ booking?.nights }} → {{ calculatedNights }} {{ $t('booking.nights') }}
          ({{ nightsDifference > 0 ? '+' : '' }}{{ nightsDifference }})
        </span>
      </div>
    </div>

    <!-- Rooms -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <span class="material-icons text-indigo-500">bed</span>
          {{ $t('booking.rooms') }}
        </h4>
        <button
          class="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
          @click="addRoom"
        >
          <span class="material-icons text-sm mr-1 align-middle">add</span>
          {{ $t('booking.amendment.addRoom') }}
        </button>
      </div>

      <div
        v-for="(room, index) in localFormData.rooms"
        :key="index"
        class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center justify-between mb-4">
          <h5 class="font-medium text-gray-900 dark:text-white">
            {{ $t('booking.room') }} {{ index + 1 }}
          </h5>
          <button
            v-if="localFormData.rooms.length > 1"
            class="text-red-500 hover:text-red-700 dark:hover:text-red-400"
            @click="removeRoom(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Room Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('booking.roomType') }}
            </label>
            <select
              v-model="room.roomTypeId"
              class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="onRoomChange(index)"
            >
              <option v-for="rt in availableRoomTypes" :key="rt._id" :value="rt._id">
                {{ getRoomTypeName(rt) }}
              </option>
            </select>
          </div>

          <!-- Meal Plan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('booking.mealPlan') }}
            </label>
            <select
              v-model="room.mealPlanId"
              class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="onRoomChange(index)"
            >
              <option v-for="mp in availableMealPlans" :key="mp._id" :value="mp._id">
                {{ getMealPlanName(mp) }}
              </option>
            </select>
          </div>
        </div>

        <!-- Guest Count Selector -->
        <div class="border-t dark:border-gray-600 pt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('booking.guests') }}
          </label>
          <GuestCountSelector
            :adults="room.adults"
            :children="room.children || []"
            :min-adults="1"
            :max-adults="6"
            :max-children="4"
            :max-child-age="17"
            @update:adults="onAdultsChange(index, $event)"
            @update:children="onChildrenChange(index, $event)"
          />
        </div>

        <!-- Rate Type -->
        <div class="border-t dark:border-gray-600 pt-4 mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('booking.rateType') }}
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                :checked="room.rateType === 'refundable'"
                name="rateType"
                class="text-indigo-600 focus:ring-indigo-500"
                @change="onRateTypeChange(index, 'refundable')"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ $t('booking.refundable') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                :checked="room.rateType === 'non_refundable'"
                name="rateType"
                class="text-indigo-600 focus:ring-indigo-500"
                @change="onRateTypeChange(index, 'non_refundable')"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ $t('booking.nonRefundable') }}</span>
            </label>
          </div>
        </div>

        <!-- Room availability status -->
        <div v-if="previewData" class="mt-4">
          <div
            v-if="getRoomAvailability(index)"
            class="flex items-center gap-2 text-green-600 dark:text-green-400"
          >
            <span class="material-icons text-sm">check_circle</span>
            {{ $t('booking.amendment.available') }}
          </div>
          <div v-else class="text-red-600 dark:text-red-400">
            <div class="flex items-center gap-2">
              <span class="material-icons text-sm">error</span>
              {{ $t('booking.amendment.unavailable') }}
            </div>
            <p v-if="getRoomError(index)" class="text-sm mt-1 ml-6">
              {{ getRoomError(index) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Check Availability Button -->
    <div class="text-center">
      <button
        :disabled="checkingAvailability"
        class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center mx-auto"
        @click="$emit('check-availability')"
      >
        <span
          v-if="checkingAvailability"
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
        ></span>
        <span class="material-icons text-sm mr-2">search</span>
        {{ $t('booking.amendment.checkAvailability') }}
      </button>
    </div>

    <!-- Preview Price Difference -->
    <div
      v-if="previewData?.priceDifference"
      class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-500">calculate</span>
        {{ $t('booking.amendment.pricePreview') }}
      </h4>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-gray-500 dark:text-gray-400">
          {{ $t('booking.amendment.originalPrice') }}
        </div>
        <div class="text-right font-medium text-gray-900 dark:text-white">
          {{
            formatCurrency(
              previewData.priceDifference.originalTotal,
              previewData.priceDifference.currency
            )
          }}
        </div>

        <div class="text-gray-500 dark:text-gray-400">{{ $t('booking.amendment.newPrice') }}</div>
        <div class="text-right font-medium text-gray-900 dark:text-white">
          {{
            formatCurrency(
              previewData.priceDifference.newTotal,
              previewData.priceDifference.currency
            )
          }}
        </div>

        <div class="col-span-2 border-t dark:border-gray-600 pt-3 mt-2">
          <div class="flex justify-between items-center">
            <span class="font-medium text-gray-900 dark:text-white">
              {{
                previewData.priceDifference.isIncrease
                  ? $t('booking.amendment.additionalCharge')
                  : $t('booking.amendment.refundDue')
              }}
            </span>
            <span
              class="text-lg font-bold"
              :class="previewData.priceDifference.isIncrease ? 'text-amber-600' : 'text-green-600'"
            >
              {{ previewData.priceDifference.isIncrease ? '+' : ''
              }}{{
                formatCurrency(
                  previewData.priceDifference.difference,
                  previewData.priceDifference.currency
                )
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BookingDateRangePicker from '@/components/booking/search/BookingDateRangePicker.vue'
import GuestCountSelector from '@/components/common/GuestCountSelector.vue'

const props = defineProps({
  booking: { type: Object, default: null },
  formData: { type: Object, required: true },
  availableRoomTypes: { type: Array, default: () => [] },
  availableMealPlans: { type: Array, default: () => [] },
  previewData: { type: Object, default: null },
  checkingAvailability: { type: Boolean, default: false }
})

const emit = defineEmits(['update:form-data', 'check-availability'])

const { locale } = useI18n()

// Local copy of form data
const localFormData = ref({ ...props.formData })

// Watch for external changes
watch(
  () => props.formData,
  newVal => {
    localFormData.value = { ...newVal }
  },
  { deep: true }
)

// Computed
const minDate = computed(() => new Date())

const dateRange = computed(() => ({
  start: localFormData.value.checkIn ? new Date(localFormData.value.checkIn) : null,
  end: localFormData.value.checkOut ? new Date(localFormData.value.checkOut) : null
}))

const calculatedNights = computed(() => {
  if (!localFormData.value.checkIn || !localFormData.value.checkOut) return 0
  const checkIn = new Date(localFormData.value.checkIn)
  const checkOut = new Date(localFormData.value.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const nightsChanged = computed(() => {
  return calculatedNights.value !== props.booking?.nights
})

const nightsDifference = computed(() => {
  return calculatedNights.value - (props.booking?.nights || 0)
})

// Methods
const onDateChange = range => {
  if (range.start) {
    // Handle both Date object and string
    localFormData.value.checkIn = range.start instanceof Date
      ? range.start.toISOString()
      : new Date(range.start).toISOString()
  }
  if (range.end) {
    localFormData.value.checkOut = range.end instanceof Date
      ? range.end.toISOString()
      : new Date(range.end).toISOString()
  }
  emitUpdate()
}

const onRoomChange = () => {
  emitUpdate()
}

const onAdultsChange = (index, adults) => {
  localFormData.value.rooms[index].adults = adults
  emitUpdate()
}

const onChildrenChange = (index, children) => {
  localFormData.value.rooms[index].children = children
  emitUpdate()
}

const onRateTypeChange = (index, rateType) => {
  localFormData.value.rooms[index].rateType = rateType
  emitUpdate()
}

const addRoom = () => {
  const lastRoom = localFormData.value.rooms[localFormData.value.rooms.length - 1]
  localFormData.value.rooms.push({
    roomTypeId: lastRoom?.roomTypeId || props.availableRoomTypes[0]?._id,
    mealPlanId: lastRoom?.mealPlanId || props.availableMealPlans[0]?._id,
    adults: 2,
    children: [],
    guests: [],
    rateType: 'refundable'
  })
  emitUpdate()
}

const removeRoom = index => {
  localFormData.value.rooms.splice(index, 1)
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:form-data', { ...localFormData.value })
}

const getRoomTypeName = rt => {
  const name = rt.name
  if (!name) return rt.code || '-'
  return typeof name === 'object' ? name[locale.value] || name.tr || name.en : name
}

const getMealPlanName = mp => {
  const name = mp.name
  if (!name) return mp.code || '-'
  return typeof name === 'object' ? name[locale.value] || name.tr || name.en : name
}

const getRoomAvailability = index => {
  // Check if there's an issue for this room
  const issue = props.previewData?.availability?.issues?.find(i => i.roomIndex === index)
  if (issue) return false

  // Check preview room availability
  if (!props.previewData?.preview?.rooms) return null
  const previewRoom = props.previewData.preview.rooms[index]
  return previewRoom?.available !== false
}

const getRoomError = index => {
  const issue = props.previewData?.availability?.issues?.find(i => i.roomIndex === index)
  if (!issue) return null

  // Map error codes to Turkish messages
  const errorMessages = {
    BELOW_MIN_ADULTS: 'Bu oda tipi için minimum yetişkin sayısına ulaşılmadı',
    ABOVE_MAX_ADULTS: 'Bu oda tipi için maksimum yetişkin sayısı aşıldı',
    ABOVE_MAX_CHILDREN: 'Bu oda tipi için maksimum çocuk sayısı aşıldı',
    ABOVE_MAX_OCCUPANCY: 'Bu oda tipi için maksimum kapasite aşıldı',
    INVALID_ROOM_TYPE_ID: 'Geçersiz oda tipi',
    INVALID_MEAL_PLAN_ID: 'Geçersiz pansiyon tipi',
    PRICING_FAILED: 'Fiyat hesaplanamadı',
    NO_RATES_FOUND: 'Seçilen tarihler için fiyat bulunamadı',
    ROOM_TYPE_NOT_FOUND: 'Oda tipi bulunamadı',
    MEAL_PLAN_NOT_FOUND: 'Pansiyon tipi bulunamadı'
  }

  return errorMessages[issue.error] || issue.message || 'Bilinmeyen hata'
}

const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}
</script>
