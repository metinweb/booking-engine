<template>
  <div>
    <!-- Header with back button -->
    <div class="mb-6">
      <button @click="goBack" class="inline-flex items-center text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400">
        <span class="material-icons mr-1">arrow_back</span>
        {{ $t('common.back') }}
      </button>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-6 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ isNew ? $t('planning.roomTypes.add') : $t('planning.roomTypes.edit') }}
        </h2>
        <p class="text-gray-600 dark:text-slate-400 mt-1">
          {{ isNew ? $t('planning.roomTypes.description') : getRoomTypeName(roomType) }}
        </p>
      </div>

      <!-- Tabs -->
      <FormTabs
        v-model="activeTab"
        :tabs="tabsWithDisabled"
        :errors="{}"
        :tab-fields="{}"
      />

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
      </div>

      <!-- Tab Content -->
      <form v-else @submit.prevent="handleSave" class="p-6">
        <!-- Save Button (Top) -->
        <div class="flex justify-end mb-6">
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>

        <!-- Basic Info Tab -->
        <div v-show="activeTab === 'basic'">
          <RoomTypeBasicForm
            ref="basicFormRef"
            :room-type="roomType"
            :hotel="hotel"
            :saving="saving"
            :is-new="isNew"
          />
        </div>

        <!-- Capacity & Pricing Tab -->
        <div v-show="activeTab === 'capacity'">
          <RoomTypeCapacityForm
            ref="capacityFormRef"
            :room-type="roomType"
            :hotel="hotel"
          />
        </div>

        <!-- Gallery Tab -->
        <div v-show="activeTab === 'gallery'">
          <RoomTypeGallery
            :hotel-id="hotelId"
            :room-type="roomType"
            @image-uploaded="handleImageUploaded"
            @image-deleted="handleImageDeleted"
            @images-reordered="handleImagesReordered"
            @main-image-set="handleMainImageSet"
          />
        </div>

        <!-- Save Button (Bottom) -->
        <div class="pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end mt-6">
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import planningService from '@/services/planningService'
import FormTabs from '@/components/common/FormTabs.vue'
import RoomTypeBasicForm from '@/components/planning/rooms/RoomTypeBasicForm.vue'
import RoomTypeCapacityForm from '@/components/planning/rooms/RoomTypeCapacityForm.vue'
import RoomTypeGallery from '@/components/planning/rooms/RoomTypeGallery.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t, locale } = useI18n()

// All supported languages for multilingual fields
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

// Helper to create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

function getEmptyRoomType() {
  return {
    code: '',
    name: createMultiLangObject(),
    description: createMultiLangObject(),
    images: [],
    occupancy: {
      maxAdults: 2,
      maxChildren: 2,
      maxInfants: 1,
      totalMaxGuests: 4,
      baseOccupancy: 2
    },
    size: null,
    bedConfiguration: [],
    amenities: [],
    status: 'draft',
    displayOrder: 0
  }
}

const roomType = ref(getEmptyRoomType())
const hotel = ref(null)
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('basic')

// Form refs
const basicFormRef = ref(null)
const capacityFormRef = ref(null)

// Get IDs from route
const hotelId = computed(() => route.params.hotelId)
const roomTypeId = computed(() => route.params.id)
const isNew = computed(() => !roomTypeId.value || route.name === 'room-type-new')

const tabs = computed(() => [
  { id: 'basic', label: t('planning.roomTypes.tabs.basic'), icon: 'info', requiresSave: false },
  { id: 'capacity', label: t('planning.roomTypes.tabs.capacity'), icon: 'people', requiresSave: false },
  { id: 'gallery', label: t('planning.roomTypes.tabs.gallery'), icon: 'photo_library', requiresSave: true }
])

// Add disabled flag for new room types
const tabsWithDisabled = computed(() => {
  return tabs.value.map(tab => ({
    ...tab,
    disabled: isNew.value && tab.requiresSave
  }))
})

const getRoomTypeName = (roomType) => {
  return roomType?.name?.[locale.value] || roomType?.name?.tr || roomType?.name?.en || roomType?.code || ''
}

const goBack = () => {
  router.push({ name: 'planning-rooms' })
}

const fetchHotel = async () => {
  try {
    const response = await planningService.getHotel(hotelId.value)
    if (response.success) {
      hotel.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch hotel:', error)
  }
}

const fetchRoomType = async () => {
  if (isNew.value) return

  loading.value = true
  try {
    const response = await planningService.getRoomType(hotelId.value, roomTypeId.value)
    if (response.success) {
      const data = response.data
      const emptyRoomType = getEmptyRoomType()

      roomType.value = {
        ...emptyRoomType,
        ...data,
        name: { ...emptyRoomType.name, ...data.name },
        description: { ...emptyRoomType.description, ...data.description },
        occupancy: { ...emptyRoomType.occupancy, ...data.occupancy },
        images: data.images || [],
        amenities: data.amenities || [],
        bedConfiguration: data.bedConfiguration || []
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.fetchError'))
    goBack()
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  // Validate form first
  const validation = basicFormRef.value?.validateAll?.()
  if (!validation?.valid) {
    // Show which fields have errors
    if (validation?.errors?.length) {
      toast.error(`${t('validation.required')}: ${validation.errors.join(', ')}`)
    } else {
      toast.error(t('validation.required'))
    }
    return
  }

  // Get form data from both forms and merge
  const basicData = basicFormRef.value?.getFormData?.() || {}
  const capacityData = capacityFormRef.value?.getFormData?.() || {}
  const formData = { ...basicData, ...capacityData }

  saving.value = true
  try {
    let response
    if (isNew.value) {
      response = await planningService.createRoomType(hotelId.value, formData)
      if (response.success) {
        toast.success(t('planning.roomTypes.created'))
        // Navigate to edit mode
        router.replace({
          name: 'room-type-detail',
          params: { hotelId: hotelId.value, id: response.data._id }
        })
        roomType.value = { ...roomType.value, ...response.data }
      }
    } else {
      response = await planningService.updateRoomType(hotelId.value, roomTypeId.value, formData)
      if (response.success) {
        roomType.value = { ...roomType.value, ...response.data }
        toast.success(t('planning.roomTypes.updated'))
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleImageUploaded = (newImage) => {
  roomType.value.images.push(newImage)
}

const handleImageDeleted = (imageId) => {
  roomType.value.images = roomType.value.images.filter(img => img._id !== imageId)
}

const handleImagesReordered = (images) => {
  roomType.value.images = images
}

const handleMainImageSet = (imageId) => {
  roomType.value.images = roomType.value.images.map(img => ({
    ...img,
    isMain: img._id === imageId
  }))
}

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchRoomType()
  } else {
    roomType.value = getEmptyRoomType()
    activeTab.value = 'basic'
  }
}, { immediate: true })

onMounted(() => {
  // Always fetch hotel for childAgeGroups
  fetchHotel()
  if (!isNew.value) {
    fetchRoomType()
  }
})
</script>
