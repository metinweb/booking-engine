<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-6 border-b border-gray-200 dark:border-slate-700">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">{{ $t('agencies.title') }}</h2>
            <p class="text-gray-600 dark:text-slate-400 mt-1">{{ $t('agencies.description') }}</p>
          </div>
          <button @click="openCreateModal" class="btn-primary flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ $t('agencies.addAgency') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <DataTable
          :columns="columns"
          :data="agencies"
          :loading="loading"
        >
          <template #cell-status="{ value }">
            <span
              class="badge"
              :class="{
                'badge-success': value === 'active',
                'badge-danger': value === 'inactive',
                'badge-warning': value === 'pending'
              }"
            >
              {{ value === 'active' ? $t('common.active') : value === 'inactive' ? $t('common.inactive') : $t('common.pending') }}
            </span>
          </template>

          <template #actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="item.status === 'pending'"
                @click="confirmApprove(item)"
                class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                :title="$t('agencies.approve')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                @click="goToUsers(item)"
                class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                :title="$t('agencies.users')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <button
                @click="openEditModal(item)"
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.edit')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="confirmDelete(item)"
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      v-model="showModal"
      :title="isEditing ? $t('agencies.editAgency') : $t('agencies.addAgency')"
      size="lg"
      :close-on-overlay="false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.basicInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="form-label">{{ $t('agencies.agencyName') }} *</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                required
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.contactEmail') }} *</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
                required
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.contactPhone') }}</label>
              <input
                v-model="form.phone"
                type="text"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">{{ $t('common.status') }}</label>
              <select v-model="form.status" class="form-input">
                <option value="active">{{ $t('common.active') }}</option>
                <option value="inactive">{{ $t('common.inactive') }}</option>
                <option value="pending">{{ $t('common.pending') }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.address') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="form-label">{{ $t('agencies.street') }}</label>
              <input
                v-model="form.address.street"
                type="text"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.city') }}</label>
              <input
                v-model="form.address.city"
                type="text"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.country') }}</label>
              <input
                v-model="form.address.country"
                type="text"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.postalCode') }}</label>
              <input
                v-model="form.address.postalCode"
                type="text"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Markup Settings -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.markupSettings') }}</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('agencies.markupDescription') }}</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label">{{ $t('agencies.hotelMarkup') }} (%)</label>
              <input
                v-model.number="form.markup.hotel"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.tourMarkup') }} (%)</label>
              <input
                v-model.number="form.markup.tour"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">{{ $t('agencies.transferMarkup') }} (%)</label>
              <input
                v-model.number="form.markup.transfer"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="form-input"
              />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <button
          @click="showModal = false"
          type="button"
          class="btn-secondary"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="handleSubmit"
          type="submit"
          class="btn-primary"
          :disabled="submitting"
        >
          <span v-if="submitting" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('common.loading') }}
          </span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('agencies.deleteAgency')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('common.confirm') }}?
      </p>

      <template #footer>
        <button
          @click="showDeleteModal = false"
          type="button"
          class="btn-secondary"
        >
          {{ $t('common.no') }}
        </button>
        <button
          @click="handleDelete"
          type="button"
          class="btn-danger"
          :disabled="deleting"
        >
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Approve Confirmation Modal -->
    <Modal
      v-model="showApproveModal"
      :title="$t('agencies.approveAgency')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('agencies.approveConfirm') }}
      </p>

      <template #footer>
        <button
          @click="showApproveModal = false"
          type="button"
          class="btn-secondary"
        >
          {{ $t('common.no') }}
        </button>
        <button
          @click="handleApprove"
          type="button"
          class="btn-success"
          :disabled="approving"
        >
          <span v-if="approving">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import agencyService from '@/services/agencyService'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'

const { t } = useI18n()
const toast = useToast()
const router = useRouter()

const agencies = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const approving = ref(false)
const selectedAgency = ref(null)

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: ''
  },
  markup: {
    hotel: 0,
    tour: 0,
    transfer: 0
  },
  status: 'active'
})

const columns = [
  { key: 'name', label: t('agencies.agencyName') },
  { key: 'email', label: t('agencies.contactEmail') },
  { key: 'phone', label: t('agencies.contactPhone') },
  { key: 'status', label: t('common.status') }
]

const fetchAgencies = async () => {
  loading.value = true
  try {
    const response = await agencyService.getAgencies()
    if (response.success) {
      agencies.value = response.data.agencies || []
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch agencies')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      country: '',
      postalCode: ''
    },
    markup: {
      hotel: 0,
      tour: 0,
      transfer: 0
    },
    status: 'active'
  }
  showModal.value = true
}

const openEditModal = (agency) => {
  isEditing.value = true
  selectedAgency.value = agency
  form.value = {
    name: agency.name,
    email: agency.email,
    phone: agency.phone || '',
    address: {
      street: agency.address?.street || '',
      city: agency.address?.city || '',
      country: agency.address?.country || '',
      postalCode: agency.address?.postalCode || ''
    },
    markup: {
      hotel: agency.markup?.hotel || 0,
      tour: agency.markup?.tour || 0,
      transfer: agency.markup?.transfer || 0
    },
    status: agency.status || 'active'
  }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEditing.value) {
      const response = await agencyService.updateAgency(selectedAgency.value._id, form.value)
      if (response.success) {
        toast.success(t('agencies.updateSuccess'))
        await fetchAgencies()
        showModal.value = false
      }
    } else {
      const response = await agencyService.createAgency(form.value)
      if (response.success) {
        toast.success(t('agencies.createSuccess'))
        await fetchAgencies()
        showModal.value = false
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (agency) => {
  selectedAgency.value = agency
  showDeleteModal.value = true
}

const handleDelete = async () => {
  deleting.value = true
  try {
    const response = await agencyService.deleteAgency(selectedAgency.value._id)
    if (response.success) {
      toast.success(t('agencies.deleteSuccess'))
      await fetchAgencies()
      showDeleteModal.value = false
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

const confirmApprove = (agency) => {
  selectedAgency.value = agency
  showApproveModal.value = true
}

const handleApprove = async () => {
  approving.value = true
  try {
    const response = await agencyService.approveAgency(selectedAgency.value._id)
    if (response.success) {
      toast.success(t('agencies.approveSuccess'))
      await fetchAgencies()
      showApproveModal.value = false
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    approving.value = false
  }
}

const goToUsers = (agency) => {
  router.push(`/agencies/${agency._id}/users`)
}

// React to partner changes - reload agencies when partner is switched
usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      fetchAgencies()
    }
  },
  immediate: true
})
</script>
