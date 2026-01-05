<template>
  <div class="space-y-8">
    <!-- Status & Featured -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
    >
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-500">toggle_on</span>
        {{ $t('hotels.statusAndFeatured') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Status -->
        <div>
          <label class="form-label">{{ $t('common.status.label') }}</label>
          <select v-model="form.status" class="form-input">
            <option value="draft">{{ $t('hotels.statuses.draft') }}</option>
            <option value="active">{{ $t('hotels.statuses.active') }}</option>
            <option value="inactive">{{ $t('hotels.statuses.inactive') }}</option>
          </select>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('hotels.statusHelp') }}
          </p>
        </div>

        <!-- Featured -->
        <div class="flex items-center pt-6">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="form.featured"
              type="checkbox"
              class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
              <span class="font-medium">{{ $t('hotels.basic.featured') }}</span>
              <span class="block text-xs text-gray-500 dark:text-slate-400 mt-0.5">{{
                $t('hotels.featuredHelp')
              }}</span>
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Display Order -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
    >
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-gray-500">sort</span>
        {{ $t('hotels.displayOrder') }}
      </h3>

      <div class="w-48">
        <label class="form-label">{{ $t('hotels.displayOrder') }}</label>
        <input v-model.number="form.displayOrder" type="number" min="0" class="form-input" />
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('hotels.displayOrderHelp') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  }
})

const form = ref({
  status: 'draft',
  featured: false,
  displayOrder: 0
})

// Watch for hotel changes
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel) {
      form.value = {
        status: newHotel.status || 'draft',
        featured: newHotel.featured || false,
        displayOrder: newHotel.displayOrder || 0
      }
    }
  },
  { immediate: true, deep: true }
)

// Get form data
const getFormData = () => {
  return { ...form.value }
}

// Expose for parent
defineExpose({
  getFormData
})
</script>
