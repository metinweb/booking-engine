<template>
  <div
    class="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
          <span class="material-icons text-white">person_outline</span>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white">Min. Yetişkin Override</h4>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            Bu markette minimum yetişkin sayısını değiştir
          </p>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          :checked="currentRoomOverride.useMinAdultsOverride"
          type="checkbox"
          class="sr-only peer"
          @change="$emit('update', 'useMinAdultsOverride', $event.target.checked)"
        />
        <div
          class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-600"
        ></div>
      </label>
    </div>

    <!-- MinAdults Input (when override enabled) -->
    <div
      v-if="currentRoomOverride.useMinAdultsOverride"
      class="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg"
    >
      <label class="text-sm text-gray-600 dark:text-slate-400">Minimum Yetişkin:</label>
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="(currentRoomOverride.minAdults || 1) <= 1"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          :class="
            (currentRoomOverride.minAdults || 1) <= 1
              ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30'
          "
          @click="$emit('adjust', -1)"
        >
          <span class="material-icons">remove</span>
        </button>
        <span class="w-10 text-center text-xl font-bold text-gray-800 dark:text-white">{{
          currentRoomOverride.minAdults || 1
        }}</span>
        <button
          type="button"
          :disabled="
            (currentRoomOverride.minAdults || 1) >=
            (currentSelectedRoom?.occupancy?.maxAdults || 10)
          "
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          :class="
            (currentRoomOverride.minAdults || 1) >=
            (currentSelectedRoom?.occupancy?.maxAdults || 10)
              ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30'
          "
          @click="$emit('adjust', 1)"
        >
          <span class="material-icons">add</span>
        </button>
      </div>
      <span class="text-xs text-gray-500 dark:text-slate-400"
        >(Oda max: {{ currentSelectedRoom?.occupancy?.maxAdults || 2 }})</span
      >
    </div>

    <!-- Info when disabled -->
    <div v-else class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
      <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
        <span class="material-icons text-sm text-cyan-500">info</span>
        Oda ayarı kullanılıyor:
        <span class="font-semibold"
          >{{ currentSelectedRoom?.occupancy?.minAdults || 1 }} yetişkin</span
        >
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentRoomOverride: { type: Object, required: true },
  currentSelectedRoom: { type: Object, default: null }
})

defineEmits(['update', 'adjust'])
</script>
