<template>
  <div class="space-y-6">
    <!-- Call Center & WhatsApp -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-blue-600 mr-2">call</span>
          {{ $t('siteSettings.contact.callCenter') }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.contact.phone') }}</label>
            <input
              v-model="form.callCenter.phone"
              type="text"
              class="form-input"
              placeholder="+90 212 xxx xx xx"
            />
          </div>

          <div>
            <label class="form-label">{{ $t('siteSettings.contact.workingHours') }} (TR)</label>
            <input
              v-model="form.callCenter.workingHours.tr"
              type="text"
              class="form-input"
              placeholder="Pazartesi - Cuma: 09:00 - 18:00"
            />
          </div>

          <div>
            <label class="form-label">{{ $t('siteSettings.contact.workingHours') }} (EN)</label>
            <input
              v-model="form.callCenter.workingHours.en"
              type="text"
              class="form-input"
              placeholder="Monday - Friday: 09:00 - 18:00"
            />
          </div>
        </div>
      </div>

      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-green-600 mr-2">chat</span>
          {{ $t('siteSettings.contact.whatsapp') }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.contact.whatsappNumber') }}</label>
            <input
              v-model="form.whatsapp.number"
              type="text"
              class="form-input"
              placeholder="+905xxxxxxxxx"
            />
          </div>

          <div class="flex items-center">
            <input
              id="whatsappActive"
              v-model="form.whatsapp.isActive"
              type="checkbox"
              class="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label for="whatsappActive" class="ml-2 text-sm text-gray-700 dark:text-slate-300">
              {{ $t('siteSettings.contact.showWhatsapp') }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Addresses -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <span class="material-icons text-purple-600 mr-2">email</span>
        {{ $t('siteSettings.contact.emailAddresses') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.contact.infoEmail') }}</label>
          <input
            v-model="form.email.info"
            type="email"
            class="form-input"
            placeholder="info@example.com"
          />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.supportEmail') }}</label>
          <input
            v-model="form.email.support"
            type="email"
            class="form-input"
            placeholder="support@example.com"
          />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.reservationEmail') }}</label>
          <input
            v-model="form.email.reservation"
            type="email"
            class="form-input"
            placeholder="reservation@example.com"
          />
        </div>
      </div>
    </div>

    <!-- Company Address -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <span class="material-icons text-red-600 mr-2">location_on</span>
        {{ $t('siteSettings.contact.companyAddress') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="form-label">{{ $t('siteSettings.contact.street') }}</label>
          <input v-model="form.address.street" type="text" class="form-input" />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.city') }}</label>
          <input v-model="form.address.city" type="text" class="form-input" />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.country') }}</label>
          <input v-model="form.address.country" type="text" class="form-input" />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.postalCode') }}</label>
          <input v-model="form.address.postalCode" type="text" class="form-input" />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.fullAddressTr') }}</label>
          <textarea v-model="form.address.fullAddress.tr" class="form-input" rows="2"></textarea>
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.contact.fullAddressEn') }}</label>
          <textarea v-model="form.address.fullAddress.en" class="form-input" rows="2"></textarea>
        </div>
      </div>
    </div>

    <!-- Social Media -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <span class="material-icons text-indigo-600 mr-2">share</span>
        {{ $t('siteSettings.contact.socialMedia') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="form-label flex items-center">
            <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            Facebook
          </label>
          <input
            v-model="form.socialMedia.facebook"
            type="text"
            class="form-input"
            placeholder="https://facebook.com/..."
          />
        </div>

        <div>
          <label class="form-label flex items-center">
            <svg class="w-4 h-4 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
              />
            </svg>
            Instagram
          </label>
          <input
            v-model="form.socialMedia.instagram"
            type="text"
            class="form-input"
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <label class="form-label flex items-center">
            <svg class="w-4 h-4 mr-2 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
              />
            </svg>
            LinkedIn
          </label>
          <input
            v-model="form.socialMedia.linkedin"
            type="text"
            class="form-input"
            placeholder="https://linkedin.com/company/..."
          />
        </div>

        <div>
          <label class="form-label flex items-center">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
            X (Twitter)
          </label>
          <input
            v-model="form.socialMedia.twitter"
            type="text"
            class="form-input"
            placeholder="https://x.com/..."
          />
        </div>

        <div>
          <label class="form-label flex items-center">
            <svg class="w-4 h-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
              />
            </svg>
            YouTube
          </label>
          <input
            v-model="form.socialMedia.youtube"
            type="text"
            class="form-input"
            placeholder="https://youtube.com/..."
          />
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button class="btn-primary" :disabled="saving" @click="handleSave">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  settings: Object,
  saving: Boolean
})

const emit = defineEmits(['save'])

const form = ref({
  callCenter: {
    phone: '',
    workingHours: { tr: '', en: '' }
  },
  whatsapp: {
    number: '',
    isActive: false
  },
  email: {
    info: '',
    support: '',
    reservation: ''
  },
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: '',
    fullAddress: { tr: '', en: '' }
  },
  socialMedia: {
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    youtube: ''
  }
})

watch(
  () => props.settings,
  newSettings => {
    if (newSettings) {
      form.value = {
        callCenter: {
          phone: newSettings.callCenter?.phone || '',
          workingHours: {
            tr: newSettings.callCenter?.workingHours?.tr || '',
            en: newSettings.callCenter?.workingHours?.en || ''
          }
        },
        whatsapp: {
          number: newSettings.whatsapp?.number || '',
          isActive: newSettings.whatsapp?.isActive || false
        },
        email: {
          info: newSettings.email?.info || '',
          support: newSettings.email?.support || '',
          reservation: newSettings.email?.reservation || ''
        },
        address: {
          street: newSettings.address?.street || '',
          city: newSettings.address?.city || '',
          country: newSettings.address?.country || '',
          postalCode: newSettings.address?.postalCode || '',
          fullAddress: {
            tr: newSettings.address?.fullAddress?.tr || '',
            en: newSettings.address?.fullAddress?.en || ''
          }
        },
        socialMedia: {
          facebook: newSettings.socialMedia?.facebook || '',
          instagram: newSettings.socialMedia?.instagram || '',
          linkedin: newSettings.socialMedia?.linkedin || '',
          twitter: newSettings.socialMedia?.twitter || '',
          youtube: newSettings.socialMedia?.youtube || ''
        }
      }
    }
  },
  { immediate: true }
)

const handleSave = () => {
  emit('save', form.value)
}
</script>
