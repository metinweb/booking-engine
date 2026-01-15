<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
        {{ $t('tour.sections.itinerary') }}
      </h4>
      <button
        type="button"
        @click="addDay"
        class="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
      >
        <span class="material-icons text-sm">add</span>
        {{ $t('tour.itinerary.addDay') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!days || days.length === 0" class="text-center py-8 bg-gray-50 dark:bg-slate-900 rounded-lg">
      <span class="material-icons text-4xl text-gray-400 mb-2">event_note</span>
      <p class="text-gray-500 dark:text-gray-400">{{ $t('tour.itinerary.empty') }}</p>
      <button
        type="button"
        @click="addDay"
        class="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        {{ $t('tour.itinerary.addFirstDay') }}
      </button>
    </div>

    <!-- Days List (Draggable) -->
    <div v-else class="space-y-4">
      <div
        v-for="(day, index) in days"
        :key="index"
        class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
        :class="{ 'ring-2 ring-purple-500': dragIndex === index }"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <!-- Day Header -->
        <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
          <!-- Drag Handle -->
          <div class="cursor-move text-gray-400 hover:text-gray-600" @mousedown.stop>
            <span class="material-icons">drag_indicator</span>
          </div>

          <!-- Day Number -->
          <div class="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-bold">
            {{ day.day || index + 1 }}
          </div>

          <!-- Day Title -->
          <div class="flex-1">
            <input
              v-model="day.title[currentLocale]"
              :placeholder="$t('tour.itinerary.dayTitle')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
            />
          </div>

          <!-- Collapse/Expand -->
          <button
            type="button"
            @click="toggleDay(index)"
            class="text-gray-400 hover:text-gray-600"
          >
            <span class="material-icons">
              {{ expandedDays.has(index) ? 'expand_less' : 'expand_more' }}
            </span>
          </button>

          <!-- Delete -->
          <button
            type="button"
            @click="removeDay(index)"
            class="text-gray-400 hover:text-red-500"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>

        <!-- Day Content (Collapsible) -->
        <div v-show="expandedDays.has(index)" class="p-4 space-y-4">
          <!-- Description -->
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('tour.itinerary.description') }}
            </label>
            <div class="flex gap-2 mb-2">
              <button
                v-for="lang in languages"
                :key="lang.code"
                type="button"
                @click="currentLocale = lang.code"
                class="px-2 py-1 text-xs rounded"
                :class="currentLocale === lang.code
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'"
              >
                {{ lang.label }}
              </button>
            </div>
            <textarea
              v-model="day.description[currentLocale]"
              :placeholder="$t('tour.itinerary.descriptionPlaceholder')"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
            ></textarea>
          </div>

          <!-- Meals -->
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ $t('tour.itinerary.meals') }}
            </label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="meal in mealOptions"
                :key="meal.value"
                class="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer"
                :class="day.meals?.includes(meal.value)
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-slate-600'"
              >
                <input
                  type="checkbox"
                  :value="meal.value"
                  v-model="day.meals"
                  class="hidden"
                />
                <span class="material-icons text-sm" :class="day.meals?.includes(meal.value) ? 'text-purple-600' : 'text-gray-400'">
                  {{ meal.icon }}
                </span>
                <span class="text-sm" :class="day.meals?.includes(meal.value) ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'">
                  {{ meal.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- Activities -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">
                {{ $t('tour.itinerary.activities') }}
              </label>
              <button
                type="button"
                @click="addActivity(index)"
                class="text-xs text-purple-600 hover:text-purple-700"
              >
                + {{ $t('common.add') }}
              </button>
            </div>
            <div v-if="day.activities?.length > 0" class="space-y-2">
              <div
                v-for="(activity, aIndex) in day.activities"
                :key="aIndex"
                class="flex items-center gap-2"
              >
                <span class="material-icons text-sm text-gray-400">schedule</span>
                <input
                  type="time"
                  v-model="activity.time"
                  class="w-24 px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                />
                <input
                  v-model="activity.name[currentLocale]"
                  :placeholder="$t('tour.itinerary.activityName')"
                  class="flex-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  @click="removeActivity(index, aIndex)"
                  class="text-gray-400 hover:text-red-500"
                >
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">
              {{ $t('tour.itinerary.noActivities') }}
            </p>
          </div>

          <!-- Accommodation -->
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('tour.itinerary.accommodation') }}
            </label>
            <input
              v-model="day.accommodation[currentLocale]"
              :placeholder="$t('tour.itinerary.accommodationPlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Multiple Days -->
    <div v-if="days.length > 0" class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t('tour.itinerary.quickAdd') }}:</span>
      <input
        type="number"
        v-model.number="quickAddCount"
        min="1"
        max="30"
        class="w-16 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm text-center"
      />
      <button
        type="button"
        @click="quickAddDays"
        class="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
      >
        {{ $t('tour.itinerary.addDays') }}
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
  }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const currentLocale = ref(locale.value)
const expandedDays = ref(new Set([0])) // First day expanded by default
const quickAddCount = ref(1)
const dragIndex = ref(null)
const dragOverIndex = ref(null)

const languages = [
  { code: 'tr', label: 'TR' },
  { code: 'en', label: 'EN' }
]

const mealOptions = computed(() => [
  { value: 'breakfast', label: t('tour.itinerary.breakfast'), icon: 'free_breakfast' },
  { value: 'lunch', label: t('tour.itinerary.lunch'), icon: 'lunch_dining' },
  { value: 'dinner', label: t('tour.itinerary.dinner'), icon: 'dinner_dining' }
])

const days = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

function createEmptyDay(dayNumber) {
  return {
    day: dayNumber,
    title: { tr: '', en: '' },
    description: { tr: '', en: '' },
    meals: [],
    activities: [],
    accommodation: { tr: '', en: '' }
  }
}

function addDay() {
  const newDays = [...days.value]
  const newDay = createEmptyDay(newDays.length + 1)
  newDays.push(newDay)
  days.value = newDays
  expandedDays.value.add(newDays.length - 1)
}

function removeDay(index) {
  const newDays = [...days.value]
  newDays.splice(index, 1)
  // Re-number days
  newDays.forEach((d, i) => {
    d.day = i + 1
  })
  days.value = newDays
  expandedDays.value.delete(index)
}

function toggleDay(index) {
  if (expandedDays.value.has(index)) {
    expandedDays.value.delete(index)
  } else {
    expandedDays.value.add(index)
  }
  expandedDays.value = new Set(expandedDays.value) // Trigger reactivity
}

function addActivity(dayIndex) {
  const newDays = [...days.value]
  if (!newDays[dayIndex].activities) {
    newDays[dayIndex].activities = []
  }
  newDays[dayIndex].activities.push({
    time: '09:00',
    name: { tr: '', en: '' },
    duration: ''
  })
  days.value = newDays
}

function removeActivity(dayIndex, activityIndex) {
  const newDays = [...days.value]
  newDays[dayIndex].activities.splice(activityIndex, 1)
  days.value = newDays
}

function quickAddDays() {
  const newDays = [...days.value]
  const startNum = newDays.length + 1
  for (let i = 0; i < quickAddCount.value; i++) {
    newDays.push(createEmptyDay(startNum + i))
  }
  days.value = newDays
}

// Drag & Drop
function onDragStart(event, index) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event, index) {
  dragOverIndex.value = index
}

function onDrop(event, index) {
  if (dragIndex.value === null || dragIndex.value === index) return

  const newDays = [...days.value]
  const [movedDay] = newDays.splice(dragIndex.value, 1)
  newDays.splice(index, 0, movedDay)

  // Re-number days
  newDays.forEach((d, i) => {
    d.day = i + 1
  })

  days.value = newDays
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>
