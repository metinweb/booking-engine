<template>
  <div class="space-y-6">
    <!-- Section Tabs -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex space-x-4 px-6" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300',
              'flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors'
            ]"
          >
            <span class="material-icons mr-2 text-lg">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Email Settings Section -->
    <div v-show="activeTab === 'email'" class="space-y-6">
      <!-- Use Own SES Toggle -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
              {{ $t('emailSetup.useOwnSES') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ $t('emailSetup.useOwnSESDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="emailForm.useOwnSES"
              class="sr-only peer"
              @change="handleEmailToggleChange"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      <!-- AWS Credentials Section -->
      <transition name="fade">
        <div v-if="emailForm.useOwnSES" class="space-y-6">
          <!-- AWS Credentials Card -->
          <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-orange-500 mr-2">cloud</span>
                {{ $t('emailSetup.awsCredentials') }}
              </h3>
            </div>
            <div class="p-6 space-y-4">
              <!-- Region -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('emailSetup.region') }}
                </label>
                <select
                  v-model="emailForm.aws.region"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="eu-west-1">EU (Ireland) - eu-west-1</option>
                  <option value="eu-central-1">EU (Frankfurt) - eu-central-1</option>
                  <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
                  <option value="us-west-2">US West (Oregon) - us-west-2</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
                </select>
              </div>

              <!-- Access Key ID -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('emailSetup.accessKeyId') }}
                </label>
                <input
                  type="text"
                  v-model="emailForm.aws.accessKeyId"
                  :placeholder="$t('emailSetup.accessKeyIdPlaceholder')"
                  autocomplete="nope"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <!-- Secret Access Key -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('emailSetup.secretAccessKey') }}
                </label>
                <div class="relative">
                  <input
                    :type="showSecretKey ? 'text' : 'password'"
                    v-model="emailForm.aws.secretAccessKey"
                    :placeholder="$t('emailSetup.secretAccessKeyPlaceholder')"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                  <button
                    type="button"
                    @click="showSecretKey = !showSecretKey"
                    class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                  >
                    <span class="material-icons text-xl">{{ showSecretKey ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sender Settings Card -->
          <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-green-500 mr-2">mail_outline</span>
                {{ $t('emailSetup.senderSettings') }}
              </h3>
            </div>
            <div class="p-6 space-y-4">
              <!-- From Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('emailSetup.fromEmail') }}
                </label>
                <input
                  type="email"
                  v-model="emailForm.aws.fromEmail"
                  :placeholder="$t('emailSetup.fromEmailPlaceholder')"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <!-- From Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('emailSetup.fromName') }}
                </label>
                <input
                  type="text"
                  v-model="emailForm.aws.fromName"
                  :placeholder="$t('emailSetup.fromNamePlaceholder')"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Platform Default Info -->
      <div v-if="!emailForm.useOwnSES" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div class="flex items-start">
          <span class="material-icons text-blue-500 mr-3">info</span>
          <div>
            <h4 class="font-medium text-blue-800 dark:text-blue-300">
              {{ $t('emailSetup.usingPlatformDefault') }}
            </h4>
            <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {{ $t('emailSetup.usingPlatformDefaultDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          @click="saveEmailSettings"
          :disabled="savingEmail"
          class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
        >
          <span v-if="savingEmail" class="material-icons animate-spin mr-2">refresh</span>
          <span v-else class="material-icons mr-2">save</span>
          {{ $t('common.save') }}
        </button>
      </div>
    </div>

    <!-- SMS Settings Section -->
    <div v-show="activeTab === 'sms'" class="space-y-6">
      <!-- SMS Enable Toggle -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
              {{ $t('smsSetup.enableSms') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ $t('smsSetup.enableSmsDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="smsForm.enabled"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      <transition name="fade">
        <div v-if="smsForm.enabled" class="space-y-6">
          <!-- Provider Selection -->
          <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-green-500 mr-2">sms</span>
                {{ $t('smsSetup.provider') }}
              </h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  v-for="provider in smsProviders"
                  :key="provider.value"
                  @click="smsForm.provider = provider.value"
                  :class="[
                    'p-4 rounded-lg border-2 transition-all text-center',
                    smsForm.provider === provider.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  ]"
                >
                  <span class="material-icons text-2xl mb-1" :class="smsForm.provider === provider.value ? 'text-purple-600' : 'text-gray-400'">
                    {{ provider.icon }}
                  </span>
                  <p class="text-sm font-medium" :class="smsForm.provider === provider.value ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-slate-400'">
                    {{ provider.label }}
                  </p>
                </button>
              </div>
            </div>
          </div>

          <!-- Provider Config -->
          <div v-if="smsForm.provider !== 'platform'" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-orange-500 mr-2">settings</span>
                {{ $t('smsSetup.providerSettings') }}
              </h3>
            </div>
            <div class="p-6 space-y-4">
              <!-- NetGSM Fields -->
              <template v-if="smsForm.provider === 'netgsm'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.netgsm.usercode') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.usercode"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.netgsm.password') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.password"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.netgsm.msgheader') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.msgheader"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>

              <!-- Ileti Merkezi Fields -->
              <template v-if="smsForm.provider === 'iletimerkezi'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.iletimerkezi.apiKey') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.apiKey"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.iletimerkezi.apiHash') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.apiHash"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.iletimerkezi.sender') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.sender"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>

              <!-- Twilio Fields -->
              <template v-if="smsForm.provider === 'twilio'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.twilio.accountSid') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.accountSid"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.twilio.authToken') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.authToken"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.twilio.fromNumber') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.fromNumber"
                    placeholder="+1234567890"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>

              <!-- Vonage Fields -->
              <template v-if="smsForm.provider === 'vonage'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.vonage.apiKey') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.apiKey"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.vonage.apiSecret') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.apiSecret"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.vonage.fromNumber') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.fromNumber"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>
            </div>
          </div>

          <!-- Test SMS Section -->
          <div v-if="smsForm.provider !== 'platform'" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-purple-500 mr-2">send</span>
                {{ $t('smsSetup.testSms') }}
              </h3>
            </div>
            <div class="p-6">
              <div class="flex space-x-2">
                <input
                  type="tel"
                  v-model="testPhone"
                  :placeholder="$t('smsSetup.testPhonePlaceholder')"
                  autocomplete="off"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
                <button
                  @click="sendTestSMS"
                  :disabled="!testPhone || sendingTestSMS"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <span v-if="sendingTestSMS" class="material-icons animate-spin mr-2">refresh</span>
                  <span v-else class="material-icons mr-2">send</span>
                  {{ $t('smsSetup.sendTest') }}
                </button>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-slate-400">
                {{ $t('smsSetup.testSmsHint') }}
              </p>
            </div>
          </div>

          <!-- Platform Default Info for SMS -->
          <div v-if="smsForm.provider === 'platform'" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div class="flex items-start">
              <span class="material-icons text-blue-500 mr-3">info</span>
              <div>
                <h4 class="font-medium text-blue-800 dark:text-blue-300">
                  {{ $t('smsSetup.usingPlatformDefault') }}
                </h4>
                <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {{ $t('smsSetup.usingPlatformDefaultDesc') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- SMS Disabled Info -->
      <div v-if="!smsForm.enabled" class="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
        <div class="flex items-start">
          <span class="material-icons text-gray-400 mr-3">sms_failed</span>
          <div>
            <h4 class="font-medium text-gray-700 dark:text-slate-300">
              {{ $t('smsSetup.smsDisabled') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('smsSetup.smsDisabledDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          @click="saveSMSSettings"
          :disabled="savingSMS"
          class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
        >
          <span v-if="savingSMS" class="material-icons animate-spin mr-2">refresh</span>
          <span v-else class="material-icons mr-2">save</span>
          {{ $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { usePartnerContext } from '@/composables/usePartnerContext'
import * as partnerEmailService from '@/services/partnerEmailService'
import * as partnerSmsService from '@/services/partnerSmsService'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const activeTab = ref('email')
const loading = ref(true)
const savingEmail = ref(false)
const savingSMS = ref(false)
const sendingTestSMS = ref(false)
const showSecretKey = ref(false)
const testPhone = ref('')

const tabs = computed(() => [
  { id: 'email', icon: 'email', label: t('smsSetup.tabs.email') },
  { id: 'sms', icon: 'sms', label: t('smsSetup.tabs.sms') }
])

const smsProviders = computed(() => [
  { value: 'platform', icon: 'cloud', label: t('smsSetup.providers.platform') },
  { value: 'netgsm', icon: 'sms', label: 'NetGSM' },
  { value: 'iletimerkezi', icon: 'message', label: t('smsSetup.providers.iletimerkezi') },
  { value: 'twilio', icon: 'call', label: 'Twilio' },
  { value: 'vonage', icon: 'send', label: 'Vonage' }
])

// Email Form
const emailForm = reactive({
  useOwnSES: false,
  aws: {
    region: 'eu-west-1',
    accessKeyId: '',
    secretAccessKey: '',
    fromEmail: '',
    fromName: ''
  }
})

// SMS Form
const smsForm = reactive({
  enabled: true,
  provider: 'platform',
  config: {
    // NetGSM
    usercode: '',
    password: '',
    msgheader: '',
    // Ileti Merkezi
    apiKey: '',
    apiHash: '',
    sender: '',
    // Twilio
    accountSid: '',
    authToken: '',
    // Vonage
    apiSecret: '',
    // Common
    fromNumber: ''
  }
})

// Get partner context
const { currentPartnerId } = usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      loadSettings()
    }
  },
  immediate: true
})

const loadSettings = async () => {
  try {
    loading.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner
    if (!partnerId) return

    // Load email settings
    const emailSettings = await partnerEmailService.getEmailSettings(partnerId)
    if (emailSettings) {
      emailForm.useOwnSES = emailSettings.useOwnSES || false
      emailForm.aws = {
        region: emailSettings.aws?.region || 'eu-west-1',
        accessKeyId: emailSettings.aws?.accessKeyId || '',
        secretAccessKey: '',
        fromEmail: emailSettings.aws?.fromEmail || '',
        fromName: emailSettings.aws?.fromName || ''
      }
    }

    // Load SMS settings
    const smsSettings = await partnerSmsService.getSMSSettings(partnerId)
    if (smsSettings) {
      smsForm.enabled = smsSettings.enabled !== false
      smsForm.provider = smsSettings.provider || 'platform'
      // Config is masked on server, so we don't load it
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

const handleEmailToggleChange = () => {
  if (!emailForm.useOwnSES) {
    emailForm.aws = {
      region: 'eu-west-1',
      accessKeyId: '',
      secretAccessKey: '',
      fromEmail: '',
      fromName: ''
    }
  }
}

const saveEmailSettings = async () => {
  try {
    savingEmail.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner

    await partnerEmailService.updateEmailSettings(partnerId, {
      useOwnSES: emailForm.useOwnSES,
      aws: emailForm.useOwnSES ? emailForm.aws : null
    })

    toast.success(t('emailSetup.settingsSaved'))
  } catch (error) {
    console.error('Save failed:', error)
    toast.error(error.response?.data?.message || t('emailSetup.saveError'))
  } finally {
    savingEmail.value = false
  }
}

const saveSMSSettings = async () => {
  try {
    savingSMS.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner

    await partnerSmsService.updateSMSSettings(partnerId, {
      enabled: smsForm.enabled,
      provider: smsForm.provider,
      config: smsForm.provider !== 'platform' ? smsForm.config : null
    })

    toast.success(t('smsSetup.settingsSaved'))
  } catch (error) {
    console.error('Save failed:', error)
    toast.error(error.response?.data?.message || t('smsSetup.saveError'))
  } finally {
    savingSMS.value = false
  }
}

const sendTestSMS = async () => {
  try {
    sendingTestSMS.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner

    await partnerSmsService.testSMS(partnerId, testPhone.value)
    toast.success(t('smsSetup.testSmsSent'))
  } catch (error) {
    console.error('Test SMS failed:', error)
    toast.error(error.response?.data?.error || t('smsSetup.testSmsError'))
  } finally {
    sendingTestSMS.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
