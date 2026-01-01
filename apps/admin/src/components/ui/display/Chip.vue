<template>
  <span
    class="ui-chip inline-flex items-center font-medium transition-colors"
    :class="[sizeClasses, colorClasses, shapeClasses, clickableClasses]"
    @click="handleClick"
  >
    <!-- Leading Icon -->
    <span v-if="icon" class="material-icons" :class="iconSizeClasses">
      {{ icon }}
    </span>

    <!-- Avatar -->
    <img
      v-if="avatar"
      :src="avatar"
      :alt="label"
      class="rounded-full object-cover"
      :class="avatarSizeClasses"
    />

    <!-- Label -->
    <span>
      <slot>{{ label }}</slot>
    </span>

    <!-- Trailing Icon / Close button -->
    <button
      v-if="removable"
      type="button"
      class="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      :class="closeButtonClasses"
      @click.stop="handleRemove"
    >
      <span class="material-icons" :class="closeIconSizeClasses">close</span>
    </button>

    <!-- Trailing Icon (non-removable) -->
    <span v-else-if="trailingIcon" class="material-icons" :class="iconSizeClasses">
      {{ trailingIcon }}
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  // Icons
  icon: {
    type: String,
    default: ''
  },
  trailingIcon: {
    type: String,
    default: ''
  },
  // Avatar image
  avatar: {
    type: String,
    default: ''
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
    default: 'gray',
    validator: (v) => ['gray', 'indigo', 'blue', 'green', 'red', 'amber', 'purple', 'pink', 'teal'].includes(v)
  },
  // Variant
  variant: {
    type: String,
    default: 'light',
    validator: (v) => ['light', 'solid', 'outline'].includes(v)
  },
  // Removable
  removable: {
    type: Boolean,
    default: false
  },
  // Clickable
  clickable: {
    type: Boolean,
    default: false
  },
  // Selected state
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'remove'])

// Color maps
const colorMaps = {
  light: {
    gray: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    pink: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
  },
  solid: {
    gray: 'bg-gray-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    amber: 'bg-amber-500 text-white',
    purple: 'bg-purple-600 text-white',
    pink: 'bg-pink-600 text-white',
    teal: 'bg-teal-600 text-white'
  },
  outline: {
    gray: 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-transparent',
    indigo: 'border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 bg-transparent',
    blue: 'border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-transparent',
    green: 'border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 bg-transparent',
    red: 'border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 bg-transparent',
    amber: 'border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-transparent',
    purple: 'border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-transparent',
    pink: 'border border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 bg-transparent',
    teal: 'border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 bg-transparent'
  }
}

// Classes
const colorClasses = computed(() => {
  return colorMaps[props.variant][props.color]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  }
  return sizes[props.size]
})

const shapeClasses = computed(() => 'rounded-full')

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

const avatarSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4 -ml-0.5',
    md: 'w-5 h-5 -ml-1',
    lg: 'w-6 h-6 -ml-1'
  }
  return sizes[props.size]
})

const closeButtonClasses = computed(() => {
  const sizes = {
    sm: 'p-0',
    md: 'p-0.5',
    lg: 'p-0.5'
  }
  return sizes[props.size]
})

const closeIconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

const clickableClasses = computed(() => {
  if (props.clickable || props.selected) {
    return 'cursor-pointer hover:opacity-80'
  }
  return ''
})

// Handlers
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

const handleRemove = () => {
  emit('remove')
}
</script>
