<template>
  <div class="space-y-4">
    <!-- Importing State -->
    <div v-if="isImporting" class="flex flex-col items-center justify-center py-12">
      <div
        class="w-16 h-16 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"
      ></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">
        {{ $t('planning.pricing.contractImport.importing') }}
      </p>
    </div>

    <!-- Success State -->
    <div v-else-if="importResult" class="text-center py-6">
      <div
        class="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-4xl text-green-600 dark:text-green-400"
          >check_circle</span
        >
      </div>
      <h4 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
        {{ $t('planning.pricing.contractImport.importSuccess') }}
      </h4>

      <!-- Detailed Results -->
      <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ importResult.roomsCreated || 0 }}
          </p>
          <p class="text-xs text-green-600/70">Yeni Oda</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ importResult.roomsUpdated || 0 }}
          </p>
          <p class="text-xs text-blue-600/70">Oda Güncellendi</p>
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ importResult.mealPlansCreated || 0 }}
          </p>
          <p class="text-xs text-amber-600/70">Yeni Pansiyon</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ importResult.seasonsCreated || 0 }}
          </p>
          <p class="text-xs text-purple-600/70">Yeni Sezon</p>
        </div>
      </div>

      <!-- Rates -->
      <div class="mt-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Fiyat Kayıtları</h5>
        <div class="flex justify-center gap-6">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ importResult.ratesCreated || importResult.created || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Oluşturuldu</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ importResult.ratesUpdated || importResult.updated || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Güncellendi</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {{ importResult.ratesSkipped || importResult.skipped || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Atlandı</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview State -->
    <div v-else class="space-y-4">
      <!-- Import Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ parsedData?.periods?.length || 0 }}
          </p>
          <p class="text-xs text-blue-600/70">Periyot</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ mappedRoomCount }}
          </p>
          <p class="text-xs text-green-600/70">Oda</p>
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ mappedMealPlanCount }}
          </p>
          <p class="text-xs text-amber-600/70">Pansiyon</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ validPricingCount }}
          </p>
          <p class="text-xs text-purple-600/70">Fiyat</p>
        </div>
      </div>

      <!-- Room Tabs -->
      <div class="bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden">
        <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="(room, index) in parsedData?.roomTypes || []"
            :key="room.contractName"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            :class="
              selectedRoomTab === index
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            "
            @click="$emit('update:selectedRoomTab', index)"
          >
            {{ room.contractName }}
            <span
              class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              :class="
                getRoomPricingCount(room) > 0
                  ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
              "
            >
              {{ getRoomPricingCount(room) }}
            </span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-4 max-h-96 overflow-auto">
          <div v-if="parsedData?.roomTypes?.[selectedRoomTab]">
            <div
              class="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-between"
            >
              <div>
                <span class="font-medium text-purple-700 dark:text-purple-300">{{
                  parsedData.roomTypes[selectedRoomTab].contractName
                }}</span>
                <span
                  v-if="parsedData.roomTypes[selectedRoomTab].matchedCode"
                  class="ml-2 text-xs text-gray-500"
                >
                  → {{ parsedData.roomTypes[selectedRoomTab].matchedCode }}
                </span>
              </div>
              <span class="text-sm text-purple-600"
                >{{ getRoomPricingCount(parsedData.roomTypes[selectedRoomTab]) }} fiyat</span
              >
            </div>

            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-gray-100 dark:bg-slate-700">
                <tr
                  class="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
                >
                  <th class="py-2 pr-4 font-semibold">Periyot</th>
                  <th class="py-2 pr-4 font-semibold">Tarih Aralığı</th>
                  <th
                    v-for="mp in parsedData?.mealPlans || []"
                    :key="mp.contractName"
                    class="py-2 pr-4 text-right font-semibold"
                  >
                    {{ mp.matchedCode || mp.contractName }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="period in parsedData?.periods"
                  :key="period.code"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td class="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                    {{ period.code }}
                    <span class="text-xs text-gray-400 ml-1">{{ period.name }}</span>
                  </td>
                  <td class="py-2 pr-4 text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(period.startDate) }} - {{ formatDate(period.endDate) }}
                  </td>
                  <td
                    v-for="mp in parsedData?.mealPlans || []"
                    :key="mp.contractName"
                    class="py-2 pr-4 text-right"
                  >
                    <template
                      v-if="getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)"
                    >
                      <div
                        v-if="
                          getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).isOBP
                        "
                        class="text-right"
                      >
                        <span
                          class="text-[8px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1 rounded font-semibold"
                          >OBP</span
                        >
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          <template
                            v-for="(price, pax) in getPriceForCell(
                              parsedData.roomTypes[selectedRoomTab],
                              mp,
                              period
                            ).occupancyPricing"
                            :key="pax"
                          >
                            <div v-if="price !== null && price !== undefined">
                              {{ pax }}P:
                              <span class="font-bold text-green-600 dark:text-green-400">{{
                                price
                              }}</span>
                            </div>
                          </template>
                        </div>
                      </div>
                      <span v-else class="font-bold text-green-600 dark:text-green-400">
                        {{
                          getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).price
                        }}
                        <span class="text-xs font-normal text-gray-400">{{
                          parsedData?.contractInfo?.currency || 'EUR'
                        }}</span>
                      </span>
                    </template>
                    <span v-else class="text-red-400 dark:text-red-500">✗</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              v-if="getRoomPricingCount(parsedData.roomTypes[selectedRoomTab]) === 0"
              class="text-center py-8"
            >
              <span class="material-icons text-4xl text-red-400">error</span>
              <p class="mt-2 text-red-600 dark:text-red-400 font-medium">
                Bu oda için HİÇ fiyat bulunamadı!
              </p>
              <p class="text-sm text-gray-500">
                AI kontratı okurken bu odayı atlamamış olabilir.
              </p>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <span class="material-icons text-4xl text-gray-300">inventory_2</span>
            <p class="mt-2 text-gray-500">Oda tipi bulunamadı</p>
          </div>
        </div>
      </div>

      <!-- Missing Prices Warning -->
      <div
        v-if="missingPricesCount > 0"
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-600">warning</span>
          <p class="text-sm text-amber-700 dark:text-amber-400">
            <strong>{{ missingPricesCount }}</strong> kombinasyon için fiyat bulunamadı. Kontratı
            kontrol edin veya eksik fiyatları manuel girin.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isImporting: { type: Boolean, default: false },
  importResult: { type: Object, default: null },
  parsedData: { type: Object, default: null },
  selectedRoomTab: { type: Number, default: 0 },
  mappedRoomCount: { type: Number, default: 0 },
  mappedMealPlanCount: { type: Number, default: 0 },
  validPricingCount: { type: Number, default: 0 },
  missingPricesCount: { type: Number, default: 0 },
  formatDate: { type: Function, required: true },
  getRoomPricingCount: { type: Function, required: true },
  getPriceForCell: { type: Function, required: true }
})

defineEmits(['update:selectedRoomTab'])
</script>
