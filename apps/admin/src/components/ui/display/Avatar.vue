<template>
  <div class="ui-avatar relative inline-flex" :class="containerClasses">
    <!-- Image -->
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt"
      class="object-cover"
      :class="[sizeClasses, shapeClasses]"
      @error="handleImageError"
    />

    <!-- Fallback: Initials or Icon -->
    <span
      v-else
      class="flex items-center justify-center font-medium"
      :class="[sizeClasses, shapeClasses, colorClasses]"
    >
      <span v-if="initials" :class="textSizeClasses">{{ computedInitials }}</span>
      <span v-else class="material-icons" :class="iconSizeClasses">{{ icon }}</span>
    </span>

    <!-- Status Badge -->
    <span
      v-if="status"
      class="absolute block rounded-full ring-2 ring-white dark:ring-slate-800"
      :class="[statusSizeClasses, statusPositionClasses, statusColorClasses]"
    ></span>

    <!-- Custom Badge Slot -->
    <span
      v-if="$slots.badge"
      class="absolute"
      :class="badgePositionClasses"
    >
      <slot name="badge"></slot>
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  // For initials fallback
  name: {
    type: String,
    default: ''
  },
  initials: {
    type: String,
    default: ''
  },
  // Fallback icon
  icon: {
    type: String,
    default: 'person'
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(v)
  },
  // Shape
  shape: {
    type: String,
    default: 'circle',
    validator: (v) => ['circle', 'square', 'rounded'].includes(v)
  },
  // Color (for fallback background)
  color: {
    type: String,
    default: 'gray',
    validator: (v) => ['gray', 'indigo', 'blue', 'green', 'red', 'amber', 'purple', 'pink'].includes(v)
  },
  // Status indicator
  status: {
    type: String,
    default: '',
    validator: (v) => ['', 'online', 'offline', 'busy', 'away'].includes(v)
  },
  // Bordered
  bordered: {
    type: Boolean,
    default: false
  }
})

const imageError = ref(false)

// Handle image load error
const handleImageError = () => {
  imageError.value = true
}

// Compute initials from name
const computedInitials = computed(() => {
  if (props.initials) return props.initials.slice(0, 2).toUpperCase()
  if (!props.name) return ''

  const names = props.name.trim().split(' ')
  if (names.length === 1) {
    return names[0].slice(0, 2).toUpperCase()
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  }
  return sizes[props.size]
})

const textSizeClasses = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl'
  }
  return sizes[props.size]
})

const iconSizeClasses = computed(() => {
  const sizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  }
  return sizes[props.size]
})

// Shape classes
const shapeClasses = computed(() => {
  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg'
  }
  return shapes[props.shape]
})

// Color classes (for fallback)
const colorClasses = computed(() => {
  const colors = {
    gray: 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400'
  }
  return colors[props.color]
})

// Status size classes
const statusSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4'
  }
  return sizes[props.size]
})

// Status position classes
const statusPositionClasses = computed(() => {
  if (props.shape === 'circle') {
    return 'bottom-0 right-0'
  }
  return '-bottom-0.5 -right-0.5'
})

const badgePositionClasses = computed(() => {
  return '-top-1 -right-1'
})

// Status color classes
const statusColorClasses = computed(() => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500'
  }
  return colors[props.status] || ''
})

// Container classes
const containerClasses = computed(() => {
  return props.bordered ? 'ring-2 ring-white dark:ring-slate-800' : ''
})
</script>
