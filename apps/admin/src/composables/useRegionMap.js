/**
 * Region Map Composable
 * Manages Leaflet maps for region management
 */

import { ref, watch, nextTick, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

// Custom icons
const cityIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #a855f7; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const regionIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

/**
 * Creates a Leaflet map with OpenStreetMap tiles
 */
function createMap(elementId, center, zoom) {
  const map = L.map(elementId, {
    center,
    zoom,
    zoomControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map)

  setTimeout(() => map.invalidateSize(), 100)

  return map
}

export function useRegionMap() {
  // Map instances
  let mainMap = null
  let cityModalMap = null
  let regionModalMap = null

  // Markers
  let cityModalMarker = null
  let regionModalMarker = null
  let mainMapMarkers = []
  let mainCityMarker = null

  /**
   * Initialize the main map
   */
  function initMainMap(selectedCity) {
    if (mainMap) return mainMap

    const mapElement = document.getElementById('region-main-map')
    if (!mapElement) return null

    const center = selectedCity?.coordinates?.lat
      ? [selectedCity.coordinates.lat, selectedCity.coordinates.lng]
      : [39.0, 35.0]
    const zoom = selectedCity?.zoom || 6

    mainMap = createMap('region-main-map', center, zoom)
    return mainMap
  }

  /**
   * Destroy the main map
   */
  function destroyMainMap() {
    if (mainMap) {
      mainMap.remove()
      mainMap = null
      mainMapMarkers = []
      mainCityMarker = null
    }
  }

  /**
   * Update markers on the main map
   */
  function updateMainMapMarkers(selectedCity, regions, getCityName, getRegionName) {
    if (!mainMap) return

    // Clear existing markers
    mainMapMarkers.forEach(marker => mainMap.removeLayer(marker))
    mainMapMarkers = []
    if (mainCityMarker) {
      mainMap.removeLayer(mainCityMarker)
      mainCityMarker = null
    }

    const bounds = []

    // Add city marker
    if (selectedCity?.coordinates?.lat) {
      mainCityMarker = L.marker(
        [selectedCity.coordinates.lat, selectedCity.coordinates.lng],
        { icon: cityIcon }
      )
        .addTo(mainMap)
        .bindPopup(
          `<strong>${getCityName(selectedCity)}</strong><br><small>Şehir Merkezi</small>`
        )

      bounds.push([selectedCity.coordinates.lat, selectedCity.coordinates.lng])
    }

    // Add region markers
    regions.forEach(region => {
      if (region.coordinates?.lat && region.coordinates?.lng) {
        const marker = L.marker([region.coordinates.lat, region.coordinates.lng], {
          icon: regionIcon
        })
          .addTo(mainMap)
          .bindPopup(
            `<strong>${getRegionName(region)}</strong><br><small>${region.coordinates.lat.toFixed(5)}, ${region.coordinates.lng.toFixed(5)}</small>`
          )

        mainMapMarkers.push(marker)
        bounds.push([region.coordinates.lat, region.coordinates.lng])
      }
    })

    // Fit bounds
    if (bounds.length > 0) {
      mainMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    } else if (selectedCity?.coordinates?.lat) {
      mainMap.setView(
        [selectedCity.coordinates.lat, selectedCity.coordinates.lng],
        selectedCity.zoom || 10
      )
    }
  }

  /**
   * Focus on a region on the main map
   */
  function focusOnMap(region) {
    if (!mainMap || !region.coordinates?.lat) return
    mainMap.setView([region.coordinates.lat, region.coordinates.lng], region.zoom || 14)

    const marker = mainMapMarkers.find(m => {
      const latlng = m.getLatLng()
      return (
        Math.abs(latlng.lat - region.coordinates.lat) < 0.0001 &&
        Math.abs(latlng.lng - region.coordinates.lng) < 0.0001
      )
    })
    if (marker) marker.openPopup()
  }

  /**
   * Initialize the city modal map
   */
  function initCityModalMap(cityForm) {
    if (cityModalMap) {
      cityModalMap.remove()
      cityModalMap = null
      cityModalMarker = null
    }

    const mapElement = document.getElementById('city-modal-map')
    if (!mapElement) return null

    const hasCoords = cityForm.coordinates?.lat && cityForm.coordinates?.lng
    const center = hasCoords
      ? [cityForm.coordinates.lat, cityForm.coordinates.lng]
      : [39.0, 35.0]

    cityModalMap = createMap('city-modal-map', center, hasCoords ? cityForm.zoom || 10 : 6)

    if (hasCoords) {
      cityModalMarker = L.marker(center, { icon: cityIcon }).addTo(cityModalMap)
    }

    cityModalMap.on('click', e => {
      const { lat, lng } = e.latlng
      cityForm.coordinates.lat = parseFloat(lat.toFixed(6))
      cityForm.coordinates.lng = parseFloat(lng.toFixed(6))
      cityForm.zoom = cityModalMap.getZoom()

      if (cityModalMarker) {
        cityModalMarker.setLatLng([lat, lng])
      } else {
        cityModalMarker = L.marker([lat, lng], { icon: cityIcon }).addTo(cityModalMap)
      }
    })

    return cityModalMap
  }

  /**
   * Destroy the city modal map
   */
  function destroyCityModalMap() {
    if (cityModalMap) {
      cityModalMap.remove()
      cityModalMap = null
      cityModalMarker = null
    }
  }

  /**
   * Initialize the region modal map
   */
  function initRegionModalMap(regionForm, selectedCity) {
    if (regionModalMap) {
      regionModalMap.remove()
      regionModalMap = null
      regionModalMarker = null
    }

    const mapElement = document.getElementById('region-modal-map')
    if (!mapElement) return null

    const hasCoords = regionForm.coordinates?.lat && regionForm.coordinates?.lng
    const center = hasCoords
      ? [regionForm.coordinates.lat, regionForm.coordinates.lng]
      : selectedCity?.coordinates?.lat
        ? [selectedCity.coordinates.lat, selectedCity.coordinates.lng]
        : [39.0, 35.0]

    regionModalMap = createMap(
      'region-modal-map',
      center,
      hasCoords ? regionForm.zoom || 14 : selectedCity?.zoom || 10
    )

    if (hasCoords) {
      regionModalMarker = L.marker(center, { icon: regionIcon }).addTo(regionModalMap)
    }

    regionModalMap.on('click', e => {
      const { lat, lng } = e.latlng
      regionForm.coordinates.lat = parseFloat(lat.toFixed(6))
      regionForm.coordinates.lng = parseFloat(lng.toFixed(6))
      regionForm.zoom = regionModalMap.getZoom()

      if (regionModalMarker) {
        regionModalMarker.setLatLng([lat, lng])
      } else {
        regionModalMarker = L.marker([lat, lng], { icon: regionIcon }).addTo(regionModalMap)
      }
    })

    // Zoom change handler - update zoom input in real-time
    regionModalMap.on('zoomend', () => {
      regionForm.zoom = regionModalMap.getZoom()
    })

    return regionModalMap
  }

  /**
   * Destroy the region modal map
   */
  function destroyRegionModalMap() {
    if (regionModalMap) {
      regionModalMap.remove()
      regionModalMap = null
      regionModalMarker = null
    }
  }

  /**
   * Cleanup all maps
   */
  function cleanup() {
    destroyMainMap()
    destroyCityModalMap()
    destroyRegionModalMap()
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    // Main map
    initMainMap,
    destroyMainMap,
    updateMainMapMarkers,
    focusOnMap,

    // City modal map
    initCityModalMap,
    destroyCityModalMap,

    // Region modal map
    initRegionModalMap,
    destroyRegionModalMap,

    // Cleanup
    cleanup
  }
}
