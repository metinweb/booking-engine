<template>
  <div
    class="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4"
  >
    <!-- Legend -->
    <div
      class="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-600 dark:text-slate-400"
    >
      <div class="flex items-center gap-1.5 sm:gap-2">
        <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500"></div>
        <span>{{ $t('planning.pricing.available') }}</span>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2">
        <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500"></div>
        <span>{{ $t('planning.pricing.stopSale') }}</span>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2">
        <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-pink-500"></div>
        <span>{{ $t('planning.pricing.singleStop') }}</span>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2">
        <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-500"></div>
        <span>{{ $t('planning.pricing.lowAllotment') }}</span>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2">
        <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded bg-gray-200 dark:bg-slate-600"></div>
        <span>{{ $t('planning.pricing.noRate') }}</span>
      </div>
    </div>

    <!-- Keyboard Shortcuts (hidden on mobile) -->
    <div class="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-slate-500">
      <div class="flex items-center gap-1">
        <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono"
          >Shift</kbd
        >
        <span>+ Click: Range</span>
      </div>
      <div class="flex items-center gap-1">
        <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono"
          >Ctrl</kbd
        >
        <span>+ C/V: Copy/Paste</span>
      </div>
      <div class="flex items-center gap-1">
        <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono"
          >Delete</kbd
        >
        <span>: Stop Sale</span>
      </div>
    </div>
  </div>
</template>

<script setup></script>
