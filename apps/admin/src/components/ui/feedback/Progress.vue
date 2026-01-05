<template>
  <div class="ui-progress">
    <!-- Label and value -->
    <div v-if="label || showValue" class="flex items-center justify-between mb-1.5">
      <span v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
      </span>
      <span v-if="showValue" class="text-sm text-gray-600 dark:text-gray-400">
        {{ displayValue }}
      </span>
    </div>

    <!-- Progress bar -->
    <div
      class="relative overflow-hidden rounded-full"
      :class="[trackClasses, heightClasses]"
      role="progressbar"
      :aria-valuenow="modelValue"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-label="label"
    >
      <!-- Determinate -->
      <div
        v-if="!indeterminate"
        class="absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-full"
        :class="[barClasses, stripeClasses]"
        :style="{ width: `${percentage}%` }"
      >
        <!-- Inner text (for large sizes) -->
        <span
          v-if="showInnerValue && size === 'xl'"
          class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
        >
          {{ displayValue }}
        </span>
      </div>

      <!-- Indeterminate -->
      <div
        v-else
        class="absolute inset-y-0 w-1/3 rounded-full animate-indeterminate"
        :class="barClasses"
      ></div>
    </div>

    <!-- Segments visualization -->
    <div v-if="segments && segments.length > 0" class="flex items-center gap-1 mt-2">
      <div
        v-for="(segment, index) in segments"
        :key="index"
        class="flex-1 h-1.5 rounded-full"
        :class="index < completedSegments ? barClasses : 'bg-gray-200 dark:bg-slate-600'"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  // Maximum value
  max: {
    type: Number,
    default: 100
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  // Color
  color: {
    type: String,
    default: 'indigo',
    validator: v =>
      ['indigo', 'blue', 'green', 'red', 'amber', 'purple', 'pink', 'gray'].includes(v)
  },
  // Label
  label: {
    type: String,
    default: ''
  },
  // Show value
  showValue: {
    type: Boolean,
    default: false
  },
  // Show value inside bar (for xl size)
  showInnerValue: {
    type: Boolean,
    default: false
  },
  // Value format
  valueFormat: {
    type: String,
    default: 'percent',
    validator: v => ['percent', 'value', 'fraction'].includes(v)
  },
  // Indeterminate (loading)
  indeterminate: {
    type: Boolean,
    default: false
  },
  // Striped animation
  striped: {
    type: Boolean,
    default: false
  },
  // Animated stripes
  animated: {
    type: Boolean,
    default: false
  },
  // Segments (for step-based progress)
  segments: {
    type: Array,
    default: null
  }
})

// Calculate percentage
const percentage = computed(() => {
  if (props.max === 0) return 0
  return Math.min(100, Math.max(0, (props.modelValue / props.max) * 100))
})

// Display value
const displayValue = computed(() => {
  switch (props.valueFormat) {
    case 'percent':
      return `${Math.round(percentage.value)}%`
    case 'value':
      return props.modelValue.toString()
    case 'fraction':
      return `${props.modelValue}/${props.max}`
    default:
      return `${Math.round(percentage.value)}%`
  }
})

// Completed segments
const completedSegments = computed(() => {
  if (!props.segments) return 0
  return Math.floor((percentage.value / 100) * props.segments.length)
})

// Height classes
const heightClasses = computed(() => {
  const heights = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-5'
  }
  return heights[props.size]
})

// Track classes
const trackClasses = computed(() => {
  return 'bg-gray-200 dark:bg-slate-700'
})

// Bar classes
const barClasses = computed(() => {
  const colors = {
    indigo: 'bg-indigo-600 dark:bg-indigo-500',
    blue: 'bg-blue-600 dark:bg-blue-500',
    green: 'bg-green-600 dark:bg-green-500',
    red: 'bg-red-600 dark:bg-red-500',
    amber: 'bg-amber-500 dark:bg-amber-400',
    purple: 'bg-purple-600 dark:bg-purple-500',
    pink: 'bg-pink-600 dark:bg-pink-500',
    gray: 'bg-gray-600 dark:bg-gray-500'
  }
  return colors[props.color]
})

// Stripe classes
const stripeClasses = computed(() => {
  if (!props.striped) return ''
  return props.animated ? 'progress-striped progress-animated' : 'progress-striped'
})
</script>

<style scoped>
.progress-striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

.progress-animated {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

@keyframes indeterminate {
  0% {
    left: -33%;
  }
  100% {
    left: 100%;
  }
}

.animate-indeterminate {
  animation: indeterminate 1.5s ease-in-out infinite;
}
</style>
