<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="table-header">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            :class="column.headerClass"
          >
            {{ column.label }}
          </th>
          <th
            v-if="$slots.actions"
            class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('common.actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading" class="table-row">
          <td
            :colspan="columns.length + ($slots.actions ? 1 : 0)"
            class="table-cell text-center py-12"
          >
            <div class="flex flex-col items-center justify-center">
              <svg
                class="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span class="text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="!data || data.length === 0" class="table-row">
          <td
            :colspan="columns.length + ($slots.actions ? 1 : 0)"
            class="table-cell text-center py-12 text-gray-500 dark:text-slate-400"
          >
            {{ $t('common.noData') }}
          </td>
        </tr>
        <tr v-for="item in data" v-else :key="item[itemKey]" class="table-row">
          <td
            v-for="column in columns"
            :key="column.key"
            class="table-cell"
            :class="column.cellClass"
          >
            <slot
              :name="`cell-${column.key}`"
              :item="item"
              :value="getNestedValue(item, column.key)"
            >
              {{ getNestedValue(item, column.key) }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="table-cell text-right">
            <slot name="actions" :item="item"></slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  itemKey: {
    type: String,
    default: '_id'
  }
})

// Helper function to get nested values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}
</script>
