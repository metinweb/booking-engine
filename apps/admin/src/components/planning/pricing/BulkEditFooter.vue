<template>
  <div
    class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
  >
    <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
      <span class="material-icons text-sm">info</span>
      {{ $t('planning.pricing.bulkEditHint') }}
    </div>
    <div class="flex gap-3">
      <button
        class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
        @click="$emit('cancel')"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        :disabled="saving"
        class="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25"
        @click="$emit('preview')"
      >
        <span class="material-icons text-sm">preview</span>
        {{ $t('planning.pricing.previewChanges') }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  saving: {
    type: Boolean,
    default: false
  }
})

defineEmits(['cancel', 'preview'])
</script>
