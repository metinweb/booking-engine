<template>
  <div ref="containerRef" class="ui-date-range-picker">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Input Fields -->
    <div class="flex items-center gap-2">
      <!-- Start Date Input -->
      <div class="relative flex-1">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          event
        </span>
        <input
          ref="startInputRef"
          type="text"
          :value="displayStartDate"
          :placeholder="startPlaceholder"
          :disabled="disabled"
          :class="inputClasses"
          readonly
          @click="openStart"
        />
      </div>

      <!-- Arrow -->
      <span class="material-icons text-gray-400">arrow_forward</span>

      <!-- End Date Input -->
      <div class="relative flex-1">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          event
        </span>
        <input
          ref="endInputRef"
          type="text"
          :value="displayEndDate"
          :placeholder="endPlaceholder"
          :disabled="disabled"
          :class="inputClasses"
          readonly
          @click="openEnd"
        />
      </div>

      <!-- Clear Button -->
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        @click="clear"
      >
        <span class="material-icons">close</span>
      </button>
    </div>

    <!-- Quick Select Buttons -->
    <div v-if="showPresets && presets.length > 0" class="flex flex-wrap gap-2 mt-2">
      <button
        v-for="preset in presets"
        :key="preset.key"
        type="button"
        class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
        :class="
          isPresetActive(preset)
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
        "
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </button>
    </div>

    <!-- Calendar Popup -->
    <Teleport to="body">
      <Transition name="calendar">
        <div
          v-if="isOpen"
          ref="calendarRef"
          :style="calendarStyle"
          class="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <!-- Two Month Calendar -->
          <div class="flex gap-6">
            <!-- Left Month -->
            <div class="calendar-month">
              <div class="flex items-center justify-between mb-4">
                <button
                  type="button"
                  class="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  @click="prevMonth"
                >
                  <span class="material-icons text-gray-600 dark:text-gray-400">chevron_left</span>
                </button>
                <span class="font-semibold text-gray-800 dark:text-white">
                  {{ formatMonthYear(viewDate) }}
                </span>
                <div class="w-8"></div>
              </div>

              <!-- Weekdays -->
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div
                  v-for="day in weekDays"
                  :key="day"
                  class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                >
                  {{ day }}
                </div>
              </div>

              <!-- Days -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="(date, index) in leftMonthDays"
                  :key="'left-' + index"
                  type="button"
                  :disabled="!date || isDateDisabled(date)"
                  :class="getDayClasses(date)"
                  @click="date && handleDateClick(date)"
                  @mouseenter="date && handleDateHover(date)"
                >
                  <span v-if="date">{{ date.getDate() }}</span>
                </button>
              </div>
            </div>

            <!-- Right Month -->
            <div class="calendar-month">
              <div class="flex items-center justify-between mb-4">
                <div class="w-8"></div>
                <span class="font-semibold text-gray-800 dark:text-white">
                  {{ formatMonthYear(nextMonthDate) }}
                </span>
                <button
                  type="button"
                  class="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  @click="nextMonth"
                >
                  <span class="material-icons text-gray-600 dark:text-gray-400">chevron_right</span>
                </button>
              </div>

              <!-- Weekdays -->
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div
                  v-for="day in weekDays"
                  :key="day"
                  class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                >
                  {{ day }}
                </div>
              </div>

              <!-- Days -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="(date, index) in rightMonthDays"
                  :key="'right-' + index"
                  type="button"
                  :disabled="!date || isDateDisabled(date)"
                  :class="getDayClasses(date)"
                  @click="date && handleDateClick(date)"
                  @mouseenter="date && handleDateHover(date)"
                >
                  <span v-if="date">{{ date.getDate() }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <template v-if="tempStartDate && tempEndDate">
                {{ formatDate(tempStartDate) }} - {{ formatDate(tempEndDate) }}
                <span class="text-gray-400 ml-2">({{ nightCount }} gece)</span>
              </template>
              <template v-else-if="tempStartDate"> {{ formatDate(tempStartDate) }} - ? </template>
              <template v-else> Tarih araligini seciniz </template>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                @click="close"
              >
                Vazgec
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                :disabled="!tempStartDate || !tempEndDate"
                @click="confirm"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="close"></div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500 flex items-center gap-1">
      <span class="material-icons text-sm">error</span>
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  // v-model desteği - object olarak { start, end }
  modelValue: {
    type: Object,
    default: null
  },
  // Legacy props - geriye uyumluluk için
  startDate: {
    type: [String, Date, null],
    default: null
  },
  endDate: {
    type: [String, Date, null],
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  startPlaceholder: {
    type: String,
    default: 'Giris tarihi'
  },
  endPlaceholder: {
    type: String,
    default: 'Cikis tarihi'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  error: {
    type: String,
    default: ''
  },
  // Date constraints
  minDate: {
    type: [String, Date],
    default: null
  },
  maxDate: {
    type: [String, Date],
    default: null
  },
  minNights: {
    type: Number,
    default: 1
  },
  maxNights: {
    type: Number,
    default: null
  },
  disabledDates: {
    type: Array,
    default: () => []
  },
  // Presets
  showPresets: {
    type: Boolean,
    default: true
  },
  presets: {
    type: Array,
    default: () => [
      { key: 'today', label: 'Bugun', days: 1 },
      { key: 'tomorrow', label: 'Yarin', days: 1, offset: 1 },
      { key: 'thisWeek', label: 'Bu Hafta', days: 7 },
      { key: 'nextWeek', label: 'Gelecek Hafta', days: 7, offset: 7 },
      { key: 'thisMonth', label: 'Bu Ay', days: 30 }
    ]
  },
  // Format
  format: {
    type: String,
    default: 'DD.MM.YYYY'
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:startDate',
  'update:endDate',
  'change',
  'open',
  'close'
])

// v-model veya legacy props kullanımını belirle
const useModelValue = computed(
  () => props.modelValue !== null || (!props.startDate && !props.endDate)
)

const { locale } = useI18n()

// Refs
const containerRef = ref(null)
const startInputRef = ref(null)
const endInputRef = ref(null)
const calendarRef = ref(null)

// State
const isOpen = ref(false)
const activeInput = ref('start') // 'start' or 'end'
const viewDate = ref(new Date())
const tempStartDate = ref(null)
const tempEndDate = ref(null)
const hoverDate = ref(null)
const calendarPosition = ref({ top: 0, left: 0 })

// Parse dates - v-model veya legacy props'tan
const parsedStartDate = computed(() => {
  // v-model kullanılıyorsa
  if (useModelValue.value) {
    const start = props.modelValue?.start
    if (!start) return null
    return start instanceof Date ? start : new Date(start)
  }
  // Legacy props
  if (!props.startDate) return null
  return props.startDate instanceof Date ? props.startDate : new Date(props.startDate)
})

const parsedEndDate = computed(() => {
  // v-model kullanılıyorsa
  if (useModelValue.value) {
    const end = props.modelValue?.end
    if (!end) return null
    return end instanceof Date ? end : new Date(end)
  }
  // Legacy props
  if (!props.endDate) return null
  return props.endDate instanceof Date ? props.endDate : new Date(props.endDate)
})

// Display values
const displayStartDate = computed(() => formatDate(parsedStartDate.value))
const displayEndDate = computed(() => formatDate(parsedEndDate.value))

// Has value check for clear button
const hasValue = computed(() => parsedStartDate.value || parsedEndDate.value)

// Next month date
const nextMonthDate = computed(() => {
  const date = new Date(viewDate.value)
  date.setMonth(date.getMonth() + 1)
  return date
})

// Night count
const nightCount = computed(() => {
  if (!tempStartDate.value || !tempEndDate.value) return 0
  const diff = tempEndDate.value.getTime() - tempStartDate.value.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

// Weekday names
const weekDays = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2000, 0, i + 3)
    return formatter.format(date)
  })
})

// Calendar days for left month
const leftMonthDays = computed(() => getMonthDays(viewDate.value))

// Calendar days for right month
const rightMonthDays = computed(() => getMonthDays(nextMonthDate.value))

// Get month days
const getMonthDays = monthDate => {
  const days = []
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d))
  }

  return days
}

// Input classes
const inputClasses = computed(() => [
  'w-full pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-slate-700',
  'text-gray-900 dark:text-white text-sm cursor-pointer transition-colors',
  'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  props.error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
])

// Calendar style
const calendarStyle = computed(() => ({
  top: `${calendarPosition.value.top}px`,
  left: `${calendarPosition.value.left}px`
}))

// Format date
const formatDate = date => {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return props.format.replace('DD', day).replace('MM', month).replace('YYYY', year)
}

// Format month year
const formatMonthYear = date => {
  return new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(date)
}

// Check if date is disabled
const isDateDisabled = date => {
  if (!date) return true

  if (props.minDate) {
    const min = props.minDate instanceof Date ? props.minDate : new Date(props.minDate)
    if (date < new Date(min.setHours(0, 0, 0, 0))) return true
  }

  if (props.maxDate) {
    const max = props.maxDate instanceof Date ? props.maxDate : new Date(props.maxDate)
    if (date > new Date(max.setHours(23, 59, 59, 999))) return true
  }

  const dateStr = date.toISOString().split('T')[0]
  if (
    props.disabledDates.some(d => {
      const disabledStr = d instanceof Date ? d.toISOString().split('T')[0] : d
      return dateStr === disabledStr
    })
  )
    return true

  return false
}

// Check if date is in range
const isInRange = date => {
  if (!date) return false

  const start = tempStartDate.value
  const end = tempEndDate.value || hoverDate.value

  if (!start || !end) return false

  const dateTime = date.getTime()
  const startTime = start.getTime()
  const endTime = end.getTime()

  return dateTime > Math.min(startTime, endTime) && dateTime < Math.max(startTime, endTime)
}

// Get day classes
const getDayClasses = date => {
  if (!date) return 'w-9 h-9'

  const isDisabled = isDateDisabled(date)
  const isStart = tempStartDate.value && date.toDateString() === tempStartDate.value.toDateString()
  const isEnd = tempEndDate.value && date.toDateString() === tempEndDate.value.toDateString()
  const inRange = isInRange(date)
  const isToday = date.toDateString() === new Date().toDateString()

  return [
    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
    isDisabled
      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
      : isStart || isEnd
        ? 'bg-indigo-600 text-white'
        : inRange
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : isToday
            ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
  ]
}

// Check if preset is active
const isPresetActive = preset => {
  if (!parsedStartDate.value || !parsedEndDate.value) return false
  const { start, end } = getPresetDates(preset)
  return (
    parsedStartDate.value.toDateString() === start.toDateString() &&
    parsedEndDate.value.toDateString() === end.toDateString()
  )
}

// Get preset dates
const getPresetDates = preset => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(start.getDate() + (preset.offset || 0))

  const end = new Date(start)
  end.setDate(end.getDate() + preset.days - 1)

  return { start, end }
}

// Emit helper - hem v-model hem legacy destekle
const emitDates = (startDate, endDate) => {
  const startStr = startDate ? startDate.toISOString().split('T')[0] : null
  const endStr = endDate ? endDate.toISOString().split('T')[0] : null

  // v-model emit
  emit('update:modelValue', { start: startStr, end: endStr })
  // Legacy emit
  emit('update:startDate', startStr)
  emit('update:endDate', endStr)
  // Change event
  emit('change', { startDate, endDate })
}

// Apply preset
const applyPreset = preset => {
  const { start, end } = getPresetDates(preset)
  emitDates(start, end)
}

// Calculate position
const calculatePosition = async () => {
  await nextTick()

  if (!startInputRef.value || !calendarRef.value) return

  const inputRect = startInputRef.value.getBoundingClientRect()
  const calendarRect = calendarRef.value.getBoundingClientRect()
  const padding = 8

  let top = inputRect.bottom + 4
  let left = inputRect.left

  if (top + calendarRect.height > window.innerHeight - padding) {
    top = inputRect.top - calendarRect.height - 4
  }

  if (left + calendarRect.width > window.innerWidth - padding) {
    left = window.innerWidth - calendarRect.width - padding
  }

  calendarPosition.value = { top, left }
}

// Open calendar
const open = async () => {
  if (props.disabled) return

  isOpen.value = true
  tempStartDate.value = parsedStartDate.value
  tempEndDate.value = parsedEndDate.value

  if (parsedStartDate.value) {
    viewDate.value = new Date(parsedStartDate.value)
  } else {
    viewDate.value = new Date()
  }

  emit('open')
  await calculatePosition()
}

const openStart = () => {
  activeInput.value = 'start'
  open()
}

const openEnd = () => {
  activeInput.value = 'end'
  open()
}

// Close calendar
const close = () => {
  isOpen.value = false
  hoverDate.value = null
  emit('close')
}

// Confirm selection
const confirm = () => {
  if (!tempStartDate.value || !tempEndDate.value) return
  emitDates(tempStartDate.value, tempEndDate.value)
  close()
}

// Clear selection
const clear = () => {
  emitDates(null, null)
}

// Handle date click
const handleDateClick = date => {
  if (isDateDisabled(date)) return

  if (!tempStartDate.value || (tempStartDate.value && tempEndDate.value)) {
    // Start new selection
    tempStartDate.value = date
    tempEndDate.value = null
  } else {
    // Complete selection
    if (date < tempStartDate.value) {
      tempEndDate.value = tempStartDate.value
      tempStartDate.value = date
    } else {
      tempEndDate.value = date
    }
  }
}

// Handle date hover
const handleDateHover = date => {
  if (tempStartDate.value && !tempEndDate.value) {
    hoverDate.value = date
  }
}

// Navigate months
const prevMonth = () => {
  const newDate = new Date(viewDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  viewDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(viewDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  viewDate.value = newDate
}

// Handle resize
const handleResize = () => {
  if (isOpen.value) calculatePosition()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Expose
defineExpose({ open, close, clear })
</script>

<style scoped>
.calendar-enter-active,
.calendar-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.calendar-enter-from,
.calendar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
