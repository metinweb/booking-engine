<template>
  <label
    class="ui-radio inline-flex items-start gap-3"
    :class="{ 'cursor-not-allowed opacity-50': disabled, 'cursor-pointer': !disabled }"
  >
    <!-- Hidden input -->
    <input
      type="radio"
      :checked="isChecked"
      :value="value"
      :disabled="disabled"
      :name="name"
      class="sr-only peer"
      @change="handleChange"
    />

    <!-- Custom radio -->
    <span
      class="relative shrink-0 flex items-center justify-center rounded-full border-2 transition-all duration-150"
      :class="[
        radioSizeClasses,
        isChecked
          ? `${activeBorderClasses} bg-white dark:bg-slate-800`
          : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-500 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-500'
      ]"
    >
      <!-- Inner dot -->
      <span
        class="rounded-full transition-transform duration-150"
        :class="[
          dotSizeClasses,
          activeDotClasses,
          isChecked ? 'scale-100' : 'scale-0'
        ]"
      ></span>
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
    type: [String, Number, Boolean, Object],
    default: null
  },
  value: {
    type: [String, Number, Boolean, Object],
    required: true
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
const borderColorMap = {
  indigo: 'border-indigo-600 dark:border-indigo-500',
  green: 'border-green-600 dark:border-green-500',
  blue: 'border-blue-600 dark:border-blue-500',
  red: 'border-red-600 dark:border-red-500',
  amber: 'border-amber-500 dark:border-amber-400',
  purple: 'border-purple-600 dark:border-purple-500'
}

const dotColorMap = {
  indigo: 'bg-indigo-600 dark:bg-indigo-500',
  green: 'bg-green-600 dark:bg-green-500',
  blue: 'bg-blue-600 dark:bg-blue-500',
  red: 'bg-red-600 dark:bg-red-500',
  amber: 'bg-amber-500 dark:bg-amber-400',
  purple: 'bg-purple-600 dark:bg-purple-500'
}

const activeBorderClasses = computed(() => borderColorMap[props.color])
const activeDotClasses = computed(() => dotColorMap[props.color])

// Size classes
const radioSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  return sizes[props.size]
})

const dotSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
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

// Check if checked
const isChecked = computed(() => {
  return props.modelValue === props.value
})

// Handle change
const handleChange = () => {
  if (props.disabled) return
  emit('update:modelValue', props.value)
  emit('change', props.value)
}
</script>
