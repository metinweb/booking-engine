import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePartnerStore = defineStore('partner', () => {
  // Selected partner for platform admin to view as
  const selectedPartner = ref(JSON.parse(localStorage.getItem('selectedPartner')) || null)

  const hasSelectedPartner = computed(() => !!selectedPartner.value)

  const selectPartner = partner => {
    selectedPartner.value = partner
    localStorage.setItem('selectedPartner', JSON.stringify(partner))
  }

  const clearSelectedPartner = () => {
    selectedPartner.value = null
    localStorage.removeItem('selectedPartner')
  }

  return {
    selectedPartner,
    hasSelectedPartner,
    selectPartner,
    clearSelectedPartner
  }
})
