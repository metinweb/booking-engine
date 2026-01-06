<template>
  <div
    class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
          <span class="material-icons text-white">payments</span>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('planning.markets.pricingTypeOverride') }}
          </h4>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ $t('planning.markets.pricingTypeOverrideHint') }}
          </p>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          :checked="currentRoomOverride.usePricingTypeOverride"
          type="checkbox"
          class="sr-only peer"
          @change="$emit('update', 'usePricingTypeOverride', $event.target.checked)"
        />
        <div
          class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        ></div>
      </label>
    </div>

    <!-- Pricing Type Selection (when override enabled) -->
    <div v-if="currentRoomOverride.usePricingTypeOverride" class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="p-4 rounded-xl border-2 transition-all text-left"
        :class="
          currentRoomOverride.pricingType === 'unit'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
        "
        @click="$emit('update', 'pricingType', 'unit')"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-blue-500">home</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{
            $t('planning.pricing.unitBased')
          }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('planning.pricing.unitBasedHint') }}
        </p>
      </button>
      <button
        type="button"
        class="p-4 rounded-xl border-2 transition-all text-left"
        :class="
          currentRoomOverride.pricingType === 'per_person'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
        "
        @click="$emit('update', 'pricingType', 'per_person')"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-purple-500">person</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{
            $t('planning.pricing.perPerson')
          }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('planning.pricing.perPersonHint') }}
        </p>
      </button>
    </div>

    <!-- Info when disabled -->
    <div v-else class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
      <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
        <span class="material-icons text-sm text-blue-500">info</span>
        {{ $t('planning.markets.usingRoomPricingType') }}:
        <span
          class="font-semibold"
          :class="
            currentSelectedRoom.pricingType === 'per_person' ? 'text-purple-600' : 'text-blue-600'
          "
        >
          {{
            currentSelectedRoom.pricingType === 'per_person'
              ? $t('planning.pricing.perPerson')
              : $t('planning.pricing.unitBased')
          }}
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentRoomOverride: { type: Object, required: true },
  currentSelectedRoom: { type: Object, required: true }
})

defineEmits(['update'])
</script>
