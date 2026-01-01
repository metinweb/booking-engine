<template>
  <div class="ui-search-input" :class="{ 'w-full': block }">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }}
    </label>

    <div class="relative">
      <!-- Search Icon -->
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span v-if="loading" class="animate-spin">
          <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
        <span v-else class="material-icons text-gray-400" :class="iconSizeClass">
          {{ icon }}
        </span>
      </div>

      <!-- Input -->
      <input
        :id="inputId"
        ref="inputRef"
        type="text"
        :value="modelValue"
        @input="handleInput"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEscape"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
      />

      <!-- Clear Button -->
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        @click="clear"
      >
        <span class="material-icons text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg">
          close
        </span>
      </button>

      <!-- Keyboard Shortcut Hint -->
      <div
        v-if="showShortcut && !modelValue && !isFocused"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <kbd class="px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-slate-600">
          {{ shortcutKey }}
        </kbd>
      </div>
    </div>

    <!-- Suggestions Dropdown -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="showSuggestions && suggestions.length > 0"
          ref="suggestionsRef"
          :style="suggestionsStyle"
          class="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg
                 border border-gray-200 dark:border-slate-700 max-h-60 overflow-y-auto py-1"
        >
          <button
            v-for="(suggestion, index) in suggestions"
            :key="index"
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
            :class="focusedIndex === index
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'"
            @click="selectSuggestion(suggestion)"
            @mouseenter="focusedIndex = index"
          >
            <span v-if="suggestion.icon" class="material-icons text-lg">{{ suggestion.icon }}</span>
            <span>{{ typeof suggestion === 'string' ? suggestion : suggestion.label }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Help Text -->
    <p v-if="help" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDebounce } from '../composables/useDebounce'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Ara...'
  },
  label: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'search'
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  block: {
    type: Boolean,
    default: false
  },
  // Debounce
  debounce: {
    type: Number,
    default: 300
  },
  // Suggestions
  suggestions: {
    type: Array,
    default: () => []
  },
  // Keyboard shortcut
  showShortcut: {
    type: Boolean,
    default: false
  },
  shortcutKey: {
    type: String,
    default: '/'
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear', 'enter', 'select'])

// Refs
const inputRef = ref(null)
const suggestionsRef = ref(null)

// State
const isFocused = ref(false)
const focusedIndex = ref(-1)
const suggestionsPosition = ref({ top: 0, left: 0, width: 0 })

// Unique ID
const inputId = `search-${Math.random().toString(36).substr(2, 9)}`

// Debounced search
const debouncedSearch = useDebounce((value) => {
  emit('search', value)
}, props.debounce)

// Show suggestions
const showSuggestions = computed(() => {
  return isFocused.value && props.suggestions.length > 0 && props.modelValue.length > 0
})

// Icon size class
const iconSizeClass = computed(() => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }
  return sizes[props.size]
})

// Input classes
const inputClasses = computed(() => {
  const sizes = {
    sm: 'pl-9 pr-9 py-1.5 text-sm',
    md: 'pl-10 pr-10 py-2 text-sm',
    lg: 'pl-11 pr-11 py-2.5 text-base'
  }

  return [
    'w-full rounded-lg border bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors',
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800',
    'border-gray-300 dark:border-slate-600',
    sizes[props.size]
  ]
})

// Suggestions style
const suggestionsStyle = computed(() => ({
  top: `${suggestionsPosition.value.top}px`,
  left: `${suggestionsPosition.value.left}px`,
  width: `${suggestionsPosition.value.width}px`
}))

// Calculate suggestions position
const calculateSuggestionsPosition = async () => {
  await nextTick()

  if (!inputRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()

  suggestionsPosition.value = {
    top: inputRect.bottom + 4,
    left: inputRect.left,
    width: inputRect.width
  }
}

// Handle input
const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  focusedIndex.value = -1
  debouncedSearch(value)
  calculateSuggestionsPosition()
}

// Handle enter key
const handleEnter = () => {
  if (focusedIndex.value >= 0 && focusedIndex.value < props.suggestions.length) {
    selectSuggestion(props.suggestions[focusedIndex.value])
  } else {
    emit('enter', props.modelValue)
  }
}

// Handle escape key
const handleEscape = () => {
  if (props.modelValue) {
    clear()
  } else {
    inputRef.value?.blur()
  }
}

// Clear input
const clear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

// Select suggestion
const selectSuggestion = (suggestion) => {
  const value = typeof suggestion === 'string' ? suggestion : suggestion.value || suggestion.label
  emit('update:modelValue', value)
  emit('select', suggestion)
  inputRef.value?.blur()
}

// Navigate suggestions
const handleKeydown = (e) => {
  if (!showSuggestions.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, props.suggestions.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, -1)
  }
}

// Global keyboard shortcut
const handleGlobalKeydown = (e) => {
  if (props.showShortcut && e.key === props.shortcutKey && !e.ctrlKey && !e.metaKey) {
    const activeElement = document.activeElement
    const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

    if (!isInputFocused) {
      e.preventDefault()
      inputRef.value?.focus()
    }
  }
}

// Watch for focus changes
watch(isFocused, (focused) => {
  if (focused) {
    calculateSuggestionsPosition()
  } else {
    focusedIndex.value = -1
  }
})

onMounted(() => {
  inputRef.value?.addEventListener('keydown', handleKeydown)
  if (props.showShortcut) {
    document.addEventListener('keydown', handleGlobalKeydown)
  }
})

onUnmounted(() => {
  inputRef.value?.removeEventListener('keydown', handleKeydown)
  if (props.showShortcut) {
    document.removeEventListener('keydown', handleGlobalKeydown)
  }
})

// Expose
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
