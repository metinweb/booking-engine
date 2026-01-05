<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Top Save Button -->
    <div class="flex justify-end">
      <button type="submit" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>

    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.seo.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">
        {{ $t('hotels.seo.description') }}
      </p>

      <!-- Meta Title -->
      <div class="mb-6">
        <MultiLangInput
          v-model="form.title"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.seo.metaTitle')"
          type="text"
          :maxlength="60"
          :placeholder="$t('hotels.seo.metaTitle')"
        />
      </div>

      <!-- Meta Description -->
      <div class="mb-6">
        <MultiLangInput
          v-model="form.description"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.seo.metaDescription')"
          type="textarea"
          :rows="3"
          :maxlength="160"
          :placeholder="$t('hotels.seo.metaDescription')"
        />
      </div>

      <!-- Keywords -->
      <div class="mb-6">
        <MultiLangInput
          v-model="form.keywords"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.seo.keywords')"
          type="text"
          :placeholder="$t('hotels.seo.keywordsHelp')"
          :help="$t('hotels.seo.keywordsHelp')"
        />
      </div>
    </div>

    <!-- Search Preview -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <span class="material-icons text-lg">preview</span>
        {{ $t('hotels.seo.preview') }}
      </h4>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('hotels.seo.previewHelp') }}
      </p>

      <!-- Preview Card -->
      <div
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm max-w-2xl"
      >
        <div class="space-y-1">
          <h5
            class="text-blue-600 dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer truncate"
          >
            {{ previewTitle || $t('hotels.seo.metaTitle') }}
          </h5>
          <p class="text-green-700 dark:text-green-500 text-sm truncate">
            www.yoursite.com/hotels/{{ hotel.slug || 'hotel-slug' }}
          </p>
          <p class="text-gray-600 dark:text-slate-400 text-sm line-clamp-2">
            {{ previewDescription || $t('hotels.seo.metaDescription') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end">
      <button type="submit" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const { locale } = useI18n()

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save'])

// All supported languages (20 languages for B2B)
const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

// Create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

const form = ref({
  title: createMultiLangObject(),
  description: createMultiLangObject(),
  keywords: createMultiLangObject()
})

// Preview based on current locale
const previewTitle = computed(() => {
  const lang = locale.value
  return form.value.title[lang] || form.value.title.tr || form.value.title.en || ''
})

const previewDescription = computed(() => {
  const lang = locale.value
  return (
    form.value.description[lang] || form.value.description.tr || form.value.description.en || ''
  )
})

// Watch for hotel changes and update form
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel?.seo) {
      form.value = {
        title: { ...createMultiLangObject(), ...newHotel.seo.title },
        description: { ...createMultiLangObject(), ...newHotel.seo.description },
        keywords: { ...createMultiLangObject(), ...newHotel.seo.keywords }
      }
    }
  },
  { immediate: true, deep: true }
)

// Validate all fields (no required fields in SEO)
const validateAll = () => true

// Get current form data
const getFormData = () => {
  return { seo: form.value }
}

const handleSubmit = () => {
  emit('save', { seo: form.value })
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData
})
</script>
