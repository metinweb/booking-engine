<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <!-- Month Navigation -->
    <div class="flex items-center gap-2 sm:gap-3">
      <button
        class="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        @click="$emit('previous-month')"
      >
        <span class="material-icons text-lg sm:text-2xl">chevron_left</span>
      </button>
      <h3
        class="text-base sm:text-xl font-bold text-gray-800 dark:text-white min-w-[140px] sm:min-w-[200px] text-center"
      >
        {{ monthYearLabel }}
      </h3>
      <button
        class="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        @click="$emit('next-month')"
      >
        <span class="material-icons text-lg sm:text-2xl">chevron_right</span>
      </button>
      <button
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        @click="$emit('go-to-today')"
      >
        {{ $t('planning.pricing.today') }}
      </button>

      <!-- Current Month Seasons -->
      <template v-if="currentSeasons.length > 0">
        <span class="hidden sm:block w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"></span>
        <div class="hidden sm:flex items-center gap-1">
          <span
            v-for="season in currentSeasons"
            :key="season._id"
            class="px-2 py-0.5 text-xs font-medium text-white rounded-full"
            :style="{ backgroundColor: season.color || '#6366f1' }"
            :title="getSeasonName(season)"
          >
            {{ season.code }}
          </span>
        </div>
      </template>
    </div>

    <!-- Quick Actions -->
    <div class="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
      <!-- Copy/Paste Buttons -->
      <button
        v-if="selectedCount > 0"
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
        :title="'Ctrl+C'"
        @click="$emit('copy-week')"
      >
        <span class="material-icons text-sm">content_copy</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.copyWeek') }}</span>
      </button>
      <button
        v-if="copiedWeek"
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 whitespace-nowrap"
        :title="'Ctrl+V'"
        @click="$emit('paste-week')"
      >
        <span class="material-icons text-sm">content_paste</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.pasteWeek') }}</span>
      </button>

      <div
        v-if="selectedCount > 0 || copiedWeek"
        class="w-px h-5 sm:h-6 bg-gray-300 dark:bg-slate-600 mx-0.5 sm:mx-1"
      ></div>

      <button
        v-if="selectedCount > 0"
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
        @click="$emit('clear-selection')"
      >
        <span class="material-icons text-sm align-middle mr-0.5 sm:mr-1">close</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.clearSelection') }}</span> ({{
          selectedCount
        }})
      </button>
      <button
        v-if="selectedCount > 0"
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 whitespace-nowrap"
        @click="$emit('bulk-edit')"
      >
        <span class="material-icons text-sm">edit</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.bulkEdit') }}</span>
      </button>

      <div class="w-px h-5 sm:h-6 bg-gray-300 dark:bg-slate-600 mx-0.5 sm:mx-1"></div>

      <!-- Inline Edit Mode Toggle -->
      <button
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
        :class="
          inlineEditMode
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
        "
        @click="$emit('toggle-inline-edit')"
      >
        <span class="material-icons text-sm">{{ inlineEditMode ? 'save' : 'edit_note' }}</span>
        <span class="hidden sm:inline">{{
          inlineEditMode
            ? $t('planning.pricing.saveInlineEdit')
            : $t('planning.pricing.inlineEditMode')
        }}</span>
      </button>
      <button
        v-if="inlineEditMode"
        class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 whitespace-nowrap"
        @click="$emit('cancel-inline-edit')"
      >
        <span class="material-icons text-sm">close</span>
        <span class="hidden sm:inline">{{ $t('common.cancel') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  monthYearLabel: { type: String, required: true },
  currentSeasons: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 },
  copiedWeek: { type: Object, default: null },
  inlineEditMode: { type: Boolean, default: false }
})

defineEmits([
  'previous-month',
  'next-month',
  'go-to-today',
  'copy-week',
  'paste-week',
  'clear-selection',
  'bulk-edit',
  'toggle-inline-edit',
  'cancel-inline-edit'
])

const { locale } = useI18n()

const getSeasonName = season => {
  return season.name?.[locale.value] || season.name?.tr || season.name?.en || season.code
}
</script>
