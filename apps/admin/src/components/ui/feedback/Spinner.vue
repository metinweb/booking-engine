<template>
  <div class="ui-spinner inline-flex items-center justify-center" :class="containerClasses">
    <!-- Circle Spinner (default) -->
    <svg
      v-if="type === 'circle'"
      class="animate-spin"
      :class="[sizeClasses, colorClasses]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>

    <!-- Dots Spinner -->
    <div v-else-if="type === 'dots'" class="flex items-center gap-1">
      <span
        v-for="i in 3"
        :key="i"
        class="rounded-full animate-bounce"
        :class="[dotSizeClasses, colorBgClasses]"
        :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
      ></span>
    </div>

    <!-- Bars Spinner -->
    <div v-else-if="type === 'bars'" class="flex items-end gap-0.5" :class="barContainerClasses">
      <span
        v-for="i in 4"
        :key="i"
        class="rounded-sm animate-pulse"
        :class="[barSizeClasses, colorBgClasses]"
        :style="{ animationDelay: `${(i - 1) * 0.15}s`, height: `${40 + i * 15}%` }"
      ></span>
    </div>

    <!-- Ring Spinner -->
    <div
      v-else-if="type === 'ring'"
      class="rounded-full border-2 animate-spin"
      :class="[sizeClasses, ringClasses]"
    ></div>

    <!-- Label -->
    <span v-if="label" class="ml-2" :class="labelClasses">
      {{ label }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Type
  type: {
    type: String,
    default: 'circle',
    validator: v => ['circle', 'dots', 'bars', 'ring'].includes(v)
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
    validator: v => ['indigo', 'blue', 'green', 'red', 'amber', 'gray', 'white'].includes(v)
  },
  // Label
  label: {
    type: String,
    default: ''
  },
  // Center in container
  center: {
    type: Boolean,
    default: false
  }
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  return sizes[props.size]
})

const dotSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3'
  }
  return sizes[props.size]
})

const barSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-0.5',
    sm: 'w-1',
    md: 'w-1',
    lg: 'w-1.5',
    xl: 'w-2'
  }
  return sizes[props.size]
})

const barContainerClasses = computed(() => {
  const sizes = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
    xl: 'h-8'
  }
  return sizes[props.size]
})

// Color classes
const colorClasses = computed(() => {
  const colors = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    gray: 'text-gray-600 dark:text-gray-400',
    white: 'text-white'
  }
  return colors[props.color]
})

const colorBgClasses = computed(() => {
  const colors = {
    indigo: 'bg-indigo-600 dark:bg-indigo-400',
    blue: 'bg-blue-600 dark:bg-blue-400',
    green: 'bg-green-600 dark:bg-green-400',
    red: 'bg-red-600 dark:bg-red-400',
    amber: 'bg-amber-600 dark:bg-amber-400',
    gray: 'bg-gray-600 dark:bg-gray-400',
    white: 'bg-white'
  }
  return colors[props.color]
})

const ringClasses = computed(() => {
  const colors = {
    indigo: 'border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400',
    blue: 'border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400',
    green: 'border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-400',
    red: 'border-red-200 dark:border-red-800 border-t-red-600 dark:border-t-red-400',
    amber: 'border-amber-200 dark:border-amber-800 border-t-amber-600 dark:border-t-amber-400',
    gray: 'border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-400',
    white: 'border-white/30 border-t-white'
  }
  return colors[props.color]
})

const labelClasses = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }
  return [sizes[props.size], colorClasses.value]
})

const containerClasses = computed(() => {
  return props.center ? 'w-full justify-center' : ''
})
</script>
