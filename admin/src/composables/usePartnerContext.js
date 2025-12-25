import { computed, watch, onMounted } from 'vue'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for partner context reactivity
 * Use this in any component that needs to react to partner changes
 *
 * @param {Object} options
 * @param {Function} options.onPartnerChange - Callback when partner changes
 * @param {boolean} options.immediate - Whether to call onPartnerChange immediately on mount (default: true)
 * @returns {Object} Partner context utilities
 */
export function usePartnerContext(options = {}) {
  const { onPartnerChange, immediate = true } = options
  const partnerStore = usePartnerStore()
  const authStore = useAuthStore()

  // Current effective partner ID
  const currentPartnerId = computed(() => {
    // If user is partner, use their accountId
    if (authStore.accountType === 'partner') {
      return authStore.user?.accountId
    }
    // If platform admin has selected a partner, use that
    if (authStore.isPlatformAdmin && partnerStore.selectedPartner) {
      return partnerStore.selectedPartner._id
    }
    return null
  })

  // Current partner object (for display)
  const currentPartner = computed(() => {
    if (authStore.accountType === 'partner') {
      return {
        _id: authStore.user?.accountId,
        companyName: authStore.user?.partnerName || 'Partner'
      }
    }
    return partnerStore.selectedPartner
  })

  // Whether a partner is selected/available
  const hasPartner = computed(() => !!currentPartnerId.value)

  // Whether user is platform admin viewing as partner
  const isViewingAsPartner = computed(() => {
    return authStore.isPlatformAdmin && partnerStore.hasSelectedPartner
  })

  // Watch for partner changes
  watch(
    () => partnerStore.selectedPartner,
    (newPartner, oldPartner) => {
      // Only trigger if partner actually changed
      if (newPartner?._id !== oldPartner?._id) {
        if (onPartnerChange && typeof onPartnerChange === 'function') {
          onPartnerChange(newPartner)
        }
      }
    },
    { deep: true }
  )

  // Call on mount if immediate is true
  onMounted(() => {
    if (immediate && onPartnerChange && typeof onPartnerChange === 'function') {
      onPartnerChange(currentPartner.value)
    }
  })

  return {
    currentPartnerId,
    currentPartner,
    hasPartner,
    isViewingAsPartner,
    // Expose store methods for convenience
    selectPartner: partnerStore.selectPartner,
    clearPartner: partnerStore.clearSelectedPartner
  }
}

export default usePartnerContext
