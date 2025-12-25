<template>
  <div class="space-y-6">
    <!-- Room Types Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ $t('planning.roomTypes.title') }}</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.description') }}</p>
        </div>
        <button @click="addNewRoomType" class="btn-primary flex items-center gap-2">
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.roomTypes.add') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loadingRoomTypes" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Room Types List -->
      <div v-else-if="roomTypes.length > 0" class="grid gap-4">
        <div
          v-for="roomType in roomTypes"
          :key="roomType._id"
          class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 flex items-center gap-4"
        >
          <div class="w-16 h-12 rounded bg-gray-200 dark:bg-slate-600 overflow-hidden flex-shrink-0">
            <img
              v-if="roomType.images?.[0]?.url"
              :src="getImageUrl(roomType.images[0].url)"
              class="w-full h-full object-cover"
            />
            <span v-else class="material-icons text-2xl text-gray-400 dark:text-slate-500 flex items-center justify-center w-full h-full">bed</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-800 dark:text-white">{{ getRoomTypeName(roomType) }}</div>
            <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-3">
              <span>{{ roomType.code }}</span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm">person</span>
                {{ roomType.occupancy?.maxAdults || 2 }} + {{ roomType.occupancy?.maxChildren || 2 }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': roomType.status === 'active',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': roomType.status === 'draft',
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400': roomType.status === 'inactive'
                }"
              >
                {{ $t(`common.status.${roomType.status}`) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="editRoomType(roomType)"
              class="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              <span class="material-icons">edit</span>
            </button>
            <button
              @click="confirmDeleteRoomType(roomType)"
              class="p-2 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">bed</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.empty') }}</p>
      </div>
    </div>

    <hr class="border-gray-200 dark:border-slate-700" />

    <!-- Meal Plans Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ $t('planning.mealPlans.title') }}</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.mealPlans.description') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showStandardSelector = true" class="btn-primary flex items-center gap-2">
            <span class="material-icons text-sm">add</span>
            {{ $t('planning.mealPlans.addStandard') }}
          </button>
          <button @click="showMealPlanForm = true" class="btn-secondary flex items-center gap-2">
            <span class="material-icons text-sm">add</span>
            {{ $t('planning.mealPlans.addCustom') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingMealPlans" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Meal Plans List -->
      <div v-else-if="mealPlans.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          v-for="plan in mealPlans"
          :key="plan._id"
          class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center"
        >
          <div class="font-bold text-lg text-indigo-600 dark:text-indigo-400">{{ plan.code }}</div>
          <div class="text-sm text-gray-600 dark:text-slate-300 truncate">{{ getMealPlanName(plan) }}</div>
          <div class="mt-2 flex flex-wrap justify-center gap-1">
            <span v-if="plan.includedMeals?.breakfast" class="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">B</span>
            <span v-if="plan.includedMeals?.lunch" class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">L</span>
            <span v-if="plan.includedMeals?.dinner" class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">D</span>
            <span v-if="plan.includedMeals?.drinks" class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">DR</span>
          </div>
          <div class="mt-2">
            <button
              @click="confirmDeleteMealPlan(plan)"
              class="text-xs text-red-500 hover:text-red-700"
            >
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">restaurant</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('planning.mealPlans.empty') }}</p>
        <p class="text-sm text-gray-400 dark:text-slate-500">{{ $t('planning.mealPlans.emptyHint') }}</p>
      </div>
    </div>

    <!-- Meal Plan Form Modal -->
    <Modal
      v-model="showMealPlanForm"
      :title="$t('planning.mealPlans.addCustom')"
      size="md"
    >
      <MealPlanForm
        :hotel="hotel"
        @saved="handleMealPlanSaved"
        @cancel="showMealPlanForm = false"
      />
    </Modal>

    <!-- Standard Meal Plan Selector Modal -->
    <Modal
      v-model="showStandardSelector"
      :title="$t('planning.mealPlans.addStandard')"
      size="lg"
    >
      <StandardMealPlanSelector
        :hotel="hotel"
        :existing-meal-plans="mealPlans"
        @saved="handleStandardPlansAdded"
        @cancel="showStandardSelector = false"
      />
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('common.delete')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('common.confirm') }}?
      </p>
      <template #footer>
        <button @click="showDeleteModal = false" type="button" class="btn-secondary">
          {{ $t('common.no') }}
        </button>
        <button @click="executeDelete" type="button" class="btn-danger" :disabled="deleting">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import MealPlanForm from './MealPlanForm.vue'
import StandardMealPlanSelector from './StandardMealPlanSelector.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()

// Room Types
const roomTypes = ref([])
const loadingRoomTypes = ref(false)

// Meal Plans
const mealPlans = ref([])
const loadingMealPlans = ref(false)
const showMealPlanForm = ref(false)
const showStandardSelector = ref(false)

// Delete
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleteType = ref(null)
const deleting = ref(false)

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const baseUrl = apiBaseUrl.replace('/api', '')
  return `${baseUrl}${url}`
}

const getRoomTypeName = (roomType) => {
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getMealPlanName = (plan) => {
  return plan.name?.[locale.value] || plan.name?.tr || plan.name?.en || plan.code
}

const fetchRoomTypes = async () => {
  loadingRoomTypes.value = true
  try {
    const response = await planningService.getRoomTypes(props.hotel._id)
    if (response.success) {
      roomTypes.value = response.data
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loadingRoomTypes.value = false
  }
}

const fetchMealPlans = async () => {
  loadingMealPlans.value = true
  try {
    const response = await planningService.getMealPlans(props.hotel._id)
    if (response.success) {
      mealPlans.value = response.data
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loadingMealPlans.value = false
  }
}

const handleStandardPlansAdded = () => {
  showStandardSelector.value = false
  fetchMealPlans()
}

const addNewRoomType = () => {
  router.push({
    name: 'room-type-new',
    params: { hotelId: props.hotel._id }
  })
}

const editRoomType = (roomType) => {
  router.push({
    name: 'room-type-detail',
    params: { hotelId: props.hotel._id, id: roomType._id }
  })
}

const handleMealPlanSaved = () => {
  showMealPlanForm.value = false
  fetchMealPlans()
}

const confirmDeleteRoomType = (roomType) => {
  deleteTarget.value = roomType
  deleteType.value = 'roomType'
  showDeleteModal.value = true
}

const confirmDeleteMealPlan = (plan) => {
  deleteTarget.value = plan
  deleteType.value = 'mealPlan'
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    if (deleteType.value === 'roomType') {
      await planningService.deleteRoomType(props.hotel._id, deleteTarget.value._id)
      toast.success(t('planning.roomTypes.deleted'))
      fetchRoomTypes()
    } else if (deleteType.value === 'mealPlan') {
      await planningService.deleteMealPlan(props.hotel._id, deleteTarget.value._id)
      toast.success(t('planning.mealPlans.deleted'))
      fetchMealPlans()
    }
    showDeleteModal.value = false
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

// Watch for hotel changes
watch(() => props.hotel?._id, (newId) => {
  if (newId) {
    fetchRoomTypes()
    fetchMealPlans()
  }
}, { immediate: true })
</script>
