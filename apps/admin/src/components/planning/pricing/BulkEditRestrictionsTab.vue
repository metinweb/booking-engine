<template>
  <div class="space-y-4">
    <!-- Stop Sale -->
    <div
      class="p-5 rounded-xl border-2 cursor-pointer transition-all"
      :class="
        stopSale
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
      "
      @click="$emit('update:stopSale', !stopSale)"
    >
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
          :class="
            stopSale
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
          "
        >
          <span class="material-icons text-2xl">block</span>
        </div>
        <div class="flex-1">
          <div
            class="font-bold text-lg"
            :class="stopSale ? 'text-red-600' : 'text-gray-700 dark:text-slate-300'"
          >
            {{ $t('planning.pricing.stopSale') }}
          </div>
          <div class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('planning.pricing.stopSaleHint') }}
          </div>
        </div>
        <div
          class="w-12 h-7 rounded-full transition-colors"
          :class="stopSale ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'"
        >
          <div
            class="w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform"
            :class="stopSale ? 'translate-x-6' : 'translate-x-1'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Single Stop -->
    <div
      class="p-5 rounded-xl border-2 cursor-pointer transition-all"
      :class="
        singleStop
          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
      "
      @click="$emit('update:singleStop', !singleStop)"
    >
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
          :class="
            singleStop
              ? 'bg-pink-500 text-white'
              : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
          "
        >
          <span class="material-icons text-2xl">person_off</span>
        </div>
        <div class="flex-1">
          <div
            class="font-bold text-lg"
            :class="singleStop ? 'text-pink-600' : 'text-gray-700 dark:text-slate-300'"
          >
            {{ $t('planning.pricing.singleStop') }}
          </div>
          <div class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('planning.pricing.singleStopHint') }}
          </div>
        </div>
        <div
          class="w-12 h-7 rounded-full transition-colors"
          :class="singleStop ? 'bg-pink-500' : 'bg-gray-300 dark:bg-slate-600'"
        >
          <div
            class="w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform"
            :class="singleStop ? 'translate-x-6' : 'translate-x-1'"
          ></div>
        </div>
      </div>
    </div>

    <!-- CTA/CTD -->
    <div class="grid grid-cols-2 gap-4">
      <div
        class="p-4 rounded-xl border-2 cursor-pointer transition-all"
        :class="
          closedToArrival
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
        "
        @click="$emit('update:closedToArrival', !closedToArrival)"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="
              closedToArrival
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
            "
          >
            <span class="material-icons">no_meeting_room</span>
          </div>
          <div>
            <div
              class="font-medium"
              :class="
                closedToArrival
                  ? 'text-orange-600'
                  : 'text-gray-700 dark:text-slate-300'
              "
            >
              CTA
            </div>
            <div class="text-xs text-gray-500">
              {{ $t('planning.pricing.closedToArrival') }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="p-4 rounded-xl border-2 cursor-pointer transition-all"
        :class="
          closedToDeparture
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
        "
        @click="$emit('update:closedToDeparture', !closedToDeparture)"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="
              closedToDeparture
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
            "
          >
            <span class="material-icons">logout</span>
          </div>
          <div>
            <div
              class="font-medium"
              :class="
                closedToDeparture
                  ? 'text-orange-600'
                  : 'text-gray-700 dark:text-slate-300'
              "
            >
              CTD
            </div>
            <div class="text-xs text-gray-500">
              {{ $t('planning.pricing.closedToDeparture') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stopSale: {
    type: Boolean,
    required: true
  },
  singleStop: {
    type: Boolean,
    required: true
  },
  closedToArrival: {
    type: Boolean,
    required: true
  },
  closedToDeparture: {
    type: Boolean,
    required: true
  }
})

defineEmits([
  'update:stopSale',
  'update:singleStop',
  'update:closedToArrival',
  'update:closedToDeparture'
])
</script>
