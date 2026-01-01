<template>
	<div class="space-y-6">
		<div class="text-center mb-6">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white">
				{{ $t('booking.amendment.datesRoomsTitle') }}
			</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
				{{ $t('booking.amendment.datesRoomsDescription') }}
			</p>
		</div>

		<!-- Date Selection -->
		<div class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
			<h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
				<span class="material-icons text-indigo-500">calendar_today</span>
				{{ $t('booking.dates') }}
			</h4>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('booking.checkIn') }}
					</label>
					<input
						type="date"
						:value="formatDateInput(localFormData.checkIn)"
						@input="updateDate('checkIn', $event.target.value)"
						:min="minCheckIn"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('booking.checkOut') }}
					</label>
					<input
						type="date"
						:value="formatDateInput(localFormData.checkOut)"
						@input="updateDate('checkOut', $event.target.value)"
						:min="minCheckOut"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
			</div>

			<!-- Nights display -->
			<div class="mt-4 flex items-center justify-center gap-2 text-sm">
				<span class="text-gray-500 dark:text-gray-400">{{ $t('booking.nights') }}:</span>
				<span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ calculatedNights }}</span>
				<span v-if="nightsChanged" class="text-amber-600 dark:text-amber-400">
					({{ nightsDifference > 0 ? '+' : '' }}{{ nightsDifference }} {{ $t('booking.amendment.changed') }})
				</span>
			</div>
		</div>

		<!-- Rooms -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h4 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
					<span class="material-icons text-indigo-500">bed</span>
					{{ $t('booking.rooms') }}
				</h4>
				<button
					@click="addRoom"
					class="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
				>
					<span class="material-icons text-sm mr-1 align-middle">add</span>
					{{ $t('booking.amendment.addRoom') }}
				</button>
			</div>

			<div
				v-for="(room, index) in localFormData.rooms"
				:key="index"
				class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
			>
				<div class="flex items-center justify-between mb-4">
					<h5 class="font-medium text-gray-900 dark:text-white">
						{{ $t('booking.room') }} {{ index + 1 }}
					</h5>
					<button
						v-if="localFormData.rooms.length > 1"
						@click="removeRoom(index)"
						class="text-red-500 hover:text-red-700 dark:hover:text-red-400"
					>
						<span class="material-icons text-sm">delete</span>
					</button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Room Type -->
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{{ $t('booking.roomType') }}
						</label>
						<select
							v-model="room.roomTypeId"
							@change="onRoomChange(index)"
							class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						>
							<option
								v-for="rt in availableRoomTypes"
								:key="rt._id"
								:value="rt._id"
							>
								{{ getRoomTypeName(rt) }}
							</option>
						</select>
					</div>

					<!-- Meal Plan -->
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{{ $t('booking.mealPlan') }}
						</label>
						<select
							v-model="room.mealPlanId"
							@change="onRoomChange(index)"
							class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						>
							<option
								v-for="mp in availableMealPlans"
								:key="mp._id"
								:value="mp._id"
							>
								{{ getMealPlanName(mp) }}
							</option>
						</select>
					</div>

					<!-- Adults -->
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{{ $t('booking.adults') }}
						</label>
						<select
							v-model="room.adults"
							@change="onRoomChange(index)"
							class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						>
							<option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
						</select>
					</div>

					<!-- Rate Type -->
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{{ $t('booking.rateType') }}
						</label>
						<select
							v-model="room.rateType"
							@change="onRoomChange(index)"
							class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						>
							<option value="refundable">{{ $t('booking.refundable') }}</option>
							<option value="non_refundable">{{ $t('booking.nonRefundable') }}</option>
						</select>
					</div>
				</div>

				<!-- Room availability status -->
				<div v-if="previewData" class="mt-4">
					<div
						v-if="getRoomAvailability(index)"
						class="flex items-center gap-2 text-green-600 dark:text-green-400"
					>
						<span class="material-icons text-sm">check_circle</span>
						{{ $t('booking.amendment.available') }}
					</div>
					<div
						v-else
						class="flex items-center gap-2 text-red-600 dark:text-red-400"
					>
						<span class="material-icons text-sm">error</span>
						{{ $t('booking.amendment.unavailable') }}
					</div>
				</div>
			</div>
		</div>

		<!-- Check Availability Button -->
		<div class="text-center">
			<button
				@click="$emit('check-availability')"
				:disabled="checkingAvailability"
				class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center mx-auto"
			>
				<span v-if="checkingAvailability" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
				<span class="material-icons text-sm mr-2">search</span>
				{{ $t('booking.amendment.checkAvailability') }}
			</button>
		</div>

		<!-- Preview Price Difference -->
		<div v-if="previewData?.priceDifference" class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
			<h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
				<span class="material-icons text-indigo-500">calculate</span>
				{{ $t('booking.amendment.pricePreview') }}
			</h4>

			<div class="grid grid-cols-2 gap-4 text-sm">
				<div class="text-gray-500 dark:text-gray-400">{{ $t('booking.amendment.originalPrice') }}</div>
				<div class="text-right font-medium text-gray-900 dark:text-white">
					{{ formatCurrency(previewData.priceDifference.originalTotal, previewData.priceDifference.currency) }}
				</div>

				<div class="text-gray-500 dark:text-gray-400">{{ $t('booking.amendment.newPrice') }}</div>
				<div class="text-right font-medium text-gray-900 dark:text-white">
					{{ formatCurrency(previewData.priceDifference.newTotal, previewData.priceDifference.currency) }}
				</div>

				<div class="col-span-2 border-t dark:border-gray-600 pt-3 mt-2">
					<div class="flex justify-between items-center">
						<span class="font-medium text-gray-900 dark:text-white">
							{{ previewData.priceDifference.isIncrease ? $t('booking.amendment.additionalCharge') : $t('booking.amendment.refundDue') }}
						</span>
						<span
							class="text-lg font-bold"
							:class="previewData.priceDifference.isIncrease ? 'text-amber-600' : 'text-green-600'"
						>
							{{ previewData.priceDifference.isIncrease ? '+' : '' }}{{ formatCurrency(previewData.priceDifference.difference, previewData.priceDifference.currency) }}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	booking: { type: Object, default: null },
	formData: { type: Object, required: true },
	availableRoomTypes: { type: Array, default: () => [] },
	availableMealPlans: { type: Array, default: () => [] },
	previewData: { type: Object, default: null },
	checkingAvailability: { type: Boolean, default: false }
})

const emit = defineEmits(['update:form-data', 'check-availability'])

const { locale } = useI18n()

// Local copy of form data
const localFormData = ref({ ...props.formData })

// Watch for external changes
watch(() => props.formData, (newVal) => {
	localFormData.value = { ...newVal }
}, { deep: true })

// Computed
const minCheckIn = computed(() => {
	const today = new Date()
	return today.toISOString().split('T')[0]
})

const minCheckOut = computed(() => {
	if (!localFormData.value.checkIn) return minCheckIn.value
	const checkIn = new Date(localFormData.value.checkIn)
	checkIn.setDate(checkIn.getDate() + 1)
	return checkIn.toISOString().split('T')[0]
})

const calculatedNights = computed(() => {
	if (!localFormData.value.checkIn || !localFormData.value.checkOut) return 0
	const checkIn = new Date(localFormData.value.checkIn)
	const checkOut = new Date(localFormData.value.checkOut)
	return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const nightsChanged = computed(() => {
	return calculatedNights.value !== props.booking?.nights
})

const nightsDifference = computed(() => {
	return calculatedNights.value - (props.booking?.nights || 0)
})

// Methods
const formatDateInput = (date) => {
	if (!date) return ''
	return new Date(date).toISOString().split('T')[0]
}

const updateDate = (field, value) => {
	localFormData.value[field] = value
	emitUpdate()
}

const onRoomChange = (index) => {
	emitUpdate()
}

const addRoom = () => {
	const lastRoom = localFormData.value.rooms[localFormData.value.rooms.length - 1]
	localFormData.value.rooms.push({
		roomTypeId: lastRoom?.roomTypeId || props.availableRoomTypes[0]?._id,
		mealPlanId: lastRoom?.mealPlanId || props.availableMealPlans[0]?._id,
		adults: 2,
		children: [],
		guests: [],
		rateType: 'refundable'
	})
	emitUpdate()
}

const removeRoom = (index) => {
	localFormData.value.rooms.splice(index, 1)
	emitUpdate()
}

const emitUpdate = () => {
	emit('update:form-data', { ...localFormData.value })
}

const getRoomTypeName = (rt) => {
	const name = rt.name
	if (!name) return rt.code || '-'
	return typeof name === 'object' ? (name[locale.value] || name.tr || name.en) : name
}

const getMealPlanName = (mp) => {
	const name = mp.name
	if (!name) return mp.code || '-'
	return typeof name === 'object' ? (name[locale.value] || name.tr || name.en) : name
}

const getRoomAvailability = (index) => {
	if (!props.previewData?.preview?.rooms) return null
	const previewRoom = props.previewData.preview.rooms[index]
	return previewRoom?.available !== false
}

const formatCurrency = (amount, currency = 'TRY') => {
	if (amount === undefined || amount === null) return '-'
	return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
		style: 'currency',
		currency: currency || 'TRY',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(amount)
}
</script>
