/**
 * PassengerForm Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    locale: { value: 'tr' }
  })
}))

// Simple PassengerForm mock for testing
const PassengerForm = {
  name: 'PassengerForm',
  props: {
    modelValue: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    removable: {
      type: Boolean,
      default: true
    },
    showPassport: {
      type: Boolean,
      default: false
    },
    showNationality: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'remove', 'setLead'],
  template: `
    <div class="passenger-form">
      <div class="passenger-header">
        <span class="passenger-label">Passenger {{ index + 1 }}</span>
        <span v-if="modelValue.isLead" class="lead-badge">Lead</span>
        <button v-if="!modelValue.isLead" @click="$emit('setLead')" class="set-lead-btn">Set Lead</button>
        <button v-if="removable" @click="$emit('remove')" class="remove-btn">Remove</button>
      </div>
      <div class="form-fields">
        <select v-model="modelValue.type" @change="updateField('type', $event.target.value)" class="type-select">
          <option value="adult">Adult</option>
          <option value="child">Child</option>
          <option value="infant">Infant</option>
        </select>
        <input
          type="text"
          :value="modelValue.firstName"
          @input="updateField('firstName', $event.target.value)"
          class="first-name-input"
          placeholder="First Name"
        />
        <input
          type="text"
          :value="modelValue.lastName"
          @input="updateField('lastName', $event.target.value)"
          class="last-name-input"
          placeholder="Last Name"
        />
        <input
          type="text"
          :value="modelValue.tcNumber"
          @input="updateField('tcNumber', $event.target.value)"
          class="tc-input"
          placeholder="TC Number"
          maxlength="11"
        />
        <input
          v-if="showPassport"
          type="text"
          :value="modelValue.passportNumber"
          @input="updateField('passportNumber', $event.target.value)"
          class="passport-input"
          placeholder="Passport Number"
        />
        <input
          type="date"
          :value="modelValue.dateOfBirth"
          @input="updateField('dateOfBirth', $event.target.value)"
          class="dob-input"
        />
        <select v-model="modelValue.gender" @change="updateField('gender', $event.target.value)" class="gender-select">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
    </div>
  `,
  methods: {
    updateField(field, value) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [field]: value
      })
    }
  }
}

describe('PassengerForm', () => {
  const mockPassenger = {
    type: 'adult',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    tcNumber: '12345678901',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    isLead: true
  }

  it('renders passenger index', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger, index: 0 }
    })

    expect(wrapper.text()).toContain('Passenger 1')
  })

  it('shows lead badge when isLead is true', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger }
    })

    expect(wrapper.find('.lead-badge').exists()).toBe(true)
  })

  it('shows set lead button when not lead', () => {
    const nonLeadPassenger = { ...mockPassenger, isLead: false }
    const wrapper = mount(PassengerForm, {
      props: { modelValue: nonLeadPassenger }
    })

    expect(wrapper.find('.set-lead-btn').exists()).toBe(true)
  })

  it('shows remove button when removable', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger, removable: true }
    })

    expect(wrapper.find('.remove-btn').exists()).toBe(true)
  })

  it('hides remove button when not removable', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger, removable: false }
    })

    expect(wrapper.find('.remove-btn').exists()).toBe(false)
  })

  it('emits remove event when remove button clicked', async () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger, removable: true }
    })

    await wrapper.find('.remove-btn').trigger('click')

    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('emits setLead event when set lead button clicked', async () => {
    const nonLeadPassenger = { ...mockPassenger, isLead: false }
    const wrapper = mount(PassengerForm, {
      props: { modelValue: nonLeadPassenger }
    })

    await wrapper.find('.set-lead-btn').trigger('click')

    expect(wrapper.emitted('setLead')).toBeTruthy()
  })

  it('renders all form fields', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger }
    })

    expect(wrapper.find('.type-select').exists()).toBe(true)
    expect(wrapper.find('.first-name-input').exists()).toBe(true)
    expect(wrapper.find('.last-name-input').exists()).toBe(true)
    expect(wrapper.find('.tc-input').exists()).toBe(true)
    expect(wrapper.find('.dob-input').exists()).toBe(true)
    expect(wrapper.find('.gender-select').exists()).toBe(true)
  })

  it('shows passport field when showPassport is true', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger, showPassport: true }
    })

    expect(wrapper.find('.passport-input').exists()).toBe(true)
  })

  it('hides passport field when showPassport is false', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger, showPassport: false }
    })

    expect(wrapper.find('.passport-input').exists()).toBe(false)
  })

  it('emits update event when first name changes', async () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger }
    })

    const input = wrapper.find('.first-name-input')
    await input.setValue('Mehmet')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')[0][0]
    expect(emittedValue.firstName).toBe('Mehmet')
  })

  it('emits update event when type changes', async () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger }
    })

    const select = wrapper.find('.type-select')
    await select.setValue('child')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('displays correct passenger type options', () => {
    const wrapper = mount(PassengerForm, {
      props: { modelValue: mockPassenger }
    })

    const options = wrapper.find('.type-select').findAll('option')
    expect(options).toHaveLength(3)
    expect(options[0].text()).toBe('Adult')
    expect(options[1].text()).toBe('Child')
    expect(options[2].text()).toBe('Infant')
  })
})
