<template>
  <div>
    <Modal
      v-model="show"
      :title="`Misafir - ${guest?.firstName} ${guest?.lastName}`"
      size="xl"
      @close="close"
    >
      <div v-if="guest" class="space-y-6">
        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              "
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="space-y-4">
          <!-- Header with VIP & Blacklist -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                :class="guest.isBlacklisted ? 'bg-red-500' : 'bg-indigo-500'"
              >
                {{ getInitials(guest) }}
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ guest.firstName }} {{ guest.lastName }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="getVipClasses(guest.vipLevel)"
                  >
                    {{ getVipLabel(guest.vipLevel) }}
                  </span>
                  <span
                    v-if="guest.isBlacklisted"
                    class="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"
                  >
                    Kara Listede
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                @click="showVipModal = true"
              >
                VIP Ayarla
              </button>
              <button
                v-if="!guest.isBlacklisted"
                class="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                @click="showBlacklistModal = true"
              >
                Kara Listeye Al
              </button>
              <button
                v-else
                class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                @click="removeFromBlacklist"
              >
                Kara Listeden Cikar
              </button>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                Kisisel Bilgiler
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Dogum Tarihi</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.dateOfBirth ? formatDate(guest.dateOfBirth) : '-'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Uyruk</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.nationality || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Kimlik Tipi</span>
                  <span class="text-gray-900 dark:text-white">{{
                    getIdTypeLabel(guest.idType)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Kimlik No</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.idNumber || '-' }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                Iletisim
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Telefon</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.phone || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">E-posta</span>
                  <span class="text-gray-900 dark:text-white truncate max-w-[200px]">{{
                    guest.email || '-'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">WhatsApp</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.whatsapp || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Istatistikler</h4>
            <div class="grid grid-cols-5 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ guest.statistics?.totalStays || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Konaklama</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ guest.statistics?.totalNights || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Gece</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(guest.statistics?.totalSpent) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Harcama</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ guest.statistics?.averageStayLength?.toFixed(1) || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Ort. Gece</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{
                    guest.statistics?.firstStayDate
                      ? formatDate(guest.statistics.firstStayDate)
                      : '-'
                  }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Ilk Konaklama</p>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Etiketler</h4>
              <button
                class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                @click="showTagsModal = true"
              >
                Duzenle
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in guest.tags"
                :key="tag"
                class="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded text-sm"
              >
                {{ tag }}
              </span>
              <span v-if="!guest.tags?.length" class="text-sm text-gray-400">Etiket yok</span>
            </div>
          </div>
        </div>

        <!-- Stay History Tab -->
        <div v-if="activeTab === 'stays'" class="space-y-4">
          <div v-if="loadingStays" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"
            ></div>
          </div>
          <div
            v-else-if="stayHistory.length === 0"
            class="text-center py-8 text-gray-500 dark:text-slate-400"
          >
            Konaklama gecmisi yok
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="stay in stayHistory"
              :key="stay._id"
              class="border border-gray-200 dark:border-slate-600 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    Oda {{ stay.room?.roomNumber }} -
                    {{ stay.roomType?.name?.tr || stay.roomType?.code }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ formatDate(stay.checkInDate) }} - {{ formatDate(stay.checkOutDate) }} ({{
                      stay.nights
                    }}
                    gece)
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(stay.totalAmount) }}
                  </p>
                  <span
                    class="px-2 py-0.5 rounded text-xs"
                    :class="
                      stay.status === 'checked_out'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-600'
                    "
                  >
                    {{ stay.status === 'checked_out' ? 'Cikis Yapti' : 'Aktif' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="space-y-4">
          <!-- Add Note Form -->
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Not Ekle</h4>
            <div class="flex gap-3">
              <textarea
                v-model="noteForm.content"
                rows="2"
                placeholder="Not ekleyin..."
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              ></textarea>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input v-model="noteForm.isImportant" type="checkbox" class="rounded" />
                  Onemli
                </label>
                <button
                  :disabled="!noteForm.content"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  @click="addNote"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>

          <!-- Notes List -->
          <div v-if="guest.notes?.length > 0" class="space-y-3">
            <div
              v-for="note in guest.notes"
              :key="note._id"
              class="rounded-lg p-3"
              :class="
                note.isImportant
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-gray-50 dark:bg-slate-700'
              "
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm text-gray-900 dark:text-white">{{ note.content }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {{ formatDateTime(note.createdAt) }}
                    <span v-if="note.isImportant" class="ml-2 text-yellow-600">Onemli</span>
                  </p>
                </div>
                <button class="p-1 text-gray-400 hover:text-red-500" @click="deleteNote(note._id)">
                  <span class="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">Henuz not yok</div>
        </div>

        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                Oda Tercihleri
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Kat Tercihi</span>
                  <span class="text-gray-900 dark:text-white">{{
                    getFloorPref(guest.preferences?.floorPreference)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Yatak Tipi</span>
                  <span class="text-gray-900 dark:text-white">{{
                    getBedPref(guest.preferences?.bedType)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Sigara Odasi</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.smokingRoom ? 'Evet' : 'Hayir'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">Sessiz Oda</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.quietRoom ? 'Evet' : 'Hayir'
                  }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                Diger
              </h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-slate-400 block mb-1">Alerjiler</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.allergies?.join(', ') || '-'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-slate-400 block mb-1">Diyet</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.dietaryRestrictions?.join(', ') || '-'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-slate-400 block mb-1">Ozel Istekler</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.specialRequests || '-'
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button
          class="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          @click="showEditModal = true"
        >
          Duzenle
        </button>
        <button
          class="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
          @click="close"
        >
          Kapat
        </button>
      </template>
    </Modal>

    <!-- VIP Modal - Outside main modal -->
    <Modal v-model="showVipModal" title="VIP Seviyesi" size="sm">
      <div class="space-y-3">
        <label
          v-for="level in vipLevels"
          :key="level.value"
          class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          :class="
            selectedVipLevel === level.value
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-slate-600'
          "
        >
          <input v-model="selectedVipLevel" type="radio" :value="level.value" class="hidden" />
          <span class="material-icons" :class="level.iconColor">{{ level.icon }}</span>
          <span class="text-gray-900 dark:text-white">{{ level.label }}</span>
        </label>
      </div>
      <template #footer>
        <button class="px-4 py-2 text-gray-600 dark:text-gray-400" @click="showVipModal = false">
          Iptal
        </button>
        <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg" @click="saveVipLevel">
          Kaydet
        </button>
      </template>
    </Modal>

    <!-- Blacklist Modal - Outside main modal -->
    <Modal v-model="showBlacklistModal" title="Kara Listeye Al" size="sm">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Neden *</label
        >
        <textarea
          v-model="blacklistReason"
          rows="3"
          placeholder="Kara listeye alma nedenini yazin..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        ></textarea>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-gray-600 dark:text-gray-400"
          @click="showBlacklistModal = false"
        >
          Iptal
        </button>
        <button
          :disabled="!blacklistReason"
          class="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
          @click="addToBlacklist"
        >
          Kara Listeye Al
        </button>
      </template>
    </Modal>

    <!-- Tags Modal - Outside main modal -->
    <Modal v-model="showTagsModal" title="Etiketleri Duzenle" size="sm">
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in commonTags"
            :key="tag"
            class="px-3 py-1.5 rounded-lg text-sm border"
            :class="
              selectedTags.includes(tag)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300'
            "
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <input
          v-model="newTag"
          type="text"
          placeholder="Ozel etiket ekle..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          @keyup.enter="addCustomTag"
        />
      </div>
      <template #footer>
        <button class="px-4 py-2 text-gray-600 dark:text-gray-400" @click="showTagsModal = false">
          Iptal
        </button>
        <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg" @click="saveTags">
          Kaydet
        </button>
      </template>
    </Modal>

    <!-- Edit Guest Modal - Outside main modal -->
    <AddGuestModal
      v-model="showEditModal"
      :hotel-id="hotelId"
      :guest="guest"
      @updated="onGuestEdited"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import AddGuestModal from '@/modules/guests/components/AddGuestModal.vue'
import guestService, { VIP_LEVEL_INFO, ID_TYPES, COMMON_TAGS } from '@/services/pms/guestService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, default: '' },
  guest: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()
const activeTab = ref('profile')
const loadingStays = ref(false)
const stayHistory = ref([])

const showVipModal = ref(false)
const showBlacklistModal = ref(false)
const showTagsModal = ref(false)
const showEditModal = ref(false)

const selectedVipLevel = ref('none')
const blacklistReason = ref('')
const selectedTags = ref([])
const newTag = ref('')

const noteForm = ref({ content: '', isImportant: false })

const commonTags = COMMON_TAGS

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const tabs = [
  { key: 'profile', label: 'Profil' },
  { key: 'stays', label: 'Konaklama Gecmisi' },
  { key: 'notes', label: 'Notlar' },
  { key: 'preferences', label: 'Tercihler' }
]

const vipLevels = [
  { value: 'none', label: 'Standart', icon: 'person', iconColor: 'text-gray-400' },
  { value: 'silver', label: 'Silver', icon: 'star_half', iconColor: 'text-slate-400' },
  { value: 'gold', label: 'Gold', icon: 'star', iconColor: 'text-yellow-500' },
  { value: 'platinum', label: 'Platinum', icon: 'workspace_premium', iconColor: 'text-purple-500' }
]

const fetchStayHistory = async () => {
  if (!props.hotelId || !props.guest?._id) return
  loadingStays.value = true
  try {
    const response = await guestService.getStayHistory(props.hotelId, props.guest._id)
    stayHistory.value = response.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loadingStays.value = false
  }
}

const saveVipLevel = async () => {
  try {
    await guestService.setVipLevel(props.hotelId, props.guest._id, selectedVipLevel.value)
    toast.success('VIP seviyesi guncellendi')
    showVipModal.value = false
    emit('updated')
  } catch {
    toast.error('VIP seviyesi guncellenemedi')
  }
}

const addToBlacklist = async () => {
  if (!blacklistReason.value) return
  try {
    await guestService.blacklist(props.hotelId, props.guest._id, blacklistReason.value)
    toast.success('Kara listeye eklendi')
    showBlacklistModal.value = false
    blacklistReason.value = ''
    emit('updated')
  } catch {
    toast.error('Islem basarisiz')
  }
}

const removeFromBlacklist = async () => {
  try {
    await guestService.removeFromBlacklist(props.hotelId, props.guest._id)
    toast.success('Kara listeden cikarildi')
    emit('updated')
  } catch {
    toast.error('Islem basarisiz')
  }
}

const toggleTag = tag => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const addCustomTag = () => {
  if (newTag.value && !selectedTags.value.includes(newTag.value)) {
    selectedTags.value.push(newTag.value)
    newTag.value = ''
  }
}

const saveTags = async () => {
  try {
    await guestService.updateTags(props.hotelId, props.guest._id, selectedTags.value)
    toast.success('Etiketler guncellendi')
    showTagsModal.value = false
    emit('updated')
  } catch {
    toast.error('Etiketler guncellenemedi')
  }
}

const addNote = async () => {
  if (!noteForm.value.content) return
  try {
    await guestService.addNote(props.hotelId, props.guest._id, noteForm.value)
    toast.success('Not eklendi')
    noteForm.value = { content: '', isImportant: false }
    emit('updated')
  } catch {
    toast.error('Not eklenemedi')
  }
}

const deleteNote = async noteId => {
  try {
    await guestService.deleteNote(props.hotelId, props.guest._id, noteId)
    toast.success('Not silindi')
    emit('updated')
  } catch {
    toast.error('Not silinemedi')
  }
}

const onGuestEdited = () => {
  showEditModal.value = false
  emit('updated')
}

const getInitials = guest => {
  return ((guest?.firstName?.charAt(0) || '') + (guest?.lastName?.charAt(0) || '')).toUpperCase()
}

const getVipLabel = level => VIP_LEVEL_INFO[level]?.label || 'Standart'
const getVipClasses = level => {
  const info = VIP_LEVEL_INFO[level]
  return info ? `${info.bgColor} ${info.textColor}` : 'bg-gray-100 text-gray-600'
}

const getIdTypeLabel = type => ID_TYPES.find(t => t.value === type)?.label || '-'

const getFloorPref = pref =>
  ({ low: 'Alt Kat', mid: 'Orta Kat', high: 'Ust Kat', any: 'Farketmez' })[pref] || '-'
const getBedPref = pref =>
  ({ single: 'Tek', double: 'Cift', twin: 'Twin', king: 'King', any: 'Farketmez' })[pref] || '-'

const formatDate = date => (date ? new Date(date).toLocaleDateString('tr-TR') : '-')
const formatDateTime = date => (date ? new Date(date).toLocaleString('tr-TR') : '-')
const formatCurrency = amount =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)

const close = () => {
  show.value = false
  activeTab.value = 'profile'
}

watch(
  () => props.modelValue,
  val => {
    if (val && props.guest) {
      activeTab.value = 'profile'
      selectedVipLevel.value = props.guest.vipLevel || 'none'
      selectedTags.value = [...(props.guest.tags || [])]
      fetchStayHistory()
    }
  }
)
</script>
