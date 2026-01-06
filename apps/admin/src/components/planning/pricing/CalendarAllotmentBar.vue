<template>
  <div
    v-if="stats.totalCells > 0 && (stats.critical > 0 || stats.low > 0 || stats.stopSale > 0)"
    class="mb-3 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600"
  >
    <div class="flex items-center gap-4 text-xs">
      <!-- Critical -->
      <span
        v-if="stats.critical > 0"
        class="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full cursor-pointer hover:bg-red-200 transition-colors"
        @click="$emit('highlight-level', 'critical')"
      >
        <span class="material-icons text-sm">error</span>
        <span class="font-bold">{{ stats.critical }}</span>
        <span class="hidden sm:inline">stok yok</span>
      </span>
      <!-- Low -->
      <span
        v-if="stats.low > 0"
        class="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full cursor-pointer hover:bg-amber-200 transition-colors"
        @click="$emit('highlight-level', 'low')"
      >
        <span class="material-icons text-sm">warning</span>
        <span class="font-bold">{{ stats.low }}</span>
        <span class="hidden sm:inline">dusuk</span>
      </span>
      <!-- Stop Sale -->
      <span
        v-if="stats.stopSale > 0"
        class="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full cursor-pointer hover:bg-purple-200 transition-colors"
        @click="$emit('highlight-level', 'stopSale')"
      >
        <span class="material-icons text-sm">block</span>
        <span class="font-bold">{{ stats.stopSale }}</span>
        <span class="hidden sm:inline">stop</span>
      </span>
      <!-- Normal -->
      <span class="flex items-center gap-1 text-green-600 dark:text-green-400">
        <span class="material-icons text-sm">check_circle</span>
        <span class="font-bold">{{ stats.normal }}</span>
        <span class="hidden sm:inline">normal</span>
      </span>
    </div>
    <!-- Details Link -->
    <button
      class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline flex items-center gap-1"
      @click="$emit('show-details')"
    >
      <span class="material-icons text-sm">info</span>
      Detaylar
    </button>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({ critical: 0, low: 0, normal: 0, stopSale: 0, totalCells: 0 })
  }
})

defineEmits(['highlight-level', 'show-details'])
</script>
