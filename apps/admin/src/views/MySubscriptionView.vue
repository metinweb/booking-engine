<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('mySubscription.title') }}
      </h1>
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('mySubscription.description') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-3xl text-purple-500">refresh</span>
    </div>

    <!-- Content -->
    <div v-else-if="subscription" class="grid gap-6">
      <!-- Plan & Status Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Plan Info -->
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-xl flex items-center justify-center"
                :class="planColors[subscription.plan]?.bg || 'bg-gray-100 dark:bg-slate-700'"
              >
                <span
                  class="material-icons text-3xl"
                  :class="planColors[subscription.plan]?.text || 'text-gray-500'"
                >
                  {{ planColors[subscription.plan]?.icon || 'workspace_premium' }}
                </span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ subscription.planName }}
                </h2>
                <p class="text-gray-500 dark:text-slate-400">
                  {{ $t('mySubscription.currentPlan') }}
                </p>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center gap-3">
              <span
                class="px-4 py-2 rounded-full text-sm font-medium"
                :class="statusColors[subscription.status]"
              >
                {{ $t(`mySubscription.status.${subscription.status}`) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dates & Progress Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.subscriptionPeriod') }}
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Start Date -->
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.startDate') }}
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatDate(subscription.startDate) }}
              </div>
            </div>

            <!-- End Date -->
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.endDate') }}
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatDate(subscription.endDate) }}
              </div>
            </div>

            <!-- Remaining Days -->
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.remainingDays') }}
              </div>
              <div class="text-lg font-semibold" :class="remainingDaysColor">
                <template v-if="subscription.remainingDays > 0">
                  {{ subscription.remainingDays }} {{ $t('mySubscription.days') }}
                </template>
                <template v-else-if="subscription.gracePeriodRemainingDays > 0">
                  {{ subscription.gracePeriodRemainingDays }} {{ $t('mySubscription.days') }} ({{ $t('mySubscription.status.grace_period') }})
                </template>
                <template v-else>
                  {{ $t('mySubscription.status.expired') }}
                </template>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="subscription.remainingDays > 0" class="mt-6">
            <div class="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
              <span>{{ $t('mySubscription.subscriptionPeriod') }}</span>
              <span>{{ progressPercentage }}%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-purple-500 rounded-full transition-all duration-500"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>

          <!-- Grace Period Warning -->
          <div
            v-if="subscription.status === 'grace_period'"
            class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <span class="material-icons text-amber-500">warning</span>
              <div>
                <div class="font-medium text-amber-800 dark:text-amber-200">
                  {{ $t('mySubscription.gracePeriodWarning') }}
                </div>
                <div class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {{ $t('mySubscription.gracePeriodRemainingDays', { days: subscription.gracePeriodRemainingDays }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Expired Warning -->
          <div
            v-if="subscription.status === 'expired'"
            class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <span class="material-icons text-red-500">error</span>
              <div>
                <div class="font-medium text-red-800 dark:text-red-200">
                  {{ $t('mySubscription.expiredWarning') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PMS Quota Card (if applicable) -->
      <div
        v-if="subscription.pmsEnabled"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.pmsQuota') }}
          </h3>
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.pmsQuota') }}
              </div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ subscription.pmsUsed || 0 }}
                <span class="text-gray-500 dark:text-slate-400 text-lg font-normal">
                  / {{ subscription.pmsLimit === -1 ? $t('mySubscription.pmsUnlimited') : subscription.pmsLimit }}
                </span>
              </div>
            </div>
            <div
              v-if="subscription.pmsLimit !== -1"
              class="w-24 h-24"
            >
              <div class="relative w-full h-full">
                <svg class="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    stroke-width="8"
                    fill="none"
                    class="text-gray-200 dark:text-slate-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    stroke-width="8"
                    fill="none"
                    class="text-purple-500"
                    :stroke-dasharray="251.2"
                    :stroke-dashoffset="251.2 - (251.2 * pmsUsagePercentage) / 100"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ pmsUsagePercentage }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.invoices') }}
          </h3>
        </div>
        <div class="p-6">
          <div v-if="invoices.length === 0" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('mySubscription.noInvoices') }}
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="invoice in invoices"
              :key="invoice._id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="invoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-slate-700'"
                >
                  <span
                    class="material-icons text-lg"
                    :class="invoice.status === 'paid' ? 'text-green-500' : 'text-gray-500'"
                  >
                    receipt
                  </span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ invoice.invoiceNumber }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">
                    {{ formatDate(invoice.invoiceDate) }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ formatCurrency(invoice.total, invoice.currency) }}
                  </div>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="invoiceStatusColors[invoice.status]"
                  >
                    {{ $t(`mySubscription.invoiceStatuses.${invoice.status}`) }}
                  </span>
                </div>
                <button
                  class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  :title="$t('mySubscription.downloadInvoice')"
                  @click="downloadInvoice(invoice._id, invoice.invoiceNumber)"
                >
                  <span class="material-icons">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase History Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.purchaseHistory') }}
          </h3>
        </div>
        <div class="p-6">
          <div v-if="!subscription.purchases?.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('mySubscription.noPurchases') }}
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="purchase in subscription.purchases"
              :key="purchase._id"
              class="flex items-center justify-between p-4 rounded-lg border"
              :class="{
                'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800': purchase.status === 'active',
                'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700': purchase.status === 'expired',
                'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800': purchase.status === 'cancelled'
              }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                  :class="planColors[purchase.plan]?.bg || 'bg-gray-100 dark:bg-slate-700'"
                >
                  <span
                    class="material-icons text-xl"
                    :class="planColors[purchase.plan]?.text || 'text-gray-500'"
                  >
                    {{ planColors[purchase.plan]?.icon || 'workspace_premium' }}
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ getPlanName(purchase.plan) }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="purchaseStatusColors[purchase.status]"
                    >
                      {{ $t(`mySubscription.purchaseStatus.${purchase.status}`) }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    {{ formatDate(purchase.period?.startDate) }} - {{ formatDate(purchase.period?.endDate) }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ formatCurrency(purchase.price?.amount, purchase.price?.currency) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400">
                  {{ $t(`mySubscription.paymentMethods.${purchase.payment?.method}`) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Support -->
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
        <span class="material-icons text-4xl text-purple-500 mb-3">support_agent</span>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('mySubscription.needHelp') }}
        </h3>
        <p class="text-gray-600 dark:text-slate-300 mb-4">
          {{ $t('mySubscription.contactSupport') }}
        </p>
        <a
          href="mailto:support@example.com"
          class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <span class="material-icons text-sm">email</span>
          {{ $t('mySubscription.contactUs') }}
        </a>
      </div>
    </div>

    <!-- No Subscription -->
    <div
      v-else
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
    >
      <span class="material-icons text-6xl text-gray-300 dark:text-slate-600 mb-4">
        card_membership
      </span>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ $t('mySubscription.loadError') }}
      </h2>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import partnerService from '@/services/partnerService'
import subscriptionInvoiceService from '@/services/subscriptionInvoiceService'

const { t, locale } = useI18n()
const authStore = useAuthStore()

const loading = ref(true)
const subscription = ref(null)
const invoices = ref([])

const planColors = {
  business: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-500',
    icon: 'business'
  },
  professional: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-500',
    icon: 'workspace_premium'
  },
  enterprise: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-500',
    icon: 'diamond'
  }
}

const statusColors = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  grace_period: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const invoiceStatusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
}

const purchaseStatusColors = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
}

const getPlanName = plan => {
  const planNames = {
    business: 'Business',
    professional: 'Professional',
    enterprise: 'Enterprise'
  }
  return planNames[plan] || plan
}

const remainingDaysColor = computed(() => {
  if (!subscription.value) return 'text-gray-500'
  if (subscription.value.remainingDays > 30) return 'text-green-600 dark:text-green-400'
  if (subscription.value.remainingDays > 7) return 'text-amber-600 dark:text-amber-400'
  if (subscription.value.remainingDays > 0) return 'text-red-600 dark:text-red-400'
  if (subscription.value.gracePeriodRemainingDays > 0) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const progressPercentage = computed(() => {
  if (!subscription.value?.startDate || !subscription.value?.endDate) return 0
  const start = new Date(subscription.value.startDate).getTime()
  const end = new Date(subscription.value.endDate).getTime()
  const now = Date.now()
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
})

const pmsUsagePercentage = computed(() => {
  if (!subscription.value || subscription.value.pmsLimit <= 0) return 0
  return Math.round((subscription.value.pmsUsed / subscription.value.pmsLimit) * 100)
})

const formatDate = dateStr => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

const loadData = async () => {
  loading.value = true
  try {
    // Get subscription info
    const response = await partnerService.getMySubscription()
    subscription.value = response.data

    // Get invoices
    const invoicesResponse = await subscriptionInvoiceService.getMyInvoices()
    invoices.value = invoicesResponse.data?.invoices || []
  } catch (error) {
    console.error('Failed to load subscription:', error)
  } finally {
    loading.value = false
  }
}

const downloadInvoice = async (invoiceId, invoiceNumber) => {
  try {
    await subscriptionInvoiceService.downloadMyInvoicePDF(invoiceId, invoiceNumber)
  } catch (error) {
    console.error('Failed to download invoice:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>
