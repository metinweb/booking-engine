<template>
  <div class="ui-tabs">
    <!-- Tab List -->
    <div
      role="tablist"
      :class="[
        'flex',
        variant === 'pills' ? 'gap-2' : '',
        variant === 'underline' ? 'border-b border-gray-200 dark:border-slate-700' : '',
        variant === 'boxed' ? 'bg-gray-100 dark:bg-slate-800 p-1 rounded-lg' : ''
      ]"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.value"
        :aria-controls="`tabpanel-${tab.value}`"
        :disabled="tab.disabled"
        :class="getTabClasses(tab)"
        @click="selectTab(tab)"
      >
        <span v-if="tab.icon" class="material-icons" :class="iconSizeClasses">
          {{ tab.icon }}
        </span>
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined"
          class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full"
          :class="getBadgeClasses(tab)"
        >
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <!-- Tab Panels -->
    <div v-if="$slots.default" class="mt-4">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  tabs: {
    type: Array,
    required: true
    // Each tab: { value, label, icon?, badge?, disabled? }
  },
  // Variants
  variant: {
    type: String,
    default: 'underline',
    validator: v => ['underline', 'pills', 'boxed'].includes(v)
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  // Color
  color: {
    type: String,
    default: 'indigo',
    validator: v => ['indigo', 'blue', 'green', 'red', 'purple'].includes(v)
  },
  // Full width
  grow: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Color classes map
const colorMap = {
  indigo: {
    active: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-600 dark:border-indigo-400',
    bg: 'bg-indigo-600 dark:bg-indigo-500',
    pillActive: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    boxedActive: 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
  },
  blue: {
    active: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-600 dark:border-blue-400',
    bg: 'bg-blue-600 dark:bg-blue-500',
    pillActive: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    boxedActive: 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
  },
  green: {
    active: 'text-green-600 dark:text-green-400',
    border: 'border-green-600 dark:border-green-400',
    bg: 'bg-green-600 dark:bg-green-500',
    pillActive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    boxedActive: 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm'
  },
  red: {
    active: 'text-red-600 dark:text-red-400',
    border: 'border-red-600 dark:border-red-400',
    bg: 'bg-red-600 dark:bg-red-500',
    pillActive: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    boxedActive: 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm'
  },
  purple: {
    active: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-600 dark:border-purple-400',
    bg: 'bg-purple-600 dark:bg-purple-500',
    pillActive: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    boxedActive: 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
  }
}

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  }
  return sizes[props.size]
})

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-base mr-1.5',
    md: 'text-lg mr-2',
    lg: 'text-xl mr-2'
  }
  return sizes[props.size]
})

// Get tab classes
const getTabClasses = tab => {
  const isActive = props.modelValue === tab.value
  const colors = colorMap[props.color]

  const baseClasses = [
    'inline-flex items-center font-medium transition-all duration-200',
    sizeClasses.value,
    props.grow ? 'flex-1 justify-center' : '',
    tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  ]

  if (props.variant === 'underline') {
    return [
      ...baseClasses,
      'border-b-2 -mb-px',
      isActive
        ? `${colors.active} ${colors.border}`
        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
    ]
  }

  if (props.variant === 'pills') {
    return [
      ...baseClasses,
      'rounded-lg',
      isActive
        ? colors.pillActive
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
    ]
  }

  if (props.variant === 'boxed') {
    return [
      ...baseClasses,
      'rounded-md',
      isActive
        ? colors.boxedActive
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    ]
  }

  return baseClasses
}

// Get badge classes
const getBadgeClasses = tab => {
  const isActive = props.modelValue === tab.value

  if (isActive) {
    return `bg-${props.color}-600 text-white`
  }
  return 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
}

// Select tab
const selectTab = tab => {
  if (tab.disabled) return
  emit('update:modelValue', tab.value)
  emit('change', tab.value)
}
</script>
