<template>
  <div class="space-y-6">
    <!-- Google Analytics -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
        Google Analytics (GA4)
      </h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.tracking.measurementId') }}</label>
          <input
            v-model="form.googleAnalytics.measurementId"
            type="text"
            class="form-input"
            placeholder="G-XXXXXXXXXX"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.tracking.measurementIdHelp') }}
          </p>
        </div>
        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.googleAnalytics.enabled"
            id="gaEnabled"
            class="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
          />
          <label for="gaEnabled" class="ml-2 text-sm text-gray-700 dark:text-slate-300">
            {{ $t('siteSettings.tracking.enableTracking') }}
          </label>
        </div>
      </div>
    </div>

    <!-- Google Tag Manager -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Google Tag Manager
      </h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.tracking.gtmId') }}</label>
          <input
            v-model="form.googleTagManager.containerId"
            type="text"
            class="form-input"
            placeholder="GTM-XXXXXXX"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.tracking.gtmIdHelp') }}
          </p>
        </div>
        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.googleTagManager.enabled"
            id="gtmEnabled"
            class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label for="gtmEnabled" class="ml-2 text-sm text-gray-700 dark:text-slate-300">
            {{ $t('siteSettings.tracking.enableTracking') }}
          </label>
        </div>
      </div>
    </div>

    <!-- Facebook Pixel -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook Pixel (Meta)
      </h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.tracking.pixelId') }}</label>
          <input
            v-model="form.facebookPixel.pixelId"
            type="text"
            class="form-input"
            placeholder="XXXXXXXXXXXXXXXX"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.tracking.pixelIdHelp') }}
          </p>
        </div>
        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.facebookPixel.enabled"
            id="fbEnabled"
            class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label for="fbEnabled" class="ml-2 text-sm text-gray-700 dark:text-slate-300">
            {{ $t('siteSettings.tracking.enableTracking') }}
          </label>
        </div>
      </div>
    </div>

    <!-- Microsoft Clarity -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        Microsoft Clarity
      </h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.tracking.clarityId') }}</label>
          <input
            v-model="form.microsoftClarity.projectId"
            type="text"
            class="form-input"
            placeholder="xxxxxxxxxx"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.tracking.clarityIdHelp') }}
          </p>
        </div>
        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.microsoftClarity.enabled"
            id="clarityEnabled"
            class="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
          />
          <label for="clarityEnabled" class="ml-2 text-sm text-gray-700 dark:text-slate-300">
            {{ $t('siteSettings.tracking.enableTracking') }}
          </label>
        </div>
      </div>
    </div>

    <!-- Custom Scripts -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <span class="material-icons text-purple-600 mr-2">code</span>
        {{ $t('siteSettings.tracking.customScripts') }}
      </h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.tracking.headScripts') }}</label>
          <textarea
            v-model="form.customScripts.head"
            class="form-input font-mono text-sm"
            rows="4"
            :placeholder="$t('siteSettings.tracking.headScriptsPlaceholder')"
          ></textarea>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.tracking.headScriptsHelp') }}
          </p>
        </div>
        <div>
          <label class="form-label">{{ $t('siteSettings.tracking.bodyScripts') }}</label>
          <textarea
            v-model="form.customScripts.body"
            class="form-input font-mono text-sm"
            rows="4"
            :placeholder="$t('siteSettings.tracking.bodyScriptsPlaceholder')"
          ></textarea>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.tracking.bodyScriptsHelp') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        @click="handleSave"
        class="btn-primary"
        :disabled="saving"
      >
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  settings: Object,
  saving: Boolean
})

const emit = defineEmits(['save'])

const form = ref({
  googleAnalytics: {
    measurementId: '',
    enabled: false
  },
  googleTagManager: {
    containerId: '',
    enabled: false
  },
  facebookPixel: {
    pixelId: '',
    enabled: false
  },
  microsoftClarity: {
    projectId: '',
    enabled: false
  },
  customScripts: {
    head: '',
    body: ''
  }
})

watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    form.value = {
      googleAnalytics: {
        measurementId: newSettings.googleAnalytics?.measurementId || '',
        enabled: newSettings.googleAnalytics?.enabled || false
      },
      googleTagManager: {
        containerId: newSettings.googleTagManager?.containerId || '',
        enabled: newSettings.googleTagManager?.enabled || false
      },
      facebookPixel: {
        pixelId: newSettings.facebookPixel?.pixelId || '',
        enabled: newSettings.facebookPixel?.enabled || false
      },
      microsoftClarity: {
        projectId: newSettings.microsoftClarity?.projectId || '',
        enabled: newSettings.microsoftClarity?.enabled || false
      },
      customScripts: {
        head: newSettings.customScripts?.head || '',
        body: newSettings.customScripts?.body || ''
      }
    }
  }
}, { immediate: true })

const handleSave = () => {
  emit('save', form.value)
}
</script>
