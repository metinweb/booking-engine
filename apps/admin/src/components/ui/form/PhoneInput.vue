<template>
  <div class="ui-phone-input">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative">
      <!-- Country Code Selector -->
      <div class="absolute inset-y-0 left-0 flex items-center">
        <button
          v-if="showCountryCode"
          ref="triggerRef"
          type="button"
          @click="toggleCountryDropdown"
          class="h-full px-3 flex items-center gap-1 border-r border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
          :class="{ 'bg-gray-50 dark:bg-slate-700': showCountrySelector }"
        >
          <span class="text-lg">{{ selectedCountry.flag }}</span>
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ selectedCountry.dialCode }}</span>
          <span class="material-icons text-sm text-gray-400">expand_more</span>
        </button>
      </div>

      <!-- Phone Input -->
      <input
        :id="inputId"
        ref="inputRef"
        type="tel"
        inputmode="numeric"
        :value="formattedValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @paste="handlePaste"
        @keydown="handleKeydown"
        :placeholder="placeholder || selectedCountry.placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          'w-full rounded-lg border bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors',
          'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          showCountryCode ? 'pl-28' : 'pl-10',
          'pr-10 py-2.5',
          error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-300 dark:border-slate-600',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : ''
        ]"
        autocomplete="tel"
      />

      <!-- Phone Icon (no country code) -->
      <div v-if="!showCountryCode" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="material-icons text-gray-400">phone</span>
      </div>

      <!-- Clear / Valid Icon -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
        <!-- Valid indicator -->
        <span v-if="isValid && modelValue" class="material-icons text-green-500 text-lg">check_circle</span>

        <!-- Clear button -->
        <button
          v-if="clearable && modelValue && !disabled"
          type="button"
          @click="clearValue"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <span class="material-icons text-lg">close</span>
        </button>
      </div>

    </div>

    <!-- Country Selector Dropdown (Teleport to body) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showCountrySelector"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-[9999] max-h-64 overflow-hidden"
        >
          <!-- Search -->
          <div class="p-2 border-b border-gray-200 dark:border-slate-700">
            <input
              ref="countrySearchRef"
              v-model="countrySearch"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @click.stop
            />
          </div>

          <!-- Country List -->
          <div class="overflow-y-auto max-h-48">
            <button
              v-for="country in filteredCountries"
              :key="country.code"
              type="button"
              @click="selectCountry(country)"
              class="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
              :class="{ 'bg-indigo-50 dark:bg-indigo-900/20': country.code === selectedCountry.code }"
            >
              <span class="text-xl">{{ country.flag }}</span>
              <span class="flex-1 text-sm text-gray-900 dark:text-white">{{ country.name }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ country.dialCode }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'TR'
  },
  showCountryCode: {
    type: Boolean,
    default: true
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  error: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  // E.164 format mı döndürülsün?
  e164: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur', 'country-change', 'valid'])

// Refs
const inputRef = ref(null)
const countrySearchRef = ref(null)
const triggerRef = ref(null)
const dropdownRef = ref(null)
const showCountrySelector = ref(false)
const countrySearch = ref('')
const isFocused = ref(false)

// Search placeholder
const searchPlaceholder = 'Search...'

// Dropdown position
const dropdownStyle = ref({
  top: '0px',
  left: '0px'
})

// Dropdown height (approximate)
const DROPDOWN_HEIGHT = 320

// Calculate dropdown position
const updateDropdownPosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  // Check if dropdown fits below
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const openAbove = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow

  if (openAbove) {
    // Open above the input
    dropdownStyle.value = {
      bottom: `${viewportHeight - rect.top + 4}px`,
      top: 'auto',
      left: `${rect.left}px`
    }
  } else {
    // Open below the input (default)
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      bottom: 'auto',
      left: `${rect.left}px`
    }
  }
}

// Unique ID
const inputId = `phone-${Math.random().toString(36).substr(2, 9)}`

// Countries data
const countries = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '🇹🇷', placeholder: '5XX XXX XX XX', format: 'XXX XXX XX XX', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', placeholder: '(XXX) XXX-XXXX', format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', placeholder: 'XXXX XXXXXX', format: 'XXXX XXXXXX', maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', placeholder: 'XXX XXXXXXXX', format: 'XXX XXXXXXXX', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', placeholder: 'X XX XX XX XX', format: 'X XX XX XX XX', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', placeholder: 'XXX XXX XXXX', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', placeholder: 'XXX XXX XXX', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', placeholder: 'X XXXXXXXX', format: 'X XXXXXXXX', maxLength: 9 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', placeholder: 'XXX XXX-XX-XX', format: 'XXX XXX-XX-XX', maxLength: 10 },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', placeholder: 'XX XXX XX XX', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', placeholder: 'XX XXX XXXX', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', placeholder: 'XX XXX XXXX', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', placeholder: 'XX XXXX XXXX', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', placeholder: 'XXX XXX XXXX', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', placeholder: 'XX-XXX-XXXX', format: 'XX-XXX-XXXX', maxLength: 9 },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷', placeholder: 'XXX XXX XXXX', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿', placeholder: 'XX XXX XX XX', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪', placeholder: 'XXX XX XX XX', format: 'XXX XX XX XX', maxLength: 9 },
]

// Selected country
const selectedCountryCode = ref(props.country)

const selectedCountry = computed(() => {
  return countries.find(c => c.code === selectedCountryCode.value) || countries[0]
})

const filteredCountries = computed(() => {
  if (!countrySearch.value) return countries
  const search = countrySearch.value.toLowerCase()
  return countries.filter(c =>
    c.name.toLowerCase().includes(search) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search)
  )
})

// Internal value (sadece rakamlar)
const rawValue = ref('')

// Formatlı görüntü
const formattedValue = computed(() => {
  if (!rawValue.value) return ''
  return formatPhone(rawValue.value, selectedCountry.value)
})

// E.164 format (output)
const e164Value = computed(() => {
  if (!rawValue.value) return ''
  const dialCode = selectedCountry.value.dialCode.replace('+', '')
  return `+${dialCode}${rawValue.value}`
})

// Geçerlilik
const isValid = computed(() => {
  if (!rawValue.value) return false
  return rawValue.value.length >= (selectedCountry.value.maxLength - 1)
})

// Telefon formatla
function formatPhone(value, country) {
  if (!value) return ''

  const digits = value.replace(/\D/g, '')
  let formatted = ''

  // TR formatı: 5XX XXX XX XX
  if (country.code === 'TR') {
    if (digits.length > 0) formatted += digits.substr(0, 3)
    if (digits.length > 3) formatted += ' ' + digits.substr(3, 3)
    if (digits.length > 6) formatted += ' ' + digits.substr(6, 2)
    if (digits.length > 8) formatted += ' ' + digits.substr(8, 2)
    return formatted
  }

  // US formatı: (XXX) XXX-XXXX
  if (country.code === 'US') {
    if (digits.length > 0) formatted += '(' + digits.substr(0, 3)
    if (digits.length > 3) formatted += ') ' + digits.substr(3, 3)
    if (digits.length > 6) formatted += '-' + digits.substr(6, 4)
    return formatted
  }

  // Genel format: boşlukla grupla
  const groups = country.format?.split(' ') || ['XXX', 'XXX', 'XXXX']
  let pos = 0
  const parts = []

  for (const group of groups) {
    const len = group.replace(/[^X]/g, '').length
    if (pos >= digits.length) break
    parts.push(digits.substr(pos, len))
    pos += len
  }

  return parts.join(' ')
}

// Input handler
function handleInput(event) {
  const input = event.target
  const cursorPos = input.selectionStart
  const oldLength = formattedValue.value.length

  // Sadece rakamları al
  let digits = event.target.value.replace(/\D/g, '')

  // Max uzunluk kontrolü
  if (digits.length > selectedCountry.value.maxLength) {
    digits = digits.substr(0, selectedCountry.value.maxLength)
  }

  rawValue.value = digits

  // Output değeri emit et
  const outputValue = props.e164 ? e164Value.value : digits
  emit('update:modelValue', outputValue)
  emit('change', outputValue)

  // Validasyon durumu emit et
  emit('valid', isValid.value)

  // Cursor pozisyonunu koru
  nextTick(() => {
    const newLength = formattedValue.value.length
    const diff = newLength - oldLength
    const newPos = Math.max(0, cursorPos + diff)
    input.setSelectionRange(newPos, newPos)
  })
}

// Paste handler
function handlePaste(event) {
  event.preventDefault()
  const pastedText = event.clipboardData.getData('text')
  // Sadece rakamları al
  let digits = pastedText.replace(/\D/g, '')

  // + ile başlıyorsa ve ülke koduyla eşleşiyorsa, ülke kodunu çıkar
  if (pastedText.startsWith('+')) {
    const dialCode = selectedCountry.value.dialCode.replace('+', '')
    if (digits.startsWith(dialCode)) {
      digits = digits.substr(dialCode.length)
    }
  }

  // TR için 0 ile başlıyorsa çıkar
  if (selectedCountry.value.code === 'TR' && digits.startsWith('0')) {
    digits = digits.substr(1)
  }

  // Max uzunluk
  if (digits.length > selectedCountry.value.maxLength) {
    digits = digits.substr(0, selectedCountry.value.maxLength)
  }

  rawValue.value = digits

  const outputValue = props.e164 ? e164Value.value : digits
  emit('update:modelValue', outputValue)
  emit('change', outputValue)
}

// Keydown handler (sadece rakam ve kontrol tuşları)
function handleKeydown(event) {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']

  if (allowedKeys.includes(event.key)) return
  if (event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

function handleFocus() {
  isFocused.value = true
  emit('focus')
}

function handleBlur() {
  isFocused.value = false
  emit('blur')
}

function clearValue() {
  rawValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
  inputRef.value?.focus()
}

// Country selector
function toggleCountryDropdown() {
  showCountrySelector.value = !showCountrySelector.value
  if (showCountrySelector.value) {
    countrySearch.value = ''
    updateDropdownPosition()
    nextTick(() => countrySearchRef.value?.focus())
  }
}

function selectCountry(country) {
  selectedCountryCode.value = country.code
  showCountrySelector.value = false
  emit('country-change', country.code)

  // Output değerini güncelle
  if (rawValue.value) {
    const outputValue = props.e164 ? e164Value.value : rawValue.value
    emit('update:modelValue', outputValue)
    emit('change', outputValue)
  }
}

// Click outside handler
function handleClickOutside(event) {
  const phoneInput = event.target.closest('.ui-phone-input')
  const dropdown = dropdownRef.value?.contains(event.target)
  if (!phoneInput && !dropdown) {
    showCountrySelector.value = false
  }
}

// Props'tan gelen değeri parse et
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    rawValue.value = ''
    return
  }

  let digits = newValue.replace(/\D/g, '')

  // E.164 format ise ülke kodunu çıkar
  if (newValue.startsWith('+')) {
    const dialCode = selectedCountry.value.dialCode.replace('+', '')
    if (digits.startsWith(dialCode)) {
      digits = digits.substr(dialCode.length)
    }
  }

  rawValue.value = digits
}, { immediate: true })

watch(() => props.country, (newCountry) => {
  selectedCountryCode.value = newCountry
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  isValid
})
</script>

<style scoped>
/* Override Chrome autofill background */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: inherit;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
