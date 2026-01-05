<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex justify-end">
          <button class="btn-primary flex items-center" @click="openCreateModal">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {{ $t('partners.addPartner') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <DataTable :columns="columns" :data="partners" :loading="loading">
          <template #cell-status="{ value }">
            <span
              class="badge"
              :class="{
                'badge-success': value === 'active',
                'badge-danger': value === 'inactive',
                'badge-warning': value === 'pending'
              }"
            >
              {{
                value === 'active'
                  ? $t('common.active')
                  : value === 'inactive'
                    ? $t('common.inactive')
                    : $t('common.pending')
              }}
            </span>
          </template>

          <template #row-actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="row.status === 'pending'"
                class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                :title="$t('partners.approve')"
                @click="confirmApprove(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <button
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.edit')"
                @click="openEditModal(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
                @click="confirmDelete(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
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
      :title="isEditing ? $t('partners.editPartner') : $t('partners.addPartner')"
      size="lg"
      :close-on-overlay="false"
    >
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Basic Information -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            {{ $t('partners.basicInfo') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">{{ $t('partners.partnerName') }} *</label>
              <input v-model="form.companyName" type="text" class="form-input" required />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.code') }}</label>
              <input
                v-model="form.code"
                type="text"
                class="form-input uppercase"
                maxlength="20"
              />
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('partners.codeDescription') }}
              </p>
            </div>

            <div>
              <label class="form-label">{{ $t('partners.contactEmail') }} *</label>
              <input v-model="form.email" type="email" class="form-input" required />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.contactPhone') }}</label>
              <input v-model="form.phone" type="text" class="form-input" />
            </div>

            <div class="md:col-span-2">
              <label class="form-label">{{ $t('partners.tradeName') }}</label>
              <input v-model="form.tradeName" type="text" class="form-input" />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.taxOffice') }}</label>
              <input v-model="form.taxOffice" type="text" class="form-input" />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.taxNumber') }}</label>
              <input v-model="form.taxNumber" type="text" class="form-input" />
            </div>

            <div>
              <label class="form-label">{{ $t('common.status.label') }}</label>
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
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            {{ $t('partners.address') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="form-label">{{ $t('partners.street') }}</label>
              <input v-model="form.address.street" type="text" class="form-input" />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.city') }}</label>
              <input v-model="form.address.city" type="text" class="form-input" />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.country') }}</label>
              <input v-model="form.address.country" type="text" class="form-input" />
            </div>

            <div>
              <label class="form-label">{{ $t('partners.postalCode') }}</label>
              <input v-model="form.address.postalCode" type="text" class="form-input" />
            </div>
          </div>
        </div>

        <!-- Documents Section (only in edit mode) -->
        <DocumentUpload
          v-if="isEditing"
          :partner-id="selectedPartner._id"
          :documents="selectedPartner?.documents"
          :uploading="uploading"
          @upload="uploadDocument"
          @delete="confirmDeleteDocument"
        />
      </form>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="flex items-center">
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
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('partners.deletePartner')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-danger" :disabled="deleting" @click="handleDelete">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Approve Confirmation Modal -->
    <Modal v-model="showApproveModal" :title="$t('partners.approvePartner')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('partners.approveConfirm') }}
      </p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showApproveModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-success" :disabled="approving" @click="handleApprove">
          <span v-if="approving">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import DocumentUpload from '@/components/DocumentUpload.vue'
import partnerService from '@/services/partnerService'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'

const { t } = useI18n()

// Use async action composables
const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false })
const { isLoading: submitting, execute: executeSubmit } = useAsyncAction()
const { isLoading: deleting, execute: executeDelete } = useAsyncAction()
const { isLoading: approving, execute: executeApprove } = useAsyncAction()
const { isLoading: uploading, execute: executeUpload } = useAsyncAction()

const partners = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const isEditing = ref(false)
const selectedPartner = ref(null)

const form = ref({
  companyName: '',
  tradeName: '',
  code: '',
  email: '',
  phone: '',
  taxOffice: '',
  taxNumber: '',
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: ''
  },
  status: 'active'
})

const columns = [
  { key: 'companyName', label: t('partners.partnerName') },
  { key: 'code', label: t('partners.code') },
  { key: 'email', label: t('partners.contactEmail') },
  { key: 'phone', label: t('partners.contactPhone') },
  { key: 'status', label: t('common.status.label') }
]

const fetchPartners = async () => {
  await executeFetch(
    () => partnerService.getPartners(),
    {
      onSuccess: response => {
        partners.value = response.data.partners || []
      },
      errorMessage: 'partners.fetchError'
    }
  )
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    companyName: '',
    tradeName: '',
    code: '',
    email: '',
    phone: '',
    taxOffice: '',
    taxNumber: '',
    address: {
      street: '',
      city: '',
      country: '',
      postalCode: ''
    },
    status: 'active'
  }
  showModal.value = true
}

const openEditModal = partner => {
  isEditing.value = true
  selectedPartner.value = partner
  form.value = {
    companyName: partner.companyName,
    tradeName: partner.tradeName || '',
    code: partner.code || '',
    email: partner.email,
    phone: partner.phone || '',
    taxOffice: partner.taxOffice || '',
    taxNumber: partner.taxNumber || '',
    address: {
      street: partner.address?.street || '',
      city: partner.address?.city || '',
      country: partner.address?.country || '',
      postalCode: partner.address?.postalCode || ''
    },
    status: partner.status || 'active'
  }
  showModal.value = true
}

const handleSubmit = async () => {
  const actionFn = isEditing.value
    ? () => partnerService.updatePartner(selectedPartner.value._id, form.value)
    : () => partnerService.createPartner(form.value)

  await executeSubmit(actionFn, {
    successMessage: isEditing.value ? 'partners.updateSuccess' : 'partners.createSuccess',
    errorMessage: 'common.operationFailed',
    onSuccess: () => {
      showModal.value = false
      fetchPartners()
    }
  })
}

const confirmDelete = partner => {
  selectedPartner.value = partner
  showDeleteModal.value = true
}

const handleDelete = async () => {
  await executeDelete(
    () => partnerService.deletePartner(selectedPartner.value._id),
    {
      successMessage: 'partners.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: () => {
        showDeleteModal.value = false
        fetchPartners()
      }
    }
  )
}

const confirmApprove = partner => {
  selectedPartner.value = partner
  showApproveModal.value = true
}

const handleApprove = async () => {
  await executeApprove(
    () => partnerService.approvePartner(selectedPartner.value._id),
    {
      successMessage: 'partners.approveSuccess',
      errorMessage: 'common.operationFailed',
      onSuccess: () => {
        showApproveModal.value = false
        fetchPartners()
      }
    }
  )
}

const uploadDocument = async file => {
  if (!file || !selectedPartner.value) return

  const formData = new FormData()
  formData.append('document', file)
  formData.append('documentType', 'license')

  await executeUpload(
    () => partnerService.uploadDocument(selectedPartner.value._id, formData),
    {
      successMessage: 'common.uploadSuccess',
      errorMessage: 'common.uploadFailed',
      onSuccess: response => {
        selectedPartner.value = response.data.partner
      }
    }
  )
}

const confirmDeleteDocument = async documentId => {
  if (!confirm(t('common.confirm'))) return

  await executeDelete(
    () => partnerService.deleteDocument(selectedPartner.value._id, documentId),
    {
      successMessage: 'common.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: response => {
        selectedPartner.value = response.data
      }
    }
  )
}

onMounted(() => {
  fetchPartners()
})
</script>
