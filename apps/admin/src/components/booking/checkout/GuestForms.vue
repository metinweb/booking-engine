<template>
	<div class="space-y-6">
		<!-- Lead Guest -->
		<div class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
				<span class="material-icons text-purple-500 mr-2">person</span>
				{{ $t('booking.leadGuest') }}
				<span class="text-red-500 ml-1">*</span>
			</h3>
			<GuestForm
				:model-value="leadGuest"
				@update:model-value="$emit('update:lead-guest', $event)"
				:is-lead-guest="true"
				:show-validation="showValidation"
			/>
		</div>

		<!-- Room Guests -->
		<div
			v-for="(room, roomIndex) in cart"
			:key="roomIndex"
			class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
		>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
				<span class="material-icons text-purple-500 mr-2">bed</span>
				{{ $t('booking.room') }} {{ roomIndex + 1 }}: {{ getLocalizedName(room.roomType?.name) }}
			</h3>

			<!-- Use Lead Guest Option (first room) -->
			<div v-if="roomIndex === 0" class="mb-4 flex items-center space-x-2">
				<input
					type="checkbox"
					:id="`useLeadGuest-${roomIndex}`"
					v-model="useLeadAsFirstGuest"
					class="form-checkbox h-4 w-4 text-purple-600 rounded"
				>
				<label :for="`useLeadGuest-${roomIndex}`" class="text-sm text-gray-600 dark:text-slate-400">
					{{ $t('booking.useLeadAsFirstGuest') }}
				</label>
			</div>

			<!-- Guest message if using lead guest -->
			<div
				v-if="roomIndex === 0 && useLeadAsFirstGuest"
				class="mb-4 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-400 flex items-center"
			>
				<span class="material-icons text-sm mr-2">check_circle</span>
				{{ $t('booking.leadGuestWillStayInRoom', { room: 1 }) }}
			</div>

			<!-- Adult Guests -->
			<div class="space-y-4">
				<template v-for="(guest, guestIndex) in getAdultsForRoom(roomIndex)" :key="`adult-${roomIndex}-${guestIndex}`">
					<!-- Skip first guest if using lead guest in first room -->
					<div v-if="!(roomIndex === 0 && guestIndex === 0 && useLeadAsFirstGuest)">
						<h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
							{{ $t('booking.adultGuest', { n: guestIndex + 1 }) }}
							<span class="text-red-500 ml-1">*</span>
						</h4>
						<GuestForm
							:model-value="guest"
							@update:model-value="updateGuest(roomIndex, guestIndex, $event)"
							:is-lead-guest="false"
							:show-validation="showValidation"
							compact
						/>
					</div>
				</template>

				<!-- Children -->
				<template v-for="(guest, childIndex) in getChildrenForRoom(roomIndex)" :key="`child-${roomIndex}-${childIndex}`">
					<div>
						<h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
							{{ $t('booking.childGuest', { n: childIndex + 1 }) }}
							<span class="text-gray-400 ml-1">({{ room.children[childIndex] }} {{ $t('booking.yearsOld') }})</span>
							<span class="text-red-500 ml-1">*</span>
						</h4>
						<GuestForm
							:model-value="guest"
							@update:model-value="updateChildGuest(roomIndex, childIndex, $event)"
							:is-child="true"
							:child-age="room.children[childIndex]"
							:check-in-date="checkInDate"
							:show-birth-date="true"
							:show-validation="showValidation"
							compact
						/>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GuestForm from '@/components/booking/GuestForm.vue'

const { locale } = useI18n()

const props = defineProps({
	cart: {
		type: Array,
		required: true
	},
	leadGuest: {
		type: Object,
		required: true
	},
	roomGuests: {
		type: Array,
		required: true
	},
	showValidation: {
		type: Boolean,
		default: false
	},
	checkInDate: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['update:lead-guest', 'update:room-guests'])

const useLeadAsFirstGuest = ref(true)

// Get localized name
const getLocalizedName = (name) => {
	if (!name) return ''
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
	}
	return name
}

// Get adults for a room
const getAdultsForRoom = (roomIndex) => {
	const room = props.cart[roomIndex]
	if (!room) return []
	const roomGuestList = props.roomGuests[roomIndex] || []
	return roomGuestList.filter(g => g.type === 'adult')
}

// Get children for a room
const getChildrenForRoom = (roomIndex) => {
	const roomGuestList = props.roomGuests[roomIndex] || []
	return roomGuestList.filter(g => g.type === 'child' || g.type === 'infant')
}

// Update adult guest
const updateGuest = (roomIndex, guestIndex, data) => {
	const newRoomGuests = JSON.parse(JSON.stringify(props.roomGuests))
	if (!newRoomGuests[roomIndex]) return

	// Find actual index (adults only)
	const adults = newRoomGuests[roomIndex].filter(g => g.type === 'adult')
	const actualIndex = newRoomGuests[roomIndex].findIndex(g => g === adults[guestIndex])

	if (actualIndex !== -1) {
		newRoomGuests[roomIndex][actualIndex] = { ...data, type: 'adult' }
		emit('update:room-guests', newRoomGuests)
	}
}

// Update child guest
const updateChildGuest = (roomIndex, childIndex, data) => {
	const newRoomGuests = JSON.parse(JSON.stringify(props.roomGuests))
	if (!newRoomGuests[roomIndex]) return

	// Find actual index (children only)
	const children = newRoomGuests[roomIndex].filter(g => g.type === 'child' || g.type === 'infant')
	const child = children[childIndex]
	const actualIndex = newRoomGuests[roomIndex].findIndex(g => g === child)

	if (actualIndex !== -1) {
		newRoomGuests[roomIndex][actualIndex] = { ...data, type: child.type }
		emit('update:room-guests', newRoomGuests)
	}
}

// Watch useLeadAsFirstGuest and sync lead guest to first room's first adult
watch(useLeadAsFirstGuest, (val) => {
	if (val && props.roomGuests[0]?.length > 0) {
		const newRoomGuests = JSON.parse(JSON.stringify(props.roomGuests))
		const firstAdultIndex = newRoomGuests[0].findIndex(g => g.type === 'adult')
		if (firstAdultIndex !== -1) {
			newRoomGuests[0][firstAdultIndex] = {
				...newRoomGuests[0][firstAdultIndex],
				title: props.leadGuest.title,
				firstName: props.leadGuest.firstName,
				lastName: props.leadGuest.lastName,
				nationality: props.leadGuest.nationality,
				tcNumber: props.leadGuest.tcNumber
			}
			emit('update:room-guests', newRoomGuests)
		}
	}
})
</script>
