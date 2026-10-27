import type { FieldConfig } from '~/components/Fields.vue'

// Field definitions shared by sign-in and sign-up, for <Fields>
export const authFields = {
  fullName: (hint?: string): FieldConfig => ({
    fieldType: 'input',
    label: 'Full name',
    name: 'fullName',
    hint,
    attrs: { autocomplete: 'name', placeholder: 'Ada Okafor' },
  }),

  storeName: (): FieldConfig => ({
    fieldType: 'input',
    label: 'Store or kennel name',
    name: 'storeName',
    hint: 'As buyers will see it. You can change it before your store goes live.',
    attrs: { autocomplete: 'organization', placeholder: 'K9 Guardian Kennels' },
  }),

  city: (): FieldConfig => ({
    fieldType: 'input',
    label: 'City',
    name: 'city',
    attrs: { autocomplete: 'address-level2', placeholder: 'Abuja' },
  }),

  email: (): FieldConfig => ({
    fieldType: 'input',
    label: 'Email',
    name: 'email',
    attrs: { type: 'email', autocomplete: 'email', placeholder: 'ada@example.com' },
  }),

  phone: (hint = 'We\'ll text you a 6-digit code.'): FieldConfig => ({
    fieldType: 'input',
    label: 'Phone number',
    name: 'phone',
    prefix: '+234',
    hint,
    attrs: { type: 'tel', inputmode: 'numeric', autocomplete: 'tel-national', placeholder: '803 123 4567' },
  }),

  password: ({ visible, isNew = false, label = 'Password' }: { visible: boolean, isNew?: boolean, label?: string }): FieldConfig => ({
    fieldType: 'input',
    label,
    name: 'password',
    secondLabel: isNew ? undefined : { label: 'Forgot password?', to: '/forgot-password' },
    attrs: { type: visible ? 'text' : 'password', autocomplete: isNew ? 'new-password' : 'current-password' },
  }),
}
