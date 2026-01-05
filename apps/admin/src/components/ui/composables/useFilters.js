import { computed, reactive } from 'vue'
import { useDebounce } from './useDebounce'

/**
 * Tablo filtreleme için composable
 * @param {object} initialFilters - Başlangıç filtre değerleri
 * @param {object} options - Ayarlar
 * @param {Function} options.onChange - Filtre değiştiğinde callback
 * @param {number} options.debounce - Debounce süresi (ms)
 * @param {string[]} options.debounceFields - Debounce uygulanacak alanlar
 * @returns {object} - Filtre state ve metodları
 */
export function useFilters(initialFilters = {}, options = {}) {
  const {
    onChange = null,
    debounce = 300,
    debounceFields = ['search', 'query', 'keyword']
  } = options

  // Initial state'i sakla
  const defaultFilters = { ...initialFilters }

  // Reactive filtre state
  const filters = reactive({ ...initialFilters })

  // Debounced callback
  const debouncedOnChange = onChange ? useDebounce(onChange, debounce) : null

  // Computed
  const activeFilters = computed(() => {
    const active = {}
    for (const [key, value] of Object.entries(filters)) {
      if (isActiveValue(value)) {
        active[key] = value
      }
    }
    return active
  })

  const hasActiveFilters = computed(() => {
    return Object.keys(activeFilters.value).length > 0
  })

  const activeFilterCount = computed(() => {
    return Object.keys(activeFilters.value).length
  })

  // Value aktif mi kontrol et
  function isActiveValue(value) {
    if (value === null || value === undefined) return false
    if (value === '') return false
    if (value === 'all') return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  }

  // Tek filtre güncelle
  const setFilter = (key, value) => {
    const oldValue = filters[key]
    filters[key] = value

    if (onChange && oldValue !== value) {
      // Debounce gereken alanlar için
      if (debounceFields.includes(key)) {
        debouncedOnChange?.(filters)
      } else {
        onChange(filters)
      }
    }
  }

  // Tek filtreyi temizle
  const clearFilter = key => {
    if (key in defaultFilters) {
      setFilter(key, defaultFilters[key])
    } else {
      setFilter(key, '')
    }
  }

  // Tüm filtreleri temizle
  const clearAll = () => {
    for (const key of Object.keys(filters)) {
      filters[key] = defaultFilters[key] ?? ''
    }
    onChange?.(filters)
  }

  // Filtreleri sıfırla (initial state'e dön)
  const reset = () => {
    for (const key of Object.keys(filters)) {
      filters[key] = defaultFilters[key] ?? ''
    }
    onChange?.(filters)
  }

  // API query params'a dönüştür
  const toQueryParams = computed(() => {
    const params = {}
    for (const [key, value] of Object.entries(filters)) {
      if (isActiveValue(value)) {
        if (Array.isArray(value)) {
          params[key] = value.join(',')
        } else if (value instanceof Date) {
          params[key] = value.toISOString()
        } else {
          params[key] = value
        }
      }
    }
    return params
  })

  // URL query string'e dönüştür
  const toQueryString = computed(() => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(toQueryParams.value)) {
      params.set(key, String(value))
    }
    return params.toString()
  })

  // URL query string'den yükle
  const fromQueryString = queryString => {
    const params = new URLSearchParams(queryString)
    for (const key of Object.keys(filters)) {
      if (params.has(key)) {
        const value = params.get(key)
        // Array alanları için
        if (Array.isArray(defaultFilters[key])) {
          filters[key] = value.split(',').filter(Boolean)
        } else {
          filters[key] = value
        }
      }
    }
  }

  // Filtre preset'i uygula
  const applyPreset = preset => {
    for (const [key, value] of Object.entries(preset)) {
      if (key in filters) {
        filters[key] = value
      }
    }
    onChange?.(filters)
  }

  return {
    // State
    filters,

    // Computed
    activeFilters,
    hasActiveFilters,
    activeFilterCount,
    toQueryParams,
    toQueryString,

    // Methods
    setFilter,
    clearFilter,
    clearAll,
    reset,
    fromQueryString,
    applyPreset
  }
}

export default useFilters
