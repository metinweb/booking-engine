<template>
  <div
    class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-indigo-600"
  >
    <div class="text-white">
      <h3 class="text-lg font-bold flex items-center gap-2">
        <span class="material-icons">edit_note</span>
        {{ $t('planning.pricing.bulkEdit') }}
      </h3>
      <p class="text-sm opacity-90 mt-0.5">
        {{ selectedCellsCount }} {{ $t('planning.pricing.cellsSelected') }}
      </p>
    </div>
    <button
      class="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
      @click="$emit('close')"
    >
      <span class="material-icons">close</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  selectedCellsCount: {
    type: Number,
    required: true
  }
})

defineEmits(['close'])
</script>
