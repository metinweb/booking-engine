<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.address.title') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('hotels.address.mapHelp') }}</p>

      <!-- Address Search -->
      <div class="mb-6">
        <label class="form-label">{{ $t('hotels.address.searchLocation') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-lg">search</span>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-input pl-10 pr-20"
            :placeholder="$t('hotels.address.searchLocation')"
            @keydown.enter.prevent="searchAddress"
          />
          <button
            type="button"
            @click="searchAddress"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
            :disabled="searching"
          >
            <span v-if="searching" class="material-icons text-sm animate-spin">sync</span>
            <span v-else>{{ $t('common.search') }}</span>
          </button>
        </div>
      </div>

      <!-- Interactive Map Container -->
      <div class="mb-6 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div class="h-96 relative" ref="mapContainer">
          <div id="hotel-map" class="w-full h-full z-0"></div>

          <!-- Map overlay instructions -->
          <div
            v-if="!form.coordinates.lat || !form.coordinates.lng"
            class="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10"
          >
            <div class="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-lg text-center">
              <span class="material-icons text-3xl text-purple-600 mb-2">touch_app</span>
              <p class="text-sm text-gray-700 dark:text-slate-300">{{ $t('hotels.address.clickToSelect') }}</p>
            </div>
          </div>
        </div>

        <!-- Map Actions -->
        <div class="bg-white dark:bg-slate-800 p-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
          <div class="flex items-center gap-4">
            <!-- Current Location Button -->
            <button
              type="button"
              @click="getCurrentLocation"
              class="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              :disabled="gettingLocation"
            >
              <span class="material-icons text-lg" :class="{ 'animate-pulse': gettingLocation }">my_location</span>
              {{ $t('hotels.address.currentLocation') }}
            </button>

            <!-- Center on marker -->
            <button
              v-if="form.coordinates.lat && form.coordinates.lng"
              type="button"
              @click="centerOnMarker"
              class="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <span class="material-icons text-lg">center_focus_strong</span>
              {{ $t('hotels.address.centerMap') }}
            </button>
          </div>
          <div v-if="form.coordinates.lat && form.coordinates.lng" class="text-sm text-gray-500 dark:text-slate-400 font-mono">
            {{ form.coordinates.lat.toFixed(6) }}, {{ form.coordinates.lng.toFixed(6) }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Street -->
        <div class="md:col-span-2">
          <label class="form-label">{{ $t('hotels.address.street') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">home</span>
            </span>
            <input
              v-model="form.street"
              type="text"
              class="form-input pl-10"
            />
          </div>
        </div>

        <!-- District -->
        <div>
          <label class="form-label">{{ $t('hotels.address.district') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">location_city</span>
            </span>
            <input
              v-model="form.district"
              type="text"
              class="form-input pl-10"
            />
          </div>
        </div>

        <!-- City -->
        <FormField
          ref="cityFieldRef"
          v-model="form.city"
          name="address.city"
          :label="$t('hotels.city')"
          icon="apartment"
          :required="true"
          :rules="[{ required: true, message: $t('validation.required') }]"
          @validation-change="({ field, error }) => handleFieldValidation(field || 'address.city', error)"
        />

        <!-- Country -->
        <FormField
          ref="countryFieldRef"
          v-model="form.country"
          name="address.country"
          :label="$t('hotels.country')"
          icon="flag"
          :required="true"
          :rules="[{ required: true, message: $t('validation.required') }]"
          @validation-change="({ field, error }) => handleFieldValidation(field || 'address.country', error)"
        />

        <!-- Postal Code -->
        <div>
          <label class="form-label">{{ $t('hotels.address.postalCode') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">markunread_mailbox</span>
            </span>
            <input
              v-model="form.postalCode"
              type="text"
              class="form-input pl-10"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Coordinates -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.address.coordinates') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('hotels.address.coordinatesHelp') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Latitude -->
        <div>
          <label class="form-label">{{ $t('hotels.address.latitude') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">north</span>
            </span>
            <input
              v-model.number="form.coordinates.lat"
              type="number"
              step="any"
              class="form-input pl-10"
              placeholder="41.0082"
              @change="updateMarkerFromInput"
            />
          </div>
        </div>

        <!-- Longitude -->
        <div>
          <label class="form-label">{{ $t('hotels.address.longitude') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">east</span>
            </span>
            <input
              v-model.number="form.coordinates.lng"
              type="number"
              step="any"
              class="form-input pl-10"
              placeholder="28.9784"
              @change="updateMarkerFromInput"
            />
          </div>
        </div>

        <!-- Formatted Address -->
        <div class="md:col-span-2">
          <label class="form-label">{{ $t('hotels.address.formattedAddress') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">place</span>
            </span>
            <input
              v-model="form.formattedAddress"
              type="text"
              class="form-input pl-10"
              :placeholder="$t('hotels.address.formattedAddress')"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths issue with bundlers (Vite/Webpack)
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

import FormField from '@/components/common/FormField.vue'

const toast = useToast()
const { t } = useI18n()

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['validation-change'])

// FormField refs for validation
const cityFieldRef = ref(null)
const countryFieldRef = ref(null)

// Track field errors for parent notification
const fieldErrors = ref({})

const handleFieldValidation = (fieldName, error) => {
  if (error) {
    fieldErrors.value[fieldName] = error
  } else {
    delete fieldErrors.value[fieldName]
  }
  emit('validation-change', { ...fieldErrors.value })
}

const hasErrors = computed(() => Object.keys(fieldErrors.value).length > 0)

const searchQuery = ref('')
const searching = ref(false)
const gettingLocation = ref(false)
const mapContainer = ref(null)

// Leaflet map and marker references
let map = null
let marker = null

// Default center (Istanbul)
const defaultCenter = [41.0082, 28.9784]
const defaultZoom = 13

const form = ref({
  street: '',
  city: '',
  district: '',
  country: 'Türkiye',
  postalCode: '',
  coordinates: {
    lat: null,
    lng: null
  },
  formattedAddress: '',
  placeId: ''
})

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
        ">🏨</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  })
}

// Initialize Leaflet map
const initMap = () => {
  if (map) return

  const center = form.value.coordinates.lat && form.value.coordinates.lng
    ? [form.value.coordinates.lat, form.value.coordinates.lng]
    : defaultCenter

  map = L.map('hotel-map', {
    center: center,
    zoom: form.value.coordinates.lat ? 16 : defaultZoom,
    zoomControl: true
  })

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  // Add initial marker if coordinates exist
  if (form.value.coordinates.lat && form.value.coordinates.lng) {
    addMarker(form.value.coordinates.lat, form.value.coordinates.lng)
  }

  // Click event to place marker
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    setLocation(lat, lng, true)
  })
}

// Add or update marker
const addMarker = (lat, lng) => {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], {
      icon: createMarkerIcon(),
      draggable: true
    }).addTo(map)

    // Marker drag event
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      setLocation(lat, lng, true)
    })

    // Popup with coordinates
    marker.bindPopup(() => {
      return `<div class="text-center">
        <strong>📍 ${t('hotels.address.selectedLocation')}</strong><br>
        <small>${form.value.coordinates.lat?.toFixed(6)}, ${form.value.coordinates.lng?.toFixed(6)}</small>
      </div>`
    })
  }
}

// Set location and optionally reverse geocode
const setLocation = async (lat, lng, reverseGeocode = false) => {
  form.value.coordinates.lat = lat
  form.value.coordinates.lng = lng

  addMarker(lat, lng)

  if (reverseGeocode) {
    await reverseGeocodeLocation(lat, lng)
  }
}

// Reverse geocode to get address from coordinates
const reverseGeocodeLocation = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'tr,en'
        }
      }
    )

    const data = await response.json()

    if (data && data.address) {
      form.value.formattedAddress = data.display_name
      form.value.street = data.address.road || data.address.street || ''
      form.value.district = data.address.suburb || data.address.district || data.address.neighbourhood || ''
      form.value.city = data.address.city || data.address.town || data.address.municipality || data.address.province || ''
      form.value.country = data.address.country || 'Türkiye'
      form.value.postalCode = data.address.postcode || ''
    }
  } catch (error) {
    console.error('Reverse geocode error:', error)
  }
}

// Update marker from manual input
const updateMarkerFromInput = () => {
  if (form.value.coordinates.lat && form.value.coordinates.lng && map) {
    addMarker(form.value.coordinates.lat, form.value.coordinates.lng)
    map.setView([form.value.coordinates.lat, form.value.coordinates.lng], 16)
  }
}

// Center map on marker
const centerOnMarker = () => {
  if (map && form.value.coordinates.lat && form.value.coordinates.lng) {
    map.setView([form.value.coordinates.lat, form.value.coordinates.lng], 16)
  }
}

// Watch for hotel changes and update form
watch(() => props.hotel, (newHotel) => {
  if (newHotel?.address) {
    form.value = {
      street: newHotel.address.street || '',
      city: newHotel.address.city || '',
      district: newHotel.address.district || '',
      country: newHotel.address.country || 'Türkiye',
      postalCode: newHotel.address.postalCode || '',
      coordinates: {
        lat: newHotel.address.coordinates?.lat || null,
        lng: newHotel.address.coordinates?.lng || null
      },
      formattedAddress: newHotel.address.formattedAddress || '',
      placeId: newHotel.address.placeId || ''
    }

    // Clear any existing validation errors when data loads
    if (Object.keys(fieldErrors.value).length > 0) {
      fieldErrors.value = {}
      emit('validation-change', {})
    }

    // Update map if it exists
    nextTick(() => {
      if (map && form.value.coordinates.lat && form.value.coordinates.lng) {
        addMarker(form.value.coordinates.lat, form.value.coordinates.lng)
        map.setView([form.value.coordinates.lat, form.value.coordinates.lng], 16)
      }
    })
  }
}, { immediate: true, deep: true })

// Search address using Nominatim (OpenStreetMap)
const searchAddress = async () => {
  if (!searchQuery.value.trim()) return

  searching.value = true
  try {
    const query = encodeURIComponent(searchQuery.value)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          'Accept-Language': 'tr,en'
        }
      }
    )

    const data = await response.json()

    if (data && data.length > 0) {
      const result = data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)

      form.value.coordinates.lat = lat
      form.value.coordinates.lng = lng
      form.value.formattedAddress = result.display_name

      // Parse address components
      if (result.address) {
        form.value.street = result.address.road || result.address.street || ''
        form.value.district = result.address.suburb || result.address.district || result.address.neighbourhood || ''
        form.value.city = result.address.city || result.address.town || result.address.municipality || ''
        form.value.country = result.address.country || 'Türkiye'
        form.value.postalCode = result.address.postcode || ''
      }

      // Update map
      if (map) {
        addMarker(lat, lng)
        map.setView([lat, lng], 16)
      }

      toast.success(t('hotels.address.locationFound'))
    } else {
      toast.warning(t('common.noData'))
    }
  } catch (error) {
    console.error('Address search error:', error)
    toast.error(t('common.operationFailed'))
  } finally {
    searching.value = false
  }
}

// Get current location
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    toast.error('Geolocation is not supported by your browser')
    return
  }

  gettingLocation.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      await setLocation(lat, lng, true)

      if (map) {
        map.setView([lat, lng], 16)
      }

      gettingLocation.value = false
      toast.success(t('hotels.address.currentLocation'))
    },
    (error) => {
      gettingLocation.value = false
      console.error('Geolocation error:', error)
      toast.error('Could not get your location')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  )
}

// Validate all fields by calling each FormField's validate method
const validateAll = () => {
  let isValid = true

  // Validate city field
  if (cityFieldRef.value) {
    const result = cityFieldRef.value.validate()
    if (!result.valid) isValid = false
  }

  // Validate country field
  if (countryFieldRef.value) {
    const result = countryFieldRef.value.validate()
    if (!result.valid) isValid = false
  }

  return isValid
}

// Get current form data (called by parent)
const getFormData = () => {
  return { address: form.value }
}

// Invalidate map size when component becomes visible (for tab switching)
const invalidateMapSize = () => {
  if (map) {
    nextTick(() => {
      map.invalidateSize()
    })
  }
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData,
  invalidateMapSize
})

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initMap()
    // Also invalidate size after a short delay (for initial load in tabs)
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
      }
    }, 100)
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>

<style>
/* Fix Leaflet default marker icon issue */
.leaflet-default-icon-path {
  background-image: url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png);
}

/* Custom marker styles */
.custom-marker {
  background: transparent !important;
  border: none !important;
}

/* Leaflet popup styles */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 12px;
}

/* Dark mode support for map */
.dark .leaflet-tile {
  filter: brightness(0.85) contrast(1.1);
}

.dark .leaflet-control-zoom a {
  background-color: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}

.dark .leaflet-control-zoom a:hover {
  background-color: #334155;
}

.dark .leaflet-control-attribution {
  background-color: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
}

.dark .leaflet-popup-content-wrapper {
  background-color: #1e293b;
  color: #e2e8f0;
}

.dark .leaflet-popup-tip {
  background-color: #1e293b;
}
</style>
