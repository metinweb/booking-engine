<template>
  <component
    :is="componentType"
    :to="to"
    :href="href"
    :type="type"
    :disabled="isDisabled"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <span v-if="loading" class="inline-flex items-center">
      <svg
        class="animate-spin -ml-1 mr-2 h-4 w-4"
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
    </span>

    <!-- Left Icon -->
    <span v-else-if="iconLeft" class="material-icons" :class="iconSizeClass">
      {{ iconLeft }}
    </span>

    <!-- Content -->
    <span v-if="$slots.default || label" :class="{ 'sr-only': iconOnly }">
      <slot>{{ label }}</slot>
    </span>

    <!-- Right Icon -->
    <span v-if="iconRight && !loading" class="material-icons" :class="iconSizeClass">
      {{ iconRight }}
    </span>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  // Content
  label: {
    type: String,
    default: ''
  },

  // Appearance
  variant: {
    type: String,
    default: 'primary',
    validator: v =>
      ['primary', 'secondary', 'danger', 'warning', 'success', 'ghost', 'link', 'outline'].includes(
        v
      )
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  rounded: {
    type: String,
    default: 'lg',
    validator: v => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(v)
  },

  // Icons
  iconLeft: {
    type: String,
    default: ''
  },
  iconRight: {
    type: String,
    default: ''
  },
  iconOnly: {
    type: Boolean,
    default: false
  },

  // State
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },

  // Button type
  type: {
    type: String,
    default: 'button'
  },

  // Link/Router
  to: {
    type: [String, Object],
    default: null
  },
  href: {
    type: String,
    default: null
  },

  // Full width
  block: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

// Component type based on props
const componentType = computed(() => {
  if (props.to) return RouterLink
  if (props.href) return 'a'
  return 'button'
})

// Disabled state
const isDisabled = computed(() => props.disabled || props.loading)

// Size classes
const sizeClasses = computed(() => {
  if (props.iconOnly) {
    const iconOnlySizes = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
      xl: 'p-3'
    }
    return iconOnlySizes[props.size]
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
    xl: 'px-6 py-3 text-lg gap-2.5'
  }
  return sizes[props.size]
})

// Icon size class
const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }
  return sizes[props.size]
})

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    primary: `
      bg-indigo-600 text-white
      hover:bg-indigo-700
      focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
      dark:bg-indigo-500 dark:hover:bg-indigo-600
    `,
    secondary: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
      dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-2 focus:ring-red-500 focus:ring-offset-2
      dark:bg-red-500 dark:hover:bg-red-600
    `,
    warning: `
      bg-amber-500 text-white
      hover:bg-amber-600
      focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
      dark:bg-amber-500 dark:hover:bg-amber-600
    `,
    success: `
      bg-green-600 text-white
      hover:bg-green-700
      focus:ring-2 focus:ring-green-500 focus:ring-offset-2
      dark:bg-green-500 dark:hover:bg-green-600
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
      dark:text-gray-300 dark:hover:bg-slate-700
    `,
    link: `
      bg-transparent text-indigo-600
      hover:text-indigo-700 hover:underline
      dark:text-indigo-400 dark:hover:text-indigo-300
      p-0
    `,
    outline: `
      bg-transparent text-indigo-600 border border-indigo-600
      hover:bg-indigo-50
      focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
      dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-indigo-900/30
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
const buttonClasses = computed(() => {
  return [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    sizeClasses.value,
    variantClasses.value,
    roundedClasses.value,
    props.block ? 'w-full' : ''
  ]
})

// Click handler
const handleClick = event => {
  if (!isDisabled.value) {
    emit('click', event)
  }
}
</script>
