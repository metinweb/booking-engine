<template>
  <Modal
    :model-value="show"
    :title="$t('hotels.hotelBase.selectSource')"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <!-- Option 1: Select from HotelBase -->
      <button
        type="button"
        class="w-full p-6 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
        @click="$emit('select', 'base')"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors"
          >
            <span class="material-icons text-2xl text-purple-600 dark:text-purple-400">domain</span>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              {{ $t('hotels.hotelBase.selectFromBase') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.hotelBase.selectFromBaseDesc') }}
            </p>
          </div>
          <span
            class="material-icons text-gray-400 dark:text-slate-500 group-hover:text-purple-500 transition-colors"
            >arrow_forward</span
          >
        </div>
      </button>

      <!-- Option 2: Create own hotel -->
      <button
        type="button"
        class="w-full p-6 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
        @click="$emit('select', 'own')"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors"
          >
            <span class="material-icons text-2xl text-blue-600 dark:text-blue-400">edit_note</span>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              {{ $t('hotels.hotelBase.createOwn') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.hotelBase.createOwnDesc') }}
            </p>
          </div>
          <span
            class="material-icons text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors"
            >arrow_forward</span
          >
        </div>
      </button>
    </div>

    <template #footer>
      <button
        type="button"
        class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        @click="$emit('close')"
      >
        {{ $t('common.cancel') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'select'])
</script>
