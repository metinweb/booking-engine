<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kat Hizmetleri Ayarlari</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">Temizlik zamanlama ve durum ayarlari</p>
    </div>

    <!-- General Housekeeping Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Genel Ayarlar</h4>
      <div class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gunluk Temizlik Saati
            </label>
            <input
              type="time"
              v-model="localSettings.dailyCleaningTime"
              @change="emitChange"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temizlik Oncelik Sirasi
            </label>
            <select
              v-model="localSettings.cleaningPriority"
              @change="emitChange"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="checkout_first">Once Check-out Odalari</option>
              <option value="vip_first">Once VIP Odalar</option>
              <option value="floor_order">Kat Sirasina Gore</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Check-out Sonrasi Otomatik Kirli Isaretle</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Misafir cikis yaptiginda oda otomatik kirli olarak isaretlenir</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="localSettings.autoMarkDirtyOnCheckout"
              @change="emitChange"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>

    <!-- Cleaning Statuses -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">Temizlik Durumlari</h4>
        <button
          @click="addCleaningStatus"
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
        >
          <span class="material-icons text-sm">add</span>
          Yeni Durum
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(status, index) in localSettings.cleaningStatuses"
          :key="status._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            type="color"
            v-model="status.color"
            @input="emitChange"
            class="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            v-model="status.code"
            @input="emitChange"
            placeholder="Kod"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            v-model="status.name"
            @input="emitChange"
            placeholder="Durum Adi"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="number"
            v-model.number="status.order"
            @input="emitChange"
            min="0"
            placeholder="Sira"
            class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <button
            @click="removeCleaningStatus(index)"
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Task Types -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">Gorev Turleri</h4>
        <button
          @click="addTaskType"
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
        >
          <span class="material-icons text-sm">add</span>
          Yeni Gorev
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(task, index) in localSettings.taskTypes"
          :key="task._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            type="text"
            v-model="task.code"
            @input="emitChange"
            placeholder="Kod"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            v-model="task.name"
            @input="emitChange"
            placeholder="Gorev Adi"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <div class="flex items-center gap-1">
            <input
              type="number"
              v-model.number="task.estimatedMinutes"
              @input="emitChange"
              min="1"
              class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <span class="text-xs text-gray-500">dk</span>
          </div>
          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="task.isActive"
              @change="emitChange"
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </label>
          <button
            @click="removeTaskType(index)"
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
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
  dailyCleaningTime: '10:00',
  autoMarkDirtyOnCheckout: true,
  cleaningPriority: 'checkout_first',
  cleaningStatuses: [],
  taskTypes: [],
  ...props.modelValue
})

watch(() => props.modelValue, (newVal) => {
  localSettings.value = { ...localSettings.value, ...newVal }
}, { deep: true })

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

const addCleaningStatus = () => {
  if (!localSettings.value.cleaningStatuses) {
    localSettings.value.cleaningStatuses = []
  }
  localSettings.value.cleaningStatuses.push({
    code: '',
    name: '',
    color: '#6b7280',
    order: localSettings.value.cleaningStatuses.length
  })
  emitChange()
}

const removeCleaningStatus = (index) => {
  localSettings.value.cleaningStatuses.splice(index, 1)
  emitChange()
}

const addTaskType = () => {
  if (!localSettings.value.taskTypes) {
    localSettings.value.taskTypes = []
  }
  localSettings.value.taskTypes.push({
    code: '',
    name: '',
    estimatedMinutes: 30,
    isActive: true
  })
  emitChange()
}

const removeTaskType = (index) => {
  localSettings.value.taskTypes.splice(index, 1)
  emitChange()
}
</script>
