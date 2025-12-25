<template>
  <div class="space-y-6">
    <!-- Status Toggle - Prominent at Top -->
    <div class="flex items-center justify-between p-4 bg-gradient-to-r rounded-xl"
         :class="formData.status === 'active'
           ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
           : 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-slate-700'">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center"
             :class="formData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'">
          <span class="material-icons text-white text-xl">
            {{ formData.status === 'active' ? 'check' : 'pause' }}
          </span>
        </div>
        <div>
          <p class="font-semibold" :class="formData.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'">
            {{ formData.status === 'active' ? $t('planning.markets.statusActive') : $t('planning.markets.statusInactive') }}
          </p>
          <p class="text-xs" :class="formData.status === 'active' ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-slate-500'">
            {{ formData.status === 'active' ? $t('planning.markets.statusActiveHint') : $t('planning.markets.statusInactiveHint') }}
          </p>
        </div>
      </div>
      <!-- Switch Toggle -->
      <button
        type="button"
        @click="toggleStatus"
        class="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="formData.status === 'active'
          ? 'bg-green-500 focus:ring-green-500'
          : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'"
      >
        <span
          class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300"
          :class="formData.status === 'active' ? 'translate-x-7' : 'translate-x-0'"
        ></span>
      </button>
    </div>

    <!-- Market Code -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('planning.markets.code') }} *
      </label>
      <input
        v-model="formData.code"
        type="text"
        class="form-input w-full uppercase"
        :placeholder="$t('planning.markets.codePlaceholder')"
        maxlength="10"
        required
      />
      <p class="mt-1 text-xs text-gray-500 dark:text-slate-500">
        {{ $t('planning.markets.codeHint') }}
      </p>
    </div>

    <!-- Market Name (Multilingual) -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {{ $t('planning.markets.name') }} *
        </label>
        <button
          type="button"
          @click="translateName"
          :disabled="translating || !formData.name[currentLang]"
          class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
        >
          <span class="material-icons text-sm">translate</span>
          {{ $t('common.translateAll') }}
        </button>
      </div>

      <!-- Language Tabs -->
      <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <div class="flex border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 overflow-x-auto">
          <button
            v-for="lang in visibleLanguages"
            :key="lang"
            type="button"
            @click="currentLang = lang"
            class="px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
            :class="currentLang === lang
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'"
          >
            {{ lang.toUpperCase() }}
            <span v-if="formData.name[lang]" class="ml-1 text-green-500">✓</span>
          </button>
          <button
            v-if="!showAllLanguages"
            type="button"
            @click="showAllLanguages = true"
            class="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-500"
          >
            +{{ SUPPORTED_LANGUAGES.length - 5 }}
          </button>
        </div>
        <div class="p-3">
          <input
            v-model="formData.name[currentLang]"
            type="text"
            class="form-input w-full"
            :placeholder="`${$t('planning.markets.name')} (${currentLang.toUpperCase()})`"
          />
        </div>
      </div>
    </div>

    <!-- Currency Selection - Beautiful Cards -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
        {{ $t('planning.markets.currency') }} *
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="curr in CURRENCIES"
          :key="curr.code"
          type="button"
          @click="formData.currency = curr.code"
          class="relative p-4 rounded-xl border-2 transition-all duration-200 text-center group"
          :class="formData.currency === curr.code
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg shadow-purple-500/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'"
        >
          <!-- Selected indicator -->
          <div
            v-if="formData.currency === curr.code"
            class="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
          >
            <span class="material-icons text-white text-sm">check</span>
          </div>

          <!-- Currency Symbol -->
          <div
            class="text-3xl font-bold mb-1 transition-colors"
            :class="formData.currency === curr.code ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600'"
          >
            {{ curr.symbol }}
          </div>

          <!-- Currency Code -->
          <div
            class="text-sm font-semibold transition-colors"
            :class="formData.currency === curr.code ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300'"
          >
            {{ curr.code }}
          </div>

          <!-- Currency Name -->
          <div
            class="text-xs mt-1 transition-colors"
            :class="formData.currency === curr.code ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-slate-500'"
          >
            {{ curr.name[locale] || curr.name.en }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import translationService from '@/services/translationService'
import { CURRENCIES } from '@/data/countries'

const props = defineProps({
  market: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  isNew: { type: Boolean, default: true }
})

const { t, locale } = useI18n()
const toast = useToast()

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const formData = ref({
  code: '',
  name: createMultiLangObject(),
  currency: 'EUR',
  status: 'active'
})

const currentLang = ref(locale.value || 'tr')
const showAllLanguages = ref(false)
const translating = ref(false)

const visibleLanguages = computed(() => {
  if (showAllLanguages.value) return SUPPORTED_LANGUAGES
  return SUPPORTED_LANGUAGES.slice(0, 5)
})

const toggleStatus = () => {
  formData.value.status = formData.value.status === 'active' ? 'inactive' : 'active'
}

// Sync with props
watch(() => props.market, (newVal) => {
  if (newVal) {
    formData.value = {
      code: newVal.code || '',
      name: { ...createMultiLangObject(), ...newVal.name },
      currency: newVal.currency || 'EUR',
      status: newVal.status || 'active'
    }
  }
}, { immediate: true, deep: true })

const translateName = async () => {
  const sourceText = formData.value.name[currentLang.value]
  if (!sourceText) return

  translating.value = true
  try {
    const targetLangs = SUPPORTED_LANGUAGES.filter(l => l !== currentLang.value && !formData.value.name[l])
    const result = await translationService.translateFields(
      { name: sourceText },
      currentLang.value,
      targetLangs
    )

    if (result.translations) {
      targetLangs.forEach(lang => {
        if (result.translations[lang]?.name) {
          formData.value.name[lang] = result.translations[lang].name
        }
      })
      toast.success(t('common.translationSuccess'))
    }
  } catch (error) {
    toast.error(t('common.translationError'))
  } finally {
    translating.value = false
  }
}

const getFormData = () => {
  return {
    code: formData.value.code.toUpperCase(),
    name: formData.value.name,
    currency: formData.value.currency,
    status: formData.value.status
  }
}

defineExpose({ getFormData })
</script>
