import { ref, reactive, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

/**
 * Composable for managing list views with pagination, filtering, and loading states
 * Reduces ~100 lines of boilerplate per list view
 *
 * @param {Function} fetchFn - Service function that returns { success, data, pagination }
 * @param {Object} options - Configuration options
 * @returns {Object} List view state and methods
 *
 * @example
 * const { items, isLoading, pagination, filters, fetch, debouncedFetch } = useListView(
 *   hotelService.getHotels,
 *   {
 *     defaultFilters: { status: 'active' },
 *     itemsKey: 'hotels', // response.data.hotels or response.data.items
 *     onSuccess: (data) => console.log('Loaded', data.length, 'items'),
 *     onError: (error) => console.error(error)
 *   }
 * )
 */
export function useListView(fetchFn, options = {}) {
  const toast = useToast()
  const { t } = useI18n()

  const {
    defaultFilters = {},
    defaultPagination = { page: 1, limit: 20 },
    itemsKey = null, // Auto-detect: items, hotels, users, etc.
    immediate = false,
    debounceMs = 300,
    resetPageOnFilter = true,
    onSuccess = null,
    onError = null,
    errorMessage = 'common.fetchError'
  } = options

  // State
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const pagination = reactive({
    page: defaultPagination.page,
    limit: defaultPagination.limit,
    total: 0,
    pages: 0
  })

  const filters = reactive({ ...defaultFilters })

  // Debounce timer
  let debounceTimer = null

  /**
   * Build params object from pagination and filters
   */
  const buildParams = () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }

    // Add non-empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    })

    return params
  }

  /**
   * Extract items from response data
   */
  const extractItems = data => {
    if (!data) return []

    // If itemsKey is specified, use it
    if (itemsKey && data[itemsKey]) {
      return data[itemsKey]
    }

    // Auto-detect common keys
    const commonKeys = ['items', 'hotels', 'users', 'bookings', 'agencies', 'partners', 'guests', 'reservations']
    for (const key of commonKeys) {
      if (Array.isArray(data[key])) {
        return data[key]
      }
    }

    // If data itself is an array
    if (Array.isArray(data)) {
      return data
    }

    return []
  }

  /**
   * Main fetch function
   */
  const fetch = async (additionalParams = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const params = { ...buildParams(), ...additionalParams }
      const response = await fetchFn(params)

      if (response.success) {
        items.value = extractItems(response.data)

        // Update pagination from response
        if (response.data?.pagination) {
          pagination.total = response.data.pagination.total || 0
          pagination.pages = response.data.pagination.pages || 0
        } else if (response.pagination) {
          pagination.total = response.pagination.total || 0
          pagination.pages = response.pagination.pages || 0
        }

        // Call success callback
        onSuccess?.(items.value, response.data)
      } else {
        throw new Error(response.message || 'Request failed')
      }
    } catch (err) {
      error.value = err
      const message = err.response?.data?.message || t(errorMessage)
      toast.error(message)
      onError?.(err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Debounced fetch - useful for search inputs
   */
  const debouncedFetch = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (resetPageOnFilter) {
        pagination.page = 1
      }
      fetch()
    }, debounceMs)
  }

  /**
   * Handle page change from DataTable
   */
  const handlePageChange = ({ page, perPage }) => {
    pagination.page = page
    if (perPage && perPage !== pagination.limit) {
      pagination.limit = perPage
    }
    fetch()
  }

  /**
   * Reset filters to defaults
   */
  const resetFilters = () => {
    Object.keys(filters).forEach(key => {
      filters[key] = defaultFilters[key] ?? ''
    })
    pagination.page = 1
    fetch()
  }

  /**
   * Set a single filter value
   */
  const setFilter = (key, value) => {
    filters[key] = value
    if (resetPageOnFilter) {
      pagination.page = 1
    }
    fetch()
  }

  /**
   * Refresh current page
   */
  const refresh = () => fetch()

  // Fetch immediately if requested
  if (immediate) {
    fetch()
  }

  return {
    // State
    items,
    isLoading,
    error,
    pagination,
    filters,

    // Methods
    fetch,
    debouncedFetch,
    handlePageChange,
    resetFilters,
    setFilter,
    refresh,

    // Utilities
    buildParams
  }
}

export default useListView
