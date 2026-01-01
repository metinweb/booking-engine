<template>
  <div class="ui-radio-group" role="radiogroup" :aria-label="label">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Options -->
    <div :class="containerClasses">
      <Radio
        v-for="option in normalizedOptions"
        :key="option.value"
        :model-value="modelValue"
        :value="option.value"
        :label="option.label"
        :description="option.description"
        :disabled="disabled || option.disabled"
        :name="name"
        :size="size"
        :color="color"
        @update:model-value="handleChange"
      />
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500 flex items-center gap-1">
      <span class="material-icons text-sm">error</span>
      {{ error }}
    </p>

    <!-- Help Text -->
    <p v-else-if="help" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Radio from './Radio.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: null
  },
  options: {
    type: Array,
    required: true
    // Each option: { value, label, description?, disabled? } or just strings
  },
  label: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: () => `radio-group-${Math.random().toString(36).substr(2, 9)}`
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  // Layout
  inline: {
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
    default: 'indigo'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Normalize options to { value, label, description?, disabled? }
const normalizedOptions = computed(() => {
  return props.options.map(option => {
    if (typeof option === 'string' || typeof option === 'number') {
      return { value: option, label: String(option) }
    }
    return option
  })
})

// Container classes
const containerClasses = computed(() => {
  const gapSizes = {
    sm: props.inline ? 'gap-4' : 'gap-2',
    md: props.inline ? 'gap-6' : 'gap-3',
    lg: props.inline ? 'gap-8' : 'gap-4'
  }

  return [
    props.inline ? 'flex flex-wrap items-center' : 'flex flex-col',
    gapSizes[props.size]
  ]
})

// Handle change
const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
