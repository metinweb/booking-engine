<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
        @click.self="close"
      >
        <!-- Close Button -->
        <button
          class="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          :title="$t('common.cancel')"
          @click="close"
        >
          <span class="material-icons">close</span>
        </button>

        <!-- Content -->
        <div class="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
          <!-- Loading -->
          <div v-if="loading && !error" class="text-white text-center absolute">
            <svg class="animate-spin h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
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
            <p>Yükleniyor...</p>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md text-center"
          >
            <span class="material-icons text-6xl text-red-600 dark:text-red-400 mb-4">error</span>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Yüklenemedi</h3>
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-2">{{ error }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-500 mb-4 break-all">{{ url }}</p>
            <a
              :href="url"
              target="_blank"
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span class="material-icons text-sm">open_in_new</span>
              Yeni Sekmede Aç
            </a>
          </div>

          <!-- Image (always rendered but hidden while loading) -->
          <img
            v-if="isImage && blobUrl"
            :src="blobUrl"
            :alt="title"
            :class="[
              'max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300',
              loading && !error ? 'opacity-0' : 'opacity-100'
            ]"
            @load="handleLoad"
            @error="handleError"
          />

          <!-- PDF -->
          <iframe
            v-else-if="isPDF && blobUrl"
            :src="blobUrl"
            class="w-full h-full rounded-lg shadow-2xl bg-white"
            frameborder="0"
          ></iframe>

          <!-- Document (DOC, DOCX) -->
          <div
            v-else
            class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md text-center"
          >
            <span class="material-icons text-6xl text-blue-600 dark:text-blue-400 mb-4"
              >description</span
            >
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">{{ title }}</h3>
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-6">
              Bu dosya türü tarayıcıda önizlenemiyor.
            </p>
            <a
              :href="url"
              download
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span class="material-icons text-sm">download</span>
              İndir
            </a>
          </div>
        </div>

        <!-- Document Info -->
        <div
          v-if="title"
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm"
        >
          <p class="text-sm font-medium">{{ title }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import apiClient from '@/services/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(true)
const error = ref(null)
const blobUrl = ref(null)

const isImage = computed(() => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  // Check filename if provided, otherwise check URL
  const checkString = props.title || props.url
  return imageExtensions.some(ext => checkString.toLowerCase().endsWith(ext))
})

const isPDF = computed(() => {
  // Check filename if provided, otherwise check URL
  const checkString = props.title || props.url
  return checkString.toLowerCase().endsWith('.pdf')
})

const fetchDocument = async () => {
  if (!props.url) return

  loading.value = true
  error.value = null

  try {
    const response = await apiClient.get(props.url, {
      responseType: 'blob'
    })

    // Create blob URL
    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    blobUrl.value = URL.createObjectURL(blob)
    loading.value = false
  } catch (err) {
    loading.value = false
    error.value = 'Dosya yüklenemedi. Lütfen tekrar deneyin.'
    console.error('Document fetch error:', err)
  }
}

const handleLoad = () => {
  loading.value = false
  error.value = null
}

const handleError = e => {
  loading.value = false
  error.value = 'Resim yüklenemedi. Dosya bulunamadı veya erişim engellendi.'
  console.error('Image load error:', e)
}

const close = () => {
  emit('update:modelValue', false)
  // Revoke blob URL to free memory
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = null
  }
  // Reset states on close
  loading.value = true
  error.value = null
}

// Close on ESC key and reset states
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      // Reset states when opening
      loading.value = true
      error.value = null

      // Fetch document with authentication
      fetchDocument()

      const handleEscape = e => {
        if (e.key === 'Escape') {
          close()
        }
      }
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>
