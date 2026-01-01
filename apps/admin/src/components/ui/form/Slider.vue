<template>
  <div class="ui-slider" :class="{ 'opacity-50 cursor-not-allowed': disabled }">
    <!-- Label -->
    <div v-if="label || showValue" class="flex items-center justify-between mb-2">
      <label v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
      </label>
      <span v-if="showValue" class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ formatValue(modelValue) }}
      </span>
    </div>

    <!-- Slider container -->
    <div
      ref="sliderRef"
      class="relative flex items-center cursor-pointer"
      :class="heightClasses"
      @mousedown="handleMouseDown"
      @touchstart.passive="handleTouchStart"
    >
      <!-- Track -->
      <div class="absolute w-full rounded-full" :class="[trackHeightClasses, trackClasses]"></div>

      <!-- Filled track -->
      <div
        class="absolute left-0 rounded-full"
        :class="[trackHeightClasses, filledClasses]"
        :style="{ width: `${percentage}%` }"
      ></div>

      <!-- Marks -->
      <template v-if="marks && marks.length > 0">
        <div
          v-for="mark in marks"
          :key="mark.value"
          class="absolute w-0.5 h-2 -translate-x-1/2 bg-gray-400 dark:bg-slate-500"
          :style="{ left: `${getMarkPosition(mark.value)}%` }"
        ></div>
        <div class="absolute w-full flex justify-between mt-6 text-xs text-gray-500 dark:text-slate-400">
          <span
            v-for="mark in marks"
            :key="mark.value"
            class="absolute -translate-x-1/2"
            :style="{ left: `${getMarkPosition(mark.value)}%` }"
          >
            {{ mark.label || mark.value }}
          </span>
        </div>
      </template>

      <!-- Step indicators -->
      <template v-if="showSteps && step > 0">
        <div
          v-for="stepMark in stepMarks"
          :key="stepMark"
          class="absolute w-1 h-1 -translate-x-1/2 rounded-full"
          :class="stepMark <= modelValue ? filledClasses : 'bg-gray-300 dark:bg-slate-500'"
          :style="{ left: `${getMarkPosition(stepMark)}%` }"
        ></div>
      </template>

      <!-- Thumb -->
      <div
        class="absolute -translate-x-1/2 rounded-full shadow-md transition-transform
               hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="[thumbClasses, thumbSizeClasses]"
        :style="{ left: `${percentage}%` }"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="modelValue"
        :aria-label="label"
        @keydown="handleKeyDown"
      >
        <!-- Tooltip -->
        <div
          v-if="showTooltip && (isDragging || tooltipAlways)"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap"
        >
          {{ formatValue(modelValue) }}
          <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-slate-700"></div>
        </div>
      </div>
    </div>

    <!-- Range display -->
    <div v-if="showRange" class="flex justify-between mt-1 text-xs text-gray-500 dark:text-slate-400">
      <span>{{ formatValue(min) }}</span>
      <span>{{ formatValue(max) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  // Range
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  // Step
  step: {
    type: Number,
    default: 1
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  // Color
  color: {
    type: String,
    default: 'indigo',
    validator: (v) => ['indigo', 'blue', 'green', 'red', 'amber', 'purple'].includes(v)
  },
  // Label
  label: {
    type: String,
    default: ''
  },
  // Show current value
  showValue: {
    type: Boolean,
    default: false
  },
  // Show tooltip on drag
  showTooltip: {
    type: Boolean,
    default: false
  },
  // Always show tooltip
  tooltipAlways: {
    type: Boolean,
    default: false
  },
  // Show min/max range
  showRange: {
    type: Boolean,
    default: false
  },
  // Show step indicators
  showSteps: {
    type: Boolean,
    default: false
  },
  // Marks
  marks: {
    type: Array,
    default: null
    // Each mark: { value, label? }
  },
  // Value formatter
  formatter: {
    type: Function,
    default: null
  },
  // Disabled
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const sliderRef = ref(null)
const isDragging = ref(false)

// Calculate percentage
const percentage = computed(() => {
  if (props.max === props.min) return 0
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

// Step marks for visualization
const stepMarks = computed(() => {
  if (props.step <= 0) return []
  const marks = []
  for (let i = props.min; i <= props.max; i += props.step) {
    marks.push(i)
  }
  return marks
})

// Get mark position
const getMarkPosition = (value) => {
  if (props.max === props.min) return 0
  return ((value - props.min) / (props.max - props.min)) * 100
}

// Format value
const formatValue = (value) => {
  if (props.formatter) {
    return props.formatter(value)
  }
  return value.toString()
}

// Height classes
const heightClasses = computed(() => {
  const heights = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6'
  }
  return heights[props.size]
})

// Track height classes
const trackHeightClasses = computed(() => {
  const heights = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2'
  }
  return heights[props.size]
})

// Thumb size classes
const thumbSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  return sizes[props.size]
})

// Track classes
const trackClasses = computed(() => {
  return 'bg-gray-200 dark:bg-slate-600'
})

// Filled track classes
const filledClasses = computed(() => {
  const colors = {
    indigo: 'bg-indigo-600 dark:bg-indigo-500',
    blue: 'bg-blue-600 dark:bg-blue-500',
    green: 'bg-green-600 dark:bg-green-500',
    red: 'bg-red-600 dark:bg-red-500',
    amber: 'bg-amber-500 dark:bg-amber-400',
    purple: 'bg-purple-600 dark:bg-purple-500'
  }
  return colors[props.color]
})

// Thumb classes
const thumbClasses = computed(() => {
  const colors = {
    indigo: 'bg-indigo-600 dark:bg-indigo-500 focus:ring-indigo-500',
    blue: 'bg-blue-600 dark:bg-blue-500 focus:ring-blue-500',
    green: 'bg-green-600 dark:bg-green-500 focus:ring-green-500',
    red: 'bg-red-600 dark:bg-red-500 focus:ring-red-500',
    amber: 'bg-amber-500 dark:bg-amber-400 focus:ring-amber-500',
    purple: 'bg-purple-600 dark:bg-purple-500 focus:ring-purple-500'
  }
  return colors[props.color]
})

// Calculate value from position
const calculateValue = (clientX) => {
  if (!sliderRef.value || props.disabled) return

  const rect = sliderRef.value.getBoundingClientRect()
  const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  let value = props.min + percent * (props.max - props.min)

  // Apply step
  if (props.step > 0) {
    value = Math.round(value / props.step) * props.step
  }

  // Clamp to range
  value = Math.min(props.max, Math.max(props.min, value))

  // Round to avoid floating point issues
  value = Math.round(value * 1000) / 1000

  return value
}

// Update value
const updateValue = (clientX) => {
  const value = calculateValue(clientX)
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}

// Mouse handlers
const handleMouseDown = (event) => {
  if (props.disabled) return
  isDragging.value = true
  updateValue(event.clientX)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event) => {
  if (isDragging.value) {
    updateValue(event.clientX)
  }
}

const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    emit('change', props.modelValue)
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Touch handlers
const handleTouchStart = (event) => {
  if (props.disabled) return
  isDragging.value = true
  updateValue(event.touches[0].clientX)

  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', handleTouchEnd)
}

const handleTouchMove = (event) => {
  if (isDragging.value) {
    updateValue(event.touches[0].clientX)
  }
}

const handleTouchEnd = () => {
  if (isDragging.value) {
    isDragging.value = false
    emit('change', props.modelValue)
  }
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

// Keyboard handler
const handleKeyDown = (event) => {
  if (props.disabled) return

  let newValue = props.modelValue
  const stepSize = props.step || 1

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      newValue = Math.min(props.max, props.modelValue + stepSize)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      newValue = Math.max(props.min, props.modelValue - stepSize)
      break
    case 'Home':
      newValue = props.min
      break
    case 'End':
      newValue = props.max
      break
    default:
      return
  }

  event.preventDefault()
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>
