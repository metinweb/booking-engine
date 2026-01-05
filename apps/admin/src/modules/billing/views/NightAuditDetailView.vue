<template>
  <div class="space-y-6">
    <!-- Header with Back Button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          @click="router.push({ name: 'pms-night-audit' })"
        >
          <span class="material-icons">arrow_back</span>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span class="material-icons text-indigo-600 dark:text-indigo-400">history</span>
            Audit Detayi
          </h1>
          <p v-if="audit" class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ audit.auditNumber }} - {{ formatDate(audit.auditDate) }}
          </p>
        </div>
      </div>

      <!-- Status Badge -->
      <div v-if="audit" class="flex items-center gap-2">
        <span
          class="px-3 py-1.5 text-sm font-medium rounded-full"
          :class="{
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
              audit.status === 'completed',
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
              audit.status === 'in_progress',
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
              audit.status === 'cancelled'
          }"
        >
          {{ getStatusLabel(audit.status) }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <span class="material-icons text-4xl text-indigo-600 animate-spin">refresh</span>
        <p class="mt-4 text-gray-500 dark:text-slate-400">Yukleniyor...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
    >
      <span class="material-icons text-4xl text-red-500 mb-4">error</span>
      <p class="text-red-700 dark:text-red-400">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        @click="fetchAudit"
      >
        Tekrar Dene
      </button>
    </div>

    <!-- Audit Details -->
    <div v-else-if="audit" class="space-y-6">
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-3xl font-bold">%{{ audit.summary?.occupancyRate || 0 }}</p>
          <p class="text-sm opacity-80">Doluluk</p>
        </div>
        <div
          class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-xl font-bold">{{ formatCurrency(audit.summary?.totalRevenue || 0) }}</p>
          <p class="text-sm opacity-80">Toplam Gelir</p>
        </div>
        <div
          class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-3xl font-bold">
            {{ audit.summary?.arrivals || 0 }} / {{ audit.summary?.departures || 0 }}
          </p>
          <p class="text-sm opacity-80">Giris / Cikis</p>
        </div>
        <div
          class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-3xl font-bold">{{ audit.summary?.inHouseGuests || 0 }}</p>
          <p class="text-sm opacity-80">Misafir</p>
        </div>
      </div>

      <!-- Audit Information -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-indigo-600">info</span>
          Audit Bilgileri
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <span class="material-icons text-gray-400">tag</span>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Audit Numarasi</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ audit.auditNumber }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <span class="material-icons text-gray-400">calendar_today</span>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Audit Tarihi</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(audit.auditDate) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <span class="material-icons text-gray-400">person</span>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Baslatan</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ audit.startedBy?.firstName }} {{ audit.startedBy?.lastName }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <span class="material-icons text-gray-400">schedule</span>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Tamamlanma</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDateTime(audit.completedAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Steps Summary -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-indigo-600">checklist</span>
          Adim Detaylari
        </h3>
        <div class="space-y-4">
          <!-- Pre-Audit Check -->
          <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div
              class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-green-600 dark:text-green-400">check</span>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">On Kontrol</h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ audit.preAuditCheck?.issues?.length || 0 }} sorun tespit edildi
              </p>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500">
              {{ formatTime(audit.preAuditCheck?.completedAt) }}
            </p>
          </div>

          <!-- No-Show Processing -->
          <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div
              class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-green-600 dark:text-green-400">check</span>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">Gelmeyenler</h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ audit.noShowProcessing?.processedCount || 0 }} no-show islendi,
                {{ formatCurrency(audit.noShowProcessing?.totalCharges || 0) }} tahsil edildi
              </p>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500">
              {{ formatTime(audit.noShowProcessing?.completedAt) }}
            </p>
          </div>

          <!-- Room Charge Posting -->
          <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div
              class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-green-600 dark:text-green-400">check</span>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">Oda Ucretleri</h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ audit.roomChargePosting?.totalRooms || 0 }} odaya toplam
                {{ formatCurrency(audit.roomChargePosting?.grandTotal || 0) }} yansitiildi
              </p>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500">
              {{ formatTime(audit.roomChargePosting?.completedAt) }}
            </p>
          </div>

          <!-- Cashier Reconciliation -->
          <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div
              class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-green-600 dark:text-green-400">check</span>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">Kasa Kapanisi</h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ audit.cashierReconciliation?.closedCount || 0 }} kasa kapatildi,
                {{ formatCurrency(audit.cashierReconciliation?.totalDiscrepancy || 0) }} fark
              </p>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500">
              {{ formatTime(audit.cashierReconciliation?.completedAt) }}
            </p>
          </div>

          <!-- Reports & Close -->
          <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div
              class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-green-600 dark:text-green-400">check</span>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">Raporlar & Kapanis</h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ audit.reportsAndClose?.reports?.length || 0 }} rapor olusturuldu
                <span
                  v-if="audit.reportsAndClose?.emailSent"
                  class="text-green-600 dark:text-green-400"
                >
                  (e-posta gonderildi)
                </span>
              </p>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500">
              {{ formatTime(audit.reportsAndClose?.completedAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Revenue Breakdown -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-emerald-600">trending_up</span>
          Gelir Dagilimi
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(audit.summary?.roomRevenue || 0) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Oda Geliri</p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(audit.summary?.extraRevenue || 0) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Ekstra Gelir</p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ audit.summary?.noShows || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">No-Show</p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ audit.summary?.cancellations || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Iptal</p>
          </div>
        </div>
      </div>

      <!-- Download Reports -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-indigo-600">description</span>
          Raporlari Indir
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            v-for="report in reports"
            :key="report.type"
            :disabled="downloadingReport === report.type"
            class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
            @click="downloadReport(report)"
          >
            <div
              class="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <span
                v-if="downloadingReport === report.type"
                class="material-icons text-indigo-600 animate-spin"
                >refresh</span
              >
              <span v-else class="material-icons text-2xl" :class="report.iconColor">{{
                report.icon
              }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
              report.label
            }}</span>
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div
        v-if="audit.notes"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-gray-500">notes</span>
          Notlar
        </h3>
        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ audit.notes }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as nightAuditService from '@/services/pms/nightAuditService'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { hotelId } = usePmsContextInjection()

// State
const loading = ref(true)
const error = ref(null)
const audit = ref(null)
const downloadingReport = ref(null)

// Computed
const auditId = computed(() => route.params.auditId)

const reports = [
  { type: 'daily', label: 'Gunluk Rapor', icon: 'summarize', iconColor: 'text-indigo-600' },
  { type: 'revenue', label: 'Gelir Raporu', icon: 'payments', iconColor: 'text-emerald-600' },
  { type: 'occupancy', label: 'Doluluk Raporu', icon: 'hotel', iconColor: 'text-blue-600' },
  { type: 'cashier', label: 'Kasa Raporu', icon: 'point_of_sale', iconColor: 'text-purple-600' }
]

// Methods
const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const getStatusLabel = status => {
  const labels = {
    completed: 'Tamamlandi',
    in_progress: 'Devam Ediyor',
    cancelled: 'Iptal Edildi'
  }
  return labels[status] || status
}

const fetchAudit = async () => {
  if (!hotelId.value || !auditId.value) {
    error.value = 'Gecersiz parametreler'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    const response = await nightAuditService.getAuditById(hotelId.value, auditId.value)
    audit.value = response.data
  } catch (err) {
    console.error('Failed to fetch audit:', err)
    error.value = err.response?.data?.message || 'Audit bilgisi alinamadi'
  } finally {
    loading.value = false
  }
}

const downloadReport = async report => {
  try {
    downloadingReport.value = report.type
    await nightAuditService.downloadReport(hotelId.value, auditId.value, report.type)
    toast.success(`${report.label} indirildi`)
  } catch (err) {
    console.error('Failed to download report:', err)
    toast.error('Rapor indirilemedi')
  } finally {
    downloadingReport.value = null
  }
}

// Lifecycle
onMounted(() => {
  fetchAudit()
})
</script>
