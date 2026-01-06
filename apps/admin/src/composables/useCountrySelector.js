/**
 * Country Selector Composable
 * Manages country dropdown state and filtering
 */

import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { COUNTRIES } from '@/data/countries'

const STORAGE_KEY = 'regionManagement_selectedCountry'

export function useCountrySelector(onCountryChange) {
  const { locale } = useI18n()

  // State
  const selectedCountryCode = ref(localStorage.getItem(STORAGE_KEY) || '')
  const showCountryDropdown = ref(false)
  const countrySearch = ref('')
  const countryDropdownRef = ref(null)
  const countrySearchInput = ref(null)

  // Countries sorted by name
  const countries = computed(() => {
    return [...COUNTRIES].sort((a, b) => {
      const nameA = getCountryName(a)
      const nameB = getCountryName(b)
      return nameA.localeCompare(nameB, locale.value)
    })
  })

  // Filtered countries based on search
  const filteredCountries = computed(() => {
    if (!countrySearch.value) return countries.value
    const search = countrySearch.value.toLowerCase()
    return countries.value.filter(c => {
      const name = getCountryName(c).toLowerCase()
      return name.includes(search) || c.code.toLowerCase().includes(search)
    })
  })

  // Selected country object
  const selectedCountry = computed(() => {
    if (!selectedCountryCode.value) return null
    return countries.value.find(c => c.code === selectedCountryCode.value)
  })

  /**
   * Get country name based on current locale
   */
  function getCountryName(country) {
    return country.name[locale.value] || country.name.tr || country.name.en || country.code
  }

  /**
   * Toggle country dropdown
   */
  function toggleCountryDropdown() {
    showCountryDropdown.value = !showCountryDropdown.value
    if (showCountryDropdown.value) {
      countrySearch.value = ''
      nextTick(() => {
        countrySearchInput.value?.focus()
      })
    }
  }

  /**
   * Select country from dropdown
   */
  function selectCountry(country) {
    selectedCountryCode.value = country.code
    showCountryDropdown.value = false
    countrySearch.value = ''

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, country.code)

    // Notify parent
    if (onCountryChange) {
      onCountryChange(country.code)
    }
  }

  /**
   * Select first filtered country on Enter
   */
  function selectFirstCountry() {
    if (filteredCountries.value.length > 0) {
      selectCountry(filteredCountries.value[0])
    }
  }

  /**
   * Handle click outside to close dropdown
   */
  function handleClickOutside(event) {
    if (countryDropdownRef.value && !countryDropdownRef.value.contains(event.target)) {
      showCountryDropdown.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)

    // Trigger initial load if country was saved
    if (selectedCountryCode.value && onCountryChange) {
      onCountryChange(selectedCountryCode.value)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    // State
    selectedCountryCode,
    showCountryDropdown,
    countrySearch,
    countryDropdownRef,
    countrySearchInput,

    // Computed
    countries,
    filteredCountries,
    selectedCountry,

    // Methods
    getCountryName,
    toggleCountryDropdown,
    selectCountry,
    selectFirstCountry
  }
}
