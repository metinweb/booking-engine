<template>
  <div>
    <div
      class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span class="material-icons text-white">calculate</span>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white">
              {{ $t('planning.pricing.multiplierOverride') }}
            </h4>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('planning.markets.overrideRoomMultipliers') }}
            </p>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            :checked="currentRoomOverride.useMultiplierOverride"
            type="checkbox"
            class="sr-only peer"
            @change="$emit('update', 'useMultiplierOverride', $event.target.checked)"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
          ></div>
          <span
            class="ms-2 text-sm font-medium"
            :class="
              currentRoomOverride.useMultiplierOverride
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-slate-400'
            "
          >
            {{
              currentRoomOverride.useMultiplierOverride
                ? $t('common.active')
                : $t('common.inactive')
            }}
          </span>
        </label>
      </div>

      <!-- Info when disabled -->
      <div
        v-if="!currentRoomOverride.useMultiplierOverride"
        class="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg"
      >
        <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
          <span class="material-icons text-sm text-blue-500">info</span>
          {{ $t('planning.pricing.usingRoomMultipliers') }}
        </p>
      </div>
    </div>

    <!-- Multiplier Template (when override enabled) -->
    <div v-if="currentRoomOverride.useMultiplierOverride && effectivePricingType === 'per_person'">
      <MultiplierTemplate
        :model-value="currentRoomOverride.multiplierOverride"
        :occupancy="currentSelectedRoom.occupancy"
        :child-age-groups="hotel.childAgeGroups || []"
        :currency="currency"
        @update:model-value="$emit('update', 'multiplierOverride', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import MultiplierTemplate from '@/components/planning/rooms/MultiplierTemplate.vue'

defineProps({
  currentRoomOverride: { type: Object, required: true },
  currentSelectedRoom: { type: Object, required: true },
  effectivePricingType: { type: String, default: 'unit' },
  hotel: { type: Object, required: true },
  currency: { type: String, default: 'EUR' }
})

defineEmits(['update'])
</script>
