<template>
  <Modal
    v-model="show"
    title="Rezervasyondan Check-in"
    size="lg"
    @close="close"
  >
    <div v-if="booking" class="space-y-6">
      <!-- Reservation Info -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-medium text-blue-900 dark:text-blue-100">{{ guestDisplayName }}</h4>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {{ reservationNumber }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-blue-600 dark:text-blue-400">
              {{ formatDate(checkInDate) }} - {{ formatDate(checkOutDate) }}
            </p>
            <p class="text-xs text-blue-500 dark:text-blue-400">{{ nightsCount }} gece</p>
          </div>
        </div>
        <div class="mt-3 flex items-center gap-4 text-sm text-blue-600 dark:text-blue-400">
          <span>{{ booking.roomType?.name?.tr || booking.roomType?.code }}</span>
          <span>{{ adultsCount }} yetiskin</span>
          <span v-if="childrenCount">{{ childrenCount }} cocuk</span>
        </div>
      </div>

      <!-- Room Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Oda Secimi *
        </label>
        <div v-if="loadingRooms" class="text-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
        <div v-else-if="availableRooms.length === 0" class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
          <span class="material-icons text-amber-500">warning</span>
          <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">Musait oda bulunamadi</p>
        </div>
        <div v-else class="grid grid-cols-4 gap-2">
          <button
            v-for="room in availableRooms"
            :key="room._id"
            @click="selectedRoomId = room._id"
            class="p-3 rounded-lg border-2 text-center transition-all relative"
            :class="[
              selectedRoomId === room._id
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : isMatchingRoomType(room)
                  ? 'border-indigo-300 dark:border-indigo-600 hover:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            ]"
          >
            <span v-if="!isMatchingRoomType(room)" class="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">
              UP
            </span>
            <span class="block font-bold text-gray-900 dark:text-white">{{ room.roomNumber }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{ room.roomType?.code || 'Kat ' + room.floor }}</span>
          </button>
        </div>
      </div>

      <!-- Guest Info Override (optional) -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Misafir Bilgileri
          </label>
          <button
            @click="showGuestEdit = !showGuestEdit"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {{ showGuestEdit ? 'Gizle' : 'Duzenle' }}
          </button>
        </div>

        <div v-if="!showGuestEdit" class="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
          <p class="text-gray-900 dark:text-white">{{ guestDisplayName }}</p>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ guestPhone }} - {{ guestEmail }}</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Ad</label>
            <input
              v-model="guestForm.firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Soyad</label>
            <input
              v-model="guestForm.lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Kimlik No</label>
            <input
              v-model="guestForm.idNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <PhoneInput
              v-model="guestForm.phone"
              label="Telefon"
              country="TR"
            />
          </div>
        </div>
      </div>

      <!-- Special Requests -->
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Ozel Istekler</label>
        <textarea
          v-model="specialRequests"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          :placeholder="booking.specialRequests || 'Ozel istek yok'"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button
        @click="close"
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
      >
        Iptal
      </button>
      <button
        @click="submit"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !selectedRoomId"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span class="material-icons text-sm" v-else>login</span>
        Check-in Yap
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import stayService from '@/services/pms/stayService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  booking: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'completed'])

const toast = useToast()
const loading = ref(false)
const loadingRooms = ref(false)
const availableRooms = ref([])
const selectedRoomId = ref('')
const showGuestEdit = ref(false)
const specialRequests = ref('')

const guestForm = ref({
  firstName: '',
  lastName: '',
  idNumber: '',
  phone: ''
})

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Helper: Check if this is a Stay object (has guests array) or Booking object
const isStayObject = computed(() => {
  return props.booking?.guests && Array.isArray(props.booking.guests)
})

// Computed properties to handle both Booking and Stay objects
const guestDisplayName = computed(() => {
  if (!props.booking) return ''
  if (isStayObject.value) {
    const mainGuest = props.booking.guests?.find(g => g.isMainGuest) || props.booking.guests?.[0]
    return mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : 'Misafir'
  }
  // Booking uses leadGuest
  if (props.booking.leadGuest?.firstName) {
    return `${props.booking.leadGuest.firstName} ${props.booking.leadGuest.lastName || ''}`.trim()
  }
  return props.booking.customerName || 'Misafir'
})

const guestPhone = computed(() => {
  if (!props.booking) return ''
  if (isStayObject.value) {
    const mainGuest = props.booking.guests?.find(g => g.isMainGuest) || props.booking.guests?.[0]
    return mainGuest?.phone || ''
  }
  // Booking uses contact.phone
  return props.booking.contact?.phone || props.booking.customerPhone || ''
})

const guestEmail = computed(() => {
  if (!props.booking) return ''
  if (isStayObject.value) {
    const mainGuest = props.booking.guests?.find(g => g.isMainGuest) || props.booking.guests?.[0]
    return mainGuest?.email || ''
  }
  // Booking uses contact.email
  return props.booking.contact?.email || props.booking.customerEmail || ''
})

const reservationNumber = computed(() => {
  if (!props.booking) return ''
  if (isStayObject.value) {
    return props.booking.bookingNumber || props.booking.stayNumber || ''
  }
  return props.booking.bookingNumber || ''
})

const checkInDate = computed(() => {
  if (!props.booking) return null
  return isStayObject.value ? props.booking.checkInDate : props.booking.checkIn
})

const checkOutDate = computed(() => {
  if (!props.booking) return null
  return isStayObject.value ? props.booking.checkOutDate : props.booking.checkOut
})

const nightsCount = computed(() => {
  return props.booking?.nights || 0
})

const adultsCount = computed(() => {
  if (!props.booking) return 0
  return isStayObject.value ? props.booking.adultsCount : props.booking.adults
})

const childrenCount = computed(() => {
  if (!props.booking) return 0
  return isStayObject.value ? props.booking.childrenCount : props.booking.children
})

// Get the expected room type from booking
const expectedRoomTypeId = computed(() => {
  return props.booking?.roomType?._id || props.booking?.rooms?.[0]?.roomType?._id || props.booking?.rooms?.[0]?.roomType
})

// Check if room matches the expected room type
const isMatchingRoomType = (room) => {
  const roomTypeId = room.roomType?._id || room.roomType
  return roomTypeId === expectedRoomTypeId.value
}

const fetchAvailableRooms = async () => {
  if (!props.hotelId || !props.booking) return

  loadingRooms.value = true
  try {
    // Get ALL available rooms for upgrade/downgrade option
    const response = await stayService.getAvailableRooms(props.hotelId, {})
    // Sort: matching room type first, then by floor and room number
    const rooms = response.data || []
    availableRooms.value = rooms.sort((a, b) => {
      const aMatch = a.roomType?._id === expectedRoomTypeId.value || a.roomType === expectedRoomTypeId.value
      const bMatch = b.roomType?._id === expectedRoomTypeId.value || b.roomType === expectedRoomTypeId.value
      if (aMatch && !bMatch) return -1
      if (!aMatch && bMatch) return 1
      return (a.floor - b.floor) || a.roomNumber.localeCompare(b.roomNumber)
    })
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
  } finally {
    loadingRooms.value = false
  }
}

const submit = async () => {
  if (!selectedRoomId.value) return

  loading.value = true
  try {
    const guests = showGuestEdit.value && guestForm.value.firstName ? [{
      ...guestForm.value,
      isMainGuest: true
    }] : null

    if (isStayObject.value) {
      // For pending Stay - use checkInFromStay
      await stayService.checkInFromStay(props.hotelId, props.booking._id, {
        roomId: selectedRoomId.value,
        guests,
        specialRequests: specialRequests.value
      })
    } else {
      // For Booking - use checkInFromBooking
      await stayService.checkInFromBooking(props.hotelId, {
        bookingId: props.booking._id,
        roomId: selectedRoomId.value,
        guests,
        specialRequests: specialRequests.value
      })
    }

    toast.success('Check-in basarili')
    emit('completed')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Check-in yapilamadi')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const close = () => {
  show.value = false
  selectedRoomId.value = ''
  showGuestEdit.value = false
  specialRequests.value = ''
  guestForm.value = { firstName: '', lastName: '', idNumber: '', phone: '' }
}

watch(() => props.modelValue, (val) => {
  if (val && props.booking) {
    selectedRoomId.value = ''
    specialRequests.value = props.booking.specialRequests || ''

    // Handle both Booking and Stay objects
    if (isStayObject.value) {
      // Stay object - use guests array
      const mainGuest = props.booking.guests?.find(g => g.isMainGuest) || props.booking.guests?.[0]
      guestForm.value = {
        firstName: mainGuest?.firstName || '',
        lastName: mainGuest?.lastName || '',
        idNumber: mainGuest?.idNumber || '',
        phone: mainGuest?.phone || ''
      }
    } else {
      // Booking object - use leadGuest and contact
      guestForm.value = {
        firstName: props.booking.leadGuest?.firstName || '',
        lastName: props.booking.leadGuest?.lastName || '',
        idNumber: '',
        phone: props.booking.contact?.phone || ''
      }
    }
    fetchAvailableRooms()
  }
})
</script>
