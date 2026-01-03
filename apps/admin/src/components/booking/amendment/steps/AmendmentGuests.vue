<template>
	<div class="space-y-6">
		<div class="text-center mb-6">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white">
				{{ $t('booking.amendment.guestsTitle') }}
			</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
				{{ $t('booking.amendment.guestsDescription') }}
			</p>
		</div>

		<!-- Lead Guest -->
		<div class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
			<h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
				<span class="material-icons text-indigo-500">person</span>
				{{ $t('booking.leadGuest') }}
				<span class="text-red-500">*</span>
			</h4>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<!-- Title -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('common.title') }}
					</label>
					<select
						v-model="localLeadGuest.title"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
					>
						<option value="mr">{{ $t('titles.mr') }}</option>
						<option value="mrs">{{ $t('titles.mrs') }}</option>
						<option value="ms">{{ $t('titles.ms') }}</option>
						<option value="miss">{{ $t('titles.miss') }}</option>
						<option value="dr">{{ $t('titles.dr') }}</option>
					</select>
				</div>

				<!-- First Name -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('common.firstName') }} <span class="text-red-500">*</span>
					</label>
					<input
						v-model="localLeadGuest.firstName"
						type="text"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						:class="{ 'border-red-500': !localLeadGuest.firstName }"
					/>
				</div>

				<!-- Last Name -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('common.lastName') }} <span class="text-red-500">*</span>
					</label>
					<input
						v-model="localLeadGuest.lastName"
						type="text"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						:class="{ 'border-red-500': !localLeadGuest.lastName }"
					/>
				</div>

				<!-- Nationality -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('booking.nationality') }}
					</label>
					<select
						v-model="localLeadGuest.nationality"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
					>
						<option value="">{{ $t('common.select') }}</option>
						<option value="TR">{{ $t('countries.TR') }}</option>
						<option value="DE">{{ $t('countries.DE') }}</option>
						<option value="RU">{{ $t('countries.RU') }}</option>
						<option value="GB">{{ $t('countries.GB') }}</option>
						<option value="FR">{{ $t('countries.FR') }}</option>
						<option value="NL">{{ $t('countries.NL') }}</option>
						<option value="BE">{{ $t('countries.BE') }}</option>
						<option value="OTHER">{{ $t('countries.OTHER') }}</option>
					</select>
				</div>

				<!-- TC Number (for Turkish citizens - optional) -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('booking.tcNumber') }}
					</label>
					<input
						v-model="localLeadGuest.tcNumber"
						type="text"
						maxlength="11"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						placeholder="11 haneli TC kimlik numarası"
					/>
				</div>

				<!-- Passport Number (for non-Turkish citizens) -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('booking.passportNumber') }}
						<span v-if="localLeadGuest.nationality && localLeadGuest.nationality !== 'TR'" class="text-red-500">*</span>
					</label>
					<input
						v-model="localLeadGuest.passportNumber"
						type="text"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						:class="{ 'border-red-500': localLeadGuest.nationality && localLeadGuest.nationality !== 'TR' && !localLeadGuest.passportNumber }"
					/>
				</div>
			</div>

			<!-- Validation message -->
			<div v-if="idValidationMessage" class="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
				<span class="material-icons text-sm">warning</span>
				{{ idValidationMessage }}
			</div>
		</div>

		<!-- Contact Information -->
		<div class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
			<h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
				<span class="material-icons text-indigo-500">contact_phone</span>
				{{ $t('booking.contactInfo') }}
			</h4>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Email -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{{ $t('common.email') }} <span class="text-red-500">*</span>
					</label>
					<input
						v-model="localContact.email"
						type="email"
						class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
						:class="{ 'border-red-500': !isValidEmail }"
					/>
				</div>

				<!-- Phone -->
				<div>
					<PhoneInput
						v-model="localContact.phone"
						:label="$t('common.phone')"
						:required="true"
						country="TR"
						:error="!localContact.phone ? $t('validation.required') : ''"
					/>
				</div>
			</div>
		</div>

		<!-- Special Requests -->
		<div class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
			<h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
				<span class="material-icons text-indigo-500">note_add</span>
				{{ $t('booking.specialRequests') }}
			</h4>

			<textarea
				v-model="localSpecialRequests"
				rows="3"
				class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
				:placeholder="$t('booking.specialRequestsPlaceholder')"
			></textarea>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'

const props = defineProps({
	booking: { type: Object, default: null },
	formData: { type: Object, required: true }
})

const emit = defineEmits(['update:form-data'])

const { t } = useI18n()

// Local copies
const localLeadGuest = ref({ ...props.formData.leadGuest })
const localContact = ref({ ...props.formData.contact })
const localSpecialRequests = ref(props.formData.specialRequests || '')

// Watch for external changes
watch(() => props.formData, (newVal) => {
	localLeadGuest.value = { ...newVal.leadGuest }
	localContact.value = { ...newVal.contact }
	localSpecialRequests.value = newVal.specialRequests || ''
}, { deep: true })

// Watch for local changes and emit
watch(localLeadGuest, () => emitUpdate(), { deep: true })
watch(localContact, () => emitUpdate(), { deep: true })
watch(localSpecialRequests, () => emitUpdate())

// Computed
const isValidEmail = computed(() => {
	if (!localContact.value.email) return false
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(localContact.value.email)
})

const idValidationMessage = computed(() => {
	const nationality = localLeadGuest.value.nationality
	const tcNumber = localLeadGuest.value.tcNumber
	const passportNumber = localLeadGuest.value.passportNumber

	// TC number is optional - only validate format if provided
	if (nationality === 'TR' && tcNumber && tcNumber.length !== 11) {
		return t('booking.tcNumberInvalid')
	}
	if (nationality && nationality !== 'TR' && !passportNumber) {
		return t('booking.passportRequired')
	}
	return ''
})

// Methods
const emitUpdate = () => {
	emit('update:form-data', {
		...props.formData,
		leadGuest: { ...localLeadGuest.value },
		contact: { ...localContact.value },
		specialRequests: localSpecialRequests.value
	})
}
</script>
