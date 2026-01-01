<template>
  <div class="ui-password-input">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative">
      <!-- Password Input -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="showPassword ? 'text' : 'password'"
        :value="modelValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :class="[
          'w-full pl-10 pr-24 py-2.5 rounded-lg border bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors',
          'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-300 dark:border-slate-600',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : ''
        ]"
      />

      <!-- Lock Icon -->
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="material-icons text-gray-400">lock</span>
      </div>

      <!-- Action Buttons -->
      <div class="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
        <!-- Copy Button -->
        <button
          v-if="showCopy && modelValue"
          type="button"
          @click="copyPassword"
          class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
          :title="copied ? $t('common.copied') : $t('common.copy')"
        >
          <span class="material-icons text-lg">{{ copied ? 'check' : 'content_copy' }}</span>
        </button>

        <!-- Generate Button -->
        <button
          v-if="showGenerator && !disabled"
          type="button"
          @click="generatePassword"
          class="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
          :title="$t('common.generatePassword')"
        >
          <span class="material-icons text-lg">auto_awesome</span>
        </button>

        <!-- Toggle Visibility -->
        <button
          type="button"
          @click="toggleVisibility"
          class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
          :title="showPassword ? $t('common.hidePassword') : $t('common.showPassword')"
        >
          <span class="material-icons text-lg">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
        </button>
      </div>
    </div>

    <!-- Password Strength Meter -->
    <div v-if="showStrength && modelValue" class="mt-2">
      <div class="flex items-center gap-2">
        <div class="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300 rounded-full"
            :class="strengthBarClass"
            :style="{ width: `${strengthPercent}%` }"
          ></div>
        </div>
        <span class="text-xs font-medium" :class="strengthTextClass">
          {{ strengthLabel }}
        </span>
      </div>

      <!-- Requirements List -->
      <div v-if="showRequirements" class="mt-2 space-y-1">
        <div
          v-for="req in requirements"
          :key="req.key"
          class="flex items-center gap-2 text-xs"
          :class="req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'"
        >
          <span class="material-icons text-sm">{{ req.met ? 'check_circle' : 'radio_button_unchecked' }}</span>
          {{ req.label }}
        </div>
      </div>
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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
  error: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  autocomplete: {
    type: String,
    default: 'new-password'
  },
  // Feature flags
  showGenerator: {
    type: Boolean,
    default: true
  },
  showStrength: {
    type: Boolean,
    default: true
  },
  showRequirements: {
    type: Boolean,
    default: false
  },
  showCopy: {
    type: Boolean,
    default: true
  },
  // Password requirements
  minLength: {
    type: Number,
    default: 8
  },
  maxLength: {
    type: Number,
    default: 50
  },
  requireUppercase: {
    type: Boolean,
    default: true
  },
  requireLowercase: {
    type: Boolean,
    default: true
  },
  requireNumber: {
    type: Boolean,
    default: true
  },
  requireSpecial: {
    type: Boolean,
    default: false
  },
  // Generator options
  generatorLength: {
    type: Number,
    default: 12
  },
  generatorIncludeSpecial: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur', 'generate', 'strength-change'])

const { t } = useI18n()

// Refs
const inputRef = ref(null)
const showPassword = ref(false)
const copied = ref(false)
const isFocused = ref(false)

// Unique ID
const inputId = `password-${Math.random().toString(36).substr(2, 9)}`

// Character sets for generator
const CHAR_SETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // I ve O hariç (karışıklık önleme)
  lowercase: 'abcdefghjkmnpqrstuvwxyz',   // l hariç
  numbers: '23456789',                      // 0, 1 hariç
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

// Password strength calculation
const strength = computed(() => {
  const password = props.modelValue || ''
  if (!password) return 0

  let score = 0

  // Uzunluk puanı
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Karakter çeşitliliği
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Ardışık karakterler (ceza)
  if (/(.)\1{2,}/.test(password)) score -= 1

  // Normalize (0-4 arası)
  return Math.max(0, Math.min(4, Math.floor(score / 2)))
})

const strengthPercent = computed(() => {
  return (strength.value / 4) * 100
})

const strengthLabel = computed(() => {
  const labels = [
    t('password.veryWeak', 'Cok Zayif'),
    t('password.weak', 'Zayif'),
    t('password.medium', 'Orta'),
    t('password.strong', 'Guclu'),
    t('password.veryStrong', 'Cok Guclu')
  ]
  return labels[strength.value]
})

const strengthBarClass = computed(() => {
  const classes = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500'
  ]
  return classes[strength.value]
})

const strengthTextClass = computed(() => {
  const classes = [
    'text-red-500',
    'text-orange-500',
    'text-yellow-600 dark:text-yellow-400',
    'text-lime-600 dark:text-lime-400',
    'text-green-600 dark:text-green-400'
  ]
  return classes[strength.value]
})

// Requirements check
const requirements = computed(() => {
  const password = props.modelValue || ''
  const reqs = []

  reqs.push({
    key: 'minLength',
    label: t('password.minLength', { count: props.minLength }, `En az ${props.minLength} karakter`),
    met: password.length >= props.minLength
  })

  if (props.requireUppercase) {
    reqs.push({
      key: 'uppercase',
      label: t('password.requireUppercase', 'Buyuk harf icermeli'),
      met: /[A-Z]/.test(password)
    })
  }

  if (props.requireLowercase) {
    reqs.push({
      key: 'lowercase',
      label: t('password.requireLowercase', 'Kucuk harf icermeli'),
      met: /[a-z]/.test(password)
    })
  }

  if (props.requireNumber) {
    reqs.push({
      key: 'number',
      label: t('password.requireNumber', 'Rakam icermeli'),
      met: /[0-9]/.test(password)
    })
  }

  if (props.requireSpecial) {
    reqs.push({
      key: 'special',
      label: t('password.requireSpecial', 'Ozel karakter icermeli'),
      met: /[^a-zA-Z0-9]/.test(password)
    })
  }

  return reqs
})

const allRequirementsMet = computed(() => {
  return requirements.value.every(r => r.met)
})

// Methods
function handleInput(event) {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('change', value)
}

function handleFocus() {
  isFocused.value = true
  emit('focus')
}

function handleBlur() {
  isFocused.value = false
  emit('blur')
}

function toggleVisibility() {
  showPassword.value = !showPassword.value
}

function generatePassword() {
  let chars = ''

  // Karakter setlerini ekle
  chars += CHAR_SETS.uppercase
  chars += CHAR_SETS.lowercase
  chars += CHAR_SETS.numbers

  if (props.generatorIncludeSpecial) {
    chars += CHAR_SETS.special
  }

  // Rastgele şifre oluştur
  let password = ''

  // En az bir karakter her kategoriden
  password += CHAR_SETS.uppercase.charAt(Math.floor(Math.random() * CHAR_SETS.uppercase.length))
  password += CHAR_SETS.lowercase.charAt(Math.floor(Math.random() * CHAR_SETS.lowercase.length))
  password += CHAR_SETS.numbers.charAt(Math.floor(Math.random() * CHAR_SETS.numbers.length))

  if (props.generatorIncludeSpecial) {
    password += CHAR_SETS.special.charAt(Math.floor(Math.random() * CHAR_SETS.special.length))
  }

  // Kalan karakterleri rastgele doldur
  const remaining = props.generatorLength - password.length
  for (let i = 0; i < remaining; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Karakterleri karıştır
  password = password.split('').sort(() => Math.random() - 0.5).join('')

  // Şifreyi göster
  showPassword.value = true

  // Değeri güncelle
  emit('update:modelValue', password)
  emit('change', password)
  emit('generate', password)
}

async function copyPassword() {
  if (!props.modelValue) return

  try {
    await navigator.clipboard.writeText(props.modelValue)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Strength değiştiğinde emit et
watch(strength, (newStrength) => {
  emit('strength-change', newStrength)
})

// Expose
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  generate: generatePassword,
  strength,
  isValid: allRequirementsMet
})
</script>
