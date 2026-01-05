<template>
  <div ref="containerRef" class="booking-date-picker">
    <!-- Display Fields -->
    <div class="grid grid-cols-2 gap-2">
      <!-- Check-in Date -->
      <div class="relative cursor-pointer group" @click="openCalendar('checkin')">
        <div
          class="form-input pl-10 pr-3 py-3 transition-all"
          :class="[
            activeField === 'checkin' ? 'ring-2 ring-purple-500 border-purple-500' : '',
            checkInDate
              ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10'
              : '',
            hasError && !checkInDate ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''
          ]"
        >
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
            <span class="material-icons text-lg">flight_land</span>
          </span>
          <div class="text-left">
            <p
              class="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-medium"
            >
              {{ $t('booking.checkIn') }}
            </p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {{ checkInDate ? formatDisplayDate(checkInDate) : $t('booking.selectDate') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Check-out Date -->
      <div class="relative cursor-pointer group" @click="openCalendar('checkout')">
        <div
          class="form-input pl-10 pr-3 py-3 transition-all"
          :class="[
            activeField === 'checkout' ? 'ring-2 ring-purple-500 border-purple-500' : '',
            checkOutDate
              ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10'
              : '',
            hasError && !checkOutDate ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''
          ]"
        >
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
            <span class="material-icons text-lg">flight_takeoff</span>
          </span>
          <div class="text-left">
            <p
              class="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-medium"
            >
              {{ $t('booking.checkOut') }}
            </p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {{ checkOutDate ? formatDisplayDate(checkOutDate) : $t('booking.selectDate') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Night Count Badge -->
    <div v-if="nightCount > 0" class="flex items-center justify-center mt-2">
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium"
      >
        <span class="material-icons text-sm">nights_stay</span>
        {{ nightCount }} {{ nightCount === 1 ? $t('booking.night') : $t('booking.nights') }}
      </span>
    </div>

    <!-- Calendar Popup -->
    <Teleport to="body">
      <transition name="calendar-fade">
        <div
          v-if="isOpen"
          ref="calendarPopup"
          class="fixed z-[9999] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-600"
          :style="popupStyle"
        >
          <!-- Header with selection info -->
          <div
            class="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 rounded-t-2xl"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- Check-in indicator -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  :class="
                    activeField === 'checkin'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                  "
                  @click="activeField = 'checkin'"
                >
                  <span class="material-icons text-sm">flight_land</span>
                  <div class="text-left">
                    <p class="text-[10px] uppercase tracking-wider opacity-75">
                      {{ $t('booking.checkIn') }}
                    </p>
                    <p class="text-sm font-semibold">
                      {{ checkInDate ? formatShortDate(checkInDate) : '--' }}
                    </p>
                  </div>
                </div>

                <!-- Arrow -->
                <span class="material-icons text-gray-400">arrow_forward</span>

                <!-- Check-out indicator -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  :class="
                    activeField === 'checkout'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                  "
                  @click="activeField = 'checkout'"
                >
                  <span class="material-icons text-sm">flight_takeoff</span>
                  <div class="text-left">
                    <p class="text-[10px] uppercase tracking-wider opacity-75">
                      {{ $t('booking.checkOut') }}
                    </p>
                    <p class="text-sm font-semibold">
                      {{ checkOutDate ? formatShortDate(checkOutDate) : '--' }}
                    </p>
                  </div>
                </div>

                <!-- Night count in header -->
                <div
                  v-if="nightCount > 0"
                  class="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg"
                >
                  <span class="material-icons text-sm">nights_stay</span>
                  <span class="text-sm font-semibold"
                    >{{ nightCount }}
                    {{ nightCount === 1 ? $t('booking.night') : $t('booking.nights') }}</span
                  >
                </div>
              </div>

              <!-- Close button -->
              <button
                class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                @click="closeCalendar"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="p-4">
            <div class="flex gap-6">
              <!-- Left Calendar (Current Month) -->
              <div class="flex-1 min-w-[280px]">
                <div class="flex items-center justify-between mb-4">
                  <button
                    class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    @click="previousMonth"
                  >
                    <span class="material-icons text-gray-600 dark:text-slate-400"
                      >chevron_left</span
                    >
                  </button>
                  <h3 class="font-semibold text-gray-800 dark:text-white">
                    {{ formatMonthYear(currentMonth) }}
                  </h3>
                  <div class="w-10"></div>
                </div>

                <!-- Week days header -->
                <div class="grid grid-cols-7 mb-2">
                  <div
                    v-for="day in weekDays"
                    :key="day"
                    class="text-center text-xs font-semibold text-gray-500 dark:text-slate-400 py-2"
                  >
                    {{ day }}
                  </div>
                </div>

                <!-- Days grid -->
                <div class="grid grid-cols-7 gap-0.5">
                  <div
                    v-for="(date, index) in getMonthDates(currentMonth)"
                    :key="`left-${index}`"
                    :class="getDateClass(date)"
                    @click="selectDate(date)"
                    @mouseenter="handleHover(date)"
                  >
                    <span v-if="date" class="relative z-10">{{ date.getDate() }}</span>
                    <!-- Check-in badge -->
                    <span
                      v-if="date && isCheckIn(date)"
                      class="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-purple-600 dark:text-purple-400"
                      >IN</span
                    >
                    <!-- Check-out badge -->
                    <span
                      v-if="date && isCheckOut(date)"
                      class="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-purple-600 dark:text-purple-400"
                      >OUT</span
                    >
                  </div>
                </div>
              </div>

              <!-- Right Calendar (Next Month) -->
              <div class="flex-1 min-w-[280px]">
                <div class="flex items-center justify-between mb-4">
                  <div class="w-10"></div>
                  <h3 class="font-semibold text-gray-800 dark:text-white">
                    {{ formatMonthYear(nextMonth) }}
                  </h3>
                  <button
                    class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    @click="nextMonthAction"
                  >
                    <span class="material-icons text-gray-600 dark:text-slate-400"
                      >chevron_right</span
                    >
                  </button>
                </div>

                <!-- Week days header -->
                <div class="grid grid-cols-7 mb-2">
                  <div
                    v-for="day in weekDays"
                    :key="day"
                    class="text-center text-xs font-semibold text-gray-500 dark:text-slate-400 py-2"
                  >
                    {{ day }}
                  </div>
                </div>

                <!-- Days grid -->
                <div class="grid grid-cols-7 gap-0.5">
                  <div
                    v-for="(date, index) in getMonthDates(nextMonth)"
                    :key="`right-${index}`"
                    :class="getDateClass(date)"
                    @click="selectDate(date)"
                    @mouseenter="handleHover(date)"
                  >
                    <span v-if="date" class="relative z-10">{{ date.getDate() }}</span>
                    <!-- Check-in badge -->
                    <span
                      v-if="date && isCheckIn(date)"
                      class="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-purple-600 dark:text-purple-400"
                      >IN</span
                    >
                    <!-- Check-out badge -->
                    <span
                      v-if="date && isCheckOut(date)"
                      class="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-purple-600 dark:text-purple-400"
                      >OUT</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Select Options -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
                {{ $t('booking.quickSelect') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in quickOptions"
                  :key="option.nights"
                  class="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                  :class="
                    option.highlight
                      ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300'
                  "
                  @click="selectQuickRange(option.nights)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div
              class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between"
            >
              <button
                class="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                @click="clearDates"
              >
                {{ $t('common.clear') }}
              </button>
              <button
                :disabled="!checkInDate || !checkOutDate"
                class="px-6 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                @click="confirmSelection"
              >
                {{ $t('common.apply') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null })
  },
  minDate: {
    type: Date,
    default: null
  },
  minNights: {
    type: Number,
    default: 1
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

// Refs
const containerRef = ref(null)
const calendarPopup = ref(null)

// State
const isOpen = ref(false)
const activeField = ref('checkin') // 'checkin' or 'checkout'
const currentMonth = ref(new Date())
const checkInDate = ref(null)
const checkOutDate = ref(null)
const hoverDate = ref(null)
const popupPosition = ref({ top: 0, left: 0 })

// Initialize from props
if (props.modelValue?.start) {
  checkInDate.value = new Date(props.modelValue.start)
}
if (props.modelValue?.end) {
  checkOutDate.value = new Date(props.modelValue.end)
}

// Computed
const nextMonth = computed(() => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() + 1)
  return date
})

const nightCount = computed(() => {
  if (checkInDate.value && checkOutDate.value) {
    const diff = Math.ceil((checkOutDate.value - checkInDate.value) / (1000 * 60 * 60 * 24))
    return diff
  }
  return 0
})

const weekDays = computed(() => {
  if (locale.value === 'tr') {
    return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
})

const months = computed(() => {
  if (locale.value === 'tr') {
    return [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık'
    ]
  }
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
})

const quickOptions = computed(() => [
  { nights: 3, label: `3 ${t('booking.nights')}`, highlight: false },
  { nights: 5, label: `5 ${t('booking.nights')}`, highlight: false },
  { nights: 7, label: `7 ${t('booking.nights')}`, highlight: true },
  { nights: 10, label: `10 ${t('booking.nights')}`, highlight: false },
  { nights: 14, label: `14 ${t('booking.nights')}`, highlight: false }
])

const popupStyle = computed(() => ({
  top: `${popupPosition.value.top}px`,
  left: `${popupPosition.value.left}px`,
  maxWidth: '700px'
}))

// Methods
const updatePopupPosition = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const popupWidth = 700
    const popupHeight = 500

    let left = rect.left
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 20
    }
    if (left < 20) left = 20

    let top = rect.bottom + 8
    if (top + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - 8
    }

    popupPosition.value = { top, left }
  }
}

const openCalendar = field => {
  activeField.value = field
  isOpen.value = true

  // Set current month based on existing selection
  if (field === 'checkin' && checkInDate.value) {
    currentMonth.value = new Date(checkInDate.value)
  } else if (field === 'checkout' && checkOutDate.value) {
    currentMonth.value = new Date(checkOutDate.value)
  } else {
    currentMonth.value = new Date()
  }

  updatePopupPosition()
}

const closeCalendar = () => {
  isOpen.value = false
  hoverDate.value = null
}

const confirmSelection = () => {
  if (checkInDate.value && checkOutDate.value) {
    emitValue()
    closeCalendar()
  }
}

const formatMonthYear = date => {
  return `${months.value[date.getMonth()]} ${date.getFullYear()}`
}

const formatDisplayDate = date => {
  if (!date) return ''
  const options = { weekday: 'short', day: 'numeric', month: 'short' }
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', options)
}

const formatShortDate = date => {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return locale.value === 'tr' ? `${day}.${month}` : `${month}/${day}`
}

const getMonthDates = month => {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)

  let startDay = firstDay.getDay()
  startDay = startDay === 0 ? 6 : startDay - 1

  const dates = []

  for (let i = 0; i < startDay; i++) {
    dates.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, monthIndex, day))
  }

  return dates
}

const getDateClass = date => {
  if (!date) return 'calendar-day-empty'

  const classes = ['calendar-day']
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateClone = new Date(date)
  dateClone.setHours(0, 0, 0, 0)

  const minDateValue = props.minDate || today

  // Disabled date (past)
  if (dateClone < minDateValue) {
    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  // Today
  if (dateClone.getTime() === today.getTime()) {
    classes.push('calendar-day-today')
  }

  // Weekend
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    classes.push('calendar-day-weekend')
  }

  // Check-in date
  if (checkInDate.value) {
    const checkIn = new Date(checkInDate.value)
    checkIn.setHours(0, 0, 0, 0)
    if (dateClone.getTime() === checkIn.getTime()) {
      classes.push('calendar-day-checkin')
    }
  }

  // Check-out date
  if (checkOutDate.value) {
    const checkOut = new Date(checkOutDate.value)
    checkOut.setHours(0, 0, 0, 0)
    if (dateClone.getTime() === checkOut.getTime()) {
      classes.push('calendar-day-checkout')
    }
  }

  // In range
  if (checkInDate.value && checkOutDate.value) {
    const checkIn = new Date(checkInDate.value)
    const checkOut = new Date(checkOutDate.value)
    checkIn.setHours(0, 0, 0, 0)
    checkOut.setHours(0, 0, 0, 0)

    if (dateClone > checkIn && dateClone < checkOut) {
      classes.push('calendar-day-in-range')
    }
  }

  // Hover range preview
  if (
    checkInDate.value &&
    !checkOutDate.value &&
    hoverDate.value &&
    activeField.value === 'checkout'
  ) {
    const checkIn = new Date(checkInDate.value)
    const hover = new Date(hoverDate.value)
    checkIn.setHours(0, 0, 0, 0)
    hover.setHours(0, 0, 0, 0)

    if (hover > checkIn && dateClone > checkIn && dateClone <= hover) {
      classes.push('calendar-day-hover-range')
    }
  }

  return classes.join(' ')
}

const isCheckIn = date => {
  if (!date || !checkInDate.value) return false
  const d = new Date(date)
  const checkIn = new Date(checkInDate.value)
  d.setHours(0, 0, 0, 0)
  checkIn.setHours(0, 0, 0, 0)
  return d.getTime() === checkIn.getTime()
}

const isCheckOut = date => {
  if (!date || !checkOutDate.value) return false
  const d = new Date(date)
  const checkOut = new Date(checkOutDate.value)
  d.setHours(0, 0, 0, 0)
  checkOut.setHours(0, 0, 0, 0)
  return d.getTime() === checkOut.getTime()
}

const selectDate = date => {
  if (!date) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateClone = new Date(date)
  dateClone.setHours(0, 0, 0, 0)

  const minDateValue = props.minDate || today
  if (dateClone < minDateValue) return

  if (activeField.value === 'checkin') {
    checkInDate.value = dateClone
    // If new check-in is after current check-out, reset check-out
    if (checkOutDate.value && dateClone >= checkOutDate.value) {
      checkOutDate.value = null
    }
    // Auto switch to checkout selection
    activeField.value = 'checkout'
  } else {
    // Check-out selection
    if (checkInDate.value && dateClone <= checkInDate.value) {
      // If selected date is before or equal to check-in, make it the new check-in
      checkInDate.value = dateClone
      checkOutDate.value = null
    } else {
      checkOutDate.value = dateClone
      // Auto close if both dates selected
      if (checkInDate.value) {
        emitValue()
        setTimeout(() => {
          closeCalendar()
        }, 200)
      }
    }
  }
}

const handleHover = date => {
  if (date) {
    hoverDate.value = date
  }
}

const selectQuickRange = nights => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = props.minDate && props.minDate > today ? new Date(props.minDate) : today
  const end = new Date(start)
  end.setDate(end.getDate() + nights)

  checkInDate.value = start
  checkOutDate.value = end

  emitValue()
  setTimeout(() => {
    closeCalendar()
  }, 200)
}

const clearDates = () => {
  checkInDate.value = null
  checkOutDate.value = null
  activeField.value = 'checkin'
  emit('update:modelValue', { start: null, end: null })
}

const emitValue = () => {
  if (checkInDate.value && checkOutDate.value) {
    const toLocalIsoDate = date => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    emit('update:modelValue', {
      start: toLocalIsoDate(checkInDate.value),
      end: toLocalIsoDate(checkOutDate.value)
    })
  }
}

const previousMonth = () => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() - 1)
  currentMonth.value = date
}

const nextMonthAction = () => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() + 1)
  currentMonth.value = date
}

const handleClickOutside = event => {
  const isInsideContainer = containerRef.value?.contains(event.target)
  const isInsidePopup = calendarPopup.value?.contains(event.target)
  if (!isInsideContainer && !isInsidePopup) {
    closeCalendar()
  }
}

// Watch props changes
watch(
  () => props.modelValue,
  newVal => {
    checkInDate.value = newVal?.start ? new Date(newVal.start) : null
    checkOutDate.value = newVal?.end ? new Date(newVal.end) : null
  },
  { deep: true }
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.booking-date-picker {
  position: relative;
}

.calendar-day {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
  color: #1f2937;
}

.dark .calendar-day {
  color: #f3f4f6;
}

.calendar-day:hover {
  background-color: #f3f4f6;
}

.dark .calendar-day:hover {
  background-color: #374151;
}

.calendar-day-empty {
  aspect-ratio: 1;
}

.calendar-day-disabled {
  color: #d1d5db;
  cursor: not-allowed;
  pointer-events: none;
}

.dark .calendar-day-disabled {
  color: #4b5563;
}

.calendar-day-today {
  font-weight: 700;
  border: 2px solid #7c3aed;
}

.calendar-day-weekend {
  color: #dc2626;
}

.dark .calendar-day-weekend {
  color: #f87171;
}

.calendar-day-checkin {
  background: linear-gradient(135deg, #7c3aed 50%, #ede9fe 50%) !important;
  color: white !important;
  font-weight: 700;
  border-radius: 0.5rem 0 0 0.5rem !important;
}

.dark .calendar-day-checkin {
  background: linear-gradient(135deg, #7c3aed 50%, rgba(124, 58, 237, 0.2) 50%) !important;
}

.calendar-day-checkout {
  background: linear-gradient(135deg, #ede9fe 50%, #7c3aed 50%) !important;
  color: white !important;
  font-weight: 700;
  border-radius: 0 0.5rem 0.5rem 0 !important;
}

.dark .calendar-day-checkout {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 50%, #7c3aed 50%) !important;
}

.calendar-day-in-range {
  background-color: #ede9fe;
  color: #5b21b6;
  border-radius: 0;
}

.dark .calendar-day-in-range {
  background-color: rgba(124, 58, 237, 0.2);
  color: #c4b5fd;
}

.calendar-day-hover-range {
  background-color: #f3e8ff;
  color: #6b21a8;
  border-radius: 0;
}

.dark .calendar-day-hover-range {
  background-color: rgba(124, 58, 237, 0.1);
  color: #c4b5fd;
}

.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: all 0.2s ease;
}

.calendar-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
