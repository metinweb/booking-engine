<template>
  <div class="space-y-8">
    <!-- Readonly Notice -->
    <div v-if="readonly" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
      <span class="material-icons text-blue-500 dark:text-blue-400 mt-0.5">info</span>
      <div>
        <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">{{ $t('hotels.linkedHotel.notice') }}</h4>
        <p class="text-sm text-blue-600 dark:text-blue-300 mt-1">{{ $t('hotels.linkedHotel.description') }}</p>
      </div>
    </div>

    <!-- Facility Contacts -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.contact.title') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">{{ $t('hotels.contact.facilityContacts') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Phone -->
        <FormField
          ref="phoneFieldRef"
          v-model="form.phone"
          name="contact.phone"
          :label="$t('hotels.contact.phone')"
          type="tel"
          icon="phone"
          placeholder="+90 XXX XXX XX XX"
          :disabled="readonly"
          :rules="readonly ? [] : [
            { phone: true, message: $t('validation.phone') }
          ]"
          @validation-change="({ field, error }) => handleFieldValidation(field || 'contact.phone', error)"
        />

        <!-- Call Center -->
        <FormField
          v-model="form.callCenter"
          name="contact.callCenter"
          :label="$t('hotels.contact.callCenter')"
          type="tel"
          icon="support_agent"
          placeholder="+90 XXX XXX XX XX"
          :disabled="readonly"
        />

        <!-- Email -->
        <FormField
          ref="emailFieldRef"
          v-model="form.email"
          name="contact.email"
          :label="$t('hotels.contact.email')"
          type="email"
          icon="email"
          placeholder="info@hotel.com"
          :disabled="readonly"
          :rules="readonly ? [] : [
            { email: true, message: $t('validation.email') }
          ]"
          @validation-change="({ field, error }) => handleFieldValidation(field || 'contact.email', error)"
        />

        <!-- Website -->
        <div>
          <label class="form-label">{{ $t('hotels.contact.website') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">language</span>
            </span>
            <input
              v-model="form.website"
              type="url"
              class="form-input pl-10"
              placeholder="https://www.hotel.com"
              :disabled="readonly"
            />
          </div>
        </div>

        <!-- Fax -->
        <div>
          <label class="form-label">{{ $t('hotels.contact.fax') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">fax</span>
            </span>
            <input
              v-model="form.fax"
              type="tel"
              class="form-input pl-10"
              placeholder="+90 XXX XXX XX XX"
              :disabled="readonly"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Authorized Person -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.contact.authorizedContacts') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">{{ $t('hotels.contact.authorizedPerson') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Authorized Person Name -->
        <div>
          <label class="form-label">{{ $t('hotels.contact.authorizedPerson') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">person</span>
            </span>
            <input
              v-model="form.authorizedPerson"
              type="text"
              class="form-input pl-10"
              :disabled="readonly"
            />
          </div>
        </div>

        <!-- Authorized Email -->
        <div>
          <label class="form-label">{{ $t('hotels.contact.authorizedEmail') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">mail</span>
            </span>
            <input
              v-model="form.authorizedEmail"
              type="email"
              class="form-input pl-10"
              :disabled="readonly"
            />
          </div>
        </div>

        <!-- Authorized Phone -->
        <div>
          <label class="form-label">{{ $t('hotels.contact.authorizedPhone') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">phone_android</span>
            </span>
            <input
              v-model="form.authorizedPhone"
              type="tel"
              class="form-input pl-10"
              placeholder="+90 XXX XXX XX XX"
              :disabled="readonly"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Social Media -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.contact.socialMedia') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">{{ $t('hotels.contact.socialMedia') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Facebook -->
        <div>
          <label class="form-label flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {{ $t('hotels.contact.facebook') }}
          </label>
          <input
            v-model="form.socialMedia.facebook"
            type="url"
            class="form-input"
            placeholder="https://facebook.com/hotel"
            :disabled="readonly"
          />
        </div>

        <!-- Instagram -->
        <div>
          <label class="form-label flex items-center gap-2">
            <svg class="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            {{ $t('hotels.contact.instagram') }}
          </label>
          <input
            v-model="form.socialMedia.instagram"
            type="url"
            class="form-input"
            placeholder="https://instagram.com/hotel"
            :disabled="readonly"
          />
        </div>

        <!-- Twitter/X -->
        <div>
          <label class="form-label flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-800 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {{ $t('hotels.contact.twitter') }}
          </label>
          <input
            v-model="form.socialMedia.twitter"
            type="url"
            class="form-input"
            placeholder="https://x.com/hotel"
            :disabled="readonly"
          />
        </div>

        <!-- YouTube -->
        <div>
          <label class="form-label flex items-center gap-2">
            <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            {{ $t('hotels.contact.youtube') }}
          </label>
          <input
            v-model="form.socialMedia.youtube"
            type="url"
            class="form-input"
            placeholder="https://youtube.com/@hotel"
            :disabled="readonly"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import FormField from '@/components/common/FormField.vue'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['validation-change'])

const { t } = useI18n()
const toast = useToast()

// FormField refs for validation
const phoneFieldRef = ref(null)
const emailFieldRef = ref(null)

// Track field errors
const fieldErrors = ref({})

const handleFieldValidation = (fieldName, error) => {
  if (error) {
    fieldErrors.value[fieldName] = error
  } else {
    delete fieldErrors.value[fieldName]
  }
  emit('validation-change', { ...fieldErrors.value })
}

const hasErrors = computed(() => Object.keys(fieldErrors.value).length > 0)

const form = ref({
  phone: '',
  email: '',
  website: '',
  callCenter: '',
  fax: '',
  authorizedPerson: '',
  authorizedEmail: '',
  authorizedPhone: '',
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  }
})

// Watch for hotel changes and update form
watch(() => props.hotel, (newHotel) => {
  if (newHotel?.contact) {
    form.value = {
      phone: newHotel.contact.phone || '',
      email: newHotel.contact.email || '',
      website: newHotel.contact.website || '',
      callCenter: newHotel.contact.callCenter || '',
      fax: newHotel.contact.fax || '',
      authorizedPerson: newHotel.contact.authorizedPerson || '',
      authorizedEmail: newHotel.contact.authorizedEmail || '',
      authorizedPhone: newHotel.contact.authorizedPhone || '',
      socialMedia: {
        facebook: newHotel.contact.socialMedia?.facebook || '',
        instagram: newHotel.contact.socialMedia?.instagram || '',
        twitter: newHotel.contact.socialMedia?.twitter || '',
        youtube: newHotel.contact.socialMedia?.youtube || ''
      }
    }

    // Clear any existing validation errors when data loads
    if (Object.keys(fieldErrors.value).length > 0) {
      fieldErrors.value = {}
      emit('validation-change', {})
    }
  }
}, { immediate: true, deep: true })

// Validate all fields by calling each FormField's validate method
const validateAll = () => {
  let isValid = true

  // Validate phone field
  if (phoneFieldRef.value) {
    const result = phoneFieldRef.value.validate()
    if (!result.valid) isValid = false
  }

  // Validate email field
  if (emailFieldRef.value) {
    const result = emailFieldRef.value.validate()
    if (!result.valid) isValid = false
  }

  return isValid
}

// Get current form data (called by parent)
const getFormData = () => {
  return { contact: form.value }
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData
})
</script>
