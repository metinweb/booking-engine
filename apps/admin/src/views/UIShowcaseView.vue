<template>
  <div class="flex h-full">
    <!-- Sidebar Navigation -->
    <aside
      class="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 overflow-y-auto"
    >
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">UI Framework</h1>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {{ componentCount }} Components
        </p>
      </div>

      <nav class="p-4">
        <div v-for="group in componentGroups" :key="group.key" class="mb-4">
          <h3
            class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2"
          >
            {{ group.label }}
          </h3>
          <ul class="space-y-1">
            <li v-for="item in group.items" :key="item.key">
              <button
                class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
                :class="
                  activeSection === item.key
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                "
                @click="activeSection = item.key"
              >
                {{ item.label }}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-slate-900">
      <!-- Buttons Section -->
      <section v-if="activeSection === 'buttons'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Button Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Butonlar ve aksiyon menüleri</p>
        </div>

        <!-- BaseButton -->
        <ComponentCard title="BaseButton" description="Primary action button with variants">
          <div class="flex flex-wrap gap-3">
            <BaseButton variant="primary">Primary</BaseButton>
            <BaseButton variant="secondary">Secondary</BaseButton>
            <BaseButton variant="outline">Outline</BaseButton>
            <BaseButton variant="ghost">Ghost</BaseButton>
            <BaseButton variant="danger">Danger</BaseButton>
          </div>
          <div class="flex flex-wrap gap-3 mt-4">
            <BaseButton size="sm">Small</BaseButton>
            <BaseButton size="md">Medium</BaseButton>
            <BaseButton size="lg">Large</BaseButton>
          </div>
          <div class="flex flex-wrap gap-3 mt-4">
            <BaseButton icon-left="add">With Icon</BaseButton>
            <BaseButton :loading="true">Loading</BaseButton>
            <BaseButton disabled>Disabled</BaseButton>
          </div>
        </ComponentCard>

        <!-- IconButton -->
        <ComponentCard title="IconButton" description="Icon-only buttons">
          <div class="flex flex-wrap gap-3">
            <IconButton icon="edit" />
            <IconButton icon="delete" variant="danger" />
            <IconButton icon="more_vert" variant="ghost" />
            <IconButton icon="add" variant="primary" />
          </div>
          <div class="flex flex-wrap gap-3 mt-4">
            <IconButton icon="settings" size="sm" />
            <IconButton icon="settings" size="md" />
            <IconButton icon="settings" size="lg" />
          </div>
        </ComponentCard>

        <!-- ActionMenu -->
        <ComponentCard title="ActionMenu" description="Dropdown action menu">
          <ActionMenu :items="actionMenuItems" @action="handleAction">
            <BaseButton variant="outline">
              Actions
              <span class="material-icons text-sm ml-1">expand_more</span>
            </BaseButton>
          </ActionMenu>
        </ComponentCard>
      </section>

      <!-- Form Inputs Section -->
      <section v-if="activeSection === 'form-inputs'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Form Input Components
          </h2>
          <p class="text-gray-600 dark:text-gray-400">Form giriş elemanları</p>
        </div>

        <!-- Toggle -->
        <ComponentCard title="Toggle" description="On/off switch">
          <div class="space-y-4">
            <Toggle v-model="toggleValue" label="Enable notifications" />
            <Toggle v-model="toggleValue" label="With icons" show-icons />
            <Toggle v-model="toggleValue" label="Colored" color="green" />
            <div class="flex gap-4">
              <Toggle v-model="toggleValue" size="sm" />
              <Toggle v-model="toggleValue" size="md" />
              <Toggle v-model="toggleValue" size="lg" />
            </div>
          </div>
        </ComponentCard>

        <!-- Checkbox -->
        <ComponentCard title="Checkbox" description="Multi-select checkbox">
          <div class="space-y-3">
            <Checkbox v-model="checkboxValue" value="option1" label="Option 1" />
            <Checkbox v-model="checkboxValue" value="option2" label="Option 2" />
            <Checkbox v-model="checkboxValue" value="option3" label="Option 3" disabled />
            <Checkbox :model-value="true" label="Indeterminate" indeterminate />
          </div>
          <p class="mt-3 text-sm text-gray-500">Selected: {{ checkboxValue }}</p>
        </ComponentCard>

        <!-- RadioGroup -->
        <ComponentCard title="RadioGroup" description="Single selection">
          <RadioGroup v-model="radioValue" :options="radioOptions" label="Select an option" />
          <div class="mt-4">
            <RadioGroup v-model="radioValue" :options="radioOptions" inline />
          </div>
        </ComponentCard>

        <!-- Dropdown -->
        <ComponentCard title="Dropdown" description="Select dropdown">
          <div class="grid grid-cols-2 gap-4">
            <Dropdown
              v-model="dropdownValue"
              :options="dropdownOptions"
              label="Select option"
              placeholder="Choose..."
            />
            <Dropdown
              v-model="dropdownValue"
              :options="dropdownOptions"
              label="Searchable"
              searchable
            />
          </div>
        </ComponentCard>

        <!-- SearchInput -->
        <ComponentCard title="SearchInput" description="Search input with debounce">
          <SearchInput v-model="searchValue" placeholder="Search..." />
        </ComponentCard>

        <!-- PhoneInput -->
        <ComponentCard title="PhoneInput" description="International phone input">
          <PhoneInput v-model="phoneValue" label="Phone Number" />
        </ComponentCard>

        <!-- PasswordInput -->
        <ComponentCard title="PasswordInput" description="Password with strength meter">
          <PasswordInput v-model="passwordValue" label="Password" show-strength />
        </ComponentCard>

        <!-- Slider -->
        <ComponentCard title="Slider" description="Value slider">
          <div class="space-y-6">
            <Slider v-model="sliderValue" label="Volume" show-value />
            <Slider v-model="sliderValue" :min="0" :max="100" :step="10" show-tooltip show-steps />
            <Slider v-model="sliderValue" color="green" show-range />
          </div>
        </ComponentCard>

        <!-- Rating -->
        <ComponentCard title="Rating" description="Star rating">
          <div class="space-y-4">
            <Rating v-model="ratingValue" show-value />
            <Rating v-model="ratingValue" :max="10" color="red" icon="favorite" />
            <Rating :model-value="3.5" allow-half readonly />
          </div>
        </ComponentCard>

        <!-- TimePicker -->
        <ComponentCard title="TimePicker" description="Time picker">
          <div class="grid grid-cols-2 gap-4">
            <TimePicker v-model="timeValue" label="24-hour format" />
            <TimePicker v-model="timeValue" label="12-hour format" :use24-hour="false" />
          </div>
        </ComponentCard>

        <!-- FormField with Validation -->
        <ComponentCard title="FormField" description="Form input with built-in validation rules">
          <div class="space-y-4">
            <FormField
              ref="emailFieldRef"
              v-model="formFieldEmail"
              name="email"
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              icon="email"
              :rules="[
                { required: true, message: 'E-posta zorunludur' },
                { email: true, message: 'Geçerli bir e-posta giriniz' }
              ]"
            />
            <FormField
              ref="phoneFieldRef"
              v-model="formFieldPhone"
              name="phone"
              label="Telefon"
              placeholder="+90 5XX XXX XX XX"
              icon="phone"
              :rules="[
                { required: true, message: 'Telefon zorunludur' },
                { phone: true, message: 'Geçerli bir telefon numarası giriniz' }
              ]"
            />
            <FormField
              ref="passwordFieldRef"
              v-model="formFieldPassword"
              name="password"
              label="Şifre"
              type="password"
              icon="lock"
              :rules="[
                { required: true, message: 'Şifre zorunludur' },
                { minLength: 8, message: 'Şifre en az 8 karakter olmalıdır' }
              ]"
            />
            <FormField
              ref="urlFieldRef"
              v-model="formFieldUrl"
              name="website"
              label="Website"
              placeholder="https://example.com"
              icon="language"
              :rules="[{ url: true, message: 'Geçerli bir URL giriniz' }]"
            />
            <div class="flex gap-2 pt-2">
              <BaseButton variant="primary" size="sm" @click="validateAllFields">
                Validate All
              </BaseButton>
              <BaseButton variant="secondary" size="sm" @click="resetAllFields"> Reset </BaseButton>
            </div>
          </div>
        </ComponentCard>
      </section>

      <!-- Date Components Section -->
      <section v-if="activeSection === 'dates'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Date Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Tarih seçiciler</p>
        </div>

        <!-- DatePicker -->
        <ComponentCard title="DatePicker" description="Single date picker">
          <DatePicker v-model="dateValue" label="Select Date" />
        </ComponentCard>

        <!-- DateRangePicker -->
        <ComponentCard
          title="DateRangePicker"
          description="Tarih aralığı seçici - preset butonları ile"
        >
          <div class="space-y-4">
            <DateRangePicker
              v-model="dateRangeValue"
              label="Tarih Aralığı"
              start-placeholder="Başlangıç"
              end-placeholder="Bitiş"
            />
            <p v-if="dateRangeValue.start" class="text-sm text-gray-500 dark:text-slate-400">
              Seçilen: {{ dateRangeValue.start }} - {{ dateRangeValue.end }}
            </p>
          </div>
        </ComponentCard>

        <!-- DateRangePicker Without Presets -->
        <ComponentCard title="DateRangePicker (No Presets)" description="Preset butonları olmadan">
          <DateRangePicker v-model="dateRangeValue2" label="Tarih Aralığı" :show-presets="false" />
        </ComponentCard>

        <!-- DateRangePicker with Min Date -->
        <ComponentCard
          title="DateRangePicker (Min Date)"
          description="Minimum tarih kısıtlaması ile"
        >
          <DateRangePicker
            v-model="dateRangeValue3"
            label="Gelecek Tarihler"
            :min-date="today"
            start-placeholder="Check-in"
            end-placeholder="Check-out"
          />
        </ComponentCard>

        <!-- BookingDateRangePicker -->
        <ComponentCard
          title="BookingDateRangePicker"
          description="Booking akışı için özelleştirilmiş tarih seçici"
        >
          <div class="space-y-4">
            <BookingDateRangePicker v-model="bookingDateRange" :min-date="today" />
            <p v-if="bookingDateRange.start" class="text-sm text-gray-500 dark:text-slate-400">
              Check-in: {{ bookingDateRange.start }} | Check-out: {{ bookingDateRange.end }}
            </p>
          </div>
        </ComponentCard>

        <!-- BirthDatePicker -->
        <ComponentCard title="BirthDatePicker" description="Birth date picker">
          <BirthDatePicker v-model="birthDateValue" label="Date of Birth" />
        </ComponentCard>
      </section>

      <!-- Display Components Section -->
      <section v-if="activeSection === 'display'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Display Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Görüntüleme bileşenleri</p>
        </div>

        <!-- Avatar -->
        <ComponentCard title="Avatar" description="User avatar">
          <div class="flex items-end gap-4">
            <Avatar src="https://i.pravatar.cc/150?img=1" size="xs" />
            <Avatar src="https://i.pravatar.cc/150?img=2" size="sm" />
            <Avatar src="https://i.pravatar.cc/150?img=3" size="md" />
            <Avatar src="https://i.pravatar.cc/150?img=4" size="lg" />
            <Avatar src="https://i.pravatar.cc/150?img=5" size="xl" />
          </div>
          <div class="flex items-center gap-4 mt-4">
            <Avatar name="John Doe" />
            <Avatar initials="AB" color="blue" />
            <Avatar src="https://i.pravatar.cc/150?img=6" status="online" />
            <Avatar src="https://i.pravatar.cc/150?img=7" status="busy" />
          </div>
        </ComponentCard>

        <!-- AvatarGroup -->
        <ComponentCard title="AvatarGroup" description="Grouped avatars">
          <AvatarGroup :avatars="avatarGroupData" :max="4" />
        </ComponentCard>

        <!-- Chip -->
        <ComponentCard title="Chip" description="Tags and labels">
          <div class="flex flex-wrap gap-2">
            <Chip label="Default" />
            <Chip label="Indigo" color="indigo" />
            <Chip label="Green" color="green" />
            <Chip label="Red" color="red" />
            <Chip label="With Icon" icon="check" color="green" />
            <Chip label="Removable" removable @remove="handleChipRemove" />
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <Chip label="Solid" variant="solid" color="indigo" />
            <Chip label="Outline" variant="outline" color="blue" />
            <Chip label="Light" variant="light" color="green" />
          </div>
        </ComponentCard>

        <!-- Tooltip -->
        <ComponentCard title="Tooltip" description="Tooltips">
          <div class="flex gap-4">
            <Tooltip text="Top tooltip" position="top">
              <BaseButton variant="outline">Top</BaseButton>
            </Tooltip>
            <Tooltip text="Bottom tooltip" position="bottom">
              <BaseButton variant="outline">Bottom</BaseButton>
            </Tooltip>
            <Tooltip text="Left tooltip" position="left">
              <BaseButton variant="outline">Left</BaseButton>
            </Tooltip>
            <Tooltip text="Right tooltip" position="right">
              <BaseButton variant="outline">Right</BaseButton>
            </Tooltip>
          </div>
        </ComponentCard>

        <!-- StatusBadge -->
        <ComponentCard title="StatusBadge" description="Status indicators">
          <div class="flex flex-wrap gap-3">
            <StatusBadge status="active" />
            <StatusBadge status="inactive" />
            <StatusBadge status="pending" />
            <StatusBadge status="approved" />
            <StatusBadge status="rejected" />
          </div>
        </ComponentCard>

        <!-- Timeline -->
        <ComponentCard title="Timeline" description="Activity timeline">
          <Timeline :items="timelineItems" />
        </ComponentCard>

        <!-- Accordion -->
        <ComponentCard title="Accordion" description="Collapsible sections">
          <Accordion variant="bordered">
            <AccordionItem item-key="1" title="What is Vue.js?">
              Vue.js is a progressive JavaScript framework for building user interfaces.
            </AccordionItem>
            <AccordionItem item-key="2" title="Why Tailwind CSS?">
              Tailwind CSS is a utility-first CSS framework that provides low-level utility classes.
            </AccordionItem>
            <AccordionItem item-key="3" title="About this project">
              This is a comprehensive UI component library built with Vue 3 and Tailwind CSS.
            </AccordionItem>
          </Accordion>
        </ComponentCard>
      </section>

      <!-- Navigation Section -->
      <section v-if="activeSection === 'navigation'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Navigation Components
          </h2>
          <p class="text-gray-600 dark:text-gray-400">Navigasyon bileşenleri</p>
        </div>

        <!-- Tabs -->
        <ComponentCard title="Tabs" description="Tab navigation">
          <Tabs v-model="activeTab" :tabs="tabItems" />
          <div class="mt-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <TabPanel :active-tab="activeTab" tab-key="tab1"> Content for Tab 1 </TabPanel>
            <TabPanel :active-tab="activeTab" tab-key="tab2"> Content for Tab 2 </TabPanel>
            <TabPanel :active-tab="activeTab" tab-key="tab3"> Content for Tab 3 </TabPanel>
          </div>
          <div class="mt-6">
            <Tabs v-model="activeTab" :tabs="tabItems" variant="pills" />
          </div>
        </ComponentCard>

        <!-- Breadcrumbs -->
        <ComponentCard title="Breadcrumbs" description="Navigation breadcrumbs">
          <Breadcrumbs :items="breadcrumbItems" show-home />
          <div class="mt-4">
            <Breadcrumbs :items="breadcrumbItems" separator="slash" />
          </div>
        </ComponentCard>

        <!-- Stepper -->
        <ComponentCard title="Stepper" description="Multi-step wizard">
          <Stepper v-model="stepperValue" :steps="stepperSteps" show-navigation />
        </ComponentCard>
      </section>

      <!-- Feedback Section -->
      <section v-if="activeSection === 'feedback'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feedback Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Geri bildirim bileşenleri</p>
        </div>

        <!-- Alert -->
        <ComponentCard title="Alert" description="Alert messages">
          <div class="space-y-3">
            <Alert type="info" title="Information">This is an informational message.</Alert>
            <Alert type="success" title="Success">Operation completed successfully.</Alert>
            <Alert type="warning" title="Warning">Please review before continuing.</Alert>
            <Alert type="error" title="Error">An error occurred.</Alert>
          </div>
        </ComponentCard>

        <!-- Spinner -->
        <ComponentCard title="Spinner" description="Loading spinners">
          <div class="flex items-center gap-6">
            <Spinner type="circle" />
            <Spinner type="dots" />
            <Spinner type="bars" />
            <Spinner type="ring" />
          </div>
          <div class="flex items-center gap-6 mt-4">
            <Spinner size="xs" />
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
          </div>
          <div class="flex items-center gap-6 mt-4">
            <Spinner color="indigo" label="Loading..." />
            <Spinner color="green" label="Processing..." />
            <Spinner color="red" label="Please wait..." />
          </div>
        </ComponentCard>

        <!-- Skeleton -->
        <ComponentCard title="Skeleton" description="Loading placeholders">
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <Skeleton type="avatar" />
              <div class="flex-1 space-y-2">
                <Skeleton type="text" width="60%" />
                <Skeleton type="text" width="40%" />
              </div>
            </div>
            <Skeleton type="rect" height="100px" />
            <div class="flex gap-2">
              <Skeleton type="button" />
              <Skeleton type="button" />
            </div>
          </div>
        </ComponentCard>

        <!-- Progress -->
        <ComponentCard title="Progress" description="Progress bars">
          <div class="space-y-4">
            <Progress :model-value="progressValue" label="Upload Progress" show-value />
            <Progress :model-value="75" color="green" striped animated />
            <Progress indeterminate color="blue" />
          </div>
        </ComponentCard>

        <!-- ConfirmDialog -->
        <ComponentCard title="ConfirmDialog" description="Confirmation dialog">
          <BaseButton @click="showConfirmDialog = true">Open Confirm Dialog</BaseButton>
          <ConfirmDialog
            v-model="showConfirmDialog"
            title="Delete Item"
            message="Are you sure you want to delete this item? This action cannot be undone."
            confirm-text="Delete"
            cancel-text="Cancel"
            type="danger"
            @confirm="handleConfirm"
          />
        </ComponentCard>
      </section>

      <!-- Overlays Section -->
      <section v-if="activeSection === 'overlays'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Overlay Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Modal ve drawer bileşenleri</p>
        </div>

        <!-- Modal -->
        <ComponentCard title="Modal" description="Modal dialogs">
          <div class="flex gap-3">
            <BaseButton @click="showModal = true">Open Modal</BaseButton>
            <BaseButton variant="outline" @click="showLargeModal = true">Large Modal</BaseButton>
          </div>
          <Modal v-model="showModal" title="Modal Title" size="md">
            <p class="text-gray-600 dark:text-gray-300">
              This is the modal content. You can put any content here including forms, tables, or
              other components.
            </p>
            <template #footer>
              <BaseButton variant="ghost" @click="showModal = false">Cancel</BaseButton>
              <BaseButton @click="showModal = false">Save</BaseButton>
            </template>
          </Modal>
          <Modal v-model="showLargeModal" title="Large Modal" size="xl">
            <div class="space-y-4">
              <p class="text-gray-600 dark:text-gray-300">
                This is a larger modal with more content space.
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">Column 1</div>
                <div class="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">Column 2</div>
              </div>
            </div>
          </Modal>
        </ComponentCard>

        <!-- Drawer -->
        <ComponentCard title="Drawer" description="Side panel drawers">
          <div class="flex gap-3">
            <BaseButton @click="showDrawerRight = true">Right Drawer</BaseButton>
            <BaseButton variant="outline" @click="showDrawerLeft = true">Left Drawer</BaseButton>
            <BaseButton variant="outline" @click="showDrawerBottom = true"
              >
Bottom Drawer
</BaseButton
            >
          </div>
          <Drawer v-model="showDrawerRight" title="Right Drawer" position="right">
            <p class="text-gray-600 dark:text-gray-300">
              This is the drawer content. It slides in from the right side.
            </p>
            <template #footer>
              <BaseButton variant="ghost" @click="showDrawerRight = false">Close</BaseButton>
              <BaseButton @click="showDrawerRight = false">Save</BaseButton>
            </template>
          </Drawer>
          <Drawer v-model="showDrawerLeft" title="Left Drawer" position="left">
            <p class="text-gray-600 dark:text-gray-300">
              This drawer slides in from the left side.
            </p>
          </Drawer>
          <Drawer v-model="showDrawerBottom" title="Bottom Drawer" position="bottom" size="md">
            <p class="text-gray-600 dark:text-gray-300">This drawer slides in from the bottom.</p>
          </Drawer>
        </ComponentCard>
      </section>

      <!-- Data Section -->
      <section v-if="activeSection === 'data'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Data Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Veri görüntüleme bileşenleri</p>
        </div>

        <!-- DataTable -->
        <ComponentCard title="DataTable" description="Advanced data table">
          <DataTable :columns="tableColumns" :data="tableData" :loading="tableLoading" selectable />
        </ComponentCard>
      </section>

      <!-- Common Components Section -->
      <section v-if="activeSection === 'common'" class="space-y-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Common Components</h2>
          <p class="text-gray-600 dark:text-gray-400">Projede yaygın kullanılan özel bileşenler</p>
        </div>

        <!-- TagInput -->
        <ComponentCard title="TagInput" description="Etiket girişi ve seçimi">
          <TagInput
            v-model="selectedTags"
            label="Etiketler"
            :available-tags="availableTags"
            placeholder="Etiket ara veya ekle..."
          />
        </ComponentCard>

        <!-- MultiLangInput -->
        <ComponentCard title="MultiLangInput" description="Çoklu dil desteği ile metin girişi">
          <div class="space-y-4">
            <MultiLangInput
              v-model="multiLangValue"
              label="Başlık"
              :languages="['tr', 'en', 'de', 'ru']"
              placeholder="Başlık girin"
            />
            <MultiLangInput
              v-model="multiLangTextarea"
              label="Açıklama"
              type="textarea"
              :languages="['tr', 'en', 'de', 'ru']"
              :rows="3"
            />
          </div>
        </ComponentCard>

        <!-- StarSelector -->
        <ComponentCard title="StarSelector" description="Otel yıldız seçici">
          <div class="space-y-4">
            <StarSelector v-model="starValue" label="Otel Yıldızı" />
            <StarSelector v-model="starValue" :max-stars="7" label="7 Yıldız" />
          </div>
        </ComponentCard>

        <!-- CountrySelect -->
        <ComponentCard title="CountrySelect" description="Ülke seçici (bayrak ile)">
          <CountrySelect v-model="countryValue" placeholder="Ülke seçin" />
        </ComponentCard>

        <!-- LanguageSelector -->
        <ComponentCard title="LanguageSelector" description="Dil seçici">
          <div class="flex justify-start">
            <LanguageSelector />
          </div>
        </ComponentCard>

        <!-- GuestCountSelector - Age Mode -->
        <ComponentCard
          title="GuestCountSelector (Age Mode)"
          description="Misafir sayısı seçici - Çocuk yaşı girişi"
        >
          <GuestCountSelector
            v-model:adults="guestAdults"
            v-model:children="guestChildren"
            child-input-mode="age"
          />
        </ComponentCard>

        <!-- GuestCountSelector - Birth Date Mode -->
        <ComponentCard
          title="GuestCountSelector (Birth Date Mode)"
          description="Misafir sayısı seçici - Çocuk doğum tarihi girişi"
        >
          <GuestCountSelector
            v-model:adults="guestAdultsBD"
            v-model:children="guestChildrenBD"
            child-input-mode="birthDate"
          />
        </ComponentCard>

        <!-- DateRangePickerInline -->
        <ComponentCard title="DateRangePickerInline" description="Inline tarih aralığı seçici">
          <DateRangePickerInline
            v-model:start-date="inlineStartDate"
            v-model:end-date="inlineEndDate"
          />
        </ComponentCard>

        <!-- CascadingLocationSelect -->
        <ComponentCard
          title="CascadingLocationSelect"
          description="Kademeli konum seçici (Ülke/Şehir)"
        >
          <CascadingLocationSelect
            v-model:country-code="locationCountry"
            v-model:city-code="locationCity"
          />
        </ComponentCard>

        <!-- HotelSelector -->
        <ComponentCard title="HotelSelector" description="Otel seçici (arama ile)">
          <div class="max-w-xs">
            <HotelSelector v-model="selectedHotelId" />
          </div>
        </ComponentCard>

        <!-- PartnerSelector -->
        <ComponentCard title="PartnerSelector" description="Partner seçici">
          <div class="max-w-xs">
            <PartnerSelector v-model="selectedPartnerId" />
          </div>
        </ComponentCard>

        <!-- NotificationBell -->
        <ComponentCard title="NotificationBell" description="Bildirim çanı">
          <div class="flex items-center gap-4">
            <NotificationBell />
            <span class="text-sm text-gray-500">Bildirim çanı (sağ üstte görünür)</span>
          </div>
        </ComponentCard>

        <!-- RichTextEditor -->
        <ComponentCard title="RichTextEditor" description="Zengin metin editörü (çoklu dil)">
          <RichTextEditor v-model="richTextValue" label="İçerik" :languages="['tr', 'en']" />
        </ComponentCard>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  // Buttons
  BaseButton,
  IconButton,
  ActionMenu,
  // Form
  Toggle,
  Checkbox,
  RadioGroup,
  Dropdown,
  SearchInput,
  PhoneInput,
  PasswordInput,
  Slider,
  Rating,
  TimePicker,
  // Dates
  DatePicker,
  DateRangePicker,
  BirthDatePicker,
  // Display
  Avatar,
  AvatarGroup,
  Chip,
  Tooltip,
  StatusBadge,
  Timeline,
  Accordion,
  AccordionItem,
  // Navigation
  Tabs,
  TabPanel,
  Breadcrumbs,
  Stepper,
  // Feedback
  Alert,
  Spinner,
  Skeleton,
  Progress,
  ConfirmDialog,
  // Overlays
  Modal,
  Drawer,
  // Data
  DataTable
} from '@/components/ui'
import BookingDateRangePicker from '@/components/booking/search/BookingDateRangePicker.vue'
import ComponentCard from '@/components/ui/common/ComponentCard.vue'
import FormField from '@/components/common/FormField.vue'

// Common Components
import TagInput from '@/components/common/TagInput.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import StarSelector from '@/components/common/StarSelector.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import LanguageSelector from '@/components/common/LanguageSelector.vue'
import GuestCountSelector from '@/components/common/GuestCountSelector.vue'
import DateRangePickerInline from '@/components/common/DateRangePickerInline.vue'
import CascadingLocationSelect from '@/components/common/CascadingLocationSelect.vue'
import HotelSelector from '@/components/common/HotelSelector.vue'
import PartnerSelector from '@/components/common/PartnerSelector.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'

// Navigation
const activeSection = ref('buttons')

const componentGroups = [
  {
    key: 'buttons',
    label: 'Buttons',
    items: [{ key: 'buttons', label: 'Buttons & Actions' }]
  },
  {
    key: 'form',
    label: 'Form',
    items: [
      { key: 'form-inputs', label: 'Form Inputs' },
      { key: 'dates', label: 'Date Pickers' }
    ]
  },
  {
    key: 'display',
    label: 'Display',
    items: [{ key: 'display', label: 'Display Elements' }]
  },
  {
    key: 'navigation',
    label: 'Navigation',
    items: [{ key: 'navigation', label: 'Navigation' }]
  },
  {
    key: 'feedback',
    label: 'Feedback',
    items: [{ key: 'feedback', label: 'Feedback' }]
  },
  {
    key: 'overlays',
    label: 'Overlays',
    items: [{ key: 'overlays', label: 'Modals & Drawers' }]
  },
  {
    key: 'data',
    label: 'Data',
    items: [{ key: 'data', label: 'Data Display' }]
  },
  {
    key: 'common',
    label: 'Common',
    items: [{ key: 'common', label: 'Common Components' }]
  }
]

const componentCount = computed(() => 50)

// Form values
const toggleValue = ref(true)
const checkboxValue = ref(['option1'])
const radioValue = ref('a')
const dropdownValue = ref('')
const searchValue = ref('')
const phoneValue = ref('')
const passwordValue = ref('')
const sliderValue = ref(50)
const ratingValue = ref(4)
const timeValue = ref('14:30')
const dateValue = ref('')
const dateRangeValue = ref({ start: null, end: null })
const dateRangeValue2 = ref({ start: null, end: null })
const dateRangeValue3 = ref({ start: null, end: null })
const bookingDateRange = ref({ start: null, end: null })
const birthDateValue = ref('')
const today = new Date()

// FormField validation values
const formFieldEmail = ref('')
const formFieldPhone = ref('')
const formFieldPassword = ref('')
const formFieldUrl = ref('')
const emailFieldRef = ref(null)
const phoneFieldRef = ref(null)
const passwordFieldRef = ref(null)
const urlFieldRef = ref(null)

const validateAllFields = () => {
  const fields = [emailFieldRef, phoneFieldRef, passwordFieldRef, urlFieldRef]
  let allValid = true
  fields.forEach(field => {
    if (field.value) {
      const result = field.value.validate()
      if (!result.valid) allValid = false
    }
  })
  return allValid
}

const resetAllFields = () => {
  formFieldEmail.value = ''
  formFieldPhone.value = ''
  formFieldPassword.value = ''
  formFieldUrl.value = ''
  const fields = [emailFieldRef, phoneFieldRef, passwordFieldRef, urlFieldRef]
  fields.forEach(field => {
    if (field.value) {
      field.value.reset()
    }
  })
}

// Common Components values
const selectedTags = ref([])
const availableTags = ref([
  { _id: '1', name: { tr: 'Önemli', en: 'Important' }, color: '#ef4444' },
  { _id: '2', name: { tr: 'Acil', en: 'Urgent' }, color: '#f97316' },
  { _id: '3', name: { tr: 'Planlı', en: 'Planned' }, color: '#22c55e' },
  { _id: '4', name: { tr: 'Beklemede', en: 'Pending' }, color: '#eab308' }
])
const multiLangValue = ref({ tr: '', en: '', de: '', ru: '' })
const multiLangTextarea = ref({ tr: '', en: '', de: '', ru: '' })
const starValue = ref(4)
const countryValue = ref('')
const guestAdults = ref(2)
const guestChildren = ref([])
const guestAdultsBD = ref(2)
const guestChildrenBD = ref([])
const inlineStartDate = ref(null)
const inlineEndDate = ref(null)
const locationCountry = ref('')
const locationCity = ref('')
const selectedHotelId = ref(null)
const selectedPartnerId = ref(null)
const richTextValue = ref({ tr: '', en: '' })

// Navigation values
const activeTab = ref('tab1')
const stepperValue = ref(1)

// Overlay values
const showModal = ref(false)
const showLargeModal = ref(false)
const showConfirmDialog = ref(false)
const showDrawerRight = ref(false)
const showDrawerLeft = ref(false)
const showDrawerBottom = ref(false)

// Progress
const progressValue = ref(65)

// Table
const tableLoading = ref(false)

// Options data
const radioOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' }
]

const dropdownOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' }
]

const actionMenuItems = [
  { label: 'Edit', icon: 'edit' },
  { label: 'Duplicate', icon: 'content_copy' },
  { divider: true },
  { label: 'Delete', icon: 'delete', danger: true }
]

const tabItems = [
  { key: 'tab1', label: 'Tab 1', icon: 'home' },
  { key: 'tab2', label: 'Tab 2', badge: 5 },
  { key: 'tab3', label: 'Tab 3' }
]

const breadcrumbItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Settings', to: '/settings' },
  { label: 'Profile' }
]

const stepperSteps = [
  { label: 'Account', description: 'Create account' },
  { label: 'Profile', description: 'Add details' },
  { label: 'Review', description: 'Confirm info' }
]

const avatarGroupData = [
  { src: 'https://i.pravatar.cc/150?img=1', name: 'John' },
  { src: 'https://i.pravatar.cc/150?img=2', name: 'Jane' },
  { src: 'https://i.pravatar.cc/150?img=3', name: 'Bob' },
  { src: 'https://i.pravatar.cc/150?img=4', name: 'Alice' },
  { src: 'https://i.pravatar.cc/150?img=5', name: 'Charlie' },
  { src: 'https://i.pravatar.cc/150?img=6', name: 'Diana' }
]

const timelineItems = [
  {
    title: 'Order Placed',
    time: '2 hours ago',
    icon: 'shopping_cart',
    color: 'green'
  },
  {
    title: 'Payment Confirmed',
    time: '1 hour ago',
    icon: 'payment',
    color: 'blue'
  },
  {
    title: 'Shipping',
    time: 'In progress',
    icon: 'local_shipping',
    color: 'amber'
  }
]

const tableColumns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' }
]

const tableData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'inactive' }
]

// Handlers
const handleAction = item => {
  console.log('Action:', item)
}

const handleChipRemove = () => {
  console.log('Chip removed')
}

const handleConfirm = () => {
  console.log('Confirmed')
  showConfirmDialog.value = false
}
</script>
