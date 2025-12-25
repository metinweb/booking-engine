<template>
  <div class="space-y-6">
    <!-- Code & Name -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('planning.pricing.seasonCode') }} <span class="text-red-500">*</span></label>
        <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
      </div>
      <div>
        <label class="form-label">{{ $t('planning.pricing.seasonName') }} <span class="text-red-500">*</span></label>
        <input v-model="form.name[currentLang]" type="text" class="form-input" />
      </div>
    </div>

    <!-- Color & Priority -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('planning.pricing.color') }}</label>
        <div class="flex items-center gap-3">
          <input v-model="form.color" type="color" class="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
          <input v-model="form.color" type="text" class="form-input flex-1" placeholder="#6366f1" />
        </div>
      </div>
      <div>
        <label class="form-label">{{ $t('planning.pricing.priority') }}</label>
        <input v-model.number="form.priority" type="number" min="0" max="100" class="form-input" />
        <p class="text-xs text-gray-500 mt-1">{{ $t('planning.pricing.priorityHint') }}</p>
      </div>
    </div>

    <!-- Date Ranges -->
    <div>
      <label class="form-label">{{ $t('planning.pricing.dateRanges') }}</label>
      <div class="space-y-3">
        <div
          v-for="(range, index) in form.dateRanges"
          :key="index"
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
        >
          <div class="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500">{{ $t('common.startDate') }}</label>
              <input v-model="range.startDate" type="date" class="form-input mt-1" />
            </div>
            <div>
              <label class="text-xs text-gray-500">{{ $t('common.endDate') }}</label>
              <input v-model="range.endDate" type="date" class="form-input mt-1" />
            </div>
          </div>
          <button
            v-if="form.dateRanges.length > 1"
            @click="removeDateRange(index)"
            type="button"
            class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        <button
          @click="addDateRange"
          type="button"
          class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.pricing.addDateRange') }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">{{ $t('common.cancel') }}</button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true },
  season: { type: Object, default: null }
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
  color: '#6366f1',
  priority: 0,
  dateRanges: [{ startDate: '', endDate: '' }]
})

const addDateRange = () => {
  form.dateRanges.push({ startDate: '', endDate: '' })
}

const removeDateRange = (index) => {
  form.dateRanges.splice(index, 1)
}

const formatDateForInput = (date) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

const handleSave = async () => {
  if (!form.code || !form.name[currentLang.value]) {
    toast.error(t('validation.required'))
    return
  }

  saving.value = true
  try {
    if (props.season) {
      await planningService.updateSeason(props.hotel._id, props.season._id, form)
      toast.success(t('planning.pricing.seasonUpdated'))
    } else {
      await planningService.createSeason(props.hotel._id, form)
      toast.success(t('planning.pricing.seasonCreated'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.season) {
    form.code = props.season.code || ''
    form.name = { ...createMultiLangObject(), ...props.season.name }
    form.color = props.season.color || '#6366f1'
    form.priority = props.season.priority || 0
    form.dateRanges = props.season.dateRanges?.length
      ? props.season.dateRanges.map(r => ({
          startDate: formatDateForInput(r.startDate),
          endDate: formatDateForInput(r.endDate)
        }))
      : [{ startDate: '', endDate: '' }]
  }
})
</script>
