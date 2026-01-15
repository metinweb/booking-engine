<template>
  <div class="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('tourBooking.passenger.title') }} {{ index + 1 }}
        </span>
        <span
          v-if="modelValue.isLead"
          class="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded"
        >
          {{ $t('tourBooking.passenger.lead') }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!modelValue.isLead"
          @click="$emit('setLead')"
          class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
          :title="$t('tourBooking.passenger.lead')"
        >
          {{ $t('tourBooking.passenger.lead') }}
        </button>
        <button
          v-if="removable"
          @click="$emit('remove')"
          class="text-gray-400 hover:text-red-500"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </div>

    <!-- Form Fields -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Type -->
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.type') }}
        </label>
        <select
          :value="modelValue.type"
          @input="updateField('type', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="adult">{{ $t('tourBooking.passenger.adult') }}</option>
          <option value="child">{{ $t('tourBooking.passenger.child') }}</option>
          <option value="infant">{{ $t('tourBooking.passenger.infant') }}</option>
        </select>
      </div>

      <!-- First Name -->
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.firstName') }} *
        </label>
        <input
          type="text"
          :value="modelValue.firstName"
          @input="updateField('firstName', $event.target.value)"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <!-- Last Name -->
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.lastName') }} *
        </label>
        <input
          type="text"
          :value="modelValue.lastName"
          @input="updateField('lastName', $event.target.value)"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <!-- TC Number -->
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.tcNumber') }}
        </label>
        <input
          type="text"
          :value="modelValue.tcNumber"
          @input="updateField('tcNumber', $event.target.value)"
          maxlength="11"
          pattern="[0-9]*"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-mono"
        />
      </div>

      <!-- Passport Number -->
      <div v-if="showPassport">
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.passportNumber') }}
        </label>
        <input
          type="text"
          :value="modelValue.passportNumber"
          @input="updateField('passportNumber', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-mono"
        />
      </div>

      <!-- Passport Expiry -->
      <div v-if="showPassport">
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.passportExpiry') }}
        </label>
        <input
          type="date"
          :value="modelValue.passportExpiry"
          @input="updateField('passportExpiry', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <!-- Date of Birth -->
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.dateOfBirth') }}
        </label>
        <input
          type="date"
          :value="modelValue.dateOfBirth"
          @input="updateField('dateOfBirth', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <!-- Gender -->
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.gender') }}
        </label>
        <select
          :value="modelValue.gender"
          @input="updateField('gender', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="male">{{ $t('tourBooking.passenger.male') }}</option>
          <option value="female">{{ $t('tourBooking.passenger.female') }}</option>
        </select>
      </div>

      <!-- Nationality -->
      <div v-if="showNationality">
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('tourBooking.passenger.nationality') }}
        </label>
        <input
          type="text"
          :value="modelValue.nationality"
          @input="updateField('nationality', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  removable: {
    type: Boolean,
    default: true
  },
  showPassport: {
    type: Boolean,
    default: false
  },
  showNationality: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'remove', 'setLead'])

function updateField(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>
