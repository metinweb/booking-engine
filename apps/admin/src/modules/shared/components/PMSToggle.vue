<template>
  <div class="flex items-center" :class="{ 'justify-between': fullWidth }">
    <!-- Label (Left) -->
    <label
      v-if="label && labelPosition === 'left'"
      :for="inputId"
      class="text-sm font-medium cursor-pointer select-none mr-3"
      :class="disabled ? 'text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'"
    >
      {{ label }}
    </label>

    <!-- Toggle Button -->
    <button
      :id="inputId"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :disabled="disabled"
      class="relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
      :class="[
        sizeClasses.button,
        modelValue ? activeColor : 'bg-gray-300 dark:bg-slate-600',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'focus:ring-indigo-500 dark:focus:ring-offset-slate-900'
      ]"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    >
      <span class="sr-only">{{ label }}</span>
      <span
        class="pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out"
        :class="[sizeClasses.dot, modelValue ? sizeClasses.dotTranslate : 'translate-x-0']"
      ></span>
    </button>

    <!-- Label (Right) -->
    <label
      v-if="label && labelPosition === 'right'"
      :for="inputId"
      class="text-sm font-medium cursor-pointer select-none ml-3"
      :class="disabled ? 'text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'"
    >
      {{ label }}
    </label>

    <!-- Description -->
    <span
      v-if="description"
      class="text-xs ml-2"
      :class="disabled ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'"
    >
      {{ description }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  labelPosition: {
    type: String,
    default: 'right', // 'left' | 'right'
    validator: v => ['left', 'right'].includes(v)
  },
  description: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  color: {
    type: String,
    default: 'indigo' // 'indigo' | 'green' | 'blue' | 'red'
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const inputId = `pms-toggle-${Math.random().toString(36).substr(2, 9)}`

const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      button: 'h-5 w-9',
      dot: 'h-4 w-4',
      dotTranslate: 'translate-x-4'
    },
    md: {
      button: 'h-6 w-11',
      dot: 'h-5 w-5',
      dotTranslate: 'translate-x-5'
    },
    lg: {
      button: 'h-7 w-14',
      dot: 'h-6 w-6',
      dotTranslate: 'translate-x-7'
    }
  }
  return sizes[props.size]
})

const activeColor = computed(() => {
  const colors = {
    indigo: 'bg-indigo-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600'
  }
  return colors[props.color] || colors.indigo
})

const toggle = () => {
  if (props.disabled) return
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>
