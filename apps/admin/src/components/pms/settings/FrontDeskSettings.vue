<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Resepsiyon Ayarlari</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">Check-in/out saatleri ve odeme ayarlari</p>
    </div>

    <!-- Check-in/Check-out Times -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Giris/Cikis Saatleri</h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Varsayilan Check-in Saati
          </label>
          <input
            type="time"
            v-model="localSettings.defaultCheckInTime"
            @change="emitChange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Varsayilan Check-out Saati
          </label>
          <input
            type="time"
            v-model="localSettings.defaultCheckOutTime"
            @change="emitChange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Early/Late Options -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Erken Giris / Gec Cikis</h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Erken Check-in Izni</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Misafirlerin erken giris yapmasina izin ver</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="localSettings.allowEarlyCheckIn"
              @change="emitChange"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div v-if="localSettings.allowEarlyCheckIn">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Erken Check-in Ucreti (Saatlik)
          </label>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="localSettings.earlyCheckInFee"
              @input="emitChange"
              min="0"
              class="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-gray-500 dark:text-slate-400">TL/saat</span>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-slate-600 pt-4 flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Gec Check-out Izni</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Misafirlerin gec cikis yapmasina izin ver</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="localSettings.allowLateCheckOut"
              @change="emitChange"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div v-if="localSettings.allowLateCheckOut">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gec Check-out Ucreti (Saatlik)
          </label>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="localSettings.lateCheckOutFee"
              @input="emitChange"
              min="0"
              class="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-gray-500 dark:text-slate-400">TL/saat</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Odeme Ayarlari</h4>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Varsayilan Odeme Yontemi
          </label>
          <select
            v-model="localSettings.defaultPaymentMethod"
            @change="emitChange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="cash">Nakit</option>
            <option value="credit_card">Kredi Karti</option>
            <option value="debit_card">Banka Karti</option>
            <option value="bank_transfer">Havale/EFT</option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Walk-in icin Depozito Zorunlu</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Rezervasyonsuz misafirlerden depozito al</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="localSettings.requireDepositForWalkIn"
              @change="emitChange"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div v-if="localSettings.requireDepositForWalkIn">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum Depozito Yuzdesi
          </label>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="localSettings.minimumDepositPercent"
              @input="emitChange"
              min="0"
              max="100"
              class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-gray-500 dark:text-slate-400">%</span>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-slate-600 pt-4 flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Check-out'ta Sifir Bakiye Zorunlu</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Cikis icin tum borcun odenmesi gerekir</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="localSettings.requireZeroBalanceCheckOut"
              @change="emitChange"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
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
  defaultCheckInTime: '14:00',
  defaultCheckOutTime: '12:00',
  allowEarlyCheckIn: true,
  allowLateCheckOut: true,
  earlyCheckInFee: 0,
  lateCheckOutFee: 0,
  defaultPaymentMethod: 'cash',
  requireDepositForWalkIn: true,
  minimumDepositPercent: 50,
  requireZeroBalanceCheckOut: true,
  ...props.modelValue
})

watch(() => props.modelValue, (newVal) => {
  localSettings.value = { ...localSettings.value, ...newVal }
}, { deep: true })

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}
</script>
