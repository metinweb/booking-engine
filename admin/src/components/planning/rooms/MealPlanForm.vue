<template>
  <div class="space-y-6">
    <!-- Code & Name -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('planning.mealPlans.code') }} <span class="text-red-500">*</span></label>
        <input
          v-model="form.code"
          type="text"
          class="form-input uppercase"
          :placeholder="$t('planning.mealPlans.codePlaceholder')"
          maxlength="10"
        />
      </div>
      <div>
        <label class="form-label">{{ $t('planning.mealPlans.name') }} ({{ currentLang.toUpperCase() }}) <span class="text-red-500">*</span></label>
        <input
          v-model="form.name[currentLang]"
          type="text"
          class="form-input"
          :placeholder="$t('planning.mealPlans.namePlaceholder')"
        />
      </div>
    </div>

    <!-- Included Meals -->
    <div>
      <label class="form-label">{{ $t('planning.mealPlans.includedMeals') }}</label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.breakfast" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.breakfast') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.lunch" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.lunch') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.dinner" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.dinner') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.snacks" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.snacks') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.drinks" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.drinks') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.alcoholicDrinks" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.alcoholicDrinks') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.minibar" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.minibar') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.includedMeals.roomService" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.mealPlans.meals.roomService') }}</span>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        <span v-if="saving">{{ $t('common.loading') }}</span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const currentLang = computed(() => locale.value)
const saving = ref(false)

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  description: createMultiLangObject(),
  includedMeals: {
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
    drinks: false,
    alcoholicDrinks: false,
    minibar: false,
    roomService: false
  }
})

const handleSave = async () => {
  if (!form.code || !form.name[currentLang.value]) {
    toast.error(t('validation.required'))
    return
  }

  saving.value = true
  try {
    await planningService.createMealPlan(props.hotel._id, form)
    toast.success(t('planning.mealPlans.created'))
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}
</script>
