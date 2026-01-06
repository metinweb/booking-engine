<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Search Input -->
    <SearchInput
      v-if="showSearch"
      v-model="localSearch"
      :placeholder="searchPlaceholder"
      :debounce="searchDebounce"
      :wrapper-class="searchWrapperClass"
      @search="handleSearch"
      @clear="handleSearchClear"
    />

    <!-- Filter Slots -->
    <slot name="filters"></slot>

    <!-- Status Filter -->
    <select
      v-if="showStatusFilter && statusOptions.length"
      v-model="localStatus"
      class="form-input min-w-[120px]"
      @change="handleStatusChange"
    >
      <option value="">{{ statusAllLabel }}</option>
      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <!-- Sort Dropdown -->
    <select
      v-if="showSort && sortOptions.length"
      v-model="localSort"
      class="form-input min-w-[150px]"
      @change="handleSortChange"
    >
      <option value="">{{ sortLabel }}</option>
      <option v-for="option in sortOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <!-- Additional Actions Slot -->
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import SearchInput from './SearchInput.vue'

const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  sort: {
    type: String,
    default: ''
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  showStatusFilter: {
    type: Boolean,
    default: true
  },
  showSort: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: ''
  },
  searchDebounce: {
    type: Number,
    default: 300
  },
  searchWrapperClass: {
    type: String,
    default: 'flex-1 min-w-[250px]'
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  statusAllLabel: {
    type: String,
    default: 'All'
  },
  sortOptions: {
    type: Array,
    default: () => []
  },
  sortLabel: {
    type: String,
    default: 'Sort by'
  }
})

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:sort',
  'search',
  'filter-change'
])

// Local state
const localSearch = ref(props.search)
const localStatus = ref(props.status)
const localSort = ref(props.sort)

// Sync with props
watch(
  () => props.search,
  val => {
    localSearch.value = val
  }
)
watch(
  () => props.status,
  val => {
    localStatus.value = val
  }
)
watch(
  () => props.sort,
  val => {
    localSort.value = val
  }
)

const handleSearch = () => {
  emit('update:search', localSearch.value)
  emit('search')
  emit('filter-change')
}

const handleSearchClear = () => {
  emit('update:search', '')
  emit('search')
  emit('filter-change')
}

const handleStatusChange = () => {
  emit('update:status', localStatus.value)
  emit('filter-change')
}

const handleSortChange = () => {
  emit('update:sort', localSort.value)
  emit('filter-change')
}
</script>
