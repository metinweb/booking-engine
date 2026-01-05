<template>
  <div
    class="ui-rating inline-flex items-center gap-0.5"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    role="slider"
    :aria-label="label || 'Rating'"
    :aria-valuenow="modelValue"
    :aria-valuemin="0"
    :aria-valuemax="max"
  >
    <!-- Label -->
    <span v-if="label" class="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </span>

    <!-- Stars/Icons -->
    <button
      v-for="index in max"
      :key="index"
      type="button"
      class="transition-all duration-150 focus:outline-none"
      :class="[
        sizeClasses,
        !disabled && !readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'
      ]"
      :disabled="disabled"
      @click="handleClick(index)"
      @mouseenter="handleHover(index)"
      @mouseleave="handleHover(0)"
    >
      <!-- Full icon -->
      <span
        v-if="getIconState(index) === 'full'"
        class="material-icons"
        :class="activeColorClasses"
      >
        {{ icon }}
      </span>

      <!-- Half icon -->
      <span v-else-if="getIconState(index) === 'half'" class="relative inline-block">
        <span class="material-icons" :class="inactiveColorClasses">{{ iconEmpty || icon }}</span>
        <span class="absolute inset-0 overflow-hidden" style="width: 50%">
          <span class="material-icons" :class="activeColorClasses">{{ icon }}</span>
        </span>
      </span>

      <!-- Empty icon -->
      <span v-else class="material-icons" :class="inactiveColorClasses">
        {{ iconEmpty || icon }}
      </span>
    </button>

    <!-- Value display -->
    <span v-if="showValue" class="ml-2 text-sm text-gray-600 dark:text-gray-400">
      {{ displayValue }}
    </span>

    <!-- Count display -->
    <span v-if="count !== null" class="ml-1 text-sm text-gray-500 dark:text-gray-500">
      ({{ count }})
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  // Maximum value
  max: {
    type: Number,
    default: 5
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
    default: 'amber',
    validator: v => ['amber', 'yellow', 'red', 'pink', 'indigo', 'blue', 'green'].includes(v)
  },
  // Icons
  icon: {
    type: String,
    default: 'star'
  },
  iconEmpty: {
    type: String,
    default: '' // Uses icon with outline style if empty
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
  // Review count
  count: {
    type: Number,
    default: null
  },
  // Allow half values
  allowHalf: {
    type: Boolean,
    default: false
  },
  // Allow clearing (click same value to clear)
  clearable: {
    type: Boolean,
    default: false
  },
  // Read-only
  readonly: {
    type: Boolean,
    default: false
  },
  // Disabled
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const hoveredValue = ref(0)

// Display value with current state
const displayValue = computed(() => {
  const value = hoveredValue.value || props.modelValue
  if (props.allowHalf) {
    return value.toFixed(1)
  }
  return value.toString()
})

// Get icon state for each position
const getIconState = index => {
  const activeValue = hoveredValue.value || props.modelValue

  if (activeValue >= index) {
    return 'full'
  }

  if (props.allowHalf && activeValue >= index - 0.5) {
    return 'half'
  }

  return 'empty'
}

// Handle click
const handleClick = index => {
  if (props.disabled || props.readonly) return

  let newValue = index

  // Allow clearing
  if (props.clearable && props.modelValue === index) {
    newValue = 0
  }

  // Allow half values
  if (props.allowHalf) {
    // If clicking on the left half of a star, set to .5
    // This is simplified - you could add mouse position detection for more precision
    if (props.modelValue === index) {
      newValue = index - 0.5
    } else if (props.modelValue === index - 0.5) {
      newValue = props.clearable ? 0 : index
    }
  }

  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}

// Handle hover
const handleHover = index => {
  if (props.disabled || props.readonly) return
  hoveredValue.value = index
}

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }
  return sizes[props.size]
})

// Active color classes
const activeColorClasses = computed(() => {
  const colors = {
    amber: 'text-amber-400',
    yellow: 'text-yellow-400',
    red: 'text-red-500',
    pink: 'text-pink-500',
    indigo: 'text-indigo-500',
    blue: 'text-blue-500',
    green: 'text-green-500'
  }
  return colors[props.color]
})

// Inactive color classes
const inactiveColorClasses = computed(() => {
  return 'text-gray-300 dark:text-slate-600'
})
</script>
