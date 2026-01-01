<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :title="tooltip"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <!-- Loading Spinner -->
    <svg v-if="loading" class="animate-spin" :class="iconSizeClass" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <!-- Icon -->
    <span v-else class="material-icons" :class="iconSizeClass">
      {{ icon }}
    </span>

    <!-- Screen reader text -->
    <span class="sr-only">{{ tooltip || icon }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  tooltip: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'ghost',
    validator: (v) => ['ghost', 'primary', 'danger', 'warning', 'success', 'secondary'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  rounded: {
    type: String,
    default: 'lg',
    validator: (v) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'button'
  }
})

defineEmits(['click'])

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  }
  return sizes[props.size]
})

// Icon size class
const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'text-sm w-4 h-4',
    sm: 'text-base w-4 h-4',
    md: 'text-lg w-5 h-5',
    lg: 'text-xl w-5 h-5',
    xl: 'text-2xl w-6 h-6'
  }
  return sizes[props.size]
})

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    ghost: `
      text-gray-500 hover:text-gray-700 hover:bg-gray-100
      dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700
    `,
    primary: `
      text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50
      dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30
    `,
    danger: `
      text-red-500 hover:text-red-600 hover:bg-red-50
      dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30
    `,
    warning: `
      text-amber-500 hover:text-amber-600 hover:bg-amber-50
      dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30
    `,
    success: `
      text-green-500 hover:text-green-600 hover:bg-green-50
      dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30
    `,
    secondary: `
      text-gray-600 hover:text-gray-800 hover:bg-gray-200
      dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-slate-600
    `
  }
  return variants[props.variant]
})

// Rounded classes
const roundedClasses = computed(() => {
  const rounded = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }
  return rounded[props.rounded]
})

// Combined button classes
const buttonClasses = computed(() => [
  'inline-flex items-center justify-center transition-colors duration-200',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  sizeClasses.value,
  variantClasses.value,
  roundedClasses.value
])
</script>
