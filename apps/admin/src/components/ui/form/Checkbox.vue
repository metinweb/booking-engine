<template>
  <label
    class="ui-checkbox inline-flex items-start gap-3"
    :class="{ 'cursor-not-allowed opacity-50': disabled, 'cursor-pointer': !disabled }"
  >
    <!-- Hidden input -->
    <input
      type="checkbox"
      :checked="isChecked"
      :value="value"
      :disabled="disabled"
      :name="name"
      :indeterminate="indeterminate"
      class="sr-only peer"
      @change="handleChange"
    />

    <!-- Custom checkbox -->
    <span
      class="relative shrink-0 flex items-center justify-center rounded border-2 transition-all duration-150"
      :class="[
        checkboxSizeClasses,
        isChecked || indeterminate
          ? `${activeColorClasses} border-transparent`
          : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-500 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-500'
      ]"
    >
      <!-- Check icon -->
      <svg
        v-if="isChecked && !indeterminate"
        class="text-white"
        :class="iconSizeClasses"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>

      <!-- Indeterminate icon -->
      <svg
        v-else-if="indeterminate"
        class="text-white"
        :class="iconSizeClasses"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
      </svg>
    </span>

    <!-- Label content -->
    <span v-if="label || description || $slots.default" class="flex flex-col">
      <span :class="labelClasses">
        <slot>{{ label }}</slot>
        <span v-if="required" class="text-red-500 ml-0.5">*</span>
      </span>
      <span v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        {{ description }}
      </span>
    </span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Boolean, Array],
    default: false
  },
  value: {
    type: [String, Number, Boolean, Object],
    default: true
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: ''
  },
  indeterminate: {
    type: Boolean,
    default: false
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
    validator: (v) => ['indigo', 'green', 'blue', 'red', 'amber', 'purple'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Color classes
const colorMap = {
  indigo: 'bg-indigo-600 dark:bg-indigo-500',
  green: 'bg-green-600 dark:bg-green-500',
  blue: 'bg-blue-600 dark:bg-blue-500',
  red: 'bg-red-600 dark:bg-red-500',
  amber: 'bg-amber-500 dark:bg-amber-400',
  purple: 'bg-purple-600 dark:bg-purple-500'
}

const activeColorClasses = computed(() => colorMap[props.color])

// Size classes
const checkboxSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  return sizes[props.size]
})

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }
  return sizes[props.size]
})

const labelClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  }
  return [sizes[props.size], 'text-gray-700 dark:text-gray-300 select-none']
})

// Check if checked (support for array modelValue)
const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return props.modelValue === true || props.modelValue === props.value
})

// Handle change
const handleChange = (event) => {
  if (props.disabled) return

  let newValue

  if (Array.isArray(props.modelValue)) {
    // Array mode (multiple checkboxes)
    newValue = [...props.modelValue]
    if (event.target.checked) {
      if (!newValue.includes(props.value)) {
        newValue.push(props.value)
      }
    } else {
      const index = newValue.indexOf(props.value)
      if (index > -1) {
        newValue.splice(index, 1)
      }
    }
  } else {
    // Boolean mode
    newValue = event.target.checked
  }

  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>
