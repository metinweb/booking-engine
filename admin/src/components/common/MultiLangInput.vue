<template>
  <div class="space-y-3">
    <!-- Header with label and translate button -->
    <div class="flex items-center justify-between">
      <label v-if="label" class="form-label mb-0">{{ label }}</label>
      <button
        v-if="showTranslate && languages.length > 1"
        type="button"
        @click="handleTranslate"
        :disabled="translating"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium shadow-sm"
        :title="$t('siteSettings.general.translateTooltip')"
      >
        <span v-if="translating" class="material-icons text-xs animate-spin">sync</span>
        <span v-else class="material-icons text-xs">translate</span>
        <span>{{ translating ? $t('siteSettings.general.translating') : $t('siteSettings.general.translateAll') }}</span>
        <span class="material-icons text-[10px]">auto_awesome</span>
      </button>
    </div>

    <!-- Language tabs -->
    <div class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div class="flex bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        <button
          v-for="lang in languages"
          :key="lang"
          type="button"
          @click="selectedLang = lang"
          class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px"
          :class="selectedLang === lang
            ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          :title="`${getLanguageFlag(lang)} ${getLanguageName(lang)}`"
        >
          <span class="uppercase">{{ lang }}</span>
          <span
            v-if="modelValue[lang] && modelValue[lang].trim()"
            class="w-2 h-2 bg-green-500 rounded-full"
          ></span>
        </button>
      </div>

      <!-- Input area -->
      <div class="p-3 bg-white dark:bg-slate-800">
        <template v-if="type === 'textarea'">
          <textarea
            :value="modelValue[selectedLang] || ''"
            @input="updateValue($event.target.value)"
            :rows="rows"
            :placeholder="placeholder"
            :maxlength="maxlength"
            class="form-input w-full"
          ></textarea>
        </template>
        <template v-else>
          <input
            :type="type"
            :value="modelValue[selectedLang] || ''"
            @input="updateValue($event.target.value)"
            :placeholder="placeholder"
            :maxlength="maxlength"
            class="form-input w-full"
          />
        </template>
        <p v-if="maxlength" class="mt-1 text-xs text-gray-500 dark:text-slate-400 text-right">
          {{ (modelValue[selectedLang] || '').length }}/{{ maxlength }}
        </p>
      </div>
    </div>

    <!-- Helper text -->
    <p v-if="help" class="text-xs text-gray-500 dark:text-slate-400">{{ help }}</p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import translationService from '@/services/translationService'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  languages: {
    type: Array,
    default: () => ['tr', 'en']
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  rows: {
    type: Number,
    default: 3
  },
  placeholder: {
    type: String,
    default: ''
  },
  maxlength: {
    type: Number,
    default: null
  },
  help: {
    type: String,
    default: ''
  },
  showTranslate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const { t } = useI18n()

const selectedLang = ref(props.languages[0] || 'tr')
const translating = ref(false)

const availableLanguages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'az', name: 'Azərbaycanca', flag: '🇦🇿' }
]

const getLanguageName = (code) => {
  return availableLanguages.find(l => l.code === code)?.name || code.toUpperCase()
}

const getLanguageFlag = (code) => {
  return availableLanguages.find(l => l.code === code)?.flag || ''
}

// Watch languages prop and reset selectedLang if needed
watch(() => props.languages, (newLangs) => {
  if (!newLangs.includes(selectedLang.value)) {
    selectedLang.value = newLangs[0] || 'tr'
  }
}, { immediate: true })

const updateValue = (value) => {
  const newValue = { ...props.modelValue }
  newValue[selectedLang.value] = value
  emit('update:modelValue', newValue)
}

const handleTranslate = async () => {
  const sourceText = props.modelValue[selectedLang.value]

  if (!sourceText || !sourceText.trim()) {
    toast.warning(t('siteSettings.general.noContentToTranslate'))
    return
  }

  translating.value = true
  try {
    // Get target languages (all except source)
    const targetLangs = props.languages.filter(l => l !== selectedLang.value)

    const response = await translationService.batchTranslate(
      props.modelValue,
      selectedLang.value,
      props.languages
    )

    if (response.success) {
      emit('update:modelValue', { ...props.modelValue, ...response.data })
      toast.success(t('siteSettings.general.translationSuccess'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('siteSettings.general.translationFailed'))
  } finally {
    translating.value = false
  }
}
</script>
