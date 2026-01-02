<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-3xl text-purple-500">refresh</span>
    </div>

    <template v-else>
      <!-- SMS Settings -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <span class="material-icons text-green-500 mr-2">sms</span>
            {{ $t('siteSettings.notifications.sms.title') }}
          </h3>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="smsForm.enabled" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.notifications.sms.description') }}
        </p>

        <div v-if="smsForm.enabled" class="space-y-4">
          <!-- Provider Selection -->
          <div>
            <label class="form-label">{{ $t('siteSettings.notifications.sms.provider') }}</label>
            <select v-model="smsForm.provider" class="form-input">
              <option
                v-for="provider in providers"
                :key="provider.name"
                :value="provider.name"
              >
                {{ provider.displayName }}
              </option>
            </select>
          </div>

          <!-- Provider Fields (Dynamic) -->
          <template v-if="selectedProvider && selectedProvider.fields.length > 0">
            <div class="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ selectedProvider.displayName }} {{ $t('siteSettings.notifications.sms.settings') }}
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="field in selectedProvider.fields" :key="field.key">
                  <label class="form-label">{{ field.label }}</label>
                  <input
                    v-model="smsForm.config[field.key]"
                    :type="field.type === 'password' ? 'password' : 'text'"
                    :placeholder="field.placeholder || (smsSettings?.config?.[field.key] ? '********' : '')"
                    :maxlength="field.maxLength"
                    class="form-input"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>

            <!-- Test SMS -->
            <div class="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <PhoneInput
                    v-model="testPhone"
                    :placeholder="$t('siteSettings.notifications.sms.testPhonePlaceholder')"
                    country="TR"
                    :clearable="true"
                  />
                </div>
                <button
                  @click="handleTestSMS"
                  :disabled="!testPhone || testingSMS"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <span v-if="testingSMS" class="material-icons animate-spin text-sm">refresh</span>
                  <span v-else class="material-icons text-sm">send</span>
                  {{ $t('siteSettings.notifications.sms.sendTest') }}
                </button>
              </div>
            </div>

            <!-- Balance (if supported) -->
            <div v-if="selectedProvider.supportsBalance" class="flex items-center gap-2 pt-2">
              <button
                @click="handleCheckBalance"
                :disabled="checkingBalance"
                class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
              >
                <span v-if="checkingBalance" class="material-icons animate-spin text-sm">refresh</span>
                <span v-else class="material-icons text-sm">account_balance_wallet</span>
                {{ $t('siteSettings.notifications.sms.checkBalance') }}
              </button>
              <span v-if="balance !== null" class="text-sm text-gray-600 dark:text-slate-400">
                {{ balance }} {{ balanceCurrency }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Email Settings -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center mb-4">
          <span class="material-icons text-orange-500 mr-2">email</span>
          {{ $t('siteSettings.notifications.email.title') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.notifications.email.description') }}
        </p>

        <EmailSettingsForm
          v-if="currentPartnerId"
          :partner-id="currentPartnerId"
          :email-settings="emailSettings"
          @saved="loadEmailSettings"
        />
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'
import partnerSmsService from '@/services/partnerSmsService'
import partnerEmailService from '@/services/partnerEmailService'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import EmailSettingsForm from './EmailSettingsForm.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  saving: Boolean
})

// State
const loading = ref(true)
const testingSMS = ref(false)
const checkingBalance = ref(false)
const testPhone = ref('')
const balance = ref(null)
const balanceCurrency = ref('')

const providers = ref([])
const smsSettings = ref(null)
const emailSettings = ref(null)
const smsForm = ref({
  enabled: true,
  provider: 'platform',
  config: {}
})

// Partner context
const { currentPartnerId } = usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      loadData()
    }
  }
})

// Computed
const selectedProvider = computed(() => {
  return providers.value.find(p => p.name === smsForm.value.provider)
})

// Load data
const loadData = async () => {
  if (!currentPartnerId.value) return

  loading.value = true
  try {
    // Load providers, SMS settings and email settings in parallel
    const [providersData, smsSettingsData, emailSettingsData] = await Promise.all([
      partnerSmsService.getSMSProviders(),
      partnerSmsService.getSMSSettings(currentPartnerId.value),
      partnerEmailService.getEmailSettings(currentPartnerId.value)
    ])

    providers.value = providersData
    smsSettings.value = smsSettingsData
    emailSettings.value = emailSettingsData

    // Set form values
    smsForm.value = {
      enabled: smsSettingsData?.enabled ?? true,
      provider: smsSettingsData?.provider || 'platform',
      config: {} // Don't pre-fill encrypted values
    }
  } catch (error) {
    console.error('Failed to load notification settings:', error)
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

// Load email settings separately
const loadEmailSettings = async () => {
  if (!currentPartnerId.value) return

  try {
    emailSettings.value = await partnerEmailService.getEmailSettings(currentPartnerId.value)
  } catch (error) {
    console.error('Failed to load email settings:', error)
  }
}

// Save settings
const handleSave = async () => {
  if (!currentPartnerId.value) return

  try {
    await partnerSmsService.updateSMSSettings(currentPartnerId.value, smsForm.value)
    toast.success(t('siteSettings.notifications.saved'))
    // Reload to get fresh masked values
    await loadData()
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  }
}

// Test SMS
const handleTestSMS = async () => {
  if (!currentPartnerId.value || !testPhone.value) return

  testingSMS.value = true
  try {
    await partnerSmsService.testSMS(currentPartnerId.value, testPhone.value)
    toast.success(t('siteSettings.notifications.sms.testSent'))
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    testingSMS.value = false
  }
}

// Check balance
const handleCheckBalance = async () => {
  if (!currentPartnerId.value) return

  checkingBalance.value = true
  try {
    const result = await partnerSmsService.getSMSBalance(currentPartnerId.value)
    if (result.success) {
      balance.value = result.balance || result.credits
      balanceCurrency.value = result.currency || 'SMS'
    } else {
      toast.error(result.error || t('common.operationFailed'))
    }
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    checkingBalance.value = false
  }
}

// Reset config when provider changes
watch(() => smsForm.value.provider, () => {
  smsForm.value.config = {}
  balance.value = null
})

onMounted(() => {
  if (currentPartnerId.value) {
    loadData()
  }
})
</script>
