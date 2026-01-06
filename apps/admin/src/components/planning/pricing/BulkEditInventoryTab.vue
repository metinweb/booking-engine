<template>
  <div class="space-y-5">
    <!-- Allotment -->
    <div class="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
      <div class="flex items-center justify-between mb-4">
        <div>
          <label
            class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2"
          >
            <span class="material-icons text-blue-600">inventory_2</span>
            {{ $t('planning.pricing.allotment') }}
          </label>
          <p class="text-xs text-gray-500 mt-1">
            {{ $t('planning.pricing.allotmentHint') }}
          </p>
        </div>
      </div>

      <!-- Allotment Mode Buttons -->
      <div class="flex justify-center gap-1 mb-4 bg-white dark:bg-slate-700 rounded-xl p-1">
        <button
          v-for="mode in allotmentModes"
          :key="mode.value"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          :class="
            allotmentMode === mode.value
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'
          "
          @click="$emit('update:allotmentMode', mode.value)"
        >
          <span class="material-icons text-lg">{{ mode.icon }}</span>
          <span class="hidden sm:inline">{{ mode.label }}</span>
        </button>
      </div>

      <div class="flex items-center justify-center gap-4">
        <button
          class="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          @click="$emit('update:allotmentValue', Math.max(0, allotmentValue - 1))"
        >
          <span class="material-icons">remove</span>
        </button>
        <input
          :value="allotmentValue"
          type="number"
          min="0"
          class="w-24 text-center text-3xl font-bold border-2 border-blue-300 dark:border-blue-700 rounded-xl py-3 bg-white dark:bg-slate-800"
          @input="$emit('update:allotmentValue', Number($event.target.value))"
        />
        <button
          class="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          @click="$emit('update:allotmentValue', allotmentValue + 1)"
        >
          <span class="material-icons">add</span>
        </button>
      </div>
    </div>

    <!-- Stay Requirements -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
        <label
          class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-2"
        >
          <span class="material-icons text-purple-600 text-lg">nights_stay</span>
          {{ $t('planning.pricing.minStay') }}
        </label>
        <div class="flex items-center gap-2">
          <input
            :value="minStay"
            type="number"
            min="1"
            max="30"
            class="form-input"
            @input="$emit('update:minStay', Number($event.target.value))"
          />
          <span class="text-sm text-gray-500">{{ $t('planning.pricing.nights') }}</span>
        </div>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
        <label
          class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-2"
        >
          <span class="material-icons text-orange-600 text-lg">schedule</span>
          {{ $t('planning.pricing.releaseDays') }}
        </label>
        <div class="flex items-center gap-2">
          <input
            :value="releaseDays"
            type="number"
            min="0"
            class="form-input"
            @input="$emit('update:releaseDays', Number($event.target.value))"
          />
          <span class="text-sm text-gray-500">{{
            $t('planning.pricing.daysBeforeArrival')
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  allotmentMode: {
    type: String,
    required: true
  },
  allotmentModes: {
    type: Array,
    required: true
  },
  allotmentValue: {
    type: Number,
    required: true
  },
  minStay: {
    type: Number,
    required: true
  },
  releaseDays: {
    type: Number,
    required: true
  }
})

defineEmits([
  'update:allotmentMode',
  'update:allotmentValue',
  'update:minStay',
  'update:releaseDays'
])
</script>
