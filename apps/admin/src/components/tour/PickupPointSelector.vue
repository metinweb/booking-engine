<template>
  <div class="space-y-4">
    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
      {{ $t('tourBooking.pickupPoint.title') }}
    </h4>

    <!-- No Pickup Points -->
    <div v-if="!pickupPoints || pickupPoints.length === 0" class="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ $t('tourBooking.pickupPoint.noPoints') }}
      </p>
    </div>

    <!-- Pickup Points List -->
    <div v-else class="space-y-2">
      <label
        v-for="point in pickupPoints"
        :key="point.code"
        class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
        :class="isSelected(point)
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'"
      >
        <input
          type="radio"
          :name="name"
          :value="point.code"
          :checked="isSelected(point)"
          @change="selectPoint(point)"
          class="w-4 h-4 mt-1 text-purple-600 border-gray-300 focus:ring-purple-500"
        />

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ point.name }}
              </p>
              <p v-if="point.address" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {{ point.address }}
              </p>
            </div>

            <div class="text-right flex-shrink-0">
              <p v-if="point.time" class="text-sm font-medium text-gray-900 dark:text-white">
                <span class="material-icons text-sm align-middle mr-1">schedule</span>
                {{ point.time }}
              </p>
              <p v-if="point.additionalPrice > 0" class="text-sm text-purple-600 dark:text-purple-400 mt-1">
                +{{ formatCurrency(point.additionalPrice, currency) }}
              </p>
            </div>
          </div>

          <!-- Map Preview (if coordinates available) -->
          <div
            v-if="point.coordinates?.lat && point.coordinates?.lng && showMap"
            class="mt-3 h-32 rounded-lg bg-gray-200 dark:bg-slate-700 overflow-hidden"
          >
            <img
              :src="getStaticMapUrl(point.coordinates)"
              :alt="point.name"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </label>
    </div>

    <!-- Custom Pickup Option -->
    <div v-if="allowCustom" class="pt-4 border-t border-gray-200 dark:border-slate-700">
      <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
        :class="isCustomSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'"
      >
        <input
          type="radio"
          :name="name"
          value="custom"
          :checked="isCustomSelected"
          @change="selectCustom"
          class="w-4 h-4 mt-1 text-purple-600 border-gray-300 focus:ring-purple-500"
        />
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-white">
            {{ $t('tourBooking.pickupPoint.custom') }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('tourBooking.pickupPoint.customDescription') }}
          </p>

          <div v-if="isCustomSelected" class="mt-3 space-y-3">
            <input
              v-model="customAddress"
              type="text"
              :placeholder="$t('tourBooking.pickupPoint.addressPlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
            <textarea
              v-model="customNotes"
              :placeholder="$t('tourBooking.pickupPoint.notesPlaceholder')"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
            ></textarea>
          </div>
        </div>
      </label>
    </div>

    <!-- Selected Summary -->
    <div v-if="modelValue" class="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="material-icons text-purple-600 dark:text-purple-400">place</span>
        <div>
          <p class="text-sm font-medium text-purple-700 dark:text-purple-300">
            {{ $t('tourBooking.pickupPoint.selected') }}:
          </p>
          <p class="text-sm text-purple-600 dark:text-purple-400">
            {{ modelValue.name }}
            <span v-if="modelValue.time">({{ modelValue.time }})</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  pickupPoints: {
    type: Array,
    default: () => []
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  name: {
    type: String,
    default: 'pickup-point'
  },
  allowCustom: {
    type: Boolean,
    default: true
  },
  showMap: {
    type: Boolean,
    default: false
  },
  googleMapsKey: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const customAddress = ref('')
const customNotes = ref('')

const isCustomSelected = computed(() => {
  return props.modelValue?.code === 'custom'
})

function isSelected(point) {
  return props.modelValue?.code === point.code
}

function selectPoint(point) {
  emit('update:modelValue', {
    code: point.code,
    name: point.name,
    address: point.address,
    time: point.time,
    additionalPrice: point.additionalPrice || 0
  })
}

function selectCustom() {
  emit('update:modelValue', {
    code: 'custom',
    name: customAddress.value || 'Custom Pickup',
    address: customAddress.value,
    time: null,
    additionalPrice: 0,
    notes: customNotes.value
  })
}

// Update custom values
watch([customAddress, customNotes], () => {
  if (isCustomSelected.value) {
    selectCustom()
  }
})

// Initialize custom values from modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (val?.code === 'custom') {
      customAddress.value = val.address || ''
      customNotes.value = val.notes || ''
    }
  },
  { immediate: true }
)

function getStaticMapUrl(coordinates) {
  if (!props.googleMapsKey) {
    // Fallback to OpenStreetMap static image
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.lat},${coordinates.lng}&zoom=14&size=400x200&markers=${coordinates.lat},${coordinates.lng},red-pushpin`
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=14&size=400x200&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${props.googleMapsKey}`
}
</script>
