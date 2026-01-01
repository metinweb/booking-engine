<template>
  <Modal
    v-model="isOpen"
    title="Otel Ata"
    size="md"
    :close-on-overlay="false"
  >
    <div class="space-y-4">
      <!-- User Info -->
      <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <p class="text-sm text-gray-500 dark:text-slate-400">Kullanici</p>
        <p class="font-medium text-gray-900 dark:text-white">{{ user?.firstName }} {{ user?.lastName }}</p>
        <p class="text-sm text-gray-500 dark:text-slate-400">@{{ user?.username }}</p>
      </div>

      <!-- Currently Assigned Hotels -->
      <div v-if="user?.assignedHotels?.length > 0">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mevcut Atamalar</h4>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="(assignment, i) in user.assignedHotels"
            :key="i"
            class="flex items-center justify-between p-2 bg-gray-100 dark:bg-slate-600/50 rounded"
          >
            <div class="flex items-center gap-2">
              <span class="material-icons text-gray-400 text-lg">hotel</span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ assignment.hotel?.name }}</span>
              <span class="px-1.5 py-0.5 text-xs rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                {{ getRoleLabel(assignment.role) }}
              </span>
            </div>
            <button
              type="button"
              @click="removeHotel(assignment.hotel?._id || assignment.hotel)"
              class="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              title="Kaldir"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add New Assignment -->
      <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Yeni Otel Ata</h4>

        <!-- Hotel Select -->
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otel</label>
          <select
            v-model="form.hotelId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Otel Secin</option>
            <option
              v-for="hotel in availableHotels"
              :key="hotel._id"
              :value="hotel._id"
            >
              {{ hotel.name }}
            </option>
          </select>
          <p v-if="availableHotels.length === 0" class="text-xs text-gray-400 mt-1">
            Tum oteller zaten atanmis.
          </p>
        </div>

        <!-- Role Select -->
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
          <select
            v-model="form.role"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ roles.find(r => r.value === form.role)?.description }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          @click="isOpen = false"
          type="button"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        >
          Kapat
        </button>
        <button
          @click="assignHotel"
          :disabled="saving || !form.hotelId"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          {{ saving ? 'Ataniyor...' : 'Ata' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import pmsAdminUserService from '@/services/pms/pmsAdminUserService'

const props = defineProps({
  modelValue: Boolean,
  user: Object,
  hotels: Array,
  roles: Array
})

const emit = defineEmits(['update:modelValue', 'assigned'])

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const saving = ref(false)

const form = ref({
  hotelId: '',
  role: 'receptionist'
})

// Get hotels that are not already assigned
const availableHotels = computed(() => {
  if (!props.hotels || !props.user?.assignedHotels) return props.hotels || []

  const assignedIds = props.user.assignedHotels.map(a => a.hotel?._id || a.hotel)
  return props.hotels.filter(h => !assignedIds.includes(h._id))
})

// Reset form when modal opens
watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = { hotelId: '', role: 'receptionist' }
  }
})

const getRoleLabel = (role) => {
  return props.roles?.find(r => r.value === role)?.label || role
}

const removeHotel = async (hotelId) => {
  if (!hotelId || !props.user?._id) return

  try {
    await pmsAdminUserService.removeHotel(props.user._id, hotelId)
    toast.success('Otel kaldirildi')
    emit('assigned')
  } catch (error) {
    console.error('Failed to remove hotel:', error)
    toast.error('Otel kaldirilamadi')
  }
}

const assignHotel = async () => {
  if (!form.value.hotelId) return

  saving.value = true
  try {
    await pmsAdminUserService.assignHotel(props.user._id, {
      hotelId: form.value.hotelId,
      role: form.value.role
    })
    toast.success('Otel atandi')
    form.value = { hotelId: '', role: 'receptionist' }
    emit('assigned')
  } catch (error) {
    console.error('Failed to assign hotel:', error)
    toast.error('Otel atanamadi')
  } finally {
    saving.value = false
  }
}
</script>
