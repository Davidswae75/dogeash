import type { FieldConfig } from '~/components/Fields.vue'

// Field definitions shared by sign-in and sign-up, for <Fields>
export const authFields = {
  fullName: (): FieldConfig => ({
    fieldType: 'input',
    label: 'Full name',
    name: 'fullName',
    attrs: { autocomplete: 'name', placeholder: 'Ada Okafor' },
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

  password: ({ visible, isNew = false }: { visible: boolean, isNew?: boolean }): FieldConfig => ({
    fieldType: 'input',
    label: 'Password',
    name: 'password',
    secondLabel: isNew ? undefined : { label: 'Forgot password?', to: '/forgot-password' },
    attrs: { type: visible ? 'text' : 'password', autocomplete: isNew ? 'new-password' : 'current-password' },
  }),
}
