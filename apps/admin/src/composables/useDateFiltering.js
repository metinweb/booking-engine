/**
 * useDateFiltering Composable
 * Provides date range filtering utilities for list views
 */

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Date range presets with calculation logic
 */
const DATE_PRESETS = {
  today: {
    label: 'dateFilter.today',
    getDates: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)
      return { start: today, end }
    }
  },
  yesterday: {
    label: 'dateFilter.yesterday',
    getDates: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const end = new Date(yesterday)
      end.setHours(23, 59, 59, 999)
      return { start: yesterday, end }
    }
  },
  last7days: {
    label: 'dateFilter.last7days',
    getDates: () => {
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      const start = new Date()
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
  },
  last30days: {
    label: 'dateFilter.last30days',
    getDates: () => {
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      const start = new Date()
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
  },
  last90days: {
    label: 'dateFilter.last90days',
    getDates: () => {
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      const start = new Date()
      start.setDate(start.getDate() - 90)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
  },
  thisMonth: {
    label: 'dateFilter.thisMonth',
    getDates: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
  },
  lastMonth: {
    label: 'dateFilter.lastMonth',
    getDates: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return { start, end }
    }
  },
  thisYear: {
    label: 'dateFilter.thisYear',
    getDates: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
  },
  custom: {
    label: 'dateFilter.custom',
    getDates: () => null
  }
}

/**
 * Composable for date range filtering
 * @param {Object} options - Configuration options
 * @param {string} options.defaultPreset - Default preset to use (default: 'last30days')
 * @param {Function} options.onChange - Callback when date range changes
 * @returns {Object} Date filtering utilities
 */
export function useDateFiltering(options = {}) {
  const { t } = useI18n()
  const { defaultPreset = 'last30days', onChange } = options

  // State
  const selectedPreset = ref(defaultPreset)
  const customStartDate = ref(null)
  const customEndDate = ref(null)

  // Computed date range based on preset or custom dates
  const dateRange = computed(() => {
    if (selectedPreset.value === 'custom') {
      return {
        start: customStartDate.value ? new Date(customStartDate.value) : null,
        end: customEndDate.value ? new Date(customEndDate.value) : null
      }
    }

    const preset = DATE_PRESETS[selectedPreset.value]
    if (preset?.getDates) {
      return preset.getDates()
    }

    return { start: null, end: null }
  })

  // ISO string versions for API calls
  const dateRangeISO = computed(() => ({
    start: dateRange.value.start?.toISOString() || null,
    end: dateRange.value.end?.toISOString() || null
  }))

  // Date strings for input fields (YYYY-MM-DD)
  const dateRangeStrings = computed(() => ({
    start: dateRange.value.start?.toISOString().split('T')[0] || '',
    end: dateRange.value.end?.toISOString().split('T')[0] || ''
  }))

  // Available presets with translated labels
  const presetOptions = computed(() => {
    return Object.entries(DATE_PRESETS).map(([key, preset]) => ({
      value: key,
      label: t(preset.label)
    }))
  })

  // Check if date range is valid
  const isValidRange = computed(() => {
    const { start, end } = dateRange.value
    if (!start || !end) return false
    return start <= end
  })

  // Watch for changes and call callback
  watch(
    [selectedPreset, customStartDate, customEndDate],
    () => {
      if (onChange && isValidRange.value) {
        onChange(dateRange.value)
      }
    },
    { deep: true }
  )

  /**
   * Set preset
   * @param {string} preset - Preset key
   */
  const setPreset = preset => {
    if (DATE_PRESETS[preset]) {
      selectedPreset.value = preset
    }
  }

  /**
   * Set custom date range
   * @param {Date|string} start - Start date
   * @param {Date|string} end - End date
   */
  const setCustomRange = (start, end) => {
    selectedPreset.value = 'custom'
    customStartDate.value = start instanceof Date ? start.toISOString().split('T')[0] : start
    customEndDate.value = end instanceof Date ? end.toISOString().split('T')[0] : end
  }

  /**
   * Reset to default preset
   */
  const reset = () => {
    selectedPreset.value = defaultPreset
    customStartDate.value = null
    customEndDate.value = null
  }

  /**
   * Get query params for API
   * @param {string} startKey - Key for start date param
   * @param {string} endKey - Key for end date param
   */
  const getQueryParams = (startKey = 'startDate', endKey = 'endDate') => {
    const params = {}
    if (dateRangeISO.value.start) {
      params[startKey] = dateRangeISO.value.start
    }
    if (dateRangeISO.value.end) {
      params[endKey] = dateRangeISO.value.end
    }
    return params
  }

  /**
   * Check if a date falls within the current range
   * @param {Date|string} date - Date to check
   */
  const isDateInRange = date => {
    const d = new Date(date)
    const { start, end } = dateRange.value
    if (!start || !end) return true
    return d >= start && d <= end
  }

  /**
   * Get human-readable range description
   */
  const rangeDescription = computed(() => {
    if (selectedPreset.value === 'custom') {
      const { start, end } = dateRangeStrings.value
      if (start && end) {
        return `${start} - ${end}`
      }
      return t('dateFilter.selectDates')
    }
    return t(DATE_PRESETS[selectedPreset.value]?.label || 'dateFilter.all')
  })

  return {
    // State
    selectedPreset,
    customStartDate,
    customEndDate,

    // Computed
    dateRange,
    dateRangeISO,
    dateRangeStrings,
    presetOptions,
    isValidRange,
    rangeDescription,

    // Methods
    setPreset,
    setCustomRange,
    reset,
    getQueryParams,
    isDateInRange,

    // Constants
    DATE_PRESETS
  }
}

export default useDateFiltering
