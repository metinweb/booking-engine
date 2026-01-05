import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

/**
 * Composable for managing bulk selection and actions in list views
 * Handles select all, individual selection, and bulk operations
 *
 * @param {Object} options - Configuration options
 * @returns {Object} Bulk action state and methods
 *
 * @example
 * const { selectedItems, isAllSelected, toggleSelectAll, toggleSelect } = useBulkActions({
 *   items: hotels,
 *   idKey: '_id',
 *   onSelectionChange: (selected) => console.log('Selected:', selected.length)
 * })
 */
export function useBulkActions(options = {}) {
  const toast = useToast()
  const { t } = useI18n()

  const {
    items = ref([]),
    idKey = '_id',
    onSelectionChange = null
  } = options

  // State
  const selectedItems = ref([])
  const isProcessing = ref(false)
  const showBulkMenu = ref(false)

  // Computed
  const isAllSelected = computed(() => {
    const itemsList = items.value || items
    return itemsList.length > 0 && selectedItems.value.length === itemsList.length
  })

  const isPartialSelected = computed(() => {
    const itemsList = items.value || items
    return selectedItems.value.length > 0 && selectedItems.value.length < itemsList.length
  })

  const selectedCount = computed(() => selectedItems.value.length)

  const hasSelection = computed(() => selectedItems.value.length > 0)

  /**
   * Toggle select all items
   */
  const toggleSelectAll = () => {
    const itemsList = items.value || items

    if (isAllSelected.value) {
      selectedItems.value = []
    } else {
      selectedItems.value = itemsList.map(item => item[idKey])
    }

    showBulkMenu.value = selectedItems.value.length > 0
    onSelectionChange?.(selectedItems.value)
  }

  /**
   * Toggle single item selection
   */
  const toggleSelect = (item) => {
    const id = typeof item === 'object' ? item[idKey] : item
    const index = selectedItems.value.indexOf(id)

    if (index === -1) {
      selectedItems.value.push(id)
    } else {
      selectedItems.value.splice(index, 1)
    }

    showBulkMenu.value = selectedItems.value.length > 0
    onSelectionChange?.(selectedItems.value)
  }

  /**
   * Check if item is selected
   */
  const isSelected = (item) => {
    const id = typeof item === 'object' ? item[idKey] : item
    return selectedItems.value.includes(id)
  }

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    selectedItems.value = []
    showBulkMenu.value = false
    onSelectionChange?.([])
  }

  /**
   * Select specific items by IDs
   */
  const selectItems = (ids) => {
    selectedItems.value = [...ids]
    showBulkMenu.value = ids.length > 0
    onSelectionChange?.(selectedItems.value)
  }

  /**
   * Execute bulk action with confirmation
   * @param {Function} actionFn - Async function to execute for each selected item
   * @param {Object} actionOptions - Options for the bulk action
   */
  const executeBulkAction = async (actionFn, actionOptions = {}) => {
    const {
      confirmMessage = null,
      successMessage = 'common.bulkActionSuccess',
      errorMessage = 'common.bulkActionError',
      clearOnSuccess = true
    } = actionOptions

    if (selectedItems.value.length === 0) {
      toast.warning(t('common.noItemsSelected'))
      return { success: false, results: [] }
    }

    isProcessing.value = true
    const results = []
    let successCount = 0
    let errorCount = 0

    try {
      for (const id of selectedItems.value) {
        try {
          const result = await actionFn(id)
          results.push({ id, success: true, result })
          successCount++
        } catch (err) {
          results.push({ id, success: false, error: err })
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(t(successMessage, { count: successCount }))
      }

      if (errorCount > 0) {
        toast.error(t(errorMessage, { count: errorCount }))
      }

      if (clearOnSuccess && successCount > 0) {
        clearSelection()
      }

      return { success: errorCount === 0, results, successCount, errorCount }
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Get selected items as full objects
   */
  const getSelectedObjects = () => {
    const itemsList = items.value || items
    return itemsList.filter(item => selectedItems.value.includes(item[idKey]))
  }

  return {
    // State
    selectedItems,
    isProcessing,
    showBulkMenu,

    // Computed
    isAllSelected,
    isPartialSelected,
    selectedCount,
    hasSelection,

    // Methods
    toggleSelectAll,
    toggleSelect,
    isSelected,
    clearSelection,
    selectItems,
    executeBulkAction,
    getSelectedObjects
  }
}

export default useBulkActions
