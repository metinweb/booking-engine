<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="$emit('close')"
      >
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          <!-- Modal Header -->
          <div
            class="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons">monitoring</span>
              <h3 class="text-lg font-bold">Kontenjan Durumu</h3>
            </div>
            <button
              class="p-1 hover:bg-white/20 rounded-lg transition-colors"
              @click="$emit('close')"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          <!-- Modal Content -->
          <div class="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            <!-- Summary Cards -->
            <div class="grid grid-cols-4 gap-3 mb-6">
              <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                <div class="text-2xl font-bold text-red-600">{{ stats.critical }}</div>
                <div class="text-xs text-red-500">Stok Yok (0)</div>
              </div>
              <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                <div class="text-2xl font-bold text-amber-600">{{ stats.low }}</div>
                <div class="text-xs text-amber-500">Dusuk (1-3)</div>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                <div class="text-2xl font-bold text-green-600">{{ stats.normal }}</div>
                <div class="text-xs text-green-500">Normal (4+)</div>
              </div>
              <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                <div class="text-2xl font-bold text-purple-600">{{ stats.stopSale }}</div>
                <div class="text-xs text-purple-500">Stop Sale</div>
              </div>
            </div>

            <!-- Details List -->
            <div v-if="details.length > 0" class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Oda Bazli Detay
              </h4>
              <div
                v-for="detail in details"
                :key="detail.key"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <span class="font-bold text-purple-600">{{ detail.roomCode }}</span>
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="getMealPlanBadgeClass(detail.mealPlanCode)"
                  >
                    {{ detail.mealPlanCode }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    v-if="detail.critical > 0"
                    class="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full"
                  >
                    {{ detail.critical }} stok yok
                  </span>
                  <span
                    v-if="detail.low > 0"
                    class="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full"
                  >
                    {{ detail.low }} dusuk
                  </span>
                  <span
                    v-if="detail.stopSale > 0"
                    class="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full"
                  >
                    {{ detail.stopSale }} stop
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <span class="material-icons text-4xl text-green-500 mb-2">check_circle</span>
              <p>Tum odalar normal stokta</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  stats: {
    type: Object,
    default: () => ({ critical: 0, low: 0, normal: 0, stopSale: 0 })
  },
  details: { type: Array, default: () => [] }
})

defineEmits(['close'])

const getMealPlanBadgeClass = code => {
  const colors = {
    RO: 'px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium',
    BB: 'px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium',
    HB: 'px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium',
    FB: 'px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium',
    AI: 'px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium',
    UAI: 'px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium'
  }
  return (
    colors[code] ||
    'px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium'
  )
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
