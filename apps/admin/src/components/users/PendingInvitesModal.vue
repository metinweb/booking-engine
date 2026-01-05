<template>
  <Modal v-model="isOpen" :title="$t('users.pendingInvites')" size="lg" :close-on-overlay="true">
    <!-- Empty State -->
    <div v-if="!props.invites?.length" class="flex flex-col items-center justify-center py-12">
      <div
        class="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4"
      >
        <span class="material-icons text-3xl text-gray-400">mail</span>
      </div>
      <p class="text-gray-500 dark:text-slate-400 font-medium">
        {{ $t('users.noPendingInvites') }}
      </p>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
        {{ $t('users.noPendingInvitesDesc') }}
      </p>
    </div>

    <!-- Invites List -->
    <div v-else class="space-y-3">
      <div
        v-for="invite in props.invites"
        :key="invite._id"
        class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
        :class="{
          'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10': isExpiringSoon(invite)
        }"
      >
        <div class="flex items-start gap-4">
          <!-- Avatar -->
          <div
            class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0"
          >
            {{ getInitials(invite.name) }}
          </div>

          <!-- Invite Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-gray-900 dark:text-white truncate">
                {{ invite.name }}
              </span>
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  invite.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                ]"
              >
                {{ invite.role === 'admin' ? $t('users.admin') : $t('users.user') }}
              </span>
            </div>

            <div class="text-sm text-gray-500 dark:text-slate-400 mb-2">
              {{ invite.email }}
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm">schedule</span>
                {{ $t('users.sentAt') }}: {{ formatDate(invite.createdAt) }}
              </span>
              <span
                v-if="invite.expiresAt"
                class="flex items-center gap-1"
                :class="{ 'text-yellow-600 dark:text-yellow-400': isExpiringSoon(invite) }"
              >
                <span class="material-icons text-sm">timer</span>
                {{ $t('users.expiresAt') }}: {{ formatDate(invite.expiresAt) }}
              </span>
            </div>

            <!-- Expiring Soon Warning -->
            <div
              v-if="isExpiringSoon(invite)"
              class="mt-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"
            >
              <span class="material-icons text-sm">warning</span>
              {{ $t('users.inviteExpiringSoon') }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              :disabled="resending === invite._id"
              :title="$t('users.resendInvite')"
              @click="handleResend(invite)"
            >
              <span
                v-if="resending === invite._id"
                class="animate-spin material-icons text-lg"
                >refresh</span
              >
              <span v-else class="material-icons text-lg">send</span>
            </button>
            <button
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              :disabled="cancelling === invite._id"
              :title="$t('users.cancelInvite')"
              @click="handleCancel(invite)"
            >
              <span
                v-if="cancelling === invite._id"
                class="animate-spin material-icons text-lg"
                >refresh</span
              >
              <span v-else class="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div
      v-if="props.invites?.length"
      class="mt-4 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
    >
      <span class="material-icons text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">info</span>
      <div>
        <p class="text-sm text-blue-800 dark:text-blue-200">
          {{ $t('users.inviteInfoNote') }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('users.totalInvites', { count: props.invites?.length || 0 }) }}
        </p>
        <button
          type="button"
          class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
          @click="handleClose"
        >
          {{ $t('common.close') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'

const props = defineProps({
  invites: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'resend', 'cancel'])

const { t } = useI18n()

const isOpen = computed({
  get: () => true,
  set: val => {
    if (!val) emit('close')
  }
})

const resending = ref(null)
const cancelling = ref(null)

// Get initials
const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Format date
const formatDate = dateString => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// Check if invite is expiring soon (within 24 hours)
const isExpiringSoon = invite => {
  if (!invite.expiresAt) return false
  const expiresAt = new Date(invite.expiresAt)
  const now = new Date()
  const diff = expiresAt - now
  return diff > 0 && diff < 24 * 60 * 60 * 1000
}

// Handle resend
const handleResend = async invite => {
  resending.value = invite._id
  try {
    emit('resend', invite)
  } finally {
    setTimeout(() => {
      resending.value = null
    }, 1000)
  }
}

// Handle cancel
const handleCancel = async invite => {
  if (!confirm(t('users.cancelInviteConfirm'))) return

  cancelling.value = invite._id
  try {
    emit('cancel', invite)
  } finally {
    setTimeout(() => {
      cancelling.value = null
    }, 1000)
  }
}

const handleClose = () => {
  emit('close')
}
</script>
