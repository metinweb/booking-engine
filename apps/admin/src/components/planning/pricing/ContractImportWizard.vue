<template>
  <Modal
    :modelValue="show"
    size="xl"
    :title="$t('planning.pricing.contractImport.title')"
    @close="$emit('close')"
  >
    <!-- Default slot for body content -->
      <!-- Progress Steps -->
      <div class="flex items-center justify-center mb-6">
        <div class="flex items-center gap-2">
          <template v-for="(step, index) in steps" :key="step.id">
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              :class="{
                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': currentStep === index,
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': currentStep > index,
                'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400': currentStep < index
              }"
            >
              <span class="material-icons text-sm">
                {{ currentStep > index ? 'check_circle' : step.icon }}
              </span>
              <span class="hidden sm:inline">{{ step.label }}</span>
            </div>
            <span v-if="index < steps.length - 1" class="material-icons text-gray-300 dark:text-gray-600">chevron_right</span>
          </template>
        </div>
      </div>

      <!-- Step 1: Upload -->
      <div v-if="currentStep === 0" class="space-y-4">
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-all"
          :class="isDragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
        >
          <div class="flex flex-col items-center gap-3">
            <div class="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-3xl text-purple-600 dark:text-purple-400">cloud_upload</span>
            </div>
            <div>
              <p class="text-gray-700 dark:text-gray-300 font-medium">
                {{ $t('planning.pricing.contractImport.dropzone') }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ $t('planning.pricing.contractImport.supportedFormats') }}
              </p>
            </div>
            <label class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
              <span class="material-icons text-sm">folder_open</span>
              {{ $t('planning.pricing.contractImport.selectFile') }}
              <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" @change="handleFileSelect" />
            </label>
          </div>
        </div>

        <!-- Selected File Preview -->
        <div v-if="selectedFile" class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
          <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span class="material-icons text-purple-600 dark:text-purple-400">
              {{ selectedFile.type.includes('pdf') ? 'picture_as_pdf' : 'image' }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">{{ selectedFile.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button @click="selectedFile = null" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Parsing -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            {{ $t('planning.pricing.contractImport.parsing') }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {{ $t('planning.pricing.contractImport.aiAnalyzing') }}
          </p>
        </div>

        <div v-else-if="parseError" class="text-center py-8">
          <div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span class="material-icons text-3xl text-red-600 dark:text-red-400">error</span>
          </div>
          <p class="mt-4 text-red-600 dark:text-red-400 font-medium">
            {{ $t('planning.pricing.contractImport.parseFailed') }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ parseError }}</p>
          <button
            @click="currentStep = 0"
            class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            {{ $t('common.tryAgain') }}
          </button>
        </div>

        <div v-else-if="parsedData" class="space-y-4">
          <!-- Contract Info -->
          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4">
            <div class="flex items-center gap-3 mb-3">
              <span class="material-icons text-purple-600 dark:text-purple-400">info</span>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.contractImport.contractInfo') }}</h4>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('planning.pricing.contractImport.hotelName') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ parsedData.contractInfo?.hotelName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('planning.pricing.contractImport.validPeriod') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(parsedData.contractInfo?.validFrom) }} - {{ formatDate(parsedData.contractInfo?.validTo) }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('planning.pricing.contractImport.currency') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ parsedData.contractInfo?.currency || 'EUR' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('planning.pricing.contractImport.confidence') }}</span>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="getConfidenceColor(parsedData.confidence?.overall)"
                      :style="{ width: `${parsedData.confidence?.overall || 0}%` }"
                    ></div>
                  </div>
                  <span class="text-xs font-medium">{{ parsedData.confidence?.overall || 0 }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ parsedData.periods?.length || 0 }}</p>
              <p class="text-xs text-blue-600/70 dark:text-blue-400/70">{{ $t('planning.pricing.contractImport.periods') }}</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ parsedData.roomTypes?.length || 0 }}</p>
              <p class="text-xs text-green-600/70 dark:text-green-400/70">{{ $t('planning.pricing.contractImport.roomTypes') }}</p>
            </div>
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ parsedData.mealPlans?.length || 0 }}</p>
              <p class="text-xs text-amber-600/70 dark:text-amber-400/70">{{ $t('planning.pricing.contractImport.mealPlans') }}</p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ parsedData.pricing?.length || 0 }}</p>
              <p class="text-xs text-purple-600/70 dark:text-purple-400/70">{{ $t('planning.pricing.contractImport.priceEntries') }}</p>
            </div>
          </div>

          <!-- Warnings -->
          <div v-if="parsedData.warnings?.length" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-amber-600 dark:text-amber-400">warning</span>
              <h4 class="font-semibold text-amber-800 dark:text-amber-300">{{ $t('planning.pricing.contractImport.warnings') }}</h4>
            </div>
            <ul class="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li v-for="(warning, index) in parsedData.warnings" :key="index">{{ warning }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Step 3: Mapping -->
      <div v-if="currentStep === 2" class="space-y-6">
        <!-- Contract Info Summary -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fiyatlandırma Tipi</span>
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ hasOBPPricing ? '👤 Kişi Bazlı' : '🏠 Ünite Bazlı' }}
                </p>
                <span v-if="hasOBPPricing" class="px-1.5 py-0.5 text-xs rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 font-semibold">OBP</span>
              </div>
            </div>
            <div v-if="parsedData?.contractInfo?.childAgeRanges?.length">
              <span class="text-gray-500 dark:text-gray-400">Çocuk Yaşları</span>
              <p class="font-medium text-gray-900 dark:text-white text-xs">
                {{ parsedData.contractInfo.childAgeRanges.map(r => `${r.minAge}-${r.maxAge}`).join(', ') }}
              </p>
            </div>
            <div v-if="hasOBPPricing">
              <span class="text-gray-500 dark:text-gray-400">OBP Fiyat Aralığı</span>
              <p class="font-medium text-gray-900 dark:text-white text-xs">
                {{ obpOccupancyRange }}
              </p>
            </div>
          </div>
        </div>

        <!-- Season Info (will be created) -->
        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span class="material-icons text-purple-600">event</span>
            Oluşturulacak Sezon
          </h4>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <p class="text-lg font-bold text-purple-700 dark:text-purple-300">{{ seasonYear }} Sezonu</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(seasonStartDate) }} → {{ formatDate(seasonEndDate) }}
                <span class="text-xs text-gray-500">({{ seasonDays }} gün)</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ parsedData?.periods?.length || 0 }} farklı fiyat dönemi</p>
            </div>
          </div>
        </div>

        <!-- Periods (Price Periods within the season) -->
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span class="material-icons text-blue-600">payments</span>
            Fiyat Dönemleri ({{ parsedData?.periods?.length || 0 }})
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            <div
              v-for="period in parsedData?.periods"
              :key="period.code"
              class="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm"
            >
              <span class="w-10 h-6 rounded text-xs flex items-center justify-center font-mono bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">{{ period.code }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate">{{ period.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(period.startDate) }} → {{ formatDate(period.endDate) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Room Type Mappings -->
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span class="material-icons text-green-600">hotel</span>
            {{ $t('planning.pricing.contractImport.roomMappings') }}
            <span class="text-xs font-normal text-gray-500">({{ newRoomCount }} yeni, {{ existingRoomCount }} mevcut)</span>
            <span
              v-if="roomMappingPercentage > 0"
              class="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
              :class="roomMappingPercentage >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : roomMappingPercentage >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            >
              %{{ roomMappingPercentage }} eşleşti
            </span>
          </h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="room in parsedData?.roomTypes"
              :key="room.contractName"
              class="flex items-center gap-3 p-3 rounded-lg"
              :class="room.isNewRoom ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-800'"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ room.contractName }}</p>
                  <span v-if="room.isNewRoom" class="px-1.5 py-0.5 text-xs rounded bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">YENİ</span>
                </div>
                <p v-if="room.capacity" class="text-xs text-gray-500 dark:text-gray-400">
                  standart: {{ room.capacity.maxAdults }} kişi
                  <span v-if="room.capacity.maxOccupancy && room.capacity.maxOccupancy > room.capacity.maxAdults">
                    → max: {{ room.capacity.maxOccupancy }} kişi
                  </span>
                </p>
              </div>
              <span class="material-icons text-gray-400">arrow_forward</span>
              <div class="flex-1">
                <select
                  v-model="roomMappings[room.contractName]"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  <option value="">{{ $t('planning.pricing.contractImport.skipRoom') }}</option>
                  <!-- Existing room types -->
                  <optgroup v-if="existingRoomTypes.length" label="Mevcut Odalar">
                    <option v-for="rt in existingRoomTypes" :key="rt.code" :value="rt.code">
                      {{ rt.code }} - {{ getLocalizedName(rt.name) }}
                    </option>
                  </optgroup>
                  <!-- New room option (will be created) -->
                  <optgroup v-if="room.isNewRoom && room.suggestedCode" label="Yeni Oluşturulacak">
                    <option :value="room.suggestedCode">
                      {{ room.suggestedCode }} - {{ room.contractName }} (YENİ)
                    </option>
                  </optgroup>
                </select>
              </div>
              <div class="w-16 text-center">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getConfidenceBadgeClass(room.confidence)"
                >
                  {{ room.confidence }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Meal Plan Mappings -->
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span class="material-icons text-amber-600">restaurant</span>
            {{ $t('planning.pricing.contractImport.mealPlanMappings') }}
            <span class="text-xs font-normal text-gray-500">({{ newMealPlanCount }} yeni, {{ existingMealPlanCount }} mevcut)</span>
            <span
              v-if="mealPlanMappingPercentage > 0"
              class="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
              :class="mealPlanMappingPercentage >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : mealPlanMappingPercentage >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            >
              %{{ mealPlanMappingPercentage }} eşleşti
            </span>
          </h4>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="mp in parsedData?.mealPlans"
              :key="mp.contractName"
              class="flex items-center gap-3 p-3 rounded-lg"
              :class="mp.isNewMealPlan ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-slate-800'"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ mp.contractName }}</p>
                  <span v-if="mp.isNewMealPlan" class="px-1.5 py-0.5 text-xs rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">YENİ</span>
                  <span v-if="mp.matchedCode" class="text-xs text-gray-500">→ {{ mp.matchedCode }}</span>
                </div>
              </div>
              <span class="material-icons text-gray-400">arrow_forward</span>
              <div class="flex-1">
                <select
                  v-model="mealPlanMappings[mp.contractName]"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  <option value="">{{ $t('planning.pricing.contractImport.skipMealPlan') }}</option>
                  <!-- Existing meal plans -->
                  <optgroup v-if="existingMealPlans.length" label="Mevcut Pansiyonlar">
                    <option v-for="plan in existingMealPlans" :key="plan.code" :value="plan.code">
                      {{ plan.code }} - {{ getLocalizedName(plan.name) }}
                    </option>
                  </optgroup>
                  <!-- New meal plan option (will be created) -->
                  <optgroup v-if="mp.isNewMealPlan && mp.suggestedCode" label="Yeni Oluşturulacak">
                    <option :value="mp.suggestedCode">
                      {{ mp.suggestedCode }} - {{ mp.contractName }} (YENİ)
                    </option>
                  </optgroup>
                </select>
              </div>
              <div class="w-16 text-center">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getConfidenceBadgeClass(mp.confidence)"
                >
                  {{ mp.confidence }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div class="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span class="material-icons text-purple-600">settings</span>
            {{ $t('planning.pricing.contractImport.importOptions') }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Checkboxes -->
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="importOptions.overwriteExisting" class="w-4 h-4 rounded text-purple-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ $t('planning.pricing.contractImport.overwriteExisting') }}</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="importOptions.createMissingRooms" class="w-4 h-4 rounded text-green-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Eksik odaları oluştur</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="importOptions.createMissingMealPlans" class="w-4 h-4 rounded text-amber-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Eksik pansiyonları oluştur</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="importOptions.updateRoomCapacity" class="w-4 h-4 rounded text-blue-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Oda kapasitelerini güncelle</span>
              </label>
            </div>
            <!-- Numbers -->
            <div class="space-y-3">
              <div class="flex items-center gap-4">
                <label class="text-sm text-gray-600 dark:text-gray-400 flex-1">{{ $t('planning.pricing.contractImport.defaultAllotment') }}</label>
                <input
                  type="number"
                  v-model.number="importOptions.defaultAllotment"
                  min="1"
                  max="100"
                  class="w-20 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-center"
                />
              </div>
              <div class="flex items-center gap-4">
                <label class="text-sm text-gray-600 dark:text-gray-400 flex-1">{{ $t('planning.pricing.contractImport.defaultMinStay') }}</label>
                <input
                  type="number"
                  v-model.number="importOptions.defaultMinStay"
                  min="1"
                  max="30"
                  class="w-20 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Confirm & Import -->
      <div v-if="currentStep === 3" class="space-y-4">
        <div v-if="isImporting" class="flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            {{ $t('planning.pricing.contractImport.importing') }}
          </p>
        </div>

        <div v-else-if="importResult" class="text-center py-6">
          <div class="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span class="material-icons text-4xl text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <h4 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            {{ $t('planning.pricing.contractImport.importSuccess') }}
          </h4>

          <!-- Detailed Results -->
          <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <!-- Rooms -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ importResult.roomsCreated || 0 }}</p>
              <p class="text-xs text-green-600/70">Yeni Oda</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ importResult.roomsUpdated || 0 }}</p>
              <p class="text-xs text-blue-600/70">Oda Güncellendi</p>
            </div>
            <!-- Meal Plans -->
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ importResult.mealPlansCreated || 0 }}</p>
              <p class="text-xs text-amber-600/70">Yeni Pansiyon</p>
            </div>
            <!-- Seasons -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ importResult.seasonsCreated || 0 }}</p>
              <p class="text-xs text-purple-600/70">Yeni Sezon</p>
            </div>
          </div>

          <!-- Rates -->
          <div class="mt-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Fiyat Kayıtları</h5>
            <div class="flex justify-center gap-6">
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ importResult.ratesCreated || importResult.created || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Oluşturuldu</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ importResult.ratesUpdated || importResult.updated || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Güncellendi</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ importResult.ratesSkipped || importResult.skipped || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Atlandı</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- Import Summary Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ parsedData?.periods?.length || 0 }}</p>
              <p class="text-xs text-blue-600/70">Periyot</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ mappedRoomCount }}</p>
              <p class="text-xs text-green-600/70">Oda</p>
            </div>
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ mappedMealPlanCount }}</p>
              <p class="text-xs text-amber-600/70">Pansiyon</p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ validPricingCount }}</p>
              <p class="text-xs text-purple-600/70">Fiyat</p>
            </div>
          </div>

          <!-- Room Tabs - TÜM ODALAR -->
          <div class="bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden">
            <!-- Tab Headers -->
            <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
              <button
                v-for="(room, index) in parsedData?.roomTypes || []"
                :key="room.contractName"
                @click="selectedRoomTab = index"
                class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                :class="selectedRoomTab === index
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
              >
                {{ room.contractName }}
                <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs" :class="getRoomPricingCount(room) > 0 ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'">
                  {{ getRoomPricingCount(room) }}
                </span>
              </button>
            </div>

            <!-- Tab Content - Period Table -->
            <div class="p-4 max-h-96 overflow-auto">
              <div v-if="parsedData?.roomTypes?.[selectedRoomTab]">
                <!-- Room Info -->
                <div class="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-between">
                  <div>
                    <span class="font-medium text-purple-700 dark:text-purple-300">{{ parsedData.roomTypes[selectedRoomTab].contractName }}</span>
                    <span v-if="parsedData.roomTypes[selectedRoomTab].matchedCode" class="ml-2 text-xs text-gray-500">
                      → {{ parsedData.roomTypes[selectedRoomTab].matchedCode }}
                    </span>
                  </div>
                  <span class="text-sm text-purple-600">{{ getRoomPricingCount(parsedData.roomTypes[selectedRoomTab]) }} fiyat</span>
                </div>

                <table class="w-full text-sm">
                  <thead class="sticky top-0 bg-gray-100 dark:bg-slate-700">
                    <tr class="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      <th class="py-2 pr-4 font-semibold">Periyot</th>
                      <th class="py-2 pr-4 font-semibold">Tarih Aralığı</th>
                      <th v-for="mp in parsedData?.mealPlans || []" :key="mp.contractName" class="py-2 pr-4 text-right font-semibold">
                        {{ mp.matchedCode || mp.contractName }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="period in parsedData?.periods" :key="period.code" class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td class="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                        {{ period.code }}
                        <span class="text-xs text-gray-400 ml-1">{{ period.name }}</span>
                      </td>
                      <td class="py-2 pr-4 text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(period.startDate) }} - {{ formatDate(period.endDate) }}
                      </td>
                      <td v-for="mp in parsedData?.mealPlans || []" :key="mp.contractName" class="py-2 pr-4 text-right">
                        <template v-if="getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)">
                          <!-- OBP Price Display -->
                          <div v-if="getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).isOBP" class="text-right">
                            <span class="text-[8px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1 rounded font-semibold">OBP</span>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                              <template v-for="(price, pax) in getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).occupancyPricing" :key="pax">
                                <div v-if="price !== null && price !== undefined">{{ pax }}P: <span class="font-bold text-green-600 dark:text-green-400">{{ price }}</span></div>
                              </template>
                            </div>
                          </div>
                          <!-- Unit Price Display -->
                          <span v-else class="font-bold text-green-600 dark:text-green-400">
                            {{ getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).price }}
                            <span class="text-xs font-normal text-gray-400">{{ parsedData?.contractInfo?.currency || 'EUR' }}</span>
                          </span>
                        </template>
                        <span v-else class="text-red-400 dark:text-red-500">✗</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- No data warning -->
                <div v-if="getRoomPricingCount(parsedData.roomTypes[selectedRoomTab]) === 0" class="text-center py-8">
                  <span class="material-icons text-4xl text-red-400">error</span>
                  <p class="mt-2 text-red-600 dark:text-red-400 font-medium">Bu oda için HİÇ fiyat bulunamadı!</p>
                  <p class="text-sm text-gray-500">AI kontratı okurken bu odayı atlamamış olabilir.</p>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else class="text-center py-8">
                <span class="material-icons text-4xl text-gray-300">inventory_2</span>
                <p class="mt-2 text-gray-500">Oda tipi bulunamadı</p>
              </div>
            </div>
          </div>

          <!-- Import Summary Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Room Capacities -->
            <div v-if="roomCapacityChanges.length > 0" class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h5 class="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <span class="material-icons text-sm">people</span>
                Oda Kapasiteleri Güncellenecek
              </h5>
              <div class="space-y-1 text-sm">
                <div v-for="room in roomCapacityChanges" :key="room.code" class="flex justify-between items-center py-1">
                  <span class="text-gray-600 dark:text-gray-400">{{ room.name }}</span>
                  <span class="text-blue-600 dark:text-blue-400 text-xs">
                    standart: {{ room.capacity.maxAdults }} kişi
                    <span v-if="room.capacity.maxOccupancy && room.capacity.maxOccupancy > room.capacity.maxAdults">
                      → max: {{ room.capacity.maxOccupancy }} kişi
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Minimum Stay Requirements -->
            <div v-if="minStayPeriods.length > 0" class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
              <h5 class="font-medium text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                <span class="material-icons text-sm">nights_stay</span>
                Minimum Konaklama Şartları
              </h5>
              <div class="space-y-1 text-sm">
                <div v-for="period in minStayPeriods" :key="period.code" class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">{{ period.name || period.code }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-orange-600 dark:text-orange-400 font-medium">
                      min. {{ period.minStay }} gece
                    </span>
                    <span v-if="period.fromWarnings" class="text-xs text-gray-400" title="Uyarılardan çıkarıldı">
                      (uyarıdan)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- EB Discounts -->
            <div v-if="ebDiscounts.length > 0" class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 md:col-span-2">
              <h5 class="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <span class="material-icons text-sm">local_offer</span>
                Erken Rezervasyon (EB) İndirimleri
              </h5>
              <div class="space-y-2 text-sm">
                <div v-for="(eb, index) in ebDiscounts" :key="index" class="bg-white dark:bg-slate-700 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-green-700 dark:text-green-400">{{ eb.name || `EB %${eb.discountPercentage}` }}</span>
                    <span class="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs font-bold">
                      %{{ eb.discountPercentage }} İndirim
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <span class="text-gray-400">Satış:</span>
                      {{ formatDate(eb.salePeriod?.startDate) }} - {{ formatDate(eb.salePeriod?.endDate) }}
                    </div>
                    <div>
                      <span class="text-gray-400">Konaklama:</span>
                      {{ formatDate(eb.stayPeriod?.startDate) }} - {{ formatDate(eb.stayPeriod?.endDate) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Extra Person Pricing -->
            <div v-if="extraPersonPricing.length > 0" class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 md:col-span-2">
              <h5 class="font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                <span class="material-icons text-sm">person_add</span>
                Ekstra Kişi Fiyatları
              </h5>
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="text-left text-gray-500 dark:text-gray-400">
                      <th class="pb-2">Oda</th>
                      <th class="pb-2">Periyot</th>
                      <th class="pb-2 text-right">Ekstra Yetişkin</th>
                      <th class="pb-2 text-right">1. Çocuk</th>
                      <th class="pb-2 text-right">2. Çocuk</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(price, index) in extraPersonPricing" :key="index" class="border-t border-gray-200 dark:border-gray-600">
                      <td class="py-1 text-gray-700 dark:text-gray-300">{{ price.roomName }}</td>
                      <td class="py-1 text-gray-500 dark:text-gray-400">{{ price.periodName }}</td>
                      <td class="py-1 text-right text-purple-600 dark:text-purple-400 font-medium">
                        {{ price.extraAdult ? formatPrice(price.extraAdult) : '-' }}
                      </td>
                      <td class="py-1 text-right text-purple-600 dark:text-purple-400">
                        {{ price.extraChild?.[0] ? formatPrice(price.extraChild[0]) : '-' }}
                      </td>
                      <td class="py-1 text-right text-purple-600 dark:text-purple-400">
                        {{ price.extraChild?.[1] ? formatPrice(price.extraChild[1]) : '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Missing Prices Warning -->
          <div v-if="missingPricesCount > 0" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-600">warning</span>
              <p class="text-sm text-amber-700 dark:text-amber-400">
                <strong>{{ missingPricesCount }}</strong> kombinasyon için fiyat bulunamadı.
                Kontratı kontrol edin veya eksik fiyatları manuel girin.
              </p>
            </div>
          </div>
        </div>
      </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <button
          v-if="currentStep > 0 && !importResult"
          @click="currentStep--"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span class="material-icons text-sm align-middle mr-1">arrow_back</span>
          {{ $t('common.back') }}
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {{ importResult ? $t('common.close') : $t('common.cancel') }}
          </button>

          <button
            v-if="currentStep === 0"
            @click="startParsing"
            :disabled="!selectedFile"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span class="material-icons text-sm">auto_awesome</span>
            {{ $t('planning.pricing.contractImport.analyzeContract') }}
          </button>

          <button
            v-else-if="currentStep === 1 && parsedData"
            @click="currentStep = 2"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {{ $t('common.next') }}
            <span class="material-icons text-sm">arrow_forward</span>
          </button>

          <button
            v-else-if="currentStep === 2"
            @click="currentStep = 3"
            :disabled="mappedRoomCount === 0 || mappedMealPlanCount === 0"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {{ $t('common.next') }}
            <span class="material-icons text-sm">arrow_forward</span>
          </button>

          <button
            v-else-if="currentStep === 3 && !importResult"
            @click="executeImport"
            :disabled="isImporting"
            class="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span class="material-icons text-sm">download</span>
            {{ $t('planning.pricing.contractImport.startImport') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useDate } from '@/composables/useDate'
import Modal from '@/components/common/Modal.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  show: { type: Boolean, default: false },
  hotelId: { type: String, required: true }
})

const emit = defineEmits(['close', 'imported'])

const { t, locale } = useI18n()
const toast = useToast()
const { formatDisplayDate } = useDate()

// Helper to get localized name from multilingual object
const getLocalizedName = (nameObj) => {
  if (!nameObj) return ''
  if (typeof nameObj === 'string') return nameObj
  return nameObj[locale.value] || nameObj.tr || nameObj.en || Object.values(nameObj)[0] || ''
}

// Steps
const steps = [
  { id: 'upload', label: t('planning.pricing.contractImport.stepUpload'), icon: 'upload_file' },
  { id: 'parse', label: t('planning.pricing.contractImport.stepParse'), icon: 'auto_awesome' },
  { id: 'map', label: t('planning.pricing.contractImport.stepMap'), icon: 'compare_arrows' },
  { id: 'import', label: t('planning.pricing.contractImport.stepImport'), icon: 'download' }
]

const stepDescriptions = computed(() => [
  t('planning.pricing.contractImport.stepUploadDesc'),
  t('planning.pricing.contractImport.stepParseDesc'),
  t('planning.pricing.contractImport.stepMapDesc'),
  t('planning.pricing.contractImport.stepImportDesc')
])

// State
const currentStep = ref(0)
const selectedFile = ref(null)
const isDragging = ref(false)
const isLoading = ref(false)
const isImporting = ref(false)
const parseError = ref(null)
const parsedData = ref(null)
const importResult = ref(null)
const selectedRoomTab = ref(0)

// Mappings
const roomMappings = ref({})
const mealPlanMappings = ref({})
const importOptions = ref({
  overwriteExisting: false,
  createMissingRooms: true,
  createMissingMealPlans: true,
  updateRoomCapacity: true,
  defaultAllotment: 10,
  defaultMinStay: 1
})

// Computed
const existingRoomTypes = computed(() => parsedData.value?.existingRoomTypes || [])
const existingMealPlans = computed(() => parsedData.value?.existingMealPlans || [])

const mappedRoomCount = computed(() => Object.values(roomMappings.value).filter(v => v).length)
const mappedMealPlanCount = computed(() => Object.values(mealPlanMappings.value).filter(v => v).length)

// New/existing room and meal plan counts
const newRoomCount = computed(() => parsedData.value?.roomTypes?.filter(r => r.isNewRoom).length || 0)
const existingRoomCount = computed(() => parsedData.value?.roomTypes?.filter(r => !r.isNewRoom).length || 0)
const newMealPlanCount = computed(() => parsedData.value?.mealPlans?.filter(m => m.isNewMealPlan).length || 0)
const existingMealPlanCount = computed(() => parsedData.value?.mealPlans?.filter(m => !m.isNewMealPlan).length || 0)

// Season date range (calculated from all periods)
const seasonStartDate = computed(() => {
  if (!parsedData.value?.periods?.length) return null
  const dates = parsedData.value.periods.map(p => new Date(p.startDate))
  return new Date(Math.min(...dates))
})

const seasonEndDate = computed(() => {
  if (!parsedData.value?.periods?.length) return null
  const dates = parsedData.value.periods.map(p => new Date(p.endDate))
  return new Date(Math.max(...dates))
})

const seasonYear = computed(() => {
  return seasonStartDate.value ? seasonStartDate.value.getFullYear() : new Date().getFullYear()
})

const seasonDays = computed(() => {
  if (!seasonStartDate.value || !seasonEndDate.value) return 0
  const diffTime = Math.abs(seasonEndDate.value - seasonStartDate.value)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
})

const validPricingCount = computed(() => {
  if (!parsedData.value?.pricing) return 0
  return parsedData.value.pricing.filter(p => {
    // Find the room that matches this pricing entry
    const room = parsedData.value.roomTypes?.find(r => {
      const roomCodes = [r.matchedCode, r.contractCode, r.suggestedCode, r.contractName].filter(Boolean)
      return roomCodes.some(code => p.roomCode === code || p.roomCode?.toLowerCase() === code?.toLowerCase())
    })
    // Find the meal plan that matches this pricing entry
    const mealPlan = parsedData.value.mealPlans?.find(mp => {
      const mealCodes = [mp.matchedCode, mp.contractCode, mp.suggestedCode, mp.contractName].filter(Boolean)
      return mealCodes.some(code => p.mealPlanCode === code || p.mealPlanCode?.toLowerCase() === code?.toLowerCase())
    })
    // Check if both are mapped
    const roomMapped = room && roomMappings.value[room.contractName]
    const mealMapped = mealPlan && mealPlanMappings.value[mealPlan.contractName]
    return roomMapped && mealMapped
  }).length
})

const previewPricing = computed(() => {
  if (!parsedData.value?.pricing) return []
  return parsedData.value.pricing.slice(0, 5)
})

// Room mapping percentage (how many rooms have a mapping - including new rooms)
const roomMappingPercentage = computed(() => {
  const total = parsedData.value?.roomTypes?.length || 0
  if (total === 0) return 0
  const matched = parsedData.value.roomTypes.filter(r => roomMappings.value[r.contractName]).length
  return Math.round((matched / total) * 100)
})

// Meal plan mapping percentage (how many meal plans have a mapping)
const mealPlanMappingPercentage = computed(() => {
  const total = parsedData.value?.mealPlans?.length || 0
  if (total === 0) return 0
  const matched = parsedData.value.mealPlans.filter(m => mealPlanMappings.value[m.contractName]).length
  return Math.round((matched / total) * 100)
})

// Get mapped rooms (rooms that have a mapping selected)
const mappedRooms = computed(() => {
  if (!parsedData.value?.roomTypes) return []
  return parsedData.value.roomTypes.filter(room =>
    roomMappings.value[room.contractName]
  )
})

// Get mapped meal plans
const mappedMealPlans = computed(() => {
  if (!parsedData.value?.mealPlans) return []
  return parsedData.value.mealPlans.filter(mp =>
    mealPlanMappings.value[mp.contractName]
  )
})

// Count missing prices (expected combinations without a price)
const missingPricesCount = computed(() => {
  if (!parsedData.value?.periods || !mappedRooms.value.length || !mappedMealPlans.value.length) return 0

  const periodsCount = parsedData.value.periods.length
  const roomsCount = mappedRooms.value.length
  const mealPlansCount = mappedMealPlans.value.length

  const expectedCombinations = periodsCount * roomsCount * mealPlansCount
  return expectedCombinations - validPricingCount.value
})

// Get price count for a specific room
const getRoomPricingCount = (room) => {
  if (!parsedData.value?.pricing || !room) return 0
  return parsedData.value.pricing.filter(p => {
    // Check all possible room code matches
    const roomCodes = [room.matchedCode, room.contractCode, room.suggestedCode, room.contractName].filter(Boolean)
    return roomCodes.some(code => p.roomCode === code || p.roomCode?.toLowerCase() === code?.toLowerCase())
  }).length
}

// Check if contract has OBP (per_person) pricing
const hasOBPPricing = computed(() => {
  if (!parsedData.value?.pricing) return false
  return parsedData.value.pricing.some(p =>
    p.pricingType === 'per_person' || p.occupancyPricing
  ) || parsedData.value.contractInfo?.pricingType === 'per_person'
})

// Get OBP occupancy range (e.g., "1-4 Yetişkin")
const obpOccupancyRange = computed(() => {
  if (!hasOBPPricing.value || !parsedData.value?.pricing) return ''

  let minPax = 10
  let maxPax = 1

  for (const price of parsedData.value.pricing) {
    if (price.occupancyPricing) {
      for (let pax = 1; pax <= 10; pax++) {
        if (price.occupancyPricing[pax] !== null && price.occupancyPricing[pax] !== undefined) {
          minPax = Math.min(minPax, pax)
          maxPax = Math.max(maxPax, pax)
        }
      }
    }
  }

  if (minPax > maxPax) return ''
  return `${minPax}-${maxPax} Yetişkin`
})

// Get price for a specific cell (room + mealplan + period)
const getPriceForCell = (room, mealPlan, period) => {
  if (!parsedData.value?.pricing || !room || !mealPlan || !period) return null

  const price = parsedData.value.pricing.find(p => {
    // All possible room codes
    const roomCodes = [room.matchedCode, room.contractCode, room.suggestedCode, room.contractName].filter(Boolean)
    const roomMatch = roomCodes.some(code => p.roomCode === code || p.roomCode?.toLowerCase() === code?.toLowerCase())

    // All possible meal plan codes
    const mealCodes = [mealPlan.matchedCode, mealPlan.contractCode, mealPlan.suggestedCode, mealPlan.contractName].filter(Boolean)
    const mealMatch = mealCodes.some(code => p.mealPlanCode === code || p.mealPlanCode?.toLowerCase() === code?.toLowerCase())

    // Period match
    const periodMatch = p.periodCode === period.code || p.periodCode?.toLowerCase() === period.code?.toLowerCase()

    return roomMatch && mealMatch && periodMatch
  })

  if (!price) return null

  // Return object with price info including OBP data
  if (price.pricingType === 'per_person' || price.occupancyPricing) {
    return {
      isOBP: true,
      occupancyPricing: price.occupancyPricing,
      price: null
    }
  }

  return {
    isOBP: false,
    price: price.pricePerNight,
    occupancyPricing: null
  }
}

// Rooms with capacity data
const roomCapacityChanges = computed(() => {
  if (!parsedData.value?.roomTypes) return []
  return parsedData.value.roomTypes
    .filter(room => room.capacity && (room.capacity.maxAdults || room.capacity.maxChildren))
    .map(room => ({
      code: room.contractCode || room.matchedCode || room.suggestedCode,
      name: room.contractName,
      capacity: room.capacity
    }))
})

// Periods with minStay > 1 - check both periods and warnings
const minStayPeriods = computed(() => {
  if (!parsedData.value?.periods) return []

  const periods = parsedData.value.periods
  const warnings = parsedData.value.warnings || []
  const result = []
  let defaultMinStay = null

  // Parse warnings for minStay info
  const periodMinStayFromWarnings = {}

  for (const warning of warnings) {
    if (typeof warning !== 'string') continue

    // Check for "diğer tarih" pattern (default minStay)
    const defaultMatch = warning.match(/diğer\s+tarih[^\d]*(\d+)\s*gece/i)
    if (defaultMatch) {
      defaultMinStay = parseInt(defaultMatch[1], 10)
    }

    // Check for specific date ranges with minStay
    const minStayMatch = warning.match(/minimum\s+(\d+)\s*gece/i)
    if (!minStayMatch) continue

    const minStayValue = parseInt(minStayMatch[1], 10)

    // Extract date ranges (DD.MM or DD.MM.YYYY format)
    const dateRangePattern = /(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\s*[-–]\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/g
    let dateMatch

    while ((dateMatch = dateRangePattern.exec(warning)) !== null) {
      const startDay = parseInt(dateMatch[1], 10)
      const startMonth = parseInt(dateMatch[2], 10)
      const startYear = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear()
      const endDay = parseInt(dateMatch[4], 10)
      const endMonth = parseInt(dateMatch[5], 10)
      const endYear = dateMatch[6] ? parseInt(dateMatch[6], 10) : new Date().getFullYear()

      const rangeStart = new Date(startYear, startMonth - 1, startDay)
      const rangeEnd = new Date(endYear, endMonth - 1, endDay)

      // Match to periods
      for (const period of periods) {
        const periodStart = new Date(period.startDate)
        const periodEnd = new Date(period.endDate)

        const overlaps =
          (rangeStart <= periodEnd && rangeEnd >= periodStart) ||
          (Math.abs(rangeStart - periodStart) < 3 * 24 * 60 * 60 * 1000)

        if (overlaps && !periodMinStayFromWarnings[period.code]) {
          periodMinStayFromWarnings[period.code] = minStayValue
        }
      }
    }
  }

  // Combine periods minStay with warnings minStay
  for (const period of periods) {
    const minStay = period.minStay || periodMinStayFromWarnings[period.code] || defaultMinStay
    if (minStay && minStay > 1) {
      result.push({
        code: period.code,
        name: period.name,
        minStay,
        fromWarnings: !period.minStay && (periodMinStayFromWarnings[period.code] || defaultMinStay)
      })
    }
  }

  return result
})

// EB discounts from contract - normalize different formats
const ebDiscounts = computed(() => {
  if (!parsedData.value?.earlyBookingDiscounts) return []

  return parsedData.value.earlyBookingDiscounts
    .filter(eb => eb.discountPercentage > 0)
    .map(eb => {
      // Normalize different AI response formats
      let salePeriod, stayPeriod

      if (eb.salePeriod?.startDate) {
        salePeriod = eb.salePeriod
      } else if (eb.bookingUntil) {
        // bookingUntil format - sale ends at this date
        salePeriod = {
          startDate: new Date().toISOString().split('T')[0],
          endDate: eb.bookingUntil
        }
      }

      if (eb.stayPeriod?.startDate) {
        stayPeriod = eb.stayPeriod
      } else {
        // Default to full season
        stayPeriod = {
          startDate: parsedData.value.contractInfo?.validFrom || seasonStartDate.value?.toISOString().split('T')[0],
          endDate: parsedData.value.contractInfo?.validTo || seasonEndDate.value?.toISOString().split('T')[0]
        }
      }

      return {
        ...eb,
        salePeriod,
        stayPeriod
      }
    })
})

// Extra person pricing from contract
const extraPersonPricing = computed(() => {
  if (!parsedData.value?.pricing) return []

  const result = []
  const periods = parsedData.value.periods || []
  const rooms = parsedData.value.roomTypes || []

  // Create lookup maps
  const periodMap = {}
  periods.forEach(p => { periodMap[p.code] = p.name || p.code })

  const roomMap = {}
  rooms.forEach(r => { roomMap[r.contractCode || r.suggestedCode] = r.contractName })

  // Filter pricing entries that have extra person pricing
  for (const price of parsedData.value.pricing) {
    if (price.extraAdult || (price.extraChild && price.extraChild.length > 0)) {
      result.push({
        roomCode: price.roomCode,
        roomName: roomMap[price.roomCode] || price.roomCode,
        periodCode: price.periodCode,
        periodName: periodMap[price.periodCode] || price.periodCode,
        extraAdult: price.extraAdult,
        extraChild: price.extraChild,
        extraInfant: price.extraInfant
      })
    }
  }

  return result
})

// Format price helper
const formatPrice = (value) => {
  if (!value && value !== 0) return '-'
  const currency = parsedData.value?.contractInfo?.currency || 'TRY'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Watch for reset
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetWizard()
  }
})

// Methods
const resetWizard = () => {
  currentStep.value = 0
  selectedFile.value = null
  isDragging.value = false
  isLoading.value = false
  isImporting.value = false
  parseError.value = null
  parsedData.value = null
  importResult.value = null
  roomMappings.value = {}
  mealPlanMappings.value = {}
  selectedRoomTab.value = 0
  importOptions.value = {
    overwriteExisting: false,
    createMissingRooms: true,
    createMissingMealPlans: true,
    updateRoomCapacity: true,
    defaultAllotment: 10,
    defaultMinStay: 1
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleFileDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (validTypes.includes(file.type) || file.name.endsWith('.pdf')) {
      selectedFile.value = file
    } else {
      toast.error(t('planning.pricing.contractImport.invalidFileType'))
    }
  }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// formatDate replaced by useDate composable's formatDisplayDate
const formatDate = formatDisplayDate

const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return 'bg-green-500'
  if (confidence >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

const getConfidenceBadgeClass = (confidence) => {
  if (confidence >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (confidence >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const startParsing = async () => {
  if (!selectedFile.value) return

  currentStep.value = 1
  isLoading.value = true
  parseError.value = null

  try {
    // Convert file to base64
    const fileContent = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(selectedFile.value)
    })

    const response = await planningService.parseContract(
      props.hotelId,
      fileContent,
      selectedFile.value.type,
      selectedFile.value.name
    )

    if (response.success) {
      parsedData.value = response.data

      // Auto-fill mappings based on AI matches
      if (response.data.roomTypes) {
        response.data.roomTypes.forEach(room => {
          if (room.isNewRoom) {
            // New rooms - use suggested code
            if (room.suggestedCode) {
              roomMappings.value[room.contractName] = room.suggestedCode
            }
          } else if (room.matchedCode) {
            // Existing rooms - use matched code
            roomMappings.value[room.contractName] = room.matchedCode
          }
        })
      }

      if (response.data.mealPlans) {
        response.data.mealPlans.forEach(mp => {
          if (mp.isNewMealPlan) {
            // New meal plans - use suggested code
            if (mp.suggestedCode) {
              mealPlanMappings.value[mp.contractName] = mp.suggestedCode
            }
          } else if (mp.matchedCode) {
            // Existing meal plans - use matched code
            mealPlanMappings.value[mp.contractName] = mp.matchedCode
          }
        })
      }

      toast.success(t('planning.pricing.contractImport.parseSuccess'))
    } else {
      parseError.value = response.error || t('planning.pricing.contractImport.parseFailed')
    }
  } catch (error) {
    console.error('Contract parsing error:', error)
    parseError.value = error.response?.data?.message || error.message || t('planning.pricing.contractImport.parseFailed')
  } finally {
    isLoading.value = false
  }
}

const executeImport = async () => {
  isImporting.value = true

  try {
    // Build proper mappings - need BOTH contractName and contractCode/matchedCode as keys
    // Backend uses contractName for capacity updates and roomCode for pricing
    const roomCodeMappings = {}
    parsedData.value.roomTypes?.forEach(room => {
      const mappedCode = roomMappings.value[room.contractName]
      if (mappedCode) {
        // Add by contractName (for capacity updates)
        roomCodeMappings[room.contractName] = mappedCode
        // Also add by contractCode/matchedCode (for pricing lookups)
        if (room.contractCode) {
          roomCodeMappings[room.contractCode] = mappedCode
        }
        if (room.matchedCode) {
          roomCodeMappings[room.matchedCode] = mappedCode
        }
        if (room.suggestedCode) {
          roomCodeMappings[room.suggestedCode] = mappedCode
        }
      }
    })

    const mealCodeMappings = {}
    parsedData.value.mealPlans?.forEach(mp => {
      const mappedCode = mealPlanMappings.value[mp.contractName]
      if (mappedCode) {
        // Add by contractName (for capacity updates)
        mealCodeMappings[mp.contractName] = mappedCode
        // Also add by contractCode/matchedCode (for pricing lookups)
        if (mp.contractCode) {
          mealCodeMappings[mp.contractCode] = mappedCode
        }
        if (mp.matchedCode) {
          mealCodeMappings[mp.matchedCode] = mappedCode
        }
        if (mp.suggestedCode) {
          mealCodeMappings[mp.suggestedCode] = mappedCode
        }
      }
    })

    const response = await planningService.importContractPricing(
      props.hotelId,
      parsedData.value,
      {
        roomMappings: roomCodeMappings,
        mealPlanMappings: mealCodeMappings
      },
      importOptions.value
    )

    if (response.success) {
      importResult.value = response.data
      toast.success(t('planning.pricing.contractImport.importSuccess'))
      emit('imported', response.data)
    } else {
      toast.error(response.message || t('planning.pricing.contractImport.importFailed'))
    }
  } catch (error) {
    console.error('Contract import error:', error)
    toast.error(error.response?.data?.message || error.message || t('planning.pricing.contractImport.importFailed'))
  } finally {
    isImporting.value = false
  }
}
</script>
