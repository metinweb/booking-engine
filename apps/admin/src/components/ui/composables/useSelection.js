import { ref, computed } from 'vue'

/**
 * Çoklu seçim için composable
 * @param {object} options - Ayarlar
 * @param {string} options.idKey - ID alanı adı (default: '_id')
 * @param {Function} options.onSelect - Seçim değiştiğinde callback
 * @returns {object} - Seçim state ve metodları
 */
export function useSelection(options = {}) {
  const { idKey = '_id', onSelect = null } = options

  // State
  const selected = ref([])
  const lastSelectedId = ref(null)

  // Computed
  const selectedCount = computed(() => selected.value.length)

  const hasSelection = computed(() => selected.value.length > 0)

  // Item ID'sini al
  const getItemId = item => {
    if (typeof item === 'object' && item !== null) {
      return item[idKey]
    }
    return item
  }

  // Seçili mi kontrol et
  const isSelected = item => {
    const id = getItemId(item)
    return selected.value.includes(id)
  }

  // Tümü seçili mi kontrol et
  const isAllSelected = items => {
    if (!items || items.length === 0) return false
    return items.every(item => isSelected(item))
  }

  // Kısmi seçim var mı
  const isIndeterminate = items => {
    if (!items || items.length === 0) return false
    const selectedInItems = items.filter(item => isSelected(item)).length
    return selectedInItems > 0 && selectedInItems < items.length
  }

  // Tek seçim toggle
  const toggleSelect = (item, shiftKey = false, items = []) => {
    const id = getItemId(item)
    const index = selected.value.indexOf(id)

    // Shift+Click ile aralık seçimi
    if (shiftKey && lastSelectedId.value && items.length > 0) {
      const itemIds = items.map(i => getItemId(i))
      const lastIndex = itemIds.indexOf(lastSelectedId.value)
      const currentIndex = itemIds.indexOf(id)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const rangeIds = itemIds.slice(start, end + 1)

        // Aralıktaki tüm item'ları seç
        for (const rangeId of rangeIds) {
          if (!selected.value.includes(rangeId)) {
            selected.value.push(rangeId)
          }
        }
        lastSelectedId.value = id
        onSelect?.(selected.value)
        return
      }
    }

    // Normal toggle
    if (index === -1) {
      selected.value.push(id)
    } else {
      selected.value.splice(index, 1)
    }

    lastSelectedId.value = id
    onSelect?.(selected.value)
  }

  // Seçimi ekle
  const select = item => {
    const id = getItemId(item)
    if (!selected.value.includes(id)) {
      selected.value.push(id)
      onSelect?.(selected.value)
    }
  }

  // Seçimi kaldır
  const deselect = item => {
    const id = getItemId(item)
    const index = selected.value.indexOf(id)
    if (index !== -1) {
      selected.value.splice(index, 1)
      onSelect?.(selected.value)
    }
  }

  // Tümünü seç
  const selectAll = items => {
    const ids = items.map(item => getItemId(item))
    selected.value = [...new Set([...selected.value, ...ids])]
    onSelect?.(selected.value)
  }

  // Listedeki tümünü seç/kaldır toggle
  const toggleSelectAll = items => {
    if (isAllSelected(items)) {
      // Tümünü kaldır
      const ids = items.map(item => getItemId(item))
      selected.value = selected.value.filter(id => !ids.includes(id))
    } else {
      // Tümünü seç
      selectAll(items)
    }
    onSelect?.(selected.value)
  }

  // Seçimi temizle
  const clearSelection = () => {
    selected.value = []
    lastSelectedId.value = null
    onSelect?.(selected.value)
  }

  // Seçili item'ları al
  const getSelectedItems = items => {
    return items.filter(item => isSelected(item))
  }

  // Seçimi ayarla
  const setSelection = ids => {
    selected.value = [...ids]
    onSelect?.(selected.value)
  }

  return {
    // State
    selected,
    selectedCount,
    hasSelection,

    // Methods
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleSelect,
    select,
    deselect,
    selectAll,
    toggleSelectAll,
    clearSelection,
    getSelectedItems,
    setSelection
  }
}

export default useSelection
