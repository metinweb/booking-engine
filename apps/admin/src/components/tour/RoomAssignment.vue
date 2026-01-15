<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
        {{ $t('tourBooking.room.title') }}
      </h4>
      <button
        type="button"
        @click="addRoom"
        class="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
      >
        <span class="material-icons text-sm">add</span>
        {{ $t('tourBooking.room.addRoom') }}
      </button>
    </div>

    <!-- Summary -->
    <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg text-sm">
      <div class="flex items-center gap-2">
        <span class="material-icons text-gray-400">people</span>
        <span class="text-gray-600 dark:text-gray-400">
          {{ assignedCount }}/{{ passengers.length }} {{ $t('tourBooking.room.assigned') }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="material-icons text-gray-400">hotel</span>
        <span class="text-gray-600 dark:text-gray-400">
          {{ rooms.length }} {{ $t('tourBooking.room.rooms') }}
        </span>
      </div>
      <div v-if="unassignedPassengers.length > 0" class="flex items-center gap-2 text-orange-600">
        <span class="material-icons text-sm">warning</span>
        <span>{{ unassignedPassengers.length }} {{ $t('tourBooking.room.unassigned') }}</span>
      </div>
    </div>

    <!-- Rooms Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Room Cards -->
      <div
        v-for="(room, roomIndex) in rooms"
        :key="roomIndex"
        class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
        @dragover.prevent="onDragOver($event, roomIndex)"
        @drop="onDrop($event, roomIndex)"
      >
        <!-- Room Header -->
        <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
          <div class="flex items-center gap-2">
            <span class="material-icons text-gray-400">hotel</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('tourBooking.room.room') }} {{ room.roomNumber || roomIndex + 1 }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-model="room.roomType"
              class="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="single">{{ $t('tourBooking.room.single') }}</option>
              <option value="double">{{ $t('tourBooking.room.double') }}</option>
              <option value="triple">{{ $t('tourBooking.room.triple') }}</option>
              <option value="quad">{{ $t('tourBooking.room.quad') }}</option>
            </select>
            <button
              type="button"
              @click="removeRoom(roomIndex)"
              class="text-gray-400 hover:text-red-500"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </div>

        <!-- Room Passengers -->
        <div class="p-3 min-h-[100px]">
          <div v-if="room.passengers.length === 0" class="text-center py-4 text-gray-400 text-sm">
            {{ $t('tourBooking.room.dropPassengers') }}
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(pIndex, idx) in room.passengers"
              :key="idx"
              class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              draggable="true"
              @dragstart="onDragStartPassenger($event, pIndex, roomIndex)"
            >
              <div class="flex items-center gap-2">
                <span class="material-icons text-purple-600 dark:text-purple-400 text-sm">person</span>
                <span class="text-sm text-gray-900 dark:text-white">
                  {{ getPassengerName(pIndex) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  ({{ $t(`tourBooking.passenger.${passengers[pIndex]?.type || 'adult'}`) }})
                </span>
              </div>
              <button
                type="button"
                @click="removePassengerFromRoom(roomIndex, idx)"
                class="text-gray-400 hover:text-red-500"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
          </div>

          <!-- Room Capacity Warning -->
          <div
            v-if="isRoomOverCapacity(room)"
            class="mt-2 flex items-center gap-1 text-xs text-orange-600"
          >
            <span class="material-icons text-sm">warning</span>
            {{ $t('tourBooking.room.overCapacity') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Unassigned Passengers -->
    <div
      v-if="unassignedPassengers.length > 0"
      class="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4"
      @dragover.prevent
      @drop="onDropToUnassigned"
    >
      <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {{ $t('tourBooking.room.unassignedPassengers') }}
      </h5>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="pIndex in unassignedPassengers"
          :key="pIndex"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg cursor-move"
          draggable="true"
          @dragstart="onDragStartPassenger($event, pIndex, null)"
        >
          <span class="material-icons text-gray-400 text-sm">person</span>
          <span class="text-sm text-gray-900 dark:text-white">
            {{ getPassengerName(pIndex) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Auto Assign Button -->
    <div v-if="passengers.length > 0" class="flex justify-end">
      <button
        type="button"
        @click="autoAssign"
        class="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
      >
        <span class="material-icons text-sm">auto_fix_high</span>
        {{ $t('tourBooking.room.autoAssign') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  passengers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const draggedPassenger = ref(null)
const draggedFromRoom = ref(null)

const rooms = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const assignedCount = computed(() => {
  return rooms.value.reduce((sum, room) => sum + (room.passengers?.length || 0), 0)
})

const unassignedPassengers = computed(() => {
  const assigned = new Set()
  rooms.value.forEach(room => {
    room.passengers?.forEach(pIndex => assigned.add(pIndex))
  })
  return props.passengers.map((_, index) => index).filter(i => !assigned.has(i))
})

const roomCapacities = {
  single: 1,
  double: 2,
  triple: 3,
  quad: 4
}

function getPassengerName(index) {
  const p = props.passengers[index]
  if (!p) return `Passenger ${index + 1}`
  if (p.firstName || p.lastName) {
    return `${p.firstName || ''} ${p.lastName || ''}`.trim()
  }
  return `${t('tourBooking.passenger.title')} ${index + 1}`
}

function isRoomOverCapacity(room) {
  const capacity = roomCapacities[room.roomType] || 2
  return (room.passengers?.length || 0) > capacity
}

function addRoom() {
  const newRooms = [...rooms.value]
  newRooms.push({
    roomNumber: newRooms.length + 1,
    roomType: 'double',
    passengers: []
  })
  rooms.value = newRooms
}

function removeRoom(index) {
  const newRooms = [...rooms.value]
  newRooms.splice(index, 1)
  // Re-number rooms
  newRooms.forEach((r, i) => {
    r.roomNumber = i + 1
  })
  rooms.value = newRooms
}

function removePassengerFromRoom(roomIndex, passengerIdx) {
  const newRooms = [...rooms.value]
  newRooms[roomIndex].passengers.splice(passengerIdx, 1)
  rooms.value = newRooms
}

// Drag & Drop
function onDragStartPassenger(event, passengerIndex, fromRoomIndex) {
  draggedPassenger.value = passengerIndex
  draggedFromRoom.value = fromRoomIndex
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event, roomIndex) {
  event.dataTransfer.dropEffect = 'move'
}

function onDrop(event, roomIndex) {
  if (draggedPassenger.value === null) return

  const newRooms = [...rooms.value]

  // Remove from previous room if exists
  if (draggedFromRoom.value !== null) {
    const prevRoom = newRooms[draggedFromRoom.value]
    const idx = prevRoom.passengers.indexOf(draggedPassenger.value)
    if (idx >= 0) {
      prevRoom.passengers.splice(idx, 1)
    }
  }

  // Add to new room (if not already there)
  if (!newRooms[roomIndex].passengers.includes(draggedPassenger.value)) {
    newRooms[roomIndex].passengers.push(draggedPassenger.value)
  }

  rooms.value = newRooms
  draggedPassenger.value = null
  draggedFromRoom.value = null
}

function onDropToUnassigned(event) {
  if (draggedPassenger.value === null || draggedFromRoom.value === null) return

  const newRooms = [...rooms.value]
  const prevRoom = newRooms[draggedFromRoom.value]
  const idx = prevRoom.passengers.indexOf(draggedPassenger.value)
  if (idx >= 0) {
    prevRoom.passengers.splice(idx, 1)
  }

  rooms.value = newRooms
  draggedPassenger.value = null
  draggedFromRoom.value = null
}

function autoAssign() {
  const adults = props.passengers
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.type === 'adult' || !p.type)

  const children = props.passengers
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.type === 'child')

  const infants = props.passengers
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.type === 'infant')

  const newRooms = []
  let roomNumber = 1

  // Pair adults into double rooms
  for (let i = 0; i < adults.length; i += 2) {
    const roomPassengers = [adults[i].index]
    const roomType = adults[i + 1] ? 'double' : 'single'

    if (adults[i + 1]) {
      roomPassengers.push(adults[i + 1].index)
    }

    newRooms.push({
      roomNumber: roomNumber++,
      roomType,
      passengers: roomPassengers
    })
  }

  // Add children to rooms with space (or create new rooms)
  children.forEach(child => {
    // Find a room with space
    let assigned = false
    for (const room of newRooms) {
      const capacity = roomCapacities[room.roomType]
      if (room.passengers.length < capacity) {
        room.passengers.push(child.index)
        assigned = true
        break
      }
    }

    if (!assigned) {
      // Create new room
      newRooms.push({
        roomNumber: roomNumber++,
        roomType: 'double',
        passengers: [child.index]
      })
    }
  })

  // Add infants to rooms with their parents (adults)
  infants.forEach(infant => {
    // Find first room with adults
    for (const room of newRooms) {
      const hasAdult = room.passengers.some(pIndex => {
        const p = props.passengers[pIndex]
        return !p.type || p.type === 'adult'
      })
      if (hasAdult) {
        room.passengers.push(infant.index)
        break
      }
    }
  })

  rooms.value = newRooms
}

// Initialize rooms if empty
watch(
  () => props.passengers.length,
  (newLen, oldLen) => {
    if (newLen > 0 && rooms.value.length === 0) {
      // Create initial room
      addRoom()
    }
  },
  { immediate: true }
)
</script>
