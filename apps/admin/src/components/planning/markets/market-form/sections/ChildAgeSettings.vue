<template>
  <div
    class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 mb-4"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="material-icons text-pink-500">child_care</span>
        <label class="form-label mb-0">{{ $t('planning.markets.ageSettings') }}</label>
      </div>
      <!-- Inherit from hotel toggle -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-slate-400">{{
          $t('planning.markets.inheritFromHotel')
        }}</span>
        <button
          type="button"
          class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
          :class="inheritFromHotel ? 'bg-pink-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="$emit('update:inheritFromHotel', !inheritFromHotel)"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
            :class="inheritFromHotel ? 'translate-x-6' : 'translate-x-0'"
          ></span>
        </button>
      </div>
    </div>

    <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
      {{ $t('planning.markets.ageSettingsHint') }}
    </p>

    <!-- Using hotel settings info -->
    <div
      v-if="inheritFromHotel"
      class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600"
    >
      <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
        <span class="material-icons text-xs">link</span>
        {{ $t('planning.markets.usingHotelSettings') }}
      </p>
      <div v-if="hotelChildAgeGroups.length" class="space-y-2">
        <div
          v-for="group in hotelChildAgeGroups"
          :key="group.code"
          class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
        >
          <span
            class="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium w-28"
            :class="getGroupClass(group.code)"
          >
            <span class="material-icons text-sm">
              {{ group.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
            </span>
            {{ $t(`planning.childGroups.${group.code}`) }}
          </span>
          <span class="text-sm text-gray-600 dark:text-slate-300">
            {{ group.minAge }} — {{ group.maxAge }} {{ $t('planning.markets.years') }}
          </span>
        </div>
      </div>
      <p v-else class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
        <span class="material-icons text-xs">warning</span>
        {{ $t('planning.markets.noChildGroups') }}
      </p>
    </div>

    <!-- Override child age groups -->
    <div v-else>
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('planning.markets.customAgeGroups') }}
        </p>
        <button
          v-if="childAgeGroups.length < 3"
          type="button"
          class="px-3 py-1.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors flex items-center gap-1"
          @click="$emit('addGroup')"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.markets.addAgeGroup') }}
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="(group, index) in childAgeGroups"
          :key="group.code"
          class="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <div class="w-28 flex-shrink-0">
            <span
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
              :class="getGroupClass(group.code)"
            >
              <span class="material-icons text-sm">
                {{ group.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
              </span>
              {{ $t(`planning.childGroups.${group.code}`) }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div class="w-16">
              <input
                :value="group.minAge"
                type="number"
                min="0"
                max="17"
                class="form-input text-sm py-1.5 text-center bg-gray-100 dark:bg-slate-600 cursor-not-allowed"
                disabled
                readonly
              />
              <span class="text-[10px] text-gray-400 block text-center">min</span>
            </div>

            <span class="text-gray-400 font-bold">—</span>

            <div class="w-16">
              <input
                :value="group.maxAge"
                type="number"
                :min="group.minAge"
                max="17"
                class="form-input text-sm py-1.5 text-center"
                @change="$emit('maxAgeChange', index)"
                @input="updateMaxAge(index, $event)"
              />
              <span class="text-[10px] text-gray-400 block text-center">max</span>
            </div>

            <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
          </div>

          <div class="flex-1"></div>

          <button
            v-if="childAgeGroups.length > 1"
            type="button"
            class="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            :title="$t('common.delete')"
            @click="$emit('removeGroup', index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>

      <p
        v-if="!childAgeGroups.length"
        class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-3"
      >
        <span class="material-icons text-xs">warning</span>
        {{ $t('planning.markets.noChildGroups') }}
      </p>

      <p class="text-xs text-gray-500 dark:text-slate-400 mt-3 flex items-center gap-1">
        <span class="material-icons text-xs">info</span>
        {{ $t('planning.markets.maxAgeGroupsHint') }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  inheritFromHotel: { type: Boolean, default: true },
  childAgeGroups: { type: Array, default: () => [] },
  hotelChildAgeGroups: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:inheritFromHotel', 'update:childAgeGroups', 'addGroup', 'removeGroup', 'maxAgeChange'])

const getGroupClass = code => {
  if (code === 'infant') return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
  if (code === 'first') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
}

const updateMaxAge = (index, event) => {
  const newGroups = [...props.childAgeGroups]
  newGroups[index].maxAge = parseInt(event.target.value) || 0
  emit('update:childAgeGroups', newGroups)
}
</script>
