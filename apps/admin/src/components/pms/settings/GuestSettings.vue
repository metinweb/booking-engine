<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Misafir Ayarlari</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">Misafir kayit gereksinimleri ve VIP ayarlari</p>
    </div>

    <!-- Required Fields -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Zorunlu Alanlar</h4>
      <div class="space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">TC / Pasaport</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Kimlik numarasi zorunlu olsun</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.requireIdentification"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">E-posta</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">E-posta adresi zorunlu olsun</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.requireEmail"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Telefon</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Telefon numarasi zorunlu olsun</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.requirePhone"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Adres</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Adres bilgisi zorunlu olsun</p>
          </div>
          <input
            type="checkbox"
            v-model="localSettings.requireAddress"
            @change="emitChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>

    <!-- VIP Levels -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">VIP Seviyeleri</h4>
        <button
          @click="addVipLevel"
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
        >
          <span class="material-icons text-sm">add</span>
          Yeni Seviye
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(level, index) in localSettings.vipLevels"
          :key="level._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            type="color"
            v-model="level.color"
            @input="emitChange"
            class="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            v-model="level.code"
            @input="emitChange"
            placeholder="Kod"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            v-model="level.name"
            @input="emitChange"
            placeholder="Seviye Adi"
            class="w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            v-model="level.benefits"
            @input="emitChange"
            placeholder="Avantajlar"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="number"
            v-model.number="level.order"
            @input="emitChange"
            min="0"
            placeholder="Sira"
            class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <button
            @click="removeVipLevel(index)"
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Auto VIP Assignment -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">Otomatik VIP Atamasi</h4>
          <p class="text-sm text-gray-500 dark:text-slate-400">Konaklama sayisina gore otomatik VIP ata</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="localSettings.autoVipAssignment.enabled"
            @change="emitChange"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div v-if="localSettings.autoVipAssignment?.enabled" class="grid md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-3 h-3 bg-gray-400 rounded-full"></span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Silver</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="localSettings.autoVipAssignment.silverAfterStays"
              @input="emitChange"
              min="1"
              class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-sm text-gray-500">konaklama sonrasi</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Gold</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="localSettings.autoVipAssignment.goldAfterStays"
              @input="emitChange"
              min="1"
              class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-sm text-gray-500">konaklama sonrasi</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-3 h-3 bg-purple-500 rounded-full"></span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Platinum</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="localSettings.autoVipAssignment.platinumAfterStays"
              @input="emitChange"
              min="1"
              class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-sm text-gray-500">konaklama sonrasi</span>
          </div>
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
  requireIdentification: true,
  requireEmail: false,
  requirePhone: true,
  requireAddress: false,
  vipLevels: [],
  autoVipAssignment: {
    enabled: true,
    silverAfterStays: 3,
    goldAfterStays: 5,
    platinumAfterStays: 10
  },
  ...props.modelValue
})

// Ensure autoVipAssignment exists
if (!localSettings.value.autoVipAssignment) {
  localSettings.value.autoVipAssignment = {
    enabled: true,
    silverAfterStays: 3,
    goldAfterStays: 5,
    platinumAfterStays: 10
  }
}

watch(() => props.modelValue, (newVal) => {
  localSettings.value = {
    ...localSettings.value,
    ...newVal,
    autoVipAssignment: { ...localSettings.value.autoVipAssignment, ...(newVal?.autoVipAssignment || {}) }
  }
}, { deep: true })

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

const addVipLevel = () => {
  if (!localSettings.value.vipLevels) {
    localSettings.value.vipLevels = []
  }
  localSettings.value.vipLevels.push({
    code: '',
    name: '',
    color: '#6b7280',
    benefits: '',
    order: localSettings.value.vipLevels.length
  })
  emitChange()
}

const removeVipLevel = (index) => {
  localSettings.value.vipLevels.splice(index, 1)
  emitChange()
}
</script>
