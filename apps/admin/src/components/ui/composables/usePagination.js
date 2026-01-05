import { ref, computed } from 'vue'

/**
 * Sayfalama için composable
 * @param {object} options - Ayarlar
 * @param {number} options.initialPage - Başlangıç sayfası (default: 1)
 * @param {number} options.initialPerPage - Sayfa başına kayıt (default: 10)
 * @param {number[]} options.perPageOptions - Sayfa başına seçenekler
 * @param {Function} options.onPageChange - Sayfa değiştiğinde callback
 * @returns {object} - Sayfalama state ve metodları
 */
export function usePagination(options = {}) {
  const {
    initialPage = 1,
    initialPerPage = 10,
    perPageOptions = [10, 25, 50, 100],
    onPageChange = null
  } = options

  // State
  const page = ref(initialPage)
  const perPage = ref(initialPerPage)
  const total = ref(0)

  // Computed
  const totalPages = computed(() => {
    if (total.value === 0) return 1
    return Math.ceil(total.value / perPage.value)
  })

  const from = computed(() => {
    if (total.value === 0) return 0
    return (page.value - 1) * perPage.value + 1
  })

  const to = computed(() => {
    const end = page.value * perPage.value
    return Math.min(end, total.value)
  })

  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  const isFirstPage = computed(() => page.value === 1)
  const isLastPage = computed(() => page.value >= totalPages.value)

  // Sayfa aralığı (gösterilecek sayfa numaraları)
  const pageRange = computed(() => {
    const range = []
    const maxVisible = 5
    const half = Math.floor(maxVisible / 2)

    let start = Math.max(1, page.value - half)
    const end = Math.min(totalPages.value, start + maxVisible - 1)

    // Baştan taşma düzeltmesi
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    return range
  })

  // Methods
  const setPage = newPage => {
    const validPage = Math.max(1, Math.min(newPage, totalPages.value))
    if (page.value !== validPage) {
      page.value = validPage
      onPageChange?.(validPage, perPage.value)
    }
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      setPage(page.value + 1)
    }
  }

  const prevPage = () => {
    if (hasPrevPage.value) {
      setPage(page.value - 1)
    }
  }

  const firstPage = () => {
    setPage(1)
  }

  const lastPage = () => {
    setPage(totalPages.value)
  }

  const setPerPage = newPerPage => {
    if (perPage.value !== newPerPage) {
      perPage.value = newPerPage
      // Sayfa başına kayıt değiştiğinde ilk sayfaya dön
      page.value = 1
      onPageChange?.(1, newPerPage)
    }
  }

  const setTotal = newTotal => {
    total.value = newTotal
    // Total değiştiğinde sayfa aşıyorsa düzelt
    if (page.value > totalPages.value) {
      page.value = Math.max(1, totalPages.value)
    }
  }

  const reset = () => {
    page.value = initialPage
    perPage.value = initialPerPage
    total.value = 0
  }

  // API parametreleri için helper
  const toParams = computed(() => ({
    page: page.value,
    limit: perPage.value
  }))

  // API response'dan güncelleme
  const fromResponse = response => {
    if (response?.pagination) {
      total.value = response.pagination.total || 0
      if (response.pagination.page) {
        page.value = response.pagination.page
      }
      if (response.pagination.limit) {
        perPage.value = response.pagination.limit
      }
    } else if (typeof response?.total === 'number') {
      total.value = response.total
    }
  }

  return {
    // State
    page,
    perPage,
    total,
    perPageOptions,

    // Computed
    totalPages,
    from,
    to,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    pageRange,
    toParams,

    // Methods
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPerPage,
    setTotal,
    reset,
    fromResponse
  }
}

export default usePagination
