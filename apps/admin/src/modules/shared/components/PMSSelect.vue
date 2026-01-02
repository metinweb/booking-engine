<template>
  <div class="relative" ref="containerRef">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Select Button -->
    <button
      type="button"
      ref="buttonRef"
      :id="inputId"
      @click="toggleDropdown"
      @keydown="handleKeydown"
      class="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-left transition-colors"
      :class="[
        error
          ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
          : 'border-gray-300 dark:border-slate-600 focus:ring-indigo-500',
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : 'cursor-pointer hover:border-gray-400 dark:hover:border-slate-500'
      ]"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-labelledby="label ? inputId : undefined"
      :aria-describedby="error ? `${inputId}-error` : undefined"
    >
      <span
        class="flex-1 truncate"
        :class="selectedLabel ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <span class="material-icons text-gray-400 dark:text-slate-500 ml-2 transition-transform" :class="{ 'rotate-180': isOpen }">
        expand_more
      </span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
        role="listbox"
        :aria-labelledby="inputId"
      >
        <!-- Search Input -->
        <div v-if="searchable" class="p-2 border-b border-gray-200 dark:border-slate-700">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            :placeholder="searchPlaceholder"
            @keydown="handleSearchKeydown"
          />
        </div>

        <!-- Options -->
        <div class="overflow-y-auto max-h-48">
          <!-- Empty State -->
          <div
            v-if="filteredOptions.length === 0"
            class="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 text-center"
          >
            {{ emptyText }}
          </div>

          <!-- Options List -->
          <button
            v-for="(option, index) in filteredOptions"
            :key="getOptionValue(option)"
            type="button"
            @click="selectOption(option)"
            @mouseenter="highlightedIndex = index"
            class="w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between"
            :class="[
              index === highlightedIndex
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700',
              isSelected(option) ? 'font-medium' : ''
            ]"
            role="option"
            :aria-selected="isSelected(option)"
          >
            <span class="truncate">{{ getOptionLabel(option) }}</span>
            <span v-if="isSelected(option)" class="material-icons text-indigo-500 text-lg ml-2">check</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Error Message -->
    <p v-if="error" :id="`${inputId}-error`" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <!-- Helper Text -->
    <p v-else-if="helper" class="mt-1 text-sm text-gray-500 dark:text-slate-400">
      {{ helper }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object, null],
    default: null
  },
  options: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seciniz...'
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: 'Ara...'
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
  helper: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: 'Sonuc bulunamadi'
  },
  // For object options
  valueKey: {
    type: String,
    default: 'value'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  // Return full object or just value
  returnObject: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Refs
const containerRef = ref(null)
const buttonRef = ref(null)
const searchInputRef = ref(null)

// State
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(0)
const inputId = `pms-select-${Math.random().toString(36).substr(2, 9)}`

// Computed
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options

  const query = searchQuery.value.toLowerCase()
  return props.options.filter(option => {
    const label = getOptionLabel(option).toLowerCase()
    return label.includes(query)
  })
})

const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''

  const selectedOption = props.options.find(option => {
    const optionValue = getOptionValue(option)
    const currentValue = props.returnObject ? getOptionValue(props.modelValue) : props.modelValue
    return optionValue === currentValue
  })

  return selectedOption ? getOptionLabel(selectedOption) : ''
})

// Methods
const getOptionValue = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey]
  }
  return option
}

const getOptionLabel = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.labelKey]
  }
  return String(option)
}

const isSelected = (option) => {
  const optionValue = getOptionValue(option)
  const currentValue = props.returnObject ? getOptionValue(props.modelValue) : props.modelValue
  return optionValue === currentValue
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    highlightedIndex.value = 0
    searchQuery.value = ''
    nextTick(() => {
      if (props.searchable && searchInputRef.value) {
        searchInputRef.value.focus()
      }
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
  buttonRef.value?.focus()
}

const selectOption = (option) => {
  const value = props.returnObject ? option : getOptionValue(option)
  emit('update:modelValue', value)
  emit('change', value)
  closeDropdown()
}

const handleKeydown = (event) => {
  if (props.disabled) return

  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (isOpen.value && filteredOptions.value[highlightedIndex.value]) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      } else {
        toggleDropdown()
      }
      break
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        toggleDropdown()
      } else {
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      }
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        closeDropdown()
      }
      break
    case 'Tab':
      if (isOpen.value) {
        closeDropdown()
      }
      break
  }
}

const handleSearchKeydown = (event) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      if (filteredOptions.value[highlightedIndex.value]) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

// Click outside handler
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

// Watch for filtered options change to reset highlighted index
watch(filteredOptions, () => {
  highlightedIndex.value = 0
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
