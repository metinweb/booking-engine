<template>
  <Modal v-model="isOpen" :title="$t('users.sessions.title')" size="xl" :close-on-overlay="true">
    <!-- User Info Header -->
    <div class="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
      <div
        class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg"
      >
        {{ avatarInitials }}
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ props.user?.name }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ props.user?.email }}</p>
      </div>
      <button
        v-if="sessions.length > 0"
        class="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
        :disabled="terminatingAll"
        @click="handleTerminateAll"
      >
        <span v-if="terminatingAll" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">logout</span>
        {{ $t('users.sessions.terminateAll') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <span class="material-icons text-4xl text-purple-600 animate-spin mb-2">refresh</span>
      <span class="text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="sessions.length === 0" class="flex flex-col items-center justify-center py-12">
      <div
        class="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4"
      >
        <span class="material-icons text-3xl text-gray-400">devices</span>
      </div>
      <p class="text-gray-500 dark:text-slate-400 font-medium">
        {{ $t('users.sessions.noSessions') }}
      </p>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
        {{ $t('users.sessions.noSessionsDesc') }}
      </p>
    </div>

    <!-- Sessions List -->
    <div v-else class="space-y-3">
      <div
        v-for="session in sessions"
        :key="session._id"
        class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
        :class="{
          'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800': session.isCurrent
        }"
      >
        <div class="flex items-start gap-4">
          <!-- Device Icon -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              session.isCurrent
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-slate-700'
            "
          >
            <span
              class="material-icons text-2xl"
              :class="
                session.isCurrent
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400'
              "
            >
              {{ getDeviceIcon(session.deviceType) }}
            </span>
          </div>

          <!-- Session Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ session.browser || $t('users.sessions.unknownBrowser') }}
              </span>
              <span
                v-if="session.isCurrent"
                class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full"
              >
                {{ $t('users.sessions.currentSession') }}
              </span>
              <span
                v-if="session.status === 'active'"
                class="w-2 h-2 bg-green-500 rounded-full"
                :title="$t('users.sessions.active')"
              ></span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-500 dark:text-slate-400">
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-sm">computer</span>
                {{ session.os || $t('users.sessions.unknownOS') }}
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-sm">language</span>
                {{ session.ipAddress || '-' }}
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-sm">location_on</span>
                {{ session.location || $t('users.sessions.unknownLocation') }}
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-sm">schedule</span>
                {{ formatRelativeTime(session.lastActivity) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex-shrink-0">
            <button
              v-if="!session.isCurrent"
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              :disabled="terminating === session._id"
              :title="$t('users.sessions.terminate')"
              @click="handleTerminate(session)"
            >
              <span
                v-if="terminating === session._id"
                class="animate-spin material-icons text-lg"
                >refresh</span
              >
              <span v-else class="material-icons text-lg">logout</span>
            </button>
            <span
              v-else
              class="p-2 text-gray-300 dark:text-slate-600"
              :title="$t('users.sessions.cannotTerminateCurrent')"
            >
              <span class="material-icons text-lg">lock</span>
            </span>
          </div>
        </div>

        <!-- Session Details -->
        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-4">
          <span>{{ $t('users.sessions.createdAt') }}: {{ formatDate(session.createdAt) }}</span>
          <span v-if="session.expiresAt">
            {{ $t('users.sessions.expiresAt') }}: {{ formatDate(session.expiresAt) }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('users.sessions.totalSessions', { count: sessions.length }) }}
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import { getUserSessions, terminateSession, terminateAllSessions } from '@/services/userService'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const toast = useToast()

const isOpen = computed({
  get: () => true,
  set: val => {
    if (!val) emit('close')
  }
})

const loading = ref(false)
const sessions = ref([])
const terminating = ref(null)
const terminatingAll = ref(false)

// Avatar initials
const avatarInitials = computed(() => {
  const name = props.user?.name || ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || '?'
})

// Get device icon
const getDeviceIcon = deviceType => {
  const icons = {
    desktop: 'computer',
    mobile: 'smartphone',
    tablet: 'tablet',
    unknown: 'devices'
  }
  return icons[deviceType] || 'devices'
}

// Format relative time
const formatRelativeTime = dateString => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return t('notifications.minutesAgo', { n: minutes })
  if (hours < 24) return t('notifications.hoursAgo', { n: hours })
  return t('notifications.daysAgo', { n: days })
}

// Format date
const formatDate = dateString => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// Fetch sessions
const fetchSessions = async () => {
  loading.value = true
  try {
    const response = await getUserSessions(props.user._id)
    sessions.value = response.data || []
  } catch (error) {
    toast.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// Terminate single session
const handleTerminate = async session => {
  terminating.value = session._id
  try {
    await terminateSession(props.user._id, session._id)
    toast.success(t('users.sessions.terminated'))
    await fetchSessions()
  } catch (error) {
    toast.error(error.message || t('common.error'))
  } finally {
    terminating.value = null
  }
}

// Terminate all sessions
const handleTerminateAll = async () => {
  if (!confirm(t('users.sessions.terminateAllConfirm'))) return

  terminatingAll.value = true
  try {
    await terminateAllSessions(props.user._id)
    toast.success(t('users.sessions.allTerminated'))
    await fetchSessions()
  } catch (error) {
    toast.error(error.message || t('common.error'))
  } finally {
    terminatingAll.value = false
  }
}

const handleClose = () => {
  emit('close')
}

// Load sessions on mount
onMounted(() => {
  fetchSessions()
})
</script>
