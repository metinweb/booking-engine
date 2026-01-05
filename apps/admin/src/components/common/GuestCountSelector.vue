<template>
  <div class="space-y-4">
    <!-- Adults -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
          {{ $t('booking.adults') }}
        </p>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('booking.adultsDesc') }}
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          :disabled="adults <= minAdults"
          class="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center transition-colors"
          :class="
            adults <= minAdults
              ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          "
          @click="decrementAdults"
        >
          <span class="material-icons text-lg">remove</span>
        </button>
        <span class="w-8 text-center font-semibold text-gray-900 dark:text-white">
          {{ adults }}
        </span>
        <button
          :disabled="adults >= maxAdults"
          class="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center transition-colors"
          :class="
            adults >= maxAdults
              ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          "
          @click="incrementAdults"
        >
          <span class="material-icons text-lg">add</span>
        </button>
      </div>
    </div>

    <!-- Children -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
            {{ $t('booking.children') }}
          </p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ $t('booking.childrenDesc', { maxAge: maxChildAge }) }}
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            :disabled="children.length === 0"
            class="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center transition-colors"
            :class="
              children.length === 0
                ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            "
            @click="removeLastChild"
          >
            <span class="material-icons text-lg">remove</span>
          </button>
          <span class="w-8 text-center font-semibold text-gray-900 dark:text-white">
            {{ children.length }}
          </span>
          <button
            :disabled="children.length >= maxChildren"
            class="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center transition-colors"
            :class="
              children.length >= maxChildren
                ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            "
            @click="addChild"
          >
            <span class="material-icons text-lg">add</span>
          </button>
        </div>
      </div>

      <!-- Child Ages / Birth Dates -->
      <div v-if="children.length > 0" class="space-y-2">
        <div
          v-for="(child, index) in children"
          :key="index"
          class="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
        >
          <span class="text-sm text-gray-600 dark:text-slate-300">
            {{
              childInputMode === 'birthDate'
                ? $t('booking.childBirthDate', { index: index + 1 })
                : $t('booking.childAge', { index: index + 1 })
            }}
          </span>
          <div class="flex items-center space-x-2">
            <!-- Age Mode: Select dropdown -->
            <select
              v-if="childInputMode === 'age'"
              :value="child"
              class="form-input py-1 px-2 text-sm w-20"
              @change="updateChildAge(index, parseInt($event.target.value))"
            >
              <option v-for="a in maxChildAge + 1" :key="a - 1" :value="a - 1">
                {{ a - 1 }} {{ $t('booking.yearsOld') }}
              </option>
            </select>
            <!-- Birth Date Mode: BirthDatePicker -->
            <BirthDatePicker
              v-else
              :model-value="child"
              size="sm"
              :max-age="maxChildAge"
              :min-age="0"
              :show-quick-ages="true"
              :placeholder="$t('booking.selectBirthDate')"
              :header-label="$t('booking.childBirthDate', { index: index + 1 })"
              :day-label="$t('booking.day')"
              :month-label="$t('booking.month')"
              :year-label="$t('booking.year')"
              :quick-select-label="$t('booking.quickSelect')"
              :years-old-label="$t('booking.yearsOld')"
              :clear-label="$t('common.clear')"
              :cancel-label="$t('common.cancel')"
              :confirm-label="$t('common.confirm')"
              :locale="$i18n.locale"
              @update:model-value="updateChildBirthDate(index, $event)"
            />
            <button
              class="text-red-500 hover:text-red-600 transition-colors"
              @click="removeChild(index)"
            >
              <span class="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Total Guests Summary -->
    <div class="pt-3 border-t border-gray-200 dark:border-slate-700">
      <p class="text-sm text-gray-600 dark:text-slate-400">
        {{ $t('booking.totalGuests') }}:
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ adults }} {{ $t('booking.adults').toLowerCase() }}
          <span v-if="children.length > 0">
            + {{ children.length }} {{ $t('booking.children').toLowerCase() }}
          </span>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import BirthDatePicker from './BirthDatePicker.vue'

const props = defineProps({
  adults: {
    type: Number,
    default: 2
  },
  children: {
    type: Array,
    default: () => []
  },
  minAdults: {
    type: Number,
    default: 1
  },
  maxAdults: {
    type: Number,
    default: 10
  },
  maxChildren: {
    type: Number,
    default: 6
  },
  maxChildAge: {
    type: Number,
    default: 17
  },
  // 'age' = yaş seçimi (0-17), 'birthDate' = doğum tarihi girişi
  childInputMode: {
    type: String,
    default: 'age',
    validator: v => ['age', 'birthDate'].includes(v)
  }
})

const emit = defineEmits(['update:adults', 'update:children'])

// Adults
const incrementAdults = () => {
  if (props.adults < props.maxAdults) {
    emit('update:adults', props.adults + 1)
  }
}

const decrementAdults = () => {
  if (props.adults > props.minAdults) {
    emit('update:adults', props.adults - 1)
  }
}

// Children
const addChild = () => {
  if (props.children.length < props.maxChildren) {
    // Default value based on mode
    const defaultValue = props.childInputMode === 'birthDate' ? '' : 0
    const newChildren = [...props.children, defaultValue]
    emit('update:children', newChildren)
  }
}

const removeLastChild = () => {
  if (props.children.length > 0) {
    const newChildren = props.children.slice(0, -1)
    emit('update:children', newChildren)
  }
}

const removeChild = index => {
  const newChildren = [...props.children]
  newChildren.splice(index, 1)
  emit('update:children', newChildren)
}

const updateChildAge = (index, age) => {
  const newChildren = [...props.children]
  newChildren[index] = age
  emit('update:children', newChildren)
}

const updateChildBirthDate = (index, date) => {
  const newChildren = [...props.children]
  newChildren[index] = date
  emit('update:children', newChildren)
}
</script>
