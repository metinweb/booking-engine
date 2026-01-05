<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="flex-1 overflow-y-auto py-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div
          v-for="stat in statCards"
          :key="stat.key"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 cursor-pointer transition-all hover:shadow-md"
          :class="{ 'ring-2 ring-purple-500': filters.status === stat.filterValue }"
          @click="setStatusFilter(stat.filterValue)"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
              :class="stat.bgClass"
            >
              <span class="material-icons" :class="stat.iconClass">{{ stat.icon }}</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >search</span
              >
              <input
                v-model="filters.search"
                type="text"
                :placeholder="$t('booking.searchPlaceholder')"
                class="form-input w-full pl-10"
                @input="debouncedSearch"
              />
            </div>
          </div>

          <!-- Status Tabs -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              :class="
                filters.status === tab.value
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              "
              @click="setStatusFilter(tab.value)"
            >
              {{ tab.label }}
              <span
                v-if="tab.count > 0"
                class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                :class="
                  filters.status === tab.value
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-400'
                "
              >
                {{ tab.count }}
              </span>
            </button>
          </div>

          <!-- Date Filter -->
          <select v-model="filters.dateRange" class="form-input w-auto" @change="applyFilters">
            <option value="">{{ $t('booking.allDates') }}</option>
            <option value="today">{{ $t('booking.today') }}</option>
            <option value="week">{{ $t('booking.thisWeek') }}</option>
            <option value="month">{{ $t('booking.thisMonth') }}</option>
            <option value="upcoming">{{ $t('booking.upcoming') }}</option>
            <option value="past">{{ $t('booking.past') }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
          <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="bookings.length === 0"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12"
      >
        <div class="text-center">
          <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">event_busy</span>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {{ $t('booking.noBookingsFound') }}
          </h3>
          <p class="mt-2 text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            {{
              filters.status
                ? $t('booking.noBookingsForStatus')
                : $t('booking.noBookingsDescription')
            }}
          </p>
          <router-link to="/bookings/new" class="mt-6 btn-primary inline-flex items-center">
            <span class="material-icons mr-2">add</span>
            {{ $t('booking.createFirstBooking') }}
          </router-link>
        </div>
      </div>

      <!-- Bookings Table -->
      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.bookingNumber') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.hotel') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.guest') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.dates') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.rooms') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.marketSeason') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('booking.totalPrice') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('payment.paidAmount') }}
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
              <tr
                v-for="booking in bookings"
                :key="booking._id"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <!-- Booking Number -->
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      class="material-icons mr-2 text-sm"
                      :class="booking.status === 'draft' ? 'text-purple-500' : 'text-gray-400'"
                    >
                      {{ booking.status === 'draft' ? 'edit_note' : 'confirmation_number' }}
                    </span>
                    <div>
                      <div class="flex items-center">
                        <span class="font-medium text-gray-900 dark:text-white">
                          {{ booking.bookingNumber }}
                        </span>
                        <!-- Amendment indicator with popover -->
                        <div
                          v-if="booking.modifications?.length > 0"
                          class="relative group/amend ml-1.5"
                        >
                          <span class="inline-flex items-center cursor-pointer">
                            <span class="material-icons text-sm text-amber-500">edit_note</span>
                          </span>
                          <!-- Popover -->
                          <div
                            class="absolute left-0 top-full mt-1 z-50 hidden group-hover/amend:block"
                          >
                            <div
                              class="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-3 min-w-[280px]"
                            >
                              <div
                                class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center"
                              >
                                <span class="material-icons text-amber-500 text-sm mr-1"
                                  >history</span
                                >
                                {{ $t('booking.amendmentHistory') }} ({{
                                  booking.modifications.length
                                }})
                              </div>
                              <div
                                v-for="(mod, modIdx) in booking.modifications.slice().reverse()"
                                :key="modIdx"
                                class="py-2"
                                :class="{
                                  'border-t border-gray-100 dark:border-slate-700': modIdx > 0
                                }"
                              >
                                <div class="flex items-start justify-between gap-2">
                                  <p class="text-sm text-gray-700 dark:text-slate-300 flex-1">
                                    {{ mod.description || $t('booking.amendment.noDescription') }}
                                  </p>
                                </div>
                                <p
                                  class="text-xs text-gray-400 dark:text-slate-500 mt-1 flex items-center"
                                >
                                  <span class="material-icons text-xs mr-1">schedule</span>
                                  {{ formatDateTime(mod.modifiedAt) }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- Status Badge -->
                      <div class="mt-1 flex items-center gap-1.5">
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusClass(booking.status)"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full mr-1"
                            :class="getStatusDotClass(booking.status)"
                          ></span>
                          {{ getStatusLabel(booking.status) }}
                        </span>
                        <!-- Expiry warning for drafts -->
                        <span
                          v-if="booking.status === 'draft' && booking.expiresAt"
                          class="text-xs text-orange-500"
                        >
                          {{ formatDaysUntil(booking.expiresAt) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Hotel -->
                <td class="px-4 py-4">
                  <div class="max-w-[200px]">
                    <p class="font-medium text-gray-900 dark:text-white truncate">
                      {{ booking.hotelName || '-' }}
                    </p>
                    <p v-if="booking.hotelCode" class="text-xs text-gray-500 dark:text-slate-400">
                      {{ booking.hotelCode }}
                    </p>
                  </div>
                </td>

                <!-- Guest -->
                <td class="px-4 py-4">
                  <div v-if="booking.leadGuest" class="max-w-[160px]">
                    <p class="font-medium text-gray-900 dark:text-white truncate">
                      {{ booking.leadGuest.firstName }} {{ booking.leadGuest.lastName }}
                    </p>
                    <div
                      v-if="booking.leadGuest.nationality"
                      class="flex items-center gap-1 mt-0.5"
                    >
                      <span class="text-sm">{{
                        getCountryFlag(booking.leadGuest.nationality)
                      }}</span>
                      <span class="text-xs text-gray-500 dark:text-slate-400">{{
                        getCountryName(booking.leadGuest.nationality)
                      }}</span>
                    </div>
                  </div>
                  <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">
                    {{ $t('booking.noGuestInfo') }}
                  </span>
                </td>

                <!-- Dates -->
                <td class="px-4 py-4 whitespace-nowrap">
                  <div v-if="booking.checkIn" class="flex items-center">
                    <div class="text-sm">
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ formatDate(booking.checkIn) }}
                      </p>
                      <p class="text-gray-500 dark:text-slate-400 flex items-center">
                        <span class="material-icons text-xs mr-1">arrow_right_alt</span>
                        {{ formatDate(booking.checkOut) }}
                        <span class="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                          ({{ booking.nights }} {{ $t('booking.night') }})
                        </span>
                      </p>
                    </div>
                  </div>
                  <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
                </td>

                <!-- Rooms -->
                <td class="px-4 py-4">
                  <!-- Rooms with popover -->
                  <div v-if="booking.rooms?.length" class="relative group">
                    <!-- Trigger: badges -->
                    <div class="flex items-center gap-1 cursor-pointer">
                      <span
                        class="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      >
                        {{ booking.rooms[0].roomTypeCode }}
                      </span>
                      <span
                        class="px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      >
                        {{ booking.rooms[0].mealPlanCode }}
                      </span>
                      <span
                        v-if="booking.rooms[0].rateType === 'non_refundable'"
                        class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                      >
                        NR
                      </span>
                      <span
                        v-if="booking.rooms.length > 1"
                        class="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded"
                      >
                        +{{ booking.rooms.length - 1 }}
                      </span>
                    </div>
                    <!-- Popover -->
                    <div class="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                      <div
                        class="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-3 min-w-[280px]"
                      >
                        <div
                          class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2"
                        >
                          {{ $t('booking.roomDetails') }}
                        </div>
                        <div
                          v-for="(room, roomIdx) in booking.rooms"
                          :key="roomIdx"
                          class="py-2"
                          :class="{ 'border-t border-gray-100 dark:border-slate-700': roomIdx > 0 }"
                        >
                          <div class="flex items-start justify-between gap-3">
                            <div class="flex-1">
                              <div class="font-medium text-gray-900 dark:text-white text-sm">
                                {{ getLocalizedName(room.roomTypeName) }}
                              </div>
                              <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                {{ getLocalizedName(room.mealPlanName) }}
                              </div>
                            </div>
                            <div
                              class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300"
                            >
                              <span class="flex items-center" :title="$t('booking.adults')">
                                <span class="material-icons text-sm mr-0.5">person</span>
                                {{ getRoomAdults(room) }}
                              </span>
                              <span
                                v-if="getRoomChildren(room) > 0"
                                class="flex items-center"
                                :title="$t('booking.children')"
                              >
                                <span class="material-icons text-sm mr-0.5">child_care</span>
                                {{ getRoomChildren(room) }}
                              </span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 mt-1.5">
                            <span
                              class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                            >
                              {{ room.roomTypeCode }}
                            </span>
                            <span
                              class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300"
                            >
                              {{ room.mealPlanCode }}
                            </span>
                            <span
                              v-if="room.rateType === 'non_refundable'"
                              class="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                            >
                              {{ $t('booking.nonRefundableRate') }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- No rooms -->
                  <div
                    v-else
                    class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400"
                  >
                    <span class="material-icons text-base">king_bed</span>
                    {{ booking.totalRooms || '-' }}
                  </div>
                </td>

                <!-- Market & Season -->
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-if="booking.market"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default"
                      :title="getLocalizedName(booking.market.name)"
                    >
                      {{ booking.market.code }}
                    </span>
                    <span
                      v-if="booking.season"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default"
                      :style="{
                        backgroundColor: booking.season.color
                          ? `${booking.season.color}20`
                          : '#fef3c7',
                        color: booking.season.color || '#d97706'
                      }"
                      :title="getLocalizedName(booking.season.name)"
                    >
                      {{ booking.season.code }}
                    </span>
                    <span
                      v-if="!booking.market && !booking.season"
                      class="text-gray-400 dark:text-slate-500 text-sm"
                      >-</span
                    >
                  </div>
                </td>

                <!-- Price -->
                <td class="px-4 py-4 whitespace-nowrap">
                  <div v-if="booking.pricing?.grandTotal">
                    <span class="font-semibold text-gray-900 dark:text-white">
                      {{ formatPrice(booking.pricing.grandTotal, booking.pricing.currency) }}
                    </span>
                    <p
                      v-if="booking.pricing?.totalCost"
                      class="text-xs text-gray-500 dark:text-slate-400 mt-0.5"
                    >
                      {{ $t('booking.cost') }}:
                      {{ formatPrice(booking.pricing.totalCost, booking.pricing.currency) }}
                    </p>
                  </div>
                  <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
                </td>

                <!-- Paid Amount -->
                <td class="px-4 py-4 whitespace-nowrap" @click.stop>
                  <button
                    v-if="booking.pricing?.grandTotal"
                    class="group flex flex-col items-start hover:bg-gray-50 dark:hover:bg-slate-700/50 -m-2 p-2 rounded-lg transition-colors"
                    @click="openPaymentModal(booking)"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{
                          formatPrice(booking.payment?.paidAmount || 0, booking.pricing.currency)
                        }}
                      </span>
                      <span class="text-gray-400 dark:text-slate-500">/</span>
                      <span class="text-gray-500 dark:text-slate-400 text-sm">
                        {{ formatPrice(booking.pricing.grandTotal, booking.pricing.currency) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <PaymentStatusBadge :status="booking.payment?.status || 'pending'" />
                      <span
                        class="material-icons text-xs text-gray-400 group-hover:text-purple-500 transition-colors"
                        >open_in_new</span
                      >
                    </div>
                  </button>
                  <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
                </td>

                <!-- Actions -->
                <td class="px-4 py-4 whitespace-nowrap text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <!-- Continue Draft Button -->
                    <button
                      v-if="booking.status === 'draft'"
                      class="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      @click.stop="continueDraft(booking)"
                    >
                      <span class="material-icons text-sm mr-1">play_arrow</span>
                      {{ $t('booking.continueBooking') }}
                    </button>

                    <!-- View Button -->
                    <button
                      v-else
                      class="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      @click.stop="viewBooking(booking)"
                    >
                      <span class="material-icons text-sm mr-1">visibility</span>
                      {{ $t('common.view') }}
                    </button>

                    <!-- Amend Button -->
                    <button
                      v-if="canAmend(booking)"
                      class="inline-flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors"
                      @click.stop="openAmendment(booking)"
                    >
                      <span class="material-icons text-sm mr-1">edit</span>
                      {{ $t('booking.amend') }}
                    </button>

                    <!-- More Actions Menu -->
                    <div v-if="booking.status !== 'draft'" class="relative">
                      <button
                        class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        @click.stop="toggleMenu(booking._id)"
                      >
                        <span class="material-icons">more_vert</span>
                      </button>

                      <!-- Dropdown Menu -->
                      <div
                        v-if="openMenuId === booking._id"
                        class="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-20"
                      >
                        <button
                          v-if="canConfirm(booking)"
                          class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                          @click.stop="confirmBooking(booking)"
                        >
                          <span class="material-icons text-green-500 mr-2 text-sm"
                            >check_circle</span
                          >
                          {{ $t('booking.confirmBooking') }}
                        </button>
                        <button
                          v-if="canCancel(booking)"
                          class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                          @click.stop="cancelBooking(booking)"
                        >
                          <span class="material-icons mr-2 text-sm">cancel</span>
                          {{ $t('booking.cancelBooking') }}
                        </button>
                        <button
                          class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                          @click.stop="printBooking(booking)"
                        >
                          <span class="material-icons mr-2 text-sm">print</span>
                          {{ $t('booking.printBooking') }}
                        </button>
                      </div>
                    </div>

                    <!-- Delete Draft -->
                    <button
                      v-if="booking.status === 'draft'"
                      class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      :title="$t('common.delete')"
                      @click.stop="deleteDraft(booking)"
                    >
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="px-4 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between"
        >
          <div class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('common.showing') }}
            <span class="font-medium text-gray-900 dark:text-white">{{
              (currentPage - 1) * perPage + 1
            }}</span>
            -
            <span class="font-medium text-gray-900 dark:text-white">{{
              Math.min(currentPage * perPage, totalItems)
            }}</span>
            {{ $t('common.of') }}
            <span class="font-medium text-gray-900 dark:text-white">{{ totalItems }}</span>
          </div>

          <div class="flex items-center space-x-2">
            <button
              :disabled="currentPage === 1"
              class="p-2 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              @click="goToPage(currentPage - 1)"
            >
              <span class="material-icons text-sm">chevron_left</span>
            </button>

            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="w-9 h-9 rounded-lg border text-sm font-medium transition-colors"
                :class="
                  page === currentPage
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                "
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <span v-else class="px-1 text-gray-400">...</span>
            </template>

            <button
              :disabled="currentPage === totalPages"
              class="p-2 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              @click="goToPage(currentPage + 1)"
            >
              <span class="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('booking.deleteDraft')">
      <div class="py-4">
        <p class="text-gray-600 dark:text-slate-400">
          {{ $t('booking.deleteDraftConfirm') }}
        </p>
        <p class="mt-2 font-medium text-gray-900 dark:text-white">
          {{ selectedBooking?.bookingNumber }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showDeleteModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-danger px-4 py-2" @click="confirmDeleteDraft">
            {{ $t('common.delete') }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Booking Amendment Modal -->
    <BookingAmendmentModal
      v-if="showAmendmentModal"
      :show="true"
      :booking-id="selectedBookingForAmendment?._id"
      @close="showAmendmentModal = false; selectedBookingForAmendment = null"
      @updated="handleAmendmentComplete"
    />

    <!-- Payment Modal -->
    <PaymentModal
      v-if="showPaymentModal"
      v-model="showPaymentModal"
      :booking="selectedBookingForPayment"
      @close="showPaymentModal = false; selectedBookingForPayment = null"
      @updated="handlePaymentUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePartnerContext } from '@/composables/usePartnerContext'
import bookingService from '@/services/bookingService'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import Modal from '@/components/common/Modal.vue'
import BookingAmendmentModal from '@/components/booking/amendment/BookingAmendmentModal.vue'
import PaymentModal from '@/components/booking/payment/PaymentModal.vue'
import PaymentStatusBadge from '@/components/booking/payment/PaymentStatusBadge.vue'

const { locale, t } = useI18n()
const router = useRouter()

// Navigation items
const navItems = computed(() => [
  {
    name: 'bookings',
    to: '/bookings',
    icon: 'event_note',
    label: t('booking.bookings'),
    matchPattern: '^/bookings(/[a-f0-9]+)?$'
  },
  {
    name: 'new-booking',
    to: '/bookings/new',
    icon: 'add',
    label: t('booking.newBooking'),
    exact: true
  }
])

// State
const bookings = ref([])
const stats = ref({})
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const perPage = 15
const openMenuId = ref(null)
const showDeleteModal = ref(false)
const selectedBooking = ref(null)
const showAmendmentModal = ref(false)
const selectedBookingForAmendment = ref(null)
const showPaymentModal = ref(false)
const selectedBookingForPayment = ref(null)

// Filters
const filters = ref({
  search: '',
  status: '',
  dateRange: ''
})

// Status tabs
const statusTabs = computed(() => [
  { value: '', label: t('common.all'), count: stats.value.total || 0 },
  { value: 'draft', label: t('booking.status.draft'), count: stats.value.draft || 0 },
  { value: 'pending', label: t('booking.status.pending'), count: stats.value.pending || 0 },
  { value: 'confirmed', label: t('booking.status.confirmed'), count: stats.value.confirmed || 0 },
  { value: 'completed', label: t('booking.status.completed'), count: stats.value.completed || 0 },
  { value: 'cancelled', label: t('booking.status.cancelled'), count: stats.value.cancelled || 0 }
])

// Stat cards
const statCards = computed(() => [
  {
    key: 'total',
    value: stats.value.total || 0,
    label: t('booking.stats.totalBookings'),
    icon: 'calendar_today',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconClass: 'text-purple-500',
    filterValue: ''
  },
  {
    key: 'draft',
    value: stats.value.draft || 0,
    label: t('booking.stats.drafts'),
    icon: 'edit_note',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconClass: 'text-blue-500',
    filterValue: 'draft'
  },
  {
    key: 'pending',
    value: stats.value.pending || 0,
    label: t('booking.stats.pending'),
    icon: 'schedule',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconClass: 'text-yellow-500',
    filterValue: 'pending'
  },
  {
    key: 'confirmed',
    value: stats.value.confirmed || 0,
    label: t('booking.stats.confirmed'),
    icon: 'check_circle',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-500',
    filterValue: 'confirmed'
  },
  {
    key: 'revenue',
    value: formatPrice(stats.value.revenue, 'TRY'),
    label: t('booking.stats.totalRevenue'),
    icon: 'payments',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconClass: 'text-emerald-500',
    filterValue: null
  }
])

// Debounce timer
let searchTimer = null

// Partner context
usePartnerContext({
  onPartnerChange: () => {
    currentPage.value = 1
    fetchBookings()
    fetchStats()
  },
  immediate: true
})

// Click outside to close menu
const handleClickOutside = e => {
  if (openMenuId.value && !e.target.closest('.relative')) {
    openMenuId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchBookings()
  fetchStats()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Fetch bookings
const fetchBookings = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: perPage,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }

    if (filters.value.search) {
      params.search = filters.value.search
    }
    if (filters.value.status) {
      params.status = filters.value.status
    }
    if (filters.value.dateRange) {
      applyDateFilter(params)
    }

    const response = await bookingService.getBookings(params)
    if (response.success) {
      bookings.value = response.data
      totalPages.value = response.pagination?.totalPages || 1
      totalItems.value = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
  } finally {
    isLoading.value = false
  }
}

// Apply date filter
const applyDateFilter = params => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filters.value.dateRange) {
    case 'today':
      params.checkInFrom = today.toISOString()
      params.checkInTo = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      break
    case 'week':
      params.checkInFrom = today.toISOString()
      params.checkInTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'month':
      params.checkInFrom = today.toISOString()
      params.checkInTo = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      ).toISOString()
      break
    case 'upcoming':
      params.checkInFrom = today.toISOString()
      break
    case 'past':
      params.checkInTo = today.toISOString()
      break
  }
}

// Fetch stats
const fetchStats = async () => {
  try {
    const response = await bookingService.getBookingStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

// Debounced search
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchBookings()
  }, 300)
}

// Set status filter
const setStatusFilter = status => {
  if (status === null) return // For revenue card
  filters.value.status = status
  applyFilters()
}

// Apply filters
const applyFilters = () => {
  currentPage.value = 1
  fetchBookings()
}

// Go to page
const goToPage = page => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchBookings()
}

// Toggle action menu
const toggleMenu = id => {
  openMenuId.value = openMenuId.value === id ? null : id
}


// View booking
const viewBooking = booking => {
  router.push(`/bookings/${booking._id}`)
}

// Continue draft
const continueDraft = booking => {
  router.push(`/bookings/draft/${booking.bookingNumber}`)
}

// Delete draft
const deleteDraft = booking => {
  selectedBooking.value = booking
  showDeleteModal.value = true
}

// Confirm delete draft
const confirmDeleteDraft = async () => {
  if (!selectedBooking.value) return

  try {
    await bookingService.deleteDraft(selectedBooking.value.bookingNumber)
    showDeleteModal.value = false
    selectedBooking.value = null
    fetchBookings()
    fetchStats()
  } catch (error) {
    console.error('Failed to delete draft:', error)
  }
}

// Confirm booking
const confirmBooking = async booking => {
  openMenuId.value = null
  try {
    await bookingService.updateBookingStatus(booking._id, 'confirmed')
    fetchBookings()
    fetchStats()
  } catch (error) {
    console.error('Failed to confirm booking:', error)
  }
}

// Cancel booking
const cancelBooking = booking => {
  openMenuId.value = null
  router.push(`/bookings/${booking._id}?action=cancel`)
}

// Print booking
const printBooking = booking => {
  openMenuId.value = null
  window.open(`/bookings/${booking._id}/print`, '_blank')
}

// Can confirm
const canConfirm = booking => {
  return booking.status === 'pending'
}

// Can cancel
const canCancel = booking => {
  return ['pending', 'confirmed'].includes(booking.status)
}

// Can amend (modify booking)
const canAmend = booking => {
  return ['pending', 'confirmed', 'checked_in'].includes(booking.status)
}

// Open amendment modal
const openAmendment = booking => {
  selectedBookingForAmendment.value = booking
  showAmendmentModal.value = true
}

// Handle amendment complete
const handleAmendmentComplete = () => {
  showAmendmentModal.value = false
  selectedBookingForAmendment.value = null
  fetchBookings()
  fetchStats()
}

// Open payment modal
const openPaymentModal = booking => {
  selectedBookingForPayment.value = booking
  showPaymentModal.value = true
}

// Handle payment updated
const handlePaymentUpdated = () => {
  fetchBookings()
  fetchStats()
}

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Format date
const formatDate = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format date with time
const formatDateTime = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format price
const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  const formatter = new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  return formatter.format(amount)
}

// Format days until
const formatDaysUntil = date => {
  if (!date) return '-'
  const now = new Date()
  const target = new Date(date)
  const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (days <= 0) return t('booking.expired')
  return `${days} ${t('booking.days')}`
}

// Get status class
const getStatusClass = status => {
  const classes = {
    draft: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    expired: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
    no_show: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  }
  return classes[status] || classes.pending
}

// Get status dot class
const getStatusDotClass = status => {
  const classes = {
    draft: 'bg-purple-500',
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500',
    expired: 'bg-gray-500',
    no_show: 'bg-orange-500'
  }
  return classes[status] || classes.pending
}

// Get status label
const getStatusLabel = status => {
  const labels = {
    draft: t('booking.status.draft'),
    pending: t('booking.status.pending'),
    confirmed: t('booking.status.confirmed'),
    completed: t('booking.status.completed'),
    cancelled: t('booking.status.cancelled'),
    expired: t('booking.status.expired'),
    no_show: t('booking.status.noShow')
  }
  return labels[status] || status
}

// Convert ISO country code to flag emoji
const getCountryFlag = countryCode => {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Country names map
const countryNames = {
  TR: 'Türkiye',
  US: 'ABD',
  GB: 'İngiltere',
  DE: 'Almanya',
  FR: 'Fransa',
  IT: 'İtalya',
  ES: 'İspanya',
  NL: 'Hollanda',
  RU: 'Rusya',
  UA: 'Ukrayna',
  PL: 'Polonya',
  CZ: 'Çekya',
  AT: 'Avusturya',
  CH: 'İsviçre',
  BE: 'Belçika',
  GR: 'Yunanistan',
  PT: 'Portekiz',
  SE: 'İsveç',
  NO: 'Norveç',
  DK: 'Danimarka',
  FI: 'Finlandiya',
  IE: 'İrlanda',
  SA: 'Suudi Arabistan',
  AE: 'BAE',
  KW: 'Kuveyt',
  QA: 'Katar',
  EG: 'Mısır',
  IL: 'İsrail',
  IR: 'İran',
  IQ: 'Irak',
  JP: 'Japonya',
  CN: 'Çin',
  KR: 'Güney Kore',
  AU: 'Avustralya',
  NZ: 'Yeni Zelanda',
  CA: 'Kanada',
  BR: 'Brezilya',
  MX: 'Meksika',
  AR: 'Arjantin',
  IN: 'Hindistan',
  PK: 'Pakistan',
  ID: 'Endonezya',
  MY: 'Malezya',
  TH: 'Tayland',
  VN: 'Vietnam',
  SG: 'Singapur',
  PH: 'Filipinler',
  ZA: 'Güney Afrika',
  NG: 'Nijerya',
  KE: 'Kenya',
  MA: 'Fas',
  TN: 'Tunus',
  DZ: 'Cezayir',
  RO: 'Romanya',
  BG: 'Bulgaristan',
  HU: 'Macaristan',
  SK: 'Slovakya',
  SI: 'Slovenya',
  HR: 'Hırvatistan',
  RS: 'Sırbistan',
  BA: 'Bosna Hersek',
  AL: 'Arnavutluk',
  MK: 'Kuzey Makedonya',
  XK: 'Kosova',
  ME: 'Karadağ',
  AZ: 'Azerbaycan',
  GE: 'Gürcistan',
  AM: 'Ermenistan',
  KZ: 'Kazakistan',
  UZ: 'Özbekistan',
  TM: 'Türkmenistan',
  KG: 'Kırgızistan',
  TJ: 'Tacikistan',
  BY: 'Belarus',
  MD: 'Moldova',
  LT: 'Litvanya',
  LV: 'Letonya',
  EE: 'Estonya',
  CY: 'Kıbrıs'
}

// Get country name from ISO code
const getCountryName = countryCode => {
  if (!countryCode) return ''
  return countryNames[countryCode.toUpperCase()] || countryCode.toUpperCase()
}

// Get room adults count
const getRoomAdults = room => {
  if (room.guests) {
    return room.guests.filter(g => g.type === 'adult').length || 1
  }
  return 2 // Default
}

// Get room children count
const getRoomChildren = room => {
  if (room.guests) {
    return room.guests.filter(g => g.type === 'child' || g.type === 'infant').length
  }
  return 0
}

// Visible pages for pagination
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }

  return pages
})

// Watch for page changes
watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>
