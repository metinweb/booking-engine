/**
 * Region Management Helpers
 * Utility functions for region management
 */

/**
 * Get city name (simple string)
 */
export function getCityName(city) {
  if (!city) return ''
  return city.name || ''
}

/**
 * Get region name (simple string)
 */
export function getRegionName(region) {
  if (!region) return ''
  return region.name || ''
}

/**
 * Ensure coordinates object exists on entity
 */
export function normalizeCoordinates(entity, defaultZoom = 10) {
  return {
    ...entity,
    coordinates: entity.coordinates || { lat: null, lng: null },
    zoom: entity.zoom || defaultZoom
  }
}

/**
 * Create empty city form
 */
export function createEmptyCityForm() {
  return {
    name: '',
    coordinates: { lat: null, lng: null },
    zoom: 10
  }
}

/**
 * Create city form from existing city
 */
export function createCityFormFromCity(city) {
  return {
    name: city.name || '',
    coordinates: city.coordinates ? { ...city.coordinates } : { lat: null, lng: null },
    zoom: city.zoom || 10
  }
}

/**
 * Create empty region form
 */
export function createEmptyRegionForm(selectedCity = null) {
  return {
    name: '',
    coordinates: selectedCity?.coordinates?.lat
      ? { ...selectedCity.coordinates }
      : { lat: null, lng: null },
    zoom: 14
  }
}

/**
 * Create region form from existing region
 */
export function createRegionFormFromRegion(region) {
  return {
    name: region.name || '',
    coordinates: region.coordinates ? { ...region.coordinates } : { lat: null, lng: null },
    zoom: region.zoom || 14
  }
}

/**
 * Prepare city data for API
 */
export function prepareCityData(cityForm) {
  return {
    name: cityForm.name,
    coordinates: cityForm.coordinates.lat ? cityForm.coordinates : null,
    zoom: cityForm.zoom
  }
}

/**
 * Prepare region data for API
 */
export function prepareRegionData(regionForm) {
  return {
    name: regionForm.name,
    coordinates: regionForm.coordinates.lat ? regionForm.coordinates : null,
    zoom: regionForm.zoom
  }
}
