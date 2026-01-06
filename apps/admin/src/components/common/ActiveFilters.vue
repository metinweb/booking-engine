<template>
  <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2 mt-3">
    <span class="text-sm text-gray-500 dark:text-slate-400">
      {{ activeFiltersLabel }}:
    </span>

    <!-- Filter Pills -->
    <span
      v-for="filter in activeFiltersList"
      :key="filter.key"
      class="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
    >
      <span v-if="filter.label" class="font-medium mr-1">{{ filter.label }}:</span>
      {{ filter.displayValue }}
      <button
        type="button"
        class="ml-1.5 hover:text-purple-900 dark:hover:text-purple-100"
        @click="removeFilter(filter.key)"
      >
        <span class="material-icons text-sm">close</span>
      </button>
    </span>

    <!-- Clear All Button -->
    <button
      v-if="showClearAll && activeFiltersList.length > 1"
      type="button"
      class="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
      @click="clearAll"
    >
      {{ clearAllLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  filterLabels: {
    type: Object,
    default: () => ({})
  },
  filterValueLabels: {
    type: Object,
    default: () => ({})
  },
  excludeKeys: {
    type: Array,
    default: () => ['page', 'limit', 'sort']
  },
  activeFiltersLabel: {
    type: String,
    default: 'Active filters'
  },
  clearAllLabel: {
    type: String,
    default: 'Clear all'
  },
  showClearAll: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['remove', 'clear-all'])

const activeFiltersList = computed(() => {
  const list = []

  Object.entries(props.filters).forEach(([key, value]) => {
    // Skip excluded keys
    if (props.excludeKeys.includes(key)) return

    // Skip empty values
    if (value === '' || value === null || value === undefined) return
    if (Array.isArray(value) && value.length === 0) return

    // Get display value
    let displayValue = value
    if (props.filterValueLabels[key]?.[value]) {
      displayValue = props.filterValueLabels[key][value]
    } else if (Array.isArray(value)) {
      displayValue = value.join(', ')
    }

    list.push({
      key,
      label: props.filterLabels[key] || null,
      value,
      displayValue
    })
  })

  return list
})

const hasActiveFilters = computed(() => activeFiltersList.value.length > 0)

const removeFilter = key => {
  emit('remove', key)
}

const clearAll = () => {
  emit('clear-all')
}
</script>
