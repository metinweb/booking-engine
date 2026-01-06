<template>
  <div class="p-6">
    <!-- Country Filter -->
    <div
      class="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
    >
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('locations.selectCountry') }}
      </label>
      <div ref="countryDropdownRef" class="relative w-full md:w-80">
        <button
          type="button"
          class="form-input w-full pl-10 pr-10 text-left cursor-pointer flex items-center gap-2"
          :class="
            selectedCountryCode
              ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
              : ''
          "
          @click="toggleCountryDropdown"
        >
          <template v-if="selectedCountry">
            <img
              :src="`/flags/${selectedCountry.code.toLowerCase()}.svg`"
              :alt="selectedCountry.code"
              class="w-5 h-4 object-contain"
            />
            <span class="truncate">{{ getCountryName(selectedCountry) }}</span>
          </template>
          <span v-else class="text-gray-400 dark:text-slate-500"
            >-- {{ $t('locations.selectCountry') }} --</span
          >
        </button>
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span class="material-icons text-lg">public</span>
        </span>
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span
            class="material-icons text-lg transition-transform"
            :class="showCountryDropdown ? 'rotate-180' : ''"
            >expand_more</span
          >
        </span>

        <!-- Country Dropdown -->
        <div
          v-if="showCountryDropdown"
          class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
        >
          <!-- Search Input -->
          <div class="p-2 border-b border-gray-200 dark:border-slate-700">
            <div class="relative">
              <input
                ref="countrySearchInput"
                v-model="countrySearch"
                type="text"
                :placeholder="$t('common.search')"
                class="form-input w-full pl-8 py-1.5 text-sm"
                @keydown.enter.prevent="selectFirstCountry"
                @keydown.esc="showCountryDropdown = false"
              />
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <span class="material-icons text-sm">search</span>
              </span>
            </div>
          </div>
          <!-- Options List -->
          <div class="max-h-60 overflow-y-auto">
            <button
              v-for="country in filteredCountries"
              :key="country.code"
              type="button"
              class="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 transition-colors"
              :class="
                country.code === selectedCountryCode
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-slate-300'
              "
              @click="selectCountry(country)"
            >
              <img
                :src="`/flags/${country.code.toLowerCase()}.svg`"
                :alt="country.code"
                class="w-5 h-4 object-contain"
              />
              <span class="truncate">{{ getCountryName(country) }}</span>
            </button>
            <div
              v-if="filteredCountries.length === 0"
              class="px-3 py-4 text-center text-sm text-gray-500 dark:text-slate-400"
            >
              {{ $t('common.noData') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="selectedCountryCode" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Cities Panel (Left) -->
      <div class="lg:col-span-4">
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50"
          >
            <h2 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-purple-500">location_city</span>
              {{ $t('locations.cities') }}
            </h2>
            <button type="button" class="btn btn-sm btn-primary" @click="openCityModal()">
              <span class="material-icons text-sm">add</span>
              {{ $t('locations.addCity') }}
            </button>
          </div>

          <div class="max-h-[600px] overflow-y-auto">
            <div v-if="loadingCities" class="p-8 text-center text-gray-500">
              <span class="material-icons text-3xl animate-spin">sync</span>
              <p class="mt-2">{{ $t('common.loading') }}</p>
            </div>

            <div
              v-else-if="cities.length === 0"
              class="p-8 text-center text-gray-400 dark:text-slate-500"
            >
              <span class="material-icons text-4xl mb-2">location_city</span>
              <p>{{ $t('locations.noCities') }}</p>
            </div>

            <div v-else>
              <div
                v-for="city in cities"
                :key="city._id"
                class="px-4 py-3 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
                :class="
                  selectedCity?._id === city._id
                    ? 'bg-purple-50 dark:bg-purple-900/30 border-l-4 border-l-purple-500'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                "
                @click="selectCity(city)"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="material-icons text-sm"
                      :class="city.coordinates?.lat ? 'text-green-500' : 'text-orange-400'"
                    >
                      {{ city.coordinates?.lat ? 'check_circle' : 'warning' }}
                    </span>
                    <span class="font-medium text-gray-800 dark:text-slate-200 truncate">{{
                      getCityName(city)
                    }}</span>
                  </div>
                  <div
                    v-if="city.coordinates?.lat"
                    class="text-xs text-gray-400 font-mono mt-0.5 ml-6"
                  >
                    {{ city.coordinates.lat.toFixed(4) }},
                    {{ city.coordinates.lng.toFixed(4) }} (z:{{ city.zoom || 10 }})
                  </div>
                </div>
                <div class="flex items-center gap-1 ml-2">
                  <span
                    class="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"
                  >
                    {{ city.regionCount || 0 }}
                  </span>
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded"
                    @click.stop="openCityModal(city)"
                  >
                    <span class="material-icons text-sm">edit</span>
                  </button>
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    @click.stop="confirmDeleteCity(city)"
                  >
                    <span class="material-icons text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Map + Regions -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Map Section (Always visible when city selected) -->
        <div
          v-if="selectedCity"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50"
          >
            <h2 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-blue-500">map</span>
              {{ getCityName(selectedCity) }} - {{ $t('locations.mapView') }}
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-slate-400">{{
                $t('locations.clickToSetCoordinates')
              }}</span>
            </div>
          </div>

          <!-- Main Map -->
          <div class="relative">
            <div ref="mainMapContainer" class="h-80">
              <div id="region-main-map" class="w-full h-full"></div>
            </div>
            <!-- Map Legend -->
            <div
              class="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded shadow text-xs space-y-1"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-purple-500"></span>
                <span>{{ $t('locations.city') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                <span>{{ $t('locations.tourismRegion') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Regions Panel -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50"
          >
            <h2 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-green-500">place</span>
              <template v-if="selectedCity">
                {{ getCityName(selectedCity) }} - {{ $t('locations.tourismRegions') }}
              </template>
              <template v-else>
                {{ $t('locations.tourismRegions') }}
              </template>
            </h2>
            <button
              v-if="selectedCity"
              type="button"
              class="btn btn-sm btn-primary"
              @click="openRegionModal()"
            >
              <span class="material-icons text-sm">add</span>
              {{ $t('locations.addRegion') }}
            </button>
          </div>

          <!-- No city selected state -->
          <div v-if="!selectedCity" class="p-12 text-center text-gray-400 dark:text-slate-500">
            <span class="material-icons text-6xl mb-4 text-gray-300 dark:text-slate-600"
              >touch_app</span
            >
            <p class="text-lg">{{ $t('locations.selectCityFirst') }}</p>
            <p class="text-sm mt-1">{{ $t('locations.selectCityToViewRegions') }}</p>
          </div>

          <!-- Regions List -->
          <div v-else class="max-h-[400px] overflow-y-auto">
            <div v-if="loadingRegions" class="p-8 text-center text-gray-500">
              <span class="material-icons text-3xl animate-spin">sync</span>
            </div>

            <div
              v-else-if="regions.length === 0"
              class="p-8 text-center text-gray-400 dark:text-slate-500"
            >
              <span class="material-icons text-4xl mb-2">place</span>
              <p>{{ $t('locations.noRegions') }}</p>
            </div>

            <div v-else>
              <div
                v-for="region in regions"
                :key="region._id"
                class="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    class="material-icons"
                    :class="region.coordinates?.lat ? 'text-green-500' : 'text-orange-400'"
                  >
                    {{ region.coordinates?.lat ? 'place' : 'location_off' }}
                  </span>
                  <div class="min-w-0">
                    <span class="font-medium text-gray-800 dark:text-slate-200 truncate block">{{
                      getRegionName(region)
                    }}</span>
                    <div
                      v-if="region.coordinates?.lat"
                      class="text-xs text-gray-400 font-mono mt-0.5"
                    >
                      {{ region.coordinates.lat.toFixed(5) }},
                      {{ region.coordinates.lng.toFixed(5) }} (z:{{ region.zoom || 14 }})
                    </div>
                    <div v-else class="text-xs text-orange-500 mt-0.5">
                      {{ $t('locations.noCoordinates') }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    :disabled="!region.coordinates?.lat"
                    class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded disabled:opacity-30"
                    :title="$t('locations.showOnMap')"
                    @click="focusOnMap(region)"
                  >
                    <span class="material-icons text-lg">my_location</span>
                  </button>
                  <button
                    type="button"
                    class="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded"
                    @click="openRegionModal(region)"
                  >
                    <span class="material-icons text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    @click="confirmDeleteRegion(region)"
                  >
                    <span class="material-icons text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state when no country selected -->
    <div
      v-else
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center"
    >
      <span class="material-icons text-6xl text-gray-300 dark:text-slate-600 mb-4">public</span>
      <h3 class="text-lg font-medium text-gray-600 dark:text-slate-400">
        {{ $t('locations.selectCountryPrompt') }}
      </h3>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
        {{ $t('locations.selectCountryPromptDesc') }}
      </p>
    </div>

    <!-- City Modal -->
    <Modal
      v-model="showCityModal"
      :title="editingCity ? $t('locations.editCity') : $t('locations.addCity')"
      size="xl"
    >
      <div class="space-y-6">
        <!-- City Name (simple string, not multilingual) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.cityName') }}
          </label>
          <input
            v-model="cityForm.name"
            type="text"
            class="form-input w-full"
            :placeholder="$t('locations.cityName')"
            required
          />
        </div>

        <!-- Coordinates Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.coordinates') }}
          </label>

          <div class="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('locations.latitude')
              }}</label>
              <input
                v-model.number="cityForm.coordinates.lat"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="39.925533"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('locations.longitude')
              }}</label>
              <input
                v-model.number="cityForm.coordinates.lng"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="32.866287"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('locations.zoomLevel')
              }}</label>
              <input
                v-model.number="cityForm.zoom"
                type="number"
                min="1"
                max="20"
                class="form-input font-mono"
                placeholder="10"
              />
            </div>
          </div>

          <!-- Map for coordinate selection -->
          <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <div class="h-64 relative" style="z-index: 1">
              <div id="city-modal-map" class="w-full h-full"></div>
            </div>
            <div
              class="bg-gray-50 dark:bg-slate-700/50 px-3 py-2 text-xs text-gray-500 dark:text-slate-400 text-center flex items-center justify-center gap-2"
            >
              <span class="material-icons text-sm">touch_app</span>
              {{ $t('locations.clickMapToSelect') }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showCityModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="savingCity || !cityForm.name"
          @click="saveCity"
        >
          <span v-if="savingCity" class="material-icons text-sm animate-spin mr-1">sync</span>
          {{ $t('common.save') }}
        </button>
      </template>
    </Modal>

    <!-- Region Modal -->
    <Modal
      v-model="showRegionModal"
      :title="editingRegion ? $t('locations.editRegion') : $t('locations.addRegion')"
      size="xl"
    >
      <div class="space-y-6">
        <!-- Region Name (simple string, not multilingual) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.regionName') }}
          </label>
          <input
            v-model="regionForm.name"
            type="text"
            class="form-input w-full"
            :placeholder="$t('locations.regionName')"
            required
          />
        </div>

        <!-- Coordinates Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.coordinates') }}
          </label>

          <div class="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('locations.latitude')
              }}</label>
              <input
                v-model.number="regionForm.coordinates.lat"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="36.850000"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('locations.longitude')
              }}</label>
              <input
                v-model.number="regionForm.coordinates.lng"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="31.050000"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('locations.zoomLevel')
              }}</label>
              <input
                v-model.number="regionForm.zoom"
                type="number"
                min="1"
                max="20"
                class="form-input font-mono"
                placeholder="14"
              />
            </div>
          </div>

          <!-- Map for coordinate selection -->
          <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <div class="h-64 relative" style="z-index: 1">
              <div id="region-modal-map" class="w-full h-full"></div>
            </div>
            <div
              class="bg-gray-50 dark:bg-slate-700/50 px-3 py-2 text-xs text-gray-500 dark:text-slate-400 text-center flex items-center justify-center gap-2"
            >
              <span class="material-icons text-sm">touch_app</span>
              {{ $t('locations.clickMapToSelect') }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showRegionModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="savingRegion || !regionForm.name"
          @click="saveRegion"
        >
          <span v-if="savingRegion" class="material-icons text-sm animate-spin mr-1">sync</span>
          {{ $t('common.save') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'

// Components
import Modal from '@/components/common/Modal.vue'

// Composables
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useCountrySelector } from '@/composables/useCountrySelector'
import { useRegionMap } from '@/composables/useRegionMap'

// Services
import {
  getCities,
  createCity,
  updateCity,
  deleteCity as deleteCityApi,
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion as deleteRegionApi
} from '@/services/locationService'

// Helpers
import {
  getCityName,
  getRegionName,
  normalizeCoordinates,
  createEmptyCityForm,
  createCityFormFromCity,
  createEmptyRegionForm,
  createRegionFormFromRegion,
  prepareCityData,
  prepareRegionData
} from '@/utils/regionHelpers'

const { t } = useI18n()
const toast = useToast()

// Async action composables
const { isLoading: loadingCities, execute: executeLoadCities } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: loadingRegions, execute: executeLoadRegions } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: savingCity, execute: executeSaveCity } = useAsyncAction({ showErrorToast: false })
const { isLoading: savingRegion, execute: executeSaveRegion } = useAsyncAction({ showErrorToast: false })
const { execute: executeDeleteCity } = useAsyncAction({ showErrorToast: false })
const { execute: executeDeleteRegion } = useAsyncAction({ showErrorToast: false })

// Country selector composable
const {
  selectedCountryCode,
  showCountryDropdown,
  countrySearch,
  countryDropdownRef,
  countrySearchInput,
  filteredCountries,
  selectedCountry,
  getCountryName,
  toggleCountryDropdown,
  selectCountry: baseSelectCountry,
  selectFirstCountry
} = useCountrySelector(loadCities)

// Region map composable
const {
  initMainMap,
  destroyMainMap,
  updateMainMapMarkers,
  focusOnMap,
  initCityModalMap,
  destroyCityModalMap,
  initRegionModalMap,
  destroyRegionModalMap
} = useRegionMap()

// State
const cities = ref([])
const regions = ref([])
const selectedCity = ref(null)

// City Modal
const showCityModal = ref(false)
const editingCity = ref(null)
const cityForm = ref(createEmptyCityForm())

// Region Modal
const showRegionModal = ref(false)
const editingRegion = ref(null)
const regionForm = ref(createEmptyRegionForm())

// Map container ref
const mainMapContainer = ref(null)

// Select country wrapper (calls loadCities via composable callback)
const selectCountry = country => {
  baseSelectCountry(country)
}

// Load cities for selected country
async function loadCities() {
  if (!selectedCountryCode.value) {
    cities.value = []
    selectedCity.value = null
    regions.value = []
    return
  }

  await executeLoadCities(
    () => getCities(selectedCountryCode.value),
    {
      onSuccess: result => {
        if (result.success) {
          cities.value = result.data.map(city => normalizeCoordinates(city, 10))
        }
      },
      onError: error => {
        console.error('Failed to load cities:', error)
        toast.error(t('common.fetchError'))
      }
    }
  )

  // Reset selection
  selectedCity.value = null
  regions.value = []
  destroyMainMap()
}

// Select a city
const selectCity = async city => {
  selectedCity.value = normalizeCoordinates(city, 10)
  await loadRegionsForCity(city._id)
}

// Load regions for a city
const loadRegionsForCity = async cityId => {
  await executeLoadRegions(
    () => getRegions(cityId),
    {
      onSuccess: result => {
        if (result.success) {
          regions.value = result.data.map(region => normalizeCoordinates(region, 14))
          nextTick(() => {
            initMainMap(selectedCity.value)
            updateMainMapMarkers(selectedCity.value, regions.value, getCityName, getRegionName)
          })
        }
      },
      onError: error => {
        console.error('Failed to load regions:', error)
        regions.value = []
      }
    }
  )
}

// ============= City Modal =============
const openCityModal = (city = null) => {
  editingCity.value = city
  cityForm.value = city ? createCityFormFromCity(city) : createEmptyCityForm()
  showCityModal.value = true

  nextTick(() => {
    setTimeout(() => initCityModalMap(cityForm.value), 200)
  })
}

const saveCity = async () => {
  if (!cityForm.value.name) {
    toast.error(t('validation.required'))
    return
  }

  const data = prepareCityData(cityForm.value)

  const actionFn = editingCity.value
    ? () => updateCity(editingCity.value._id, data)
    : () => createCity({ ...data, countryCode: selectedCountryCode.value })

  await executeSaveCity(actionFn, {
    successMessage: editingCity.value ? 'locations.cityUpdated' : 'locations.cityCreated',
    onSuccess: async () => {
      showCityModal.value = false
      await loadCities()
    },
    onError: error => {
      console.error('Failed to save city:', error)
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    }
  })
}

const confirmDeleteCity = async city => {
  if (!confirm(t('locations.deleteCityConfirm'))) return

  await executeDeleteCity(
    () => deleteCityApi(city._id),
    {
      successMessage: 'locations.cityDeleted',
      onSuccess: async () => {
        if (selectedCity.value?._id === city._id) {
          selectedCity.value = null
          regions.value = []
        }
        await loadCities()
      },
      onError: error => {
        console.error('Failed to delete city:', error)
        toast.error(t('common.operationFailed'))
      }
    }
  )
}

// ============= Region Modal =============
const openRegionModal = (region = null) => {
  editingRegion.value = region
  regionForm.value = region
    ? createRegionFormFromRegion(region)
    : createEmptyRegionForm(selectedCity.value)
  showRegionModal.value = true

  nextTick(() => {
    setTimeout(() => initRegionModalMap(regionForm.value, selectedCity.value), 200)
  })
}

const saveRegion = async () => {
  if (!regionForm.value.name) {
    toast.error(t('validation.required'))
    return
  }

  const data = prepareRegionData(regionForm.value)

  const actionFn = editingRegion.value
    ? () => updateRegion(editingRegion.value._id, data)
    : () => createRegion({ ...data, city: selectedCity.value._id })

  await executeSaveRegion(actionFn, {
    successMessage: editingRegion.value ? 'locations.regionUpdated' : 'locations.regionCreated',
    onSuccess: async () => {
      showRegionModal.value = false
      await loadRegionsForCity(selectedCity.value._id)
    },
    onError: error => {
      console.error('Failed to save region:', error)
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    }
  })
}

const confirmDeleteRegion = async region => {
  if (!confirm(t('locations.deleteRegionConfirm'))) return

  await executeDeleteRegion(
    () => deleteRegionApi(region._id),
    {
      successMessage: 'locations.regionDeleted',
      onSuccess: async () => {
        await loadRegionsForCity(selectedCity.value._id)
      },
      onError: error => {
        console.error('Failed to delete region:', error)
        toast.error(t('common.operationFailed'))
      }
    }
  )
}

// Watch for modal close to cleanup maps
watch(showCityModal, val => {
  if (!val) {
    destroyCityModalMap()
  }
})

watch(showRegionModal, val => {
  if (!val) {
    destroyRegionModalMap()
  }
})
</script>

<style scoped>
/* Ensure Leaflet map controls are visible */
:deep(.leaflet-control-container) {
  z-index: 1 !important;
}

:deep(.leaflet-pane) {
  z-index: 1 !important;
}

:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 1 !important;
}

:deep(.leaflet-popup) {
  z-index: 2 !important;
}
</style>
