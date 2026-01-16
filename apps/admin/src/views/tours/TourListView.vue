<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="teal" />

    <div class="flex-1 overflow-y-auto py-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in statCards"
          :key="stat.key"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 cursor-pointer transition-all hover:shadow-md"
          :class="{ 'ring-2 ring-teal-500': filters.status === stat.filterValue }"
          @click="setStatusFilter(stat.filterValue)"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
              :class="stat.bgClass"
            >
              <span class="material-icons" :class="stat.iconClass">{{ stat.icon }}</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                v-model="filters.search"
                type="text"
                :placeholder="$t('tour.search')"
                class="form-input w-full pl-10"
                @input="debouncedSearch"
              />
            </div>
          </div>

          <!-- Tour Type Filter -->
          <select v-model="filters.tourType" class="form-input w-auto" @change="applyFilters">
            <option value="">{{ $t('filters.allTypes') }}</option>
            <option v-for="type in tourTypes" :key="type.value" :value="type.value">
              {{ $t(type.label) }}
            </option>
          </select>

          <!-- Status Filter -->
          <select v-model="filters.status" class="form-input w-auto" @change="applyFilters">
            <option value="">{{ $t('filters.allStatuses') }}</option>
            <option value="active">{{ $t('tour.statuses.active') }}</option>
            <option value="inactive">{{ $t('tour.statuses.inactive') }}</option>
            <option value="draft">{{ $t('tour.statuses.draft') }}</option>
          </select>

          <!-- View Toggle -->
          <div class="flex border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              class="p-2"
              :class="viewMode === 'table' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'"
              @click="viewMode = 'table'"
            >
              <span class="material-icons text-xl">table_rows</span>
            </button>
            <button
              class="p-2"
              :class="viewMode === 'cards' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'"
              @click="viewMode = 'cards'"
            >
              <span class="material-icons text-xl">grid_view</span>
            </button>
          </div>

          <!-- AI Import Button -->
          <button
            class="btn-outline border-teal-500 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30"
            @click="showAIImporter = true"
          >
            <span class="material-icons mr-2">auto_awesome</span>
            {{ $t('tour.aiImport.button') }}
          </button>

          <!-- New Tour Button -->
          <button class="btn-primary bg-teal-600 hover:bg-teal-700" @click="createTour">
            <span class="material-icons mr-2">add</span>
            {{ $t('tour.newTour') }}
          </button>
        </div>
      </div>

      <!-- Tours DataTable -->
      <DataTable
        ref="dataTableRef"
        :data="tours"
        :columns="columns"
        :loading="isLoading"
        :total="pagination.total"
        :page="pagination.page"
        :per-page="pagination.limit"
        :show-header="false"
        :default-view-mode="viewMode"
        :card-title-key="'code'"
        :empty-icon="'tour'"
        :empty-text="$t('tour.noToursDescription')"
        @page-change="handlePageChange"
      >
        <!-- Empty State Action -->
        <template #empty-action>
          <button type="button" class="mt-4 btn-primary bg-teal-600 hover:bg-teal-700" @click="createTour">
            <span class="material-icons mr-2">add</span>
            {{ $t('tour.createFirstTour') }}
          </button>
        </template>

        <!-- Tour Code & Name Cell -->
        <template #cell-code="{ row }">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-lg overflow-hidden mr-3 bg-gray-100 dark:bg-slate-700 flex-shrink-0">
              <img
                v-if="row.mainImage"
                :src="row.mainImage"
                :alt="getLocalizedName(row.name)"
                class="w-full h-full object-cover"
              />
              <span v-else class="material-icons text-2xl text-gray-400 flex items-center justify-center w-full h-full">tour</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <button
                  class="font-semibold text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  @click.stop="editTour(row)"
                >
                  {{ row.code }}
                </button>
                <span
                  v-if="row.isFeatured"
                  class="material-icons text-amber-500 text-sm"
                  title="Featured"
                >star</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-slate-300 line-clamp-1 max-w-[250px]">
                {{ getLocalizedName(row.name) }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                  {{ $t(`tour.tourTypes.${row.tourType}`) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-slate-400">
                  {{ row.duration?.nights }}N / {{ row.duration?.days }}D
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Destination Cell -->
        <template #cell-destination="{ row }">
          <div v-if="row.destination">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ row.destination.city || row.destination.country }}
            </p>
            <p v-if="row.destination.region" class="text-xs text-gray-500 dark:text-slate-400">
              {{ row.destination.region }}
            </p>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- Transportation Cell -->
        <template #cell-transportation="{ row }">
          <div v-if="row.transportation?.length" class="flex items-center gap-1">
            <span
              v-for="(transport, idx) in row.transportation.slice(0, 3)"
              :key="idx"
              class="material-icons text-lg"
              :class="getTransportIcon(transport.type).class"
              :title="$t(`tour.transportTypes.${transport.type}`)"
            >
              {{ getTransportIcon(transport.type).icon }}
            </span>
            <span v-if="row.transportation.length > 3" class="text-xs text-gray-500">
              +{{ row.transportation.length - 3 }}
            </span>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- Departures Cell -->
        <template #cell-departures="{ row }">
          <div class="text-center">
            <p class="font-semibold text-gray-900 dark:text-white">{{ row.departureCount || 0 }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('departure.departures') }}</p>
          </div>
        </template>

        <!-- Status Cell -->
        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="getStatusClass(row.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(row.status)"></span>
            {{ $t(`tour.statuses.${row.status}`) }}
          </span>
        </template>

        <!-- Actions Cell -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-teal-600"
              :title="$t('common.edit')"
              @click.stop="editTour(row)"
            >
              <span class="material-icons text-lg">edit</span>
            </button>
            <button
              class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600"
              :title="$t('tour.duplicate')"
              @click.stop="duplicateTour(row)"
            >
              <span class="material-icons text-lg">content_copy</span>
            </button>
            <button
              class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-red-600"
              :title="$t('common.delete')"
              @click.stop="confirmDelete(row)"
            >
              <span class="material-icons text-lg">delete</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      :title="$t('tour.deleteTour')"
      :message="$t('tour.deleteConfirm')"
      type="danger"
      @confirm="deleteTour"
    />

    <!-- AI Import Modal -->
    <TourAIImporter
      v-model="showAIImporter"
      @apply="handleAIImportApply"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTourStore } from '@/stores/tour'
import { getTourTypes } from '@/services/tourService'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import { DataTable, ConfirmDialog } from '@/components/ui'
import TourAIImporter from '@/components/tour/TourAIImporter.vue'
import debounce from 'lodash/debounce'

const router = useRouter()
const { t, locale } = useI18n()
const tourStore = useTourStore()

// State
const isLoading = computed(() => tourStore.loading)
const tours = computed(() => tourStore.tours)
const pagination = computed(() => tourStore.pagination)
const viewMode = ref('table')
const showDeleteDialog = ref(false)
const tourToDelete = ref(null)
const showAIImporter = ref(false)

// Filters
const filters = ref({
  search: '',
  tourType: '',
  status: ''
})

// Tour Types
const tourTypes = getTourTypes()

// Navigation Items
const navItems = computed(() => [
  {
    label: t('tour.tourList'),
    icon: 'tour',
    to: '/tours'
  },
  {
    label: t('departure.calendar'),
    icon: 'calendar_month',
    to: '/tours/departures'
  },
  {
    label: t('extra.extras'),
    icon: 'add_circle',
    to: '/tours/extras'
  },
  {
    label: t('tourBooking.bookings'),
    icon: 'book_online',
    to: '/tours/bookings'
  }
])

// Stats
const statCards = computed(() => [
  {
    key: 'total',
    label: t('stats.totalTours'),
    value: tourStore.tourStats?.total || tours.value.length,
    icon: 'tour',
    bgClass: 'bg-teal-100 dark:bg-teal-900/50',
    iconClass: 'text-teal-600 dark:text-teal-400',
    filterValue: ''
  },
  {
    key: 'active',
    label: t('stats.activeTours'),
    value: tourStore.tourStats?.active || tourStore.activeTours.length,
    icon: 'check_circle',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    iconClass: 'text-green-600 dark:text-green-400',
    filterValue: 'active'
  },
  {
    key: 'departures',
    label: t('stats.upcomingDepartures'),
    value: tourStore.tourStats?.upcomingDepartures || 0,
    icon: 'event',
    bgClass: 'bg-blue-100 dark:bg-blue-900/50',
    iconClass: 'text-blue-600 dark:text-blue-400',
    filterValue: null
  },
  {
    key: 'featured',
    label: t('tour.fields.featured'),
    value: tourStore.featuredTours.length,
    icon: 'star',
    bgClass: 'bg-amber-100 dark:bg-amber-900/50',
    iconClass: 'text-amber-600 dark:text-amber-400',
    filterValue: null
  }
])

// Table Columns
const columns = computed(() => [
  {
    key: 'code',
    label: t('tour.fields.code'),
    sortable: true,
    width: '320px'
  },
  {
    key: 'destination',
    label: t('tour.fields.destination'),
    sortable: true,
    width: '150px'
  },
  {
    key: 'transportation',
    label: t('tour.transportation.title'),
    width: '120px'
  },
  {
    key: 'departures',
    label: t('departure.departures'),
    width: '100px',
    align: 'center'
  },
  {
    key: 'status',
    label: t('tour.fields.status'),
    sortable: true,
    width: '120px'
  },
  {
    key: 'actions',
    label: '',
    width: '120px',
    align: 'right'
  }
])

// Methods
const getLocalizedName = (name) => {
  if (!name) return ''
  return name[locale.value] || name.tr || name.en || Object.values(name)[0] || ''
}

const getTransportIcon = (type) => {
  const icons = {
    flight: { icon: 'flight', class: 'text-blue-500' },
    bus: { icon: 'directions_bus', class: 'text-orange-500' },
    ferry: { icon: 'directions_boat', class: 'text-cyan-500' },
    car: { icon: 'directions_car', class: 'text-purple-500' },
    train: { icon: 'train', class: 'text-green-500' },
    combined: { icon: 'multiple_stop', class: 'text-gray-500' }
  }
  return icons[type] || { icon: 'help', class: 'text-gray-400' }
}

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    archived: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
  return classes[status] || classes.draft
}

const getStatusDotClass = (status) => {
  const classes = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    draft: 'bg-amber-500',
    archived: 'bg-red-500'
  }
  return classes[status] || classes.draft
}

const setStatusFilter = (value) => {
  if (value === null) return
  filters.value.status = value
  applyFilters()
}

const applyFilters = () => {
  loadTours()
}

const debouncedSearch = debounce(() => {
  applyFilters()
}, 300)

const loadTours = async () => {
  const params = {
    page: pagination.value.page,
    limit: pagination.value.limit
  }

  if (filters.value.search) params.search = filters.value.search
  if (filters.value.tourType) params.tourType = filters.value.tourType
  if (filters.value.status) params.status = filters.value.status

  await tourStore.fetchTours(params)
}

const handlePageChange = (page) => {
  tourStore.pagination.page = page
  loadTours()
}

const createTour = () => {
  router.push('/tours/new')
}

const handleAIImportApply = (data) => {
  // Store data in session storage and navigate to new tour page
  sessionStorage.setItem('aiTourData', JSON.stringify(data))
  router.push('/tours/new?ai=true')
}

const editTour = (tour) => {
  router.push(`/tours/${tour._id}`)
}

const duplicateTour = async (tour) => {
  try {
    const newTour = await tourStore.duplicateTour(tour._id)
    router.push(`/tours/${newTour._id}`)
  } catch (error) {
    console.error('Duplicate error:', error)
  }
}

const confirmDelete = (tour) => {
  tourToDelete.value = tour
  showDeleteDialog.value = true
}

const deleteTour = async () => {
  if (!tourToDelete.value) return
  try {
    await tourStore.deleteTour(tourToDelete.value._id)
    showDeleteDialog.value = false
    tourToDelete.value = null
  } catch (error) {
    console.error('Delete error:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await loadTours()
  tourStore.fetchTourStats()
})
</script>
