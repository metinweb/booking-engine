<template>
  <div class="space-y-6">
    <!-- Today's Summary -->
    <div class="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white">
      <h2 class="text-lg font-medium opacity-90">{{ $t('dashboard.partner.todaySummary') }}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
        <div>
          <p class="text-3xl font-bold">{{ stats.today?.checkIns || 0 }}</p>
          <p class="text-sm opacity-75">{{ $t('dashboard.partner.checkIns') }}</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ stats.today?.checkOuts || 0 }}</p>
          <p class="text-sm opacity-75">{{ $t('dashboard.partner.checkOuts') }}</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ stats.bookings?.pending || 0 }}</p>
          <p class="text-sm opacity-75">{{ $t('dashboard.partner.pendingBookings') }}</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ stats.bookings?.weekly || 0 }}</p>
          <p class="text-sm opacity-75">{{ $t('dashboard.partner.weeklyBookings') }}</p>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        :title="$t('dashboard.partner.monthlyRevenue')"
        :value="stats.revenue?.monthly || 0"
        icon="payments"
        color="green"
        format="currency"
      />
      <StatCard
        :title="$t('dashboard.partner.monthlyBookings')"
        :value="stats.bookings?.monthly || 0"
        icon="calendar_month"
        color="blue"
        :sub-label="$t('dashboard.partner.total')"
        :sub-value="stats.bookings?.total || 0"
      />
      <StatCard
        :title="$t('dashboard.partner.totalAgencies')"
        :value="stats.agencies?.total || 0"
        icon="storefront"
        color="purple"
        :sub-label="$t('dashboard.partner.active')"
        :sub-value="stats.agencies?.active || 0"
      />
      <StatCard
        :title="$t('dashboard.partner.totalHotels')"
        :value="stats.hotels?.total || 0"
        icon="hotel"
        color="orange"
        :sub-label="$t('dashboard.partner.active')"
        :sub-value="stats.hotels?.active || 0"
      />
    </div>

    <!-- Charts and Tables Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Bookings -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-blue-600 mr-2">schedule</span>
          {{ $t('dashboard.recentBookings') }}
        </h3>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="booking in recentBookings"
            :key="booking._id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-800 dark:text-white">{{ booking.bookingNumber }}</p>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    getStatusClass(booking.status)
                  ]"
                >
                  {{ $t('booking.statuses.' + booking.status) }}
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-slate-400 truncate">
                {{ booking.leadGuest?.firstName }} {{ booking.leadGuest?.lastName }} • {{ booking.hotel?.name }}
              </p>
              <p class="text-xs text-gray-400 dark:text-slate-500">
                {{ formatDate(booking.checkIn) }} - {{ formatDate(booking.checkOut) }}
              </p>
            </div>
            <div class="text-right ml-4">
              <p class="font-semibold text-gray-800 dark:text-white">
                {{ formatPrice(booking.pricing?.grandTotal, booking.pricing?.currency) }}
              </p>
              <p v-if="booking.source?.agencyName || booking.source?.agencyId" class="text-xs text-gray-500 dark:text-slate-400">{{ booking.source?.agencyName || booking.source?.agencyId?.name }}</p>
            </div>
          </div>
          <p v-if="!recentBookings?.length" class="text-center text-gray-500 dark:text-slate-400 py-4">
            {{ $t('dashboard.noRecentBookings') }}
          </p>
        </div>
      </div>

      <!-- Top Agencies & Hotels -->
      <div class="space-y-6">
        <!-- Top Agencies -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <span class="material-icons text-purple-600 mr-2">leaderboard</span>
            {{ $t('dashboard.partner.topAgencies') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="(agency, index) in topAgencies"
              :key="agency._id || index"
              class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg"
            >
              <div class="flex items-center">
                <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold mr-2">
                  {{ index + 1 }}
                </span>
                <span class="text-gray-800 dark:text-white">{{ agency.name }}</span>
              </div>
              <span class="text-green-600 dark:text-green-400 font-medium">₺{{ agency.revenue?.toLocaleString('tr-TR') }}</span>
            </div>
            <p v-if="!topAgencies?.length" class="text-center text-gray-500 dark:text-slate-400 py-2 text-sm">
              {{ $t('dashboard.noData') }}
            </p>
          </div>
        </div>

        <!-- Top Hotels -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <span class="material-icons text-orange-600 mr-2">hotel</span>
            {{ $t('dashboard.partner.topHotels') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="(hotel, index) in topHotels"
              :key="hotel._id"
              class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg"
            >
              <div class="flex items-center">
                <span class="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold mr-2">
                  {{ index + 1 }}
                </span>
                <span class="text-gray-800 dark:text-white">{{ hotel.name }}</span>
              </div>
              <span class="text-green-600 dark:text-green-400 font-medium">₺{{ hotel.revenue?.toLocaleString('tr-TR') }}</span>
            </div>
            <p v-if="!topHotels?.length" class="text-center text-gray-500 dark:text-slate-400 py-2 text-sm">
              {{ $t('dashboard.noData') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatCard from './StatCard.vue'

defineProps({
  stats: { type: Object, default: () => ({}) },
  recentBookings: { type: Array, default: () => [] },
  topAgencies: { type: Array, default: () => [] },
  topHotels: { type: Array, default: () => [] },
  dailyTrend: { type: Array, default: () => [] }
})

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[status] || classes.pending
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>
