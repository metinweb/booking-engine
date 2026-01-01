<template>
  <div
    v-if="!dismissed"
    :class="alertClasses"
    role="alert"
  >
    <!-- Icon -->
    <div v-if="showIcon" class="flex-shrink-0">
      <span class="material-icons" :class="iconClass">{{ alertIcon }}</span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h4 v-if="title" class="font-semibold" :class="titleClass">
        {{ title }}
      </h4>
      <div :class="[title ? 'mt-1' : '', contentClass]">
        <slot>{{ message }}</slot>
      </div>

      <!-- Actions -->
      <div v-if="$slots.actions" class="mt-3">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Close Button -->
    <button
      v-if="dismissible"
      type="button"
      class="flex-shrink-0 p-1 rounded-lg transition-colors"
      :class="closeButtonClass"
      @click="dismiss"
    >
      <span class="material-icons text-lg">close</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'success', 'warning', 'error'].includes(v)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  dismissible: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'light',
    validator: (v) => ['light', 'solid', 'outline'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['dismiss'])

// State
const dismissed = ref(false)

// Alert icon based on type
const alertIcon = computed(() => {
  if (props.icon) return props.icon

  const icons = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error'
  }
  return icons[props.type]
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-3 text-sm gap-3',
    lg: 'px-5 py-4 text-base gap-4'
  }
  return sizes[props.size]
})

// Variant classes based on type
const variantClasses = computed(() => {
  const variants = {
    light: {
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    },
    solid: {
      info: 'bg-blue-600 border-blue-600 text-white',
      success: 'bg-green-600 border-green-600 text-white',
      warning: 'bg-amber-500 border-amber-500 text-white',
      error: 'bg-red-600 border-red-600 text-white'
    },
    outline: {
      info: 'bg-transparent border-blue-500 dark:border-blue-400',
      success: 'bg-transparent border-green-500 dark:border-green-400',
      warning: 'bg-transparent border-amber-500 dark:border-amber-400',
      error: 'bg-transparent border-red-500 dark:border-red-400'
    }
  }
  return variants[props.variant][props.type]
})

// Icon class
const iconClass = computed(() => {
  if (props.variant === 'solid') return 'text-white/90'

  const colors = {
    info: 'text-blue-500 dark:text-blue-400',
    success: 'text-green-500 dark:text-green-400',
    warning: 'text-amber-500 dark:text-amber-400',
    error: 'text-red-500 dark:text-red-400'
  }
  return colors[props.type]
})

// Title class
const titleClass = computed(() => {
  if (props.variant === 'solid') return 'text-white'

  const colors = {
    info: 'text-blue-800 dark:text-blue-300',
    success: 'text-green-800 dark:text-green-300',
    warning: 'text-amber-800 dark:text-amber-300',
    error: 'text-red-800 dark:text-red-300'
  }
  return colors[props.type]
})

// Content class
const contentClass = computed(() => {
  if (props.variant === 'solid') return 'text-white/90'

  const colors = {
    info: 'text-blue-700 dark:text-blue-400',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-amber-700 dark:text-amber-400',
    error: 'text-red-700 dark:text-red-400'
  }
  return colors[props.type]
})

// Close button class
const closeButtonClass = computed(() => {
  if (props.variant === 'solid') return 'hover:bg-white/20 text-white/80 hover:text-white'

  const colors = {
    info: 'hover:bg-blue-100 text-blue-500 dark:hover:bg-blue-900/50',
    success: 'hover:bg-green-100 text-green-500 dark:hover:bg-green-900/50',
    warning: 'hover:bg-amber-100 text-amber-500 dark:hover:bg-amber-900/50',
    error: 'hover:bg-red-100 text-red-500 dark:hover:bg-red-900/50'
  }
  return colors[props.type]
})

// Combined alert classes
const alertClasses = computed(() => [
  'flex items-start rounded-lg border',
  sizeClasses.value,
  variantClasses.value
])

// Dismiss
const dismiss = () => {
  dismissed.value = true
  emit('dismiss')
}

// Expose reset
defineExpose({
  reset: () => { dismissed.value = false }
})
</script>
