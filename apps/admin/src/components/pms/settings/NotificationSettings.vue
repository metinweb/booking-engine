<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Bildirim Ayarlari</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">E-posta, SMS ve dahili bildirim ayarlari</p>
    </div>

    <!-- Email Notifications -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">E-posta Bildirimleri</h4>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="localSettings.emailNotifications.enabled"
            @change="emitChange"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div v-if="localSettings.emailNotifications?.enabled" class="space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Rezervasyon Onay Maili</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Rezervasyon yapildiginda misafire onay maili gonder</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.emailNotifications.sendReservationConfirmation"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Check-in Hatirlatma</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Giris tarihinden once hatirlatma maili gonder</p>
          </div>
          <div class="flex items-center gap-3">
            <div v-if="localSettings.emailNotifications.sendCheckInReminder" class="flex items-center gap-1">
              <input
                type="number"
                v-model.number="localSettings.emailNotifications.checkInReminderDays"
                @input="emitChange"
                min="1"
                max="7"
                class="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <span class="text-xs text-gray-500">gun once</span>
            </div>
            <input
              type="checkbox"
              v-model="localSettings.emailNotifications.sendCheckInReminder"
              @change="emitChange"
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </div>
        </div>

        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Check-out Hatirlatma</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Cikis gununde sabah hatirlatma maili gonder</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.emailNotifications.sendCheckOutReminder"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Fatura Maili</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Check-out sonrasi fatura maili gonder</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.emailNotifications.sendInvoiceEmail"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>

    <!-- SMS Notifications -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">SMS Bildirimleri</h4>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="localSettings.smsNotifications.enabled"
            @change="emitChange"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div v-if="localSettings.smsNotifications?.enabled" class="space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Rezervasyon Onay SMS</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.smsNotifications.sendReservationConfirmation"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Check-in Hatirlatma SMS</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.smsNotifications.sendCheckInReminder"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>
      </div>

      <div v-if="!localSettings.smsNotifications?.enabled" class="text-sm text-gray-500 dark:text-slate-400">
        SMS bildirimleri devre disi. Aktif etmek icin SMS entegrasyonu yapilandirilmalidir.
      </div>
    </div>

    <!-- Internal Notifications -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Dahili Bildirimler</h4>
      <div class="space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">VIP Misafir Gelisi</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">VIP misafir giris yaptiginda bildirim goster</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.internalNotifications.notifyVipArrival"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Yuksek Bakiye Uyarisi</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Misafir bakiyesi belirli tutari gectiginde uyar</p>
          </div>
          <div class="flex items-center gap-3">
            <div v-if="localSettings.internalNotifications.notifyHighBalance" class="flex items-center gap-1">
              <input
                type="number"
                v-model.number="localSettings.internalNotifications.highBalanceThreshold"
                @input="emitChange"
                min="0"
                class="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <span class="text-xs text-gray-500">TL</span>
            </div>
            <input
              type="checkbox"
              v-model="localSettings.internalNotifications.notifyHighBalance"
              @change="emitChange"
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </div>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">No-Show Uyarisi</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Misafir gelmediginde uyar</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.internalNotifications.notifyNoShow"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localSettings = ref({
  emailNotifications: {
    enabled: true,
    sendReservationConfirmation: true,
    sendCheckInReminder: true,
    checkInReminderDays: 1,
    sendCheckOutReminder: true,
    sendInvoiceEmail: true
  },
  smsNotifications: {
    enabled: false,
    sendReservationConfirmation: false,
    sendCheckInReminder: false
  },
  internalNotifications: {
    notifyVipArrival: true,
    notifyHighBalance: true,
    highBalanceThreshold: 5000,
    notifyNoShow: true
  },
  ...props.modelValue
})

// Ensure nested objects exist
if (!localSettings.value.emailNotifications) {
  localSettings.value.emailNotifications = {
    enabled: true,
    sendReservationConfirmation: true,
    sendCheckInReminder: true,
    checkInReminderDays: 1,
    sendCheckOutReminder: true,
    sendInvoiceEmail: true
  }
}
if (!localSettings.value.smsNotifications) {
  localSettings.value.smsNotifications = {
    enabled: false,
    sendReservationConfirmation: false,
    sendCheckInReminder: false
  }
}
if (!localSettings.value.internalNotifications) {
  localSettings.value.internalNotifications = {
    notifyVipArrival: true,
    notifyHighBalance: true,
    highBalanceThreshold: 5000,
    notifyNoShow: true
  }
}

watch(() => props.modelValue, (newVal) => {
  localSettings.value = {
    ...localSettings.value,
    ...newVal,
    emailNotifications: { ...localSettings.value.emailNotifications, ...(newVal?.emailNotifications || {}) },
    smsNotifications: { ...localSettings.value.smsNotifications, ...(newVal?.smsNotifications || {}) },
    internalNotifications: { ...localSettings.value.internalNotifications, ...(newVal?.internalNotifications || {}) }
  }
}, { deep: true })

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}
</script>
