<template>
  <div class="ui-birth-date-picker relative">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Display Field -->
    <div
      class="w-full cursor-pointer flex items-center justify-between transition-colors border rounded-lg"
      :class="[
        sizeClasses,
        disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-700'
          : 'bg-white dark:bg-slate-800 hover:border-indigo-400',
        error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
      ]"
      @click="openPicker"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-gray-400 text-lg">cake</span>
        <span v-if="displayValue" class="text-gray-900 dark:text-white">{{ displayValue }}</span>
        <span v-else class="text-gray-400 dark:text-slate-500">{{ placeholder }}</span>
      </div>
      <span class="material-icons text-gray-400 text-lg">calendar_today</span>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500 flex items-center gap-1">
      <span class="material-icons text-sm">error</span>
      {{ error }}
    </p>

    <!-- Help Text -->
    <p v-else-if="help" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>

    <!-- Picker Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPicker" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50" @click="closePicker"></div>

          <!-- Picker Content -->
          <div
            class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <!-- Header -->
            <div class="bg-indigo-600 dark:bg-indigo-700 text-white p-4">
              <div class="text-sm opacity-80 mb-1">{{ headerLabel }}</div>
              <div class="text-2xl font-semibold">{{ headerDisplay }}</div>
            </div>

            <!-- Selectors -->
            <div class="p-4">
              <!-- Day/Month/Year Selectors -->
              <div class="grid grid-cols-3 gap-3 mb-4">
                <!-- Day -->
                <div>
                  <label
                    class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 text-center"
                  >
                    {{ dayLabel }}
                  </label>
                  <div class="relative">
                    <select
                      v-model="selectedDay"
                      class="w-full text-center appearance-none pr-8 font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}</option>
                    </select>
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span class="material-icons text-gray-400 text-sm">expand_more</span>
                    </span>
                  </div>
                </div>

                <!-- Month -->
                <div>
                  <label
                    class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 text-center"
                  >
                    {{ monthLabel }}
                  </label>
                  <div class="relative">
                    <select
                      v-model="selectedMonth"
                      class="w-full text-center appearance-none pr-8 font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option v-for="(month, index) in months" :key="index" :value="index + 1">
                        {{ month }}
                      </option>
                    </select>
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span class="material-icons text-gray-400 text-sm">expand_more</span>
                    </span>
                  </div>
                </div>

                <!-- Year -->
                <div>
                  <label
                    class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 text-center"
                  >
                    {{ yearLabel }}
                  </label>
                  <div class="relative">
                    <select
                      v-model="selectedYear"
                      class="w-full text-center appearance-none pr-8 font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span class="material-icons text-gray-400 text-sm">expand_more</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Quick Age Buttons -->
              <div v-if="showQuickAges" class="mb-4">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
                  {{ quickSelectLabel }}
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="age in quickAges"
                    :key="age"
                    type="button"
                    class="px-3 py-1.5 text-sm rounded-full border transition-colors"
                    :class="
                      currentAge === age
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600'
                    "
                    @click="setAge(age)"
                  >
                    {{ age }} {{ yearsOldLabel }}
                  </button>
                </div>
              </div>

              <!-- Age Display -->
              <div
                v-if="currentAge !== null"
                class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 mb-4"
              >
                <div
                  class="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300"
                >
                  <span class="material-icons">person</span>
                  <span class="font-medium">{{ currentAge }} {{ yearsOldLabel }}</span>
                </div>
              </div>

              <!-- Age Mismatch Warning -->
              <div
                v-if="hasAgeMismatch"
                class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4"
              >
                <div class="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                  <span class="material-icons text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                    >warning</span
                  >
                  <div>
                    <p class="font-medium">{{ ageWarningTitle }}</p>
                    <p class="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">
                      {{ ageWarningMessage }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                class="flex-1 px-4 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                @click="clearDate"
              >
                {{ clearLabel }}
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-l border-gray-200 dark:border-slate-700"
                @click="closePicker"
              >
                {{ cancelLabel }}
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-3 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-l border-gray-200 dark:border-slate-700"
                @click="confirmDate"
              >
                {{ confirmLabel }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select birth date'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  // Age constraints
  minAge: {
    type: Number,
    default: 0
  },
  maxAge: {
    type: Number,
    default: 100
  },
  // Expected age (for validation)
  expectedAge: {
    type: Number,
    default: null
  },
  // Check-in date (for age at check-in calculation)
  checkInDate: {
    type: String,
    default: ''
  },
  // Show quick age selection
  showQuickAges: {
    type: Boolean,
    default: true
  },
  // Labels (i18n support)
  headerLabel: {
    type: String,
    default: 'Birth Date'
  },
  dayLabel: {
    type: String,
    default: 'Day'
  },
  monthLabel: {
    type: String,
    default: 'Month'
  },
  yearLabel: {
    type: String,
    default: 'Year'
  },
  quickSelectLabel: {
    type: String,
    default: 'Quick Select'
  },
  yearsOldLabel: {
    type: String,
    default: 'years old'
  },
  clearLabel: {
    type: String,
    default: 'Clear'
  },
  cancelLabel: {
    type: String,
    default: 'Cancel'
  },
  confirmLabel: {
    type: String,
    default: 'Confirm'
  },
  ageWarningTitle: {
    type: String,
    default: 'Age Mismatch'
  },
  ageWarningMessage: {
    type: String,
    default: 'The age at check-in differs from the search age'
  },
  // Locale for month names
  locale: {
    type: String,
    default: 'en'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'age-change'])

const showPicker = ref(false)
const selectedDay = ref(1)
const selectedMonth = ref(1)
const selectedYear = ref(2000)

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg'
  }
  return sizes[props.size]
})

// Months
const months = computed(() => {
  const formatter = new Intl.DateTimeFormat(props.locale, { month: 'long' })
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1)
    return formatter.format(date)
  })
})

// Years (from minAge to maxAge years ago)
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - props.maxAge
  const endYear = currentYear - props.minAge
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i)
})

// Days in selected month
const daysInMonth = computed(() => {
  const days = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
})

// Quick age buttons
const quickAges = computed(() => {
  if (props.maxAge <= 17) {
    // Child mode
    return [2, 4, 6, 8, 10, 12, 14, 16]
  }
  // Adult mode
  return [18, 25, 30, 35, 40, 50, 60]
})

// Current age based on selected date
const currentAge = computed(() => {
  const today = new Date()
  const birthDate = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age : null
})

// Age at check-in date
const ageAtCheckIn = computed(() => {
  if (!props.checkInDate) return null
  const birthDate = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  const checkIn = new Date(props.checkInDate)
  let age = checkIn.getFullYear() - birthDate.getFullYear()
  const monthDiff = checkIn.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && checkIn.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age : null
})

// Check if age at check-in differs from expected age
const hasAgeMismatch = computed(() => {
  if (props.expectedAge === null || ageAtCheckIn.value === null) return false
  return ageAtCheckIn.value !== props.expectedAge
})

// Display value
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const date = new Date(props.modelValue)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(props.locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
})

// Header display
const headerDisplay = computed(() => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  return new Intl.DateTimeFormat(props.locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
})

// Set age (calculate birth date)
const setAge = age => {
  const today = new Date()
  selectedYear.value = today.getFullYear() - age
  selectedMonth.value = today.getMonth() + 1
  selectedDay.value = today.getDate()
}

// Open picker
const openPicker = () => {
  if (props.disabled) return

  if (props.modelValue) {
    const date = new Date(props.modelValue)
    if (!isNaN(date.getTime())) {
      selectedDay.value = date.getDate()
      selectedMonth.value = date.getMonth() + 1
      selectedYear.value = date.getFullYear()
    }
  } else {
    // Default to 30 years ago
    const defaultDate = new Date()
    defaultDate.setFullYear(defaultDate.getFullYear() - 30)
    selectedDay.value = defaultDate.getDate()
    selectedMonth.value = defaultDate.getMonth() + 1
    selectedYear.value = defaultDate.getFullYear()
  }

  showPicker.value = true
}

// Close picker
const closePicker = () => {
  showPicker.value = false
}

// Clear date
const clearDate = () => {
  emit('update:modelValue', '')
  emit('change', null)
  showPicker.value = false
}

// Confirm date
const confirmDate = () => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  const formatted = date.toISOString().split('T')[0]
  emit('update:modelValue', formatted)
  emit('change', date)
  emit('age-change', currentAge.value)
  showPicker.value = false
}

// Watch for day overflow when month/year changes
watch([selectedMonth, selectedYear], () => {
  const maxDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  if (selectedDay.value > maxDay) {
    selectedDay.value = maxDay
  }
})

// Expose
defineExpose({
  open: openPicker,
  close: closePicker,
  clear: clearDate,
  currentAge
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
