<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-2xl text-emerald-600 dark:text-emerald-400">payments</span>
      </div>
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Oda Ucretleri</h2>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          Bugunun oda ucretleri misafir hesaplarina yansitiliyor
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse">
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
        </div>
        <div class="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ summary.totalRooms }}</p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Dolu Oda</p>
        </div>
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(summary.roomCharges) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Oda Ucreti</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ formatCurrency(summary.extras) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Ekstralar</p>
        </div>
        <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {{ formatCurrency(summary.total) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Toplam</p>
        </div>
      </div>

      <!-- Pending Extras Warning -->
      <div
        v-if="pendingExtras.length > 0"
        class="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-amber-600 dark:text-amber-400">warning</span>
          <div class="flex-1">
            <h4 class="font-medium text-amber-800 dark:text-amber-300">
              {{ pendingExtras.length }} oda icin ekstra onay gerekiyor
            </h4>
            <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Minibar, hasar veya diger ekstra ucretler icin onay bekleniyor
            </p>
            <button
              class="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
              @click="showExtrasModal = true"
            >
              Ekstralari Incele
            </button>
          </div>
        </div>
      </div>

      <!-- Charges Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Oda
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Misafir
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Oda Ucreti
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Ekstralar
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Toplam
                </th>
                <th
                  class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Durum
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
              <tr
                v-for="charge in charges"
                :key="charge.stayId"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                :class="{ 'bg-amber-50/50 dark:bg-amber-900/10': charge.hasPendingExtras }"
              >
                <td class="px-4 py-3">
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    charge.roomNumber
                  }}</span>
                </td>
                <td class="px-4 py-3">
                  <p class="text-gray-900 dark:text-white">{{ charge.guestName }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400">{{ charge.roomType }}</p>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="text-gray-900 dark:text-white">{{
                    formatCurrency(charge.roomRate)
                  }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span v-if="charge.extras > 0" class="text-blue-600 dark:text-blue-400">
                    {{ formatCurrency(charge.extras) }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(charge.total) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="charge.posted"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs"
                  >
                    <span class="material-icons text-sm">check</span>
                    Yansitildi
                  </span>
                  <span
                    v-else-if="charge.hasPendingExtras"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs"
                  >
                    <span class="material-icons text-sm">pending</span>
                    Onay Bekliyor
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 rounded-full text-xs"
                  >
                    <span class="material-icons text-sm">schedule</span>
                    Bekliyor
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="charges.length === 0" class="p-8 text-center text-gray-500 dark:text-slate-400">
          Bugun icin yansitilacak oda ucreti yok
        </div>
      </div>

      <!-- Post All Button -->
      <div v-if="charges.length > 0 && !allPosted" class="mt-4 flex justify-center">
        <button
          :disabled="posting || pendingExtras.length > 0"
          class="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl transition-colors"
          @click="postAllCharges"
        >
          <span v-if="posting" class="material-icons animate-spin">refresh</span>
          <span v-else class="material-icons">bolt</span>
          {{ posting ? 'Yansitiliyor...' : `Tum Ucretleri Yansit (${unpaidCount} oda)` }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          <template v-if="charges.length > 0">
            {{ postedCount }} / {{ charges.length }} oda ucreti yansitildi
          </template>
          <template v-else> Islem yapilacak ucret yok </template>
        </p>

        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="emit('back')"
          >
            <span class="material-icons">arrow_back</span>
            Geri
          </button>

          <button
            :disabled="loading || completing || (charges.length > 0 && !allPosted)"
            class="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
            @click="handleContinue"
          >
            <span v-if="completing" class="material-icons animate-spin">refresh</span>
            {{ completing ? 'Kaydediliyor...' : 'Devam Et' }}
            <span v-if="!completing" class="material-icons">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Extras Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showExtrasModal"
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          @click.self="showExtrasModal = false"
        >
          <div
            class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
          >
            <div
              class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700"
            >
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Onay Bekleyen Ekstralar
              </h3>
              <button
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                @click="showExtrasModal = false"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="p-4 overflow-y-auto max-h-[60vh] space-y-3">
              <div
                v-for="extra in pendingExtras"
                :key="extra.stayId"
                class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900 dark:text-white">
                    Oda {{ extra.roomNumber }} - {{ extra.guestName }}
                  </span>
                  <span class="font-medium text-amber-600 dark:text-amber-400">
                    {{ formatCurrency(extra.amount) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
                  {{ extra.description }}
                </p>
                <div class="flex items-center gap-2">
                  <button
                    class="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    @click="approveExtra(extra)"
                  >
                    Onayla
                  </button>
                  <button
                    class="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                    @click="rejectExtra(extra)"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import * as nightAuditService from '@/services/pms/nightAuditService'

const props = defineProps({
  audit: {
    type: Object,
    required: true
  },
  hotelId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['complete', 'back', 'refresh'])

const toast = useToast()

// State
const loading = ref(true)
const posting = ref(false)
const completing = ref(false)
const showExtrasModal = ref(false)
const charges = ref([])
const summary = ref({
  totalRooms: 0,
  roomCharges: 0,
  extras: 0,
  total: 0
})

// Computed
const postedCount = computed(() => {
  return charges.value.filter(c => c.posted).length
})

const unpaidCount = computed(() => {
  return charges.value.filter(c => !c.posted && !c.hasPendingExtras).length
})

const allPosted = computed(() => {
  return charges.value.length > 0 && charges.value.every(c => c.posted)
})

const pendingExtras = computed(() => {
  return charges.value
    .filter(c => c.hasPendingExtras)
    .map(c => ({
      stayId: c.stayId,
      roomNumber: c.roomNumber,
      guestName: c.guestName,
      description: c.pendingExtraDescription || 'Ekstra ucret',
      amount: c.pendingExtraAmount || 0
    }))
})

// Methods
const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const fetchCharges = async () => {
  if (!props.hotelId) return

  try {
    loading.value = true
    const response = await nightAuditService.getRoomCharges(props.hotelId)
    const data = response.data

    // Map backend data to frontend format
    // Backend returns "roomCharges" array with "stay" field
    const roomCharges = data.roomCharges || []
    charges.value = roomCharges.map(charge => ({
      stayId: charge.stay, // Backend uses "stay", frontend uses "stayId"
      roomNumber: charge.roomNumber,
      roomType: charge.roomType,
      guestName: charge.guestName,
      roomRate: charge.roomRate || 0,
      extras: charge.extras || 0,
      total: charge.total || 0,
      balance: charge.balance || 0,
      posted: false,
      hasPendingExtras: charge.needsReview || false,
      pendingExtraAmount: charge.extras || 0,
      pendingExtraDescription: 'Minibar / Ekstra hizmet'
    }))

    // Map summary fields
    summary.value = {
      totalRooms: data.summary?.totalRooms || 0,
      roomCharges: data.summary?.totalRoomCharges || 0,
      extras: data.summary?.totalExtras || 0,
      total: data.summary?.grandTotal || 0
    }
  } catch (error) {
    console.error('Failed to fetch room charges:', error)
    toast.error('Oda ucretleri yuklenemedi')
  } finally {
    loading.value = false
  }
}

const postAllCharges = async () => {
  if (pendingExtras.value.length > 0) {
    toast.warning('Lutfen once ekstralari onaylayin')
    return
  }

  try {
    posting.value = true

    const chargesToPost = charges.value
      .filter(c => !c.posted)
      .map(c => ({
        stayId: c.stayId,
        roomRate: c.roomRate,
        extras: c.extras,
        total: c.total
      }))

    await nightAuditService.postRoomCharges(props.hotelId, chargesToPost)

    // Mark all as posted
    charges.value.forEach(c => {
      c.posted = true
    })

    toast.success('Tum ucretler yansitildi')
  } catch (error) {
    console.error('Failed to post charges:', error)
    toast.error(error.response?.data?.message || 'Ucretler yansitilamadi')
  } finally {
    posting.value = false
  }
}

const approveExtra = extra => {
  // Find and update the charge
  const charge = charges.value.find(c => c.stayId === extra.stayId)
  if (charge) {
    charge.hasPendingExtras = false
    charge.extras += extra.amount
    charge.total += extra.amount
    summary.value.extras += extra.amount
    summary.value.total += extra.amount
  }
  toast.success('Ekstra onaylandi')
}

const rejectExtra = extra => {
  // Find and update the charge
  const charge = charges.value.find(c => c.stayId === extra.stayId)
  if (charge) {
    charge.hasPendingExtras = false
  }
  toast.info('Ekstra reddedildi')
}

const handleContinue = async () => {
  if (charges.value.length > 0 && !allPosted.value) {
    toast.warning('Lutfen tum ucretleri yansitin')
    return
  }

  try {
    completing.value = true

    // If charges haven't been posted yet via postAllCharges, post them now
    // This also completes the step on the backend
    const chargesToPost = charges.value.map(c => ({
      stayId: c.stayId,
      roomRate: c.roomRate,
      extras: c.extras,
      total: c.total
    }))

    await nightAuditService.postRoomCharges(props.hotelId, chargesToPost)

    emit('complete')
  } catch (error) {
    console.error('Failed to complete room charges step:', error)
    toast.error(error.response?.data?.message || 'Adim tamamlanamadi')
  } finally {
    completing.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchCharges()
})
</script>
