<template>
  <div ref="containerRef" class="ui-time-picker relative">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input -->
    <div
      class="relative flex items-center border rounded-lg transition-colors cursor-pointer"
      :class="[
        inputClasses,
        sizeClasses,
        error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600',
        disabled
          ? 'bg-gray-100 dark:bg-slate-700 cursor-not-allowed opacity-60'
          : 'bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
      ]"
      @click="togglePicker"
    >
      <span class="material-icons text-gray-400 dark:text-slate-500 pl-3"> schedule </span>
      <input
        type="text"
        readonly
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="flex-1 bg-transparent border-none outline-none cursor-pointer text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
        :class="inputPaddingClasses"
      />
      <button
        v-if="clearable && modelValue"
        type="button"
        class="p-1 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
        @click.stop="clearValue"
      >
        <span class="material-icons text-sm">close</span>
      </button>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-500">
      {{ error }}
    </p>

    <!-- Picker dropdown (Teleport to body) -->
    <Teleport to="body">
      <Transition name="picker">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex gap-4">
            <!-- Hours -->
            <div class="flex flex-col items-center">
              <span class="text-xs text-gray-500 dark:text-slate-400 mb-2">
                {{ hourLabel }}
              </span>
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  @click="incrementHour"
                >
                  <span class="material-icons">keyboard_arrow_up</span>
                </button>
                <input
                  type="text"
                  :value="displayHour"
                  class="w-12 h-10 text-center text-xl font-semibold bg-gray-100 dark:bg-slate-700 rounded-lg border-none outline-none text-gray-900 dark:text-white"
                  @input="handleHourInput"
                  @blur="validateHour"
                />
                <button
                  type="button"
                  class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  @click="decrementHour"
                >
                  <span class="material-icons">keyboard_arrow_down</span>
                </button>
              </div>
            </div>

            <!-- Separator -->
            <div class="flex items-center text-2xl font-semibold text-gray-400 dark:text-slate-500">
              :
            </div>

            <!-- Minutes -->
            <div class="flex flex-col items-center">
              <span class="text-xs text-gray-500 dark:text-slate-400 mb-2">
                {{ minuteLabel }}
              </span>
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  @click="incrementMinute"
                >
                  <span class="material-icons">keyboard_arrow_up</span>
                </button>
                <input
                  type="text"
                  :value="displayMinute"
                  class="w-12 h-10 text-center text-xl font-semibold bg-gray-100 dark:bg-slate-700 rounded-lg border-none outline-none text-gray-900 dark:text-white"
                  @input="handleMinuteInput"
                  @blur="validateMinute"
                />
                <button
                  type="button"
                  class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  @click="decrementMinute"
                >
                  <span class="material-icons">keyboard_arrow_down</span>
                </button>
              </div>
            </div>

            <!-- AM/PM (12-hour format) -->
            <div v-if="!use24Hour" class="flex flex-col items-center">
              <span class="text-xs text-gray-500 dark:text-slate-400 mb-2">&nbsp;</span>
              <div class="flex flex-col gap-1 mt-2">
                <button
                  type="button"
                  class="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
                  :class="
                    period === 'AM'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  "
                  @click="period = 'AM'"
                >
                  AM
                </button>
                <button
                  type="button"
                  class="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
                  :class="
                    period === 'PM'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  "
                  @click="period = 'PM'"
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <!-- Quick select presets -->
          <div
            v-if="presets && presets.length"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
          >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presets"
                :key="preset.value"
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-lg transition-colors bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400"
                @click="selectPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
          >
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              @click="cancel"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
              @click="confirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Click outside handler -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[9998]" @click="cancel"></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '' // Format: "HH:mm" or "HH:mm:ss"
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select time'
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  // 24-hour format
  use24Hour: {
    type: Boolean,
    default: true
  },
  // Minute step
  minuteStep: {
    type: Number,
    default: 1
  },
  // Min/max time
  minTime: {
    type: String,
    default: ''
  },
  maxTime: {
    type: String,
    default: ''
  },
  // Presets
  presets: {
    type: Array,
    default: null
    // Each preset: { label, value } where value is "HH:mm"
  },
  // Labels
  hourLabel: {
    type: String,
    default: 'Hour'
  },
  minuteLabel: {
    type: String,
    default: 'Minute'
  },
  confirmLabel: {
    type: String,
    default: 'OK'
  },
  cancelLabel: {
    type: String,
    default: 'Cancel'
  },
  // Validation
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  // State
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const containerRef = ref(null)
const dropdownRef = ref(null)
const isOpen = ref(false)

// Dropdown position
const dropdownStyle = ref({
  top: '0px',
  left: '0px'
})

// Dropdown height (approximate)
const DROPDOWN_HEIGHT = 280

// Calculate dropdown position
const updateDropdownPosition = () => {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  // Check if dropdown fits below
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const openAbove = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow

  if (openAbove) {
    // Open above the input
    dropdownStyle.value = {
      bottom: `${viewportHeight - rect.top + 4}px`,
      top: 'auto',
      left: `${rect.left}px`
    }
  } else {
    // Open below the input (default)
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      bottom: 'auto',
      left: `${rect.left}px`
    }
  }
}

// Internal state
const hour = ref(0)
const minute = ref(0)
const period = ref('AM')

// Parse modelValue
const parseTime = timeStr => {
  if (!timeStr) {
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  }

  const parts = timeStr.split(':')
  return {
    hour: parseInt(parts[0]) || 0,
    minute: parseInt(parts[1]) || 0
  }
}

// Initialize from modelValue
watch(
  () => props.modelValue,
  value => {
    const parsed = parseTime(value)
    hour.value = parsed.hour
    minute.value = parsed.minute

    if (!props.use24Hour) {
      if (hour.value >= 12) {
        period.value = 'PM'
        if (hour.value > 12) hour.value -= 12
      } else {
        period.value = 'AM'
        if (hour.value === 0) hour.value = 12
      }
    }
  },
  { immediate: true }
)

// Display values
const displayHour = computed(() => {
  if (props.use24Hour) {
    return hour.value.toString().padStart(2, '0')
  }
  return hour.value.toString().padStart(2, '0')
})

const displayMinute = computed(() => {
  return minute.value.toString().padStart(2, '0')
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''

  if (props.use24Hour) {
    return `${displayHour.value}:${displayMinute.value}`
  }
  return `${displayHour.value}:${displayMinute.value} ${period.value}`
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  }
  return sizes[props.size]
})

const inputPaddingClasses = computed(() => {
  const paddings = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg'
  }
  return paddings[props.size]
})

const inputClasses = computed(() => '')

// Increment/decrement
const incrementHour = () => {
  const max = props.use24Hour ? 23 : 12
  hour.value = hour.value >= max ? (props.use24Hour ? 0 : 1) : hour.value + 1
}

const decrementHour = () => {
  const min = props.use24Hour ? 0 : 1
  const max = props.use24Hour ? 23 : 12
  hour.value = hour.value <= min ? max : hour.value - 1
}

const incrementMinute = () => {
  minute.value = minute.value >= 60 - props.minuteStep ? 0 : minute.value + props.minuteStep
}

const decrementMinute = () => {
  minute.value = minute.value <= 0 ? 60 - props.minuteStep : minute.value - props.minuteStep
}

// Input handlers
const handleHourInput = event => {
  let value = parseInt(event.target.value) || 0
  const max = props.use24Hour ? 23 : 12
  const min = props.use24Hour ? 0 : 1
  hour.value = Math.min(max, Math.max(min, value))
}

const handleMinuteInput = event => {
  let value = parseInt(event.target.value) || 0
  minute.value = Math.min(59, Math.max(0, value))
}

const validateHour = () => {
  const max = props.use24Hour ? 23 : 12
  const min = props.use24Hour ? 0 : 1
  hour.value = Math.min(max, Math.max(min, hour.value))
}

const validateMinute = () => {
  minute.value = Math.min(59, Math.max(0, minute.value))
}

// Select preset
const selectPreset = value => {
  const parsed = parseTime(value)
  hour.value = parsed.hour
  minute.value = parsed.minute

  if (!props.use24Hour) {
    if (hour.value >= 12) {
      period.value = 'PM'
      if (hour.value > 12) hour.value -= 12
    } else {
      period.value = 'AM'
      if (hour.value === 0) hour.value = 12
    }
  }
}

// Toggle picker
const togglePicker = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

// Get 24-hour format value
const get24HourValue = () => {
  let h = hour.value

  if (!props.use24Hour) {
    if (period.value === 'PM' && h !== 12) {
      h += 12
    } else if (period.value === 'AM' && h === 12) {
      h = 0
    }
  }

  return `${h.toString().padStart(2, '0')}:${minute.value.toString().padStart(2, '0')}`
}

// Confirm selection
const confirm = () => {
  const value = get24HourValue()
  emit('update:modelValue', value)
  emit('change', value)
  isOpen.value = false
}

// Cancel
const cancel = () => {
  // Reset to original value
  const parsed = parseTime(props.modelValue)
  hour.value = parsed.hour
  minute.value = parsed.minute
  isOpen.value = false
}

// Clear value
const clearValue = () => {
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<style scoped>
.picker-enter-active,
.picker-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
