<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- B2C Domain -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-purple-600 mr-2">language</span>
          {{ $t('siteSettings.setup.b2cDomain') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.setup.b2cDescription') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>
            <input
              v-model="form.b2cDomain"
              type="text"
              class="form-input"
              placeholder="www.example.com"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-sm text-gray-600 dark:text-slate-400 mr-2">SSL:</span>
              <span
                class="badge"
                :class="{
                  'badge-success': settings?.b2cSslStatus === 'active',
                  'badge-warning': settings?.b2cSslStatus === 'pending',
                  'badge-danger': settings?.b2cSslStatus === 'failed',
                  'badge-secondary': !settings?.b2cSslStatus || settings?.b2cSslStatus === 'none'
                }"
              >
                {{ getSslStatusText(settings?.b2cSslStatus) }}
              </span>
            </div>
            <button
              v-if="form.b2cDomain && settings?.b2cSslStatus !== 'active'"
              @click="handleSslRequest('b2c')"
              class="btn-secondary text-sm"
              :disabled="saving"
            >
              <span class="material-icons text-sm mr-1">security</span>
              {{ $t('siteSettings.setup.requestSsl') }}
            </button>
          </div>
        </div>
      </div>

      <!-- B2B Domain -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-blue-600 mr-2">business</span>
          {{ $t('siteSettings.setup.b2bDomain') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.setup.b2bDescription') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>
            <input
              v-model="form.b2bDomain"
              type="text"
              class="form-input"
              placeholder="extranet.example.com"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-sm text-gray-600 dark:text-slate-400 mr-2">SSL:</span>
              <span
                class="badge"
                :class="{
                  'badge-success': settings?.b2bSslStatus === 'active',
                  'badge-warning': settings?.b2bSslStatus === 'pending',
                  'badge-danger': settings?.b2bSslStatus === 'failed',
                  'badge-secondary': !settings?.b2bSslStatus || settings?.b2bSslStatus === 'none'
                }"
              >
                {{ getSslStatusText(settings?.b2bSslStatus) }}
              </span>
            </div>
            <button
              v-if="form.b2bDomain && settings?.b2bSslStatus !== 'active'"
              @click="handleSslRequest('b2b')"
              class="btn-secondary text-sm"
              :disabled="saving"
            >
              <span class="material-icons text-sm mr-1">security</span>
              {{ $t('siteSettings.setup.requestSsl') }}
            </button>
          </div>
        </div>
      </div>

      <!-- PMS Domain -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-indigo-600 mr-2">hotel</span>
          {{ $t('siteSettings.setup.pmsDomain') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.setup.pmsDescription') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>
            <input
              v-model="form.pmsDomain"
              type="text"
              class="form-input"
              placeholder="pms.example.com"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-sm text-gray-600 dark:text-slate-400 mr-2">SSL:</span>
              <span
                class="badge"
                :class="{
                  'badge-success': settings?.pmsSslStatus === 'active',
                  'badge-warning': settings?.pmsSslStatus === 'pending',
                  'badge-danger': settings?.pmsSslStatus === 'failed',
                  'badge-secondary': !settings?.pmsSslStatus || settings?.pmsSslStatus === 'none'
                }"
              >
                {{ getSslStatusText(settings?.pmsSslStatus) }}
              </span>
            </div>
            <button
              v-if="form.pmsDomain && settings?.pmsSslStatus !== 'active'"
              @click="handleSslRequest('pms')"
              class="btn-secondary text-sm"
              :disabled="saving"
            >
              <span class="material-icons text-sm mr-1">security</span>
              {{ $t('siteSettings.setup.requestSsl') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DNS Instructions -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        <span class="material-icons text-sm mr-2">info</span>
        {{ $t('siteSettings.setup.dnsInstructions') }}
      </h4>
      <p class="text-sm text-blue-700 dark:text-blue-400">
        {{ $t('siteSettings.setup.dnsDescription') }}
      </p>
      <code class="block mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-xs text-blue-800 dark:text-blue-300">
        CNAME → booking.platform.com
      </code>
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  settings: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'request-ssl'])

const handleSslRequest = (type) => {
  // Pass form data along with the type so parent can save first
  emit('request-ssl', { type, formData: { ...form.value } })
}

const form = ref({
  b2cDomain: '',
  b2bDomain: '',
  pmsDomain: ''
})

watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    form.value = {
      b2cDomain: newSettings.b2cDomain || '',
      b2bDomain: newSettings.b2bDomain || '',
      pmsDomain: newSettings.pmsDomain || ''
    }
  }
}, { immediate: true })

const getSslStatusText = (status) => {
  const statusMap = {
    active: t('siteSettings.setup.sslActive'),
    pending: t('siteSettings.setup.sslPending'),
    failed: t('siteSettings.setup.sslFailed'),
    none: t('siteSettings.setup.sslNone')
  }
  return statusMap[status] || statusMap.none
}

const handleSave = () => {
  emit('save', form.value)
}
</script>
