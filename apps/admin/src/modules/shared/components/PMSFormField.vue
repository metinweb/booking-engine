<template>
  <div class="space-y-1">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-slate-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Input Container -->
    <div class="relative">
      <!-- Prefix Icon -->
      <div
        v-if="prefixIcon"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <span class="material-icons text-gray-400 dark:text-slate-500 text-lg">{{
          prefixIcon
        }}</span>
      </div>

      <!-- Input -->
      <input
        v-if="type !== 'textarea'"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxlength"
        class="block w-full rounded-lg border transition-colors focus:ring-2 focus:ring-offset-0"
        :class="[
          inputClasses,
          prefixIcon ? 'pl-10' : 'pl-3',
          suffixIcon || clearable ? 'pr-10' : 'pr-3'
        ]"
        :aria-describedby="error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined"
        :aria-invalid="!!error"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Textarea -->
      <textarea
        v-else
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :maxlength="maxlength"
        class="block w-full rounded-lg border transition-colors focus:ring-2 focus:ring-offset-0 resize-none"
        :class="[inputClasses, 'px-3']"
        :aria-describedby="error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined"
        :aria-invalid="!!error"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      ></textarea>

      <!-- Suffix Icon -->
      <div
        v-if="suffixIcon && !clearable"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <span class="material-icons text-gray-400 dark:text-slate-500 text-lg">{{
          suffixIcon
        }}</span>
      </div>

      <!-- Clear Button -->
      <button
        v-if="clearable && modelValue"
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        @click="handleClear"
      >
        <span class="material-icons text-lg">close</span>
      </button>

      <!-- Character Counter -->
      <div
        v-if="showCounter && maxlength"
        class="absolute right-2 bottom-1 text-xs"
        :class="characterCount >= maxlength ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'"
      >
        {{ characterCount }}/{{ maxlength }}
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
      role="alert"
    >
      <span class="material-icons text-sm">error_outline</span>
      {{ error }}
    </p>

    <!-- Helper Text -->
    <p
      v-else-if="helper"
      :id="`${inputId}-helper`"
      class="text-sm text-gray-500 dark:text-slate-400"
    >
      {{ helper }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text' // text, email, password, number, tel, url, search, textarea
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
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
  helper: {
    type: String,
    default: ''
  },
  prefixIcon: {
    type: String,
    default: ''
  },
  suffixIcon: {
    type: String,
    default: ''
  },
  clearable: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  // Number input props
  min: {
    type: [Number, String],
    default: undefined
  },
  max: {
    type: [Number, String],
    default: undefined
  },
  step: {
    type: [Number, String],
    default: undefined
  },
  // Textarea props
  rows: {
    type: [Number, String],
    default: 3
  },
  // Character limit
  maxlength: {
    type: [Number, String],
    default: undefined
  },
  showCounter: {
    type: Boolean,
    default: false
  },
  // Styling
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
    validator: v => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'clear'])

const inputId = `pms-field-${Math.random().toString(36).substr(2, 9)}`

const characterCount = computed(() => {
  return String(props.modelValue || '').length
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'py-1.5 text-sm',
    md: 'py-2 text-base',
    lg: 'py-3 text-lg'
  }
  return sizes[props.size]
})

const inputClasses = computed(() => {
  const base = sizeClasses.value

  if (props.error) {
    return `${base} border-red-300 dark:border-red-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700`
  }

  if (props.disabled) {
    return `${base} border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500 cursor-not-allowed`
  }

  if (props.readonly) {
    return `${base} border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-default`
  }

  return `${base} border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700`
})

const handleInput = event => {
  let value = event.target.value

  // For number type, convert to number
  if (props.type === 'number' && value !== '') {
    value = Number(value)
  }

  emit('update:modelValue', value)
}

const handleBlur = event => {
  emit('blur', event)
}

const handleFocus = event => {
  emit('focus', event)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>
