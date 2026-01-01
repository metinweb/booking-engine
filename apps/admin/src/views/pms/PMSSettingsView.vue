<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">PMS yapilandirma ve ayarlarini yonetin</p>
      </div>
      <button
        v-if="hasChanges"
        @click="saveAllSettings"
        :disabled="saving"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span class="material-icons text-sm" v-else>save</span>
        Kaydet
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
    </div>

    <!-- Settings Tabs -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        <div class="flex min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            :class="activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          >
            <span class="material-icons text-sm mr-1 align-middle">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- General Settings -->
        <GeneralSettings
          v-if="activeTab === 'general'"
          v-model="settings.general"
          :timezones="timezones"
          :currencies="currencies"
          @change="markChanged"
        />

        <!-- Front Desk Settings -->
        <FrontDeskSettings
          v-else-if="activeTab === 'frontDesk'"
          v-model="settings.frontDesk"
          @change="markChanged"
        />

        <!-- Tax Settings -->
        <TaxSettings
          v-else-if="activeTab === 'taxes'"
          v-model="settings.taxes"
          @change="markChanged"
        />

        <!-- Invoicing Settings -->
        <InvoicingSettings
          v-else-if="activeTab === 'invoicing'"
          v-model="settings.invoicing"
          @change="markChanged"
        />

        <!-- Housekeeping Settings -->
        <HousekeepingSettings
          v-else-if="activeTab === 'housekeeping'"
          v-model="settings.housekeeping"
          @change="markChanged"
        />

        <!-- Cashier Settings -->
        <CashierSettings
          v-else-if="activeTab === 'cashier'"
          v-model="settings.cashier"
          @change="markChanged"
        />

        <!-- Notification Settings -->
        <NotificationSettings
          v-else-if="activeTab === 'notifications'"
          v-model="settings.notifications"
          @change="markChanged"
        />

        <!-- Reservation Settings -->
        <ReservationSettings
          v-else-if="activeTab === 'reservations'"
          v-model="settings.reservations"
          @change="markChanged"
        />

        <!-- Guest Settings -->
        <GuestSettings
          v-else-if="activeTab === 'guests'"
          v-model="settings.guests"
          @change="markChanged"
        />

        <!-- KBS Settings -->
        <KBSSettings
          v-else-if="activeTab === 'kbs'"
          v-model="settings.kbs"
          @change="markChanged"
        />

        <!-- Exchange Settings -->
        <ExchangeSettings
          v-else-if="activeTab === 'exchange'"
        />
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <div
      v-if="showResetModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showResetModal = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ayarlari Sifirla</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Bu bolumun ayarlarini varsayilan degerlere sifirlamak istediginizden emin misiniz?
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="showResetModal = false"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Iptal
          </button>
          <button
            @click="confirmReset"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sifirla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import * as settingsService from '@/services/pms/settingsService'

// Tab components
import GeneralSettings from '@/components/pms/settings/GeneralSettings.vue'
import FrontDeskSettings from '@/components/pms/settings/FrontDeskSettings.vue'
import TaxSettings from '@/components/pms/settings/TaxSettings.vue'
import InvoicingSettings from '@/components/pms/settings/InvoicingSettings.vue'
import HousekeepingSettings from '@/components/pms/settings/HousekeepingSettings.vue'
import CashierSettings from '@/components/pms/settings/CashierSettings.vue'
import NotificationSettings from '@/components/pms/settings/NotificationSettings.vue'
import ReservationSettings from '@/components/pms/settings/ReservationSettings.vue'
import GuestSettings from '@/components/pms/settings/GuestSettings.vue'
import KBSSettings from '@/components/pms/settings/KBSSettings.vue'
import ExchangeSettings from '@/components/pms/settings/ExchangeSettings.vue'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const toast = useToast()
const { hotelId } = usePmsContextInjection()

// State
const loading = ref(true)
const saving = ref(false)
const hasChanges = ref(false)
const showResetModal = ref(false)
const resetSection = ref(null)
const activeTab = ref('general')

const settings = ref({
  general: {},
  frontDesk: {},
  taxes: {},
  invoicing: {},
  housekeeping: {},
  cashier: {},
  notifications: {},
  reservations: {},
  guests: {},
  kbs: {}
})

const timezones = ref([])
const currencies = ref([])

// Tabs configuration
const tabs = [
  { id: 'general', label: 'Genel', icon: 'settings' },
  { id: 'frontDesk', label: 'Resepsiyon', icon: 'desk' },
  { id: 'taxes', label: 'Vergiler', icon: 'receipt' },
  { id: 'invoicing', label: 'Faturalama', icon: 'description' },
  { id: 'housekeeping', label: 'Kat Hizmetleri', icon: 'cleaning_services' },
  { id: 'cashier', label: 'Kasa', icon: 'point_of_sale' },
  { id: 'exchange', label: 'Doviz Kuru', icon: 'currency_exchange' },
  { id: 'notifications', label: 'Bildirimler', icon: 'notifications' },
  { id: 'reservations', label: 'Rezervasyon', icon: 'event' },
  { id: 'guests', label: 'Misafir', icon: 'people' },
  { id: 'kbs', label: 'KBS', icon: 'badge' }
]

// Methods
const loadSettings = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const [settingsRes, timezonesRes, currenciesRes] = await Promise.all([
      settingsService.getSettings(hotelId.value),
      settingsService.getTimezones(),
      settingsService.getCurrencies()
    ])

    if (settingsRes.success) {
      settings.value = {
        general: settingsRes.data.general || {},
        frontDesk: settingsRes.data.frontDesk || {},
        taxes: settingsRes.data.taxes || {},
        invoicing: settingsRes.data.invoicing || {},
        housekeeping: settingsRes.data.housekeeping || {},
        cashier: settingsRes.data.cashier || {},
        notifications: settingsRes.data.notifications || {},
        reservations: settingsRes.data.reservations || {},
        guests: settingsRes.data.guests || {},
        kbs: settingsRes.data.kbs || {}
      }
    }

    if (timezonesRes.success) {
      timezones.value = timezonesRes.data
    }

    if (currenciesRes.success) {
      currencies.value = currenciesRes.data
    }

    hasChanges.value = false
  } catch (error) {
    console.error('Error loading settings:', error)
    toast.error('Ayarlar yuklenirken hata olustu')
  } finally {
    loading.value = false
  }
}

const markChanged = () => {
  hasChanges.value = true
}

const saveAllSettings = async () => {
  if (!hotelId.value) return

  saving.value = true
  try {
    const response = await settingsService.updateAllSettings(hotelId.value, settings.value)
    if (response.success) {
      toast.success('Ayarlar kaydedildi')
      hasChanges.value = false
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    toast.error('Ayarlar kaydedilirken hata olustu')
  } finally {
    saving.value = false
  }
}

const openResetModal = (section) => {
  resetSection.value = section
  showResetModal.value = true
}

const confirmReset = async () => {
  if (!hotelId.value) return

  try {
    const response = await settingsService.resetSettings(hotelId.value, resetSection.value)
    if (response.success) {
      toast.success('Ayarlar sifirlandi')
      await loadSettings()
    }
  } catch (error) {
    console.error('Error resetting settings:', error)
    toast.error('Ayarlar sifirlanirken hata olustu')
  } finally {
    showResetModal.value = false
    resetSection.value = null
  }
}

// Lifecycle
onMounted(() => {
  loadSettings()
})

// Expose for child components
defineExpose({ openResetModal })
</script>
