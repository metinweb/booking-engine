<template>
  <Modal
    v-model="show"
    :title="`Oda ${room?.roomNumber || ''}`"
    size="lg"
    @close="close"
  >
    <div v-if="room" class="space-y-6">
      <!-- Room Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="roomStatusInfo?.bgColor + ' ' + roomStatusInfo?.textColor"
            >
              {{ roomStatusInfo?.label }}
            </span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="housekeepingStatusInfo?.bgColor + ' ' + housekeepingStatusInfo?.textColor"
            >
              {{ housekeepingStatusInfo?.label }}
            </span>
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ room.roomType?.name?.tr || room.roomType?.code }} - Kat {{ room.floor }}
          </p>
        </div>
        <div class="text-right">
          <span
            class="px-2 py-1 rounded text-xs font-medium"
            :class="priorityInfo?.bgColor + ' ' + priorityInfo?.textColor"
          >
            {{ priorityInfo?.label }} Oncelik
          </span>
        </div>
      </div>

      <!-- Current Guests (if occupied) -->
      <div v-if="room.status === 'occupied' && room.currentGuests?.length" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 class="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Misafirler</h4>
        <div class="space-y-1">
          <div
            v-for="(guest, index) in room.currentGuests"
            :key="index"
            class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300"
          >
            <span class="material-icons text-sm">{{ guest.isMainGuest ? 'star' : 'person' }}</span>
            {{ guest.firstName }} {{ guest.lastName }}
          </div>
        </div>
        <div v-if="room.expectedCheckoutDate" class="mt-2 text-xs text-blue-500 dark:text-blue-400">
          Cikis: {{ formatDate(room.expectedCheckoutDate) }}
        </div>
      </div>

      <!-- Room Status Update -->
      <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Oda Durumu Degistir</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="status in availableStatuses"
            :key="status.value"
            @click="updateRoomStatus(status.value)"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all"
            :class="[
              room.status === status.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
            ]"
            :disabled="isStatusDisabled(status.value)"
          >
            <span class="material-icons text-lg" :class="status.textColor">{{ status.icon }}</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ status.label }}</span>
          </button>
        </div>
      </div>

      <!-- Housekeeping Status Update -->
      <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Housekeeping Durumu</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="status in housekeepingStatuses"
            :key="status.value"
            @click="updateHousekeeping(status.value)"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all"
            :class="[
              room.housekeepingStatus === status.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
            ]"
          >
            <span class="w-3 h-3 rounded-full" :class="status.dotColor"></span>
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ status.label }}</span>
          </button>
        </div>
      </div>

      <!-- Priority Update -->
      <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Temizlik Onceligi</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="priority in priorities"
            :key="priority.value"
            @click="updatePriority(priority.value)"
            class="px-3 py-1.5 rounded-lg border-2 text-sm transition-all"
            :class="[
              room.housekeepingPriority === priority.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500',
              priority.textColor
            ]"
          >
            {{ priority.label }}
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Notlar</h4>
        <div v-if="room.notes" class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
          {{ room.notes }}
        </div>
        <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Not bulunmuyor</p>
      </div>

      <!-- Last Cleaning Info -->
      <div v-if="room.lastCleanedAt" class="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span class="material-icons text-sm">cleaning_services</span>
          Son temizlik: {{ formatDate(room.lastCleanedAt) }}
          <span v-if="room.lastCleanedBy">
            - {{ room.lastCleanedBy.firstName }} {{ room.lastCleanedBy.lastName }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="close"
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
      >
        Kapat
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import {
  ROOM_STATUS,
  ROOM_STATUS_INFO,
  HOUSEKEEPING_STATUS,
  HOUSEKEEPING_STATUS_INFO,
  HOUSEKEEPING_PRIORITY,
  PRIORITY_INFO,
  updateRoomStatus as apiUpdateRoomStatus,
  updateHousekeepingStatus
} from '@/services/pms/roomService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  room: {
    type: Object,
    default: null
  },
  hotelId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()
const loading = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const roomStatusInfo = computed(() => {
  if (!props.room?.status) return null
  return ROOM_STATUS_INFO[props.room.status]
})

const housekeepingStatusInfo = computed(() => {
  if (!props.room?.housekeepingStatus) return null
  return HOUSEKEEPING_STATUS_INFO[props.room.housekeepingStatus]
})

const priorityInfo = computed(() => {
  if (!props.room?.housekeepingPriority) return null
  return PRIORITY_INFO[props.room.housekeepingPriority]
})

const availableStatuses = [
  { value: ROOM_STATUS.VACANT_CLEAN, label: 'Bos - Temiz', icon: 'check_circle', textColor: 'text-green-600' },
  { value: ROOM_STATUS.VACANT_DIRTY, label: 'Bos - Kirli', icon: 'cleaning_services', textColor: 'text-amber-600' },
  { value: ROOM_STATUS.CHECKOUT, label: 'Cikis Yapildi', icon: 'logout', textColor: 'text-orange-600' },
  { value: ROOM_STATUS.MAINTENANCE, label: 'Bakimda', icon: 'build', textColor: 'text-purple-600' },
  { value: ROOM_STATUS.OUT_OF_ORDER, label: 'Kullanim Disi', icon: 'block', textColor: 'text-red-600' },
  { value: ROOM_STATUS.INSPECTED, label: 'Denetlendi', icon: 'verified', textColor: 'text-teal-600' }
]

const housekeepingStatuses = [
  { value: HOUSEKEEPING_STATUS.CLEAN, label: 'Temiz', dotColor: 'bg-green-500' },
  { value: HOUSEKEEPING_STATUS.DIRTY, label: 'Kirli', dotColor: 'bg-amber-500' },
  { value: HOUSEKEEPING_STATUS.CLEANING, label: 'Temizleniyor', dotColor: 'bg-blue-500' },
  { value: HOUSEKEEPING_STATUS.INSPECTED, label: 'Denetlendi', dotColor: 'bg-teal-500' }
]

const priorities = [
  { value: HOUSEKEEPING_PRIORITY.LOW, label: 'Dusuk', textColor: 'text-gray-600' },
  { value: HOUSEKEEPING_PRIORITY.NORMAL, label: 'Normal', textColor: 'text-blue-600' },
  { value: HOUSEKEEPING_PRIORITY.HIGH, label: 'Yuksek', textColor: 'text-amber-600' },
  { value: HOUSEKEEPING_PRIORITY.URGENT, label: 'Acil', textColor: 'text-red-600' }
]

const isStatusDisabled = (status) => {
  // Cannot manually set to occupied
  if (status === ROOM_STATUS.OCCUPIED) return true
  return false
}

const updateRoomStatus = async (status) => {
  if (props.room.status === status || isStatusDisabled(status)) return

  loading.value = true
  try {
    await apiUpdateRoomStatus(props.hotelId, props.room._id, status)
    toast.success('Oda durumu guncellendi')
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Durum guncellenemedi')
  } finally {
    loading.value = false
  }
}

const updateHousekeeping = async (status) => {
  if (props.room.housekeepingStatus === status) return

  loading.value = true
  try {
    await updateHousekeepingStatus(props.hotelId, props.room._id, { housekeepingStatus: status })
    toast.success('Housekeeping durumu guncellendi')
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Durum guncellenemedi')
  } finally {
    loading.value = false
  }
}

const updatePriority = async (priority) => {
  if (props.room.housekeepingPriority === priority) return

  loading.value = true
  try {
    await updateHousekeepingStatus(props.hotelId, props.room._id, { priority })
    toast.success('Oncelik guncellendi')
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Oncelik guncellenemedi')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const close = () => {
  show.value = false
}
</script>
