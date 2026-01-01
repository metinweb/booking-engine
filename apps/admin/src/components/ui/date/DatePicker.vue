<template>
  <div class="ui-date-picker" ref="containerRef">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Input Field -->
    <div class="relative">
      <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
        event
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        type="text"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        readonly
        @click="toggle"
        @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle"
        @keydown.esc="close"
      />
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        @click.stop="clear"
      >
        <span class="material-icons text-lg">close</span>
      </button>
    </div>

    <!-- Calendar Popup -->
    <Teleport to="body">
      <Transition name="calendar">
        <div
          v-if="isOpen"
          ref="calendarRef"
          :style="calendarStyle"
          class="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl
                 border border-gray-200 dark:border-slate-700 p-4"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <button
              type="button"
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              @click="prevMonth"
            >
              <span class="material-icons text-gray-600 dark:text-gray-400">chevron_left</span>
            </button>

            <div class="flex items-center gap-2">
              <!-- Month Selector -->
              <select
                v-model="viewMonth"
                class="text-sm font-semibold text-gray-800 dark:text-white bg-transparent
                       border-none focus:ring-0 cursor-pointer"
              >
                <option v-for="(month, index) in monthNames" :key="index" :value="index">
                  {{ month }}
                </option>
              </select>

              <!-- Year Selector -->
              <select
                v-model="viewYear"
                class="text-sm font-semibold text-gray-800 dark:text-white bg-transparent
                       border-none focus:ring-0 cursor-pointer"
              >
                <option v-for="year in yearRange" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>

            <button
              type="button"
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              @click="nextMonth"
            >
              <span class="material-icons text-gray-600 dark:text-gray-400">chevron_right</span>
            </button>
          </div>

          <!-- Weekday Headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
            >
              {{ day }}
            </div>
          </div>

          <!-- Calendar Days -->
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="(date, index) in calendarDays"
              :key="index"
              type="button"
              :disabled="!date || isDateDisabled(date)"
              :class="getDayClasses(date)"
              @click="date && selectDate(date)"
            >
              <span v-if="date">{{ date.getDate() }}</span>
            </button>
          </div>

          <!-- Footer -->
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <button
              type="button"
              class="text-xs px-3 py-1.5 rounded-lg font-medium
                     text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              @click="goToToday"
            >
              {{ todayLabel }}
            </button>
            <button
              v-if="clearable && modelValue"
              type="button"
              class="text-xs px-3 py-1.5 rounded-lg font-medium
                     text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              @click="clear"
            >
              {{ clearLabel }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="close"
    ></div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500 flex items-center gap-1">
      <span class="material-icons text-sm">error</span>
      {{ error }}
    </p>

    <!-- Help Text -->
    <p v-else-if="help" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: [String, Date, null],
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Tarih seciniz'
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
  help: {
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
  disabledDates: {
    type: Array,
    default: () => []
  },
  disabledDays: {
    type: Array,
    default: () => [] // 0 = Sunday, 6 = Saturday
  },
  // Format
  format: {
    type: String,
    default: 'DD.MM.YYYY'
  },
  // Labels
  todayLabel: {
    type: String,
    default: 'Bugun'
  },
  clearLabel: {
    type: String,
    default: 'Temizle'
  },
  // Year range
  yearRangeStart: {
    type: Number,
    default: () => new Date().getFullYear() - 100
  },
  yearRangeEnd: {
    type: Number,
    default: () => new Date().getFullYear() + 10
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'open', 'close'])

const { locale } = useI18n()

// Refs
const containerRef = ref(null)
const inputRef = ref(null)
const calendarRef = ref(null)

// State
const isOpen = ref(false)
const viewMonth = ref(new Date().getMonth())
const viewYear = ref(new Date().getFullYear())
const calendarPosition = ref({ top: 0, left: 0 })

// Unique ID
const inputId = `datepicker-${Math.random().toString(36).substr(2, 9)}`

// Parse model value
const parsedValue = computed(() => {
  if (!props.modelValue) return null
  if (props.modelValue instanceof Date) return props.modelValue
  return new Date(props.modelValue)
})

// Display value
const displayValue = computed(() => {
  if (!parsedValue.value) return ''
  return formatDate(parsedValue.value)
})

// Month names
const monthNames = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: 'long' })
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1)
    return formatter.format(date)
  })
})

// Weekday names
const weekDays = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2000, 0, i + 3) // Start from Monday
    return formatter.format(date)
  })
})

// Year range
const yearRange = computed(() => {
  const years = []
  for (let y = props.yearRangeStart; y <= props.yearRangeEnd; y++) {
    years.push(y)
  }
  return years
})

// Calendar days for current view
const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const lastDay = new Date(viewYear.value, viewMonth.value + 1, 0)

  // Get first day of week (0 = Sunday, adjust for Monday start)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  // Add empty slots for days before first day
  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }

  // Add days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(viewYear.value, viewMonth.value, d))
  }

  return days
})

// Calendar style
const calendarStyle = computed(() => ({
  top: `${calendarPosition.value.top}px`,
  left: `${calendarPosition.value.left}px`,
  minWidth: '300px'
}))

// Input classes
const inputClasses = computed(() => [
  'w-full pl-10 pr-10 py-2 rounded-lg border bg-white dark:bg-slate-700',
  'text-gray-900 dark:text-white text-sm cursor-pointer transition-colors',
  'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800',
  props.error
    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
    : 'border-gray-300 dark:border-slate-600'
])

// Format date
const formatDate = (date) => {
  if (!date) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return props.format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
}

// Check if date is disabled
const isDateDisabled = (date) => {
  if (!date) return true

  // Min date check
  if (props.minDate) {
    const min = props.minDate instanceof Date ? props.minDate : new Date(props.minDate)
    if (date < new Date(min.setHours(0, 0, 0, 0))) return true
  }

  // Max date check
  if (props.maxDate) {
    const max = props.maxDate instanceof Date ? props.maxDate : new Date(props.maxDate)
    if (date > new Date(max.setHours(23, 59, 59, 999))) return true
  }

  // Disabled days of week
  if (props.disabledDays.includes(date.getDay())) return true

  // Disabled specific dates
  const dateStr = date.toISOString().split('T')[0]
  if (props.disabledDates.some(d => {
    const disabledStr = d instanceof Date ? d.toISOString().split('T')[0] : d
    return dateStr === disabledStr
  })) return true

  return false
}

// Get day button classes
const getDayClasses = (date) => {
  if (!date) {
    return 'w-9 h-9'
  }

  const isSelected = parsedValue.value &&
    date.toDateString() === parsedValue.value.toDateString()
  const isToday = date.toDateString() === new Date().toDateString()
  const isDisabled = isDateDisabled(date)

  return [
    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
    isDisabled
      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
      : isSelected
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : isToday
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
  ]
}

// Calculate calendar position
const calculatePosition = async () => {
  await nextTick()

  if (!inputRef.value || !calendarRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()
  const calendarRect = calendarRef.value.getBoundingClientRect()
  const padding = 8

  let top = inputRect.bottom + 4
  let left = inputRect.left

  // Check bottom overflow
  if (top + calendarRect.height > window.innerHeight - padding) {
    top = inputRect.top - calendarRect.height - 4
  }

  // Check right overflow
  if (left + calendarRect.width > window.innerWidth - padding) {
    left = window.innerWidth - calendarRect.width - padding
  }

  calendarPosition.value = { top, left }
}

// Open calendar
const open = async () => {
  if (props.disabled) return

  isOpen.value = true

  // Set view to selected date or today
  if (parsedValue.value) {
    viewMonth.value = parsedValue.value.getMonth()
    viewYear.value = parsedValue.value.getFullYear()
  } else {
    const today = new Date()
    viewMonth.value = today.getMonth()
    viewYear.value = today.getFullYear()
  }

  emit('open')
  await calculatePosition()
}

// Close calendar
const close = () => {
  isOpen.value = false
  emit('close')
}

// Toggle calendar
const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

// Select date
const selectDate = (date) => {
  if (isDateDisabled(date)) return

  const isoDate = date.toISOString().split('T')[0]
  emit('update:modelValue', isoDate)
  emit('change', date)
  close()
}

// Clear selection
const clear = () => {
  emit('update:modelValue', null)
  emit('change', null)
}

// Go to today
const goToToday = () => {
  const today = new Date()
  viewMonth.value = today.getMonth()
  viewYear.value = today.getFullYear()

  if (!isDateDisabled(today)) {
    selectDate(today)
  }
}

// Navigate months
const prevMonth = () => {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

const nextMonth = () => {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

// Handle resize
const handleResize = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

// Handle escape key
const handleKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
})

// Expose
defineExpose({ open, close, toggle, clear })
</script>

<style scoped>
.calendar-enter-active,
.calendar-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.calendar-enter-from,
.calendar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
