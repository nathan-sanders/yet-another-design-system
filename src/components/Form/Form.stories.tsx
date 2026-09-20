import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Autocomplete } from '../Autocomplete'
import { Button } from '../Button'
import { Card } from '../Card'
import { Checkbox } from '../Checkbox'
import { Combobox } from '../Combobox'
import { Field } from '../Field'
import { Input } from '../Input'
import { NumberInput } from '../NumberInput'
import { Radio } from '../Radio'
import { SegmentedControl } from '../SegmentedControl'
import { Select } from '../Select'
import { Switch } from '../Switch'
import { TextArea } from '../TextArea'
import { Form, type FormErrors, type FormProps } from './Form'

const roles = [
  { value: 'designer', label: 'Designer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'manager', label: 'Manager' },
] as const

const roleItems = roles.map(({ value, label }) => (
  <Select.Item key={value} value={value}>
    {label}
  </Select.Item>
))

const timezones = [
  { value: 'america/los_angeles', label: 'Pacific Time' },
  { value: 'america/new_york', label: 'Eastern Time' },
  { value: 'europe/london', label: 'London' },
  { value: 'asia/tokyo', label: 'Tokyo' },
] as const

const timezoneItems = timezones.map(({ value, label }) => (
  <Select.Item key={value} value={value}>
    {label}
  </Select.Item>
))

const countries = [
  { value: 'ar', label: 'Argentina' },
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
  { value: 'us', label: 'United States' },
]

const projects = [
  { value: 'annual report', label: 'annual report' },
  { value: 'brand guidelines', label: 'brand guidelines' },
  { value: 'design tokens', label: 'design tokens' },
  { value: 'onboarding checklist', label: 'onboarding checklist' },
]

/**
 * A phone, the size of Figma's Mobile Navigation frames (393 × 852). The test
 * runner sets the browser to it; in Storybook pick it from the Viewport
 * toolbar, or drag the canvas under 640.
 */
const phone = {
  viewport: {
    options: {
      phone: { name: 'Phone', styles: { width: '393px', height: '852px' } },
    },
  },
}

const meta = {
  title: 'Components/Form',
  component: Form,
  // A compound component: the form is a column and the interesting props are
  // Base UI's. Every story submits, so every story is given `onFormSubmit` —
  // a `<form>` with no handler at all navigates the page on submit, and in the
  // test runner that page is the whole suite's.
  parameters: { controls: { disable: true } },
  args: { onFormSubmit: fn() },
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The sign-up form the Field stories had been drawing as a raw `<form>`.
 * Every Field is named, the Select's Field turns `nativeLabel` off because
 * its control is a button, and the submit button says `type="submit"`.
 */
function SignUp(props: FormProps) {
  return (
    <Form {...props}>
      <Field name="name" label="Full name">
        <Input required autoComplete="name" placeholder="Ada Lovelace" />
      </Field>
      <Field name="email" label="Email" description="We'll only use it to sign you in">
        <Input type="email" required autoComplete="email" placeholder="ada@example.com" />
      </Field>
      <Field name="role" label="Role" nativeLabel={false}>
        <Select required placeholder="Select role…">
          {roleItems}
        </Select>
      </Field>
      <Field name="terms" label="Terms">
        <Checkbox required label="I accept the terms of service" />
      </Field>
      <Form.Actions>
        <Button appearance="secondary">Cancel</Button>
        <Button type="submit">Create account</Button>
      </Form.Actions>
    </Form>
  )
}

/**
 * Submit it empty. Nothing is sent: Base UI's Form asks every Field to check
 * itself, the browser reports `required` on each, the messages land under the
 * fields in Field's italic danger recipe, and focus goes to the first one that
 * failed. From then on each field re-checks as it changes, so typing a name
 * clears its message on its own.
 *
 * Use the Theme switch in the toolbar for dark mode.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-96">
      <SignUp {...args} />
    </div>
  ),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    const form = canvasElement.querySelector('form')!
    const name = canvas.getByRole('textbox', { name: 'Full name' })
    const email = canvas.getByRole('textbox', { name: 'Email' })

    await step('The column, and the browser bubbles switched off', async () => {
      await expect(form).toHaveAttribute('novalidate')
      const style = getComputedStyle(form)
      await expect(style.display).toBe('flex')
      await expect(style.flexDirection).toBe('column')
      await expect(style.rowGap).toBe('16px')
    })

    await step('Submitting empty sends nothing and marks every field', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Create account' }))
      await expect(args.onFormSubmit).not.toHaveBeenCalled()
      await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'))
      await expect(name).toHaveAccessibleDescription(/fill out this field/i)
      await expect(document.activeElement).toBe(name)
      await expect(email).toHaveAttribute('aria-invalid', 'true')
      await expect(canvas.getByRole('combobox', { name: 'Role' })).toHaveAttribute(
        'aria-invalid',
        'true',
      )
      await expect(
        canvas.getByRole('checkbox', { name: 'I accept the terms of service' }),
      ).toHaveAccessibleDescription(/check this box/i)
      const [message] = canvas.getAllByText(/fill out this field/i)
      await expect(getComputedStyle(message).fontStyle).toBe('italic')
    })

    await step('After the first attempt, a field re-checks as it changes', async () => {
      await userEvent.type(name, 'Ada Lovelace')
      await waitFor(() => expect(name).not.toHaveAttribute('aria-invalid'))
      await expect(name).not.toHaveAccessibleDescription(/fill out this field/i)
    })
  },
}

/**
 * **Let the browser check what it can.** `type="email"`, `type="url"`,
 * `pattern`, `min` and the rest are constraints the platform already knows how
 * to test and how to phrase, and Field shows the browser's own words.
 * `validationMode="onBlur"` makes the form check a field the moment it is left
 * rather than waiting for submit — the mode to reach for on a long form, where
 * a mistake at the top should not wait for the button at the bottom.
 *
 * `minLength` and `maxLength` are constraints too, but the browser only counts
 * them against text a person typed, so a test that sets the value cannot trip
 * them; they are left out of this story for that reason and no other.
 */
export const NativeValidation: Story = {
  render: (args) => (
    <div className="w-96">
      <Form {...args} validationMode="onBlur">
        <Field name="email" label="Email">
          <Input type="email" required placeholder="ada@example.com" />
        </Field>
        <Field name="zip" label="ZIP code" description="Five digits">
          <Input pattern="[0-9]{5}" inputMode="numeric" placeholder="94103" />
        </Field>
        <Field name="website" label="Website">
          <Input type="url" placeholder="https://example.com" />
        </Field>
        <Form.Actions>
          <Button type="submit">Save</Button>
        </Form.Actions>
      </Form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = canvas.getByRole('textbox', { name: 'Email' })
    const zip = canvas.getByRole('textbox', { name: 'ZIP code' })
    const website = canvas.getByRole('textbox', { name: 'Website' })

    await userEvent.type(email, 'nathan')
    await userEvent.tab()
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'))
    await expect(email).toHaveAccessibleDescription(/@/)

    await userEvent.type(zip, '1234')
    await userEvent.tab()
    await waitFor(() => expect(zip).toHaveAttribute('aria-invalid', 'true'))
    await expect(zip).toHaveAccessibleDescription(/match the requested format/i)

    await userEvent.type(website, 'example.com')
    await userEvent.tab()
    await waitFor(() => expect(website).toHaveAttribute('aria-invalid', 'true'))
    await expect(website).toHaveAccessibleDescription(/url/i)

    await userEvent.clear(email)
    await userEvent.type(email, 'nathan@example.com')
    await userEvent.tab()
    await waitFor(() => expect(email).not.toHaveAttribute('aria-invalid'))
  },
}

function ServerErrorsForm(props: FormProps) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  return (
    <Form
      {...props}
      errors={errors}
      onFormSubmit={async (values, details) => {
        setSaving(true)
        // Mimic a round trip that rejects one address.
        await new Promise((resolve) => setTimeout(resolve, 200))
        setSaving(false)
        if (values.email === 'taken@example.com') {
          setErrors({ email: 'That email is already registered' })
          return
        }
        setErrors({})
        props.onFormSubmit?.(values, details)
      }}
    >
      <Field name="email" label="Email">
        <Input type="email" required defaultValue="taken@example.com" />
      </Field>
      <Form.Actions>
        <Button type="submit" disabled={saving}>
          {saving ? 'Checking…' : 'Continue'}
        </Button>
      </Form.Actions>
    </Form>
  )
}

/**
 * **The server's half.** A value can pass every check the browser knows and
 * still be wrong — this address is already taken. The answer comes back as
 * `errors`, an object keyed by Field `name`, and the Field with an entry is
 * invalid and shows the text. Editing that field clears its entry on its own;
 * nothing has to be reset by hand.
 *
 * Hold `errors` in state rather than writing a fresh object inline — Base UI
 * watches it by reference, and a new `{}` every render would put the message
 * straight back after each keystroke.
 */
export const ServerErrors: Story = {
  render: (args) => (
    <div className="w-96">
      <ServerErrorsForm {...args} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const email = canvas.getByRole('textbox', { name: 'Email' })

    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(email).toHaveAccessibleDescription(/already registered/i))
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(args.onFormSubmit).not.toHaveBeenCalled()

    await userEvent.type(email, 'x')
    await waitFor(() => expect(email).not.toHaveAttribute('aria-invalid'))
    await expect(email).not.toHaveAccessibleDescription(/already registered/i)

    await userEvent.clear(email)
    await userEvent.type(email, 'free@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(args.onFormSubmit).toHaveBeenCalledTimes(1))
  },
}

/**
 * **`validate` is for the rules the browser cannot know**, and it is a Field
 * prop, because the rule belongs to one field. Confirm password is checked on
 * every change, against the other field's value, which `validate` is handed as
 * its second argument. Username keeps the form's own mode — `onBlur` here — so
 * it says nothing until it is left. **A Field's `validationMode` wins over the
 * form's.**
 */
export const Validate: Story = {
  render: (args) => (
    <div className="w-96">
      <Form {...args} validationMode="onBlur">
        <Field
          name="username"
          label="Username"
          validate={(value) => (/\s/.test(String(value)) ? 'No spaces in a username' : null)}
        >
          <Input required placeholder="ada" />
        </Field>
        <Field name="password" label="Password">
          <Input type="password" required autoComplete="new-password" />
        </Field>
        <Field
          name="confirm"
          label="Confirm password"
          validationMode="onChange"
          validate={(value, values) =>
            value === values.password ? null : 'Passwords do not match'
          }
        >
          <Input type="password" required autoComplete="new-password" />
        </Field>
        <Form.Actions>
          <Button type="submit">Create account</Button>
        </Form.Actions>
      </Form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const username = canvas.getByRole('textbox', { name: 'Username' })
    const password = canvas.getByLabelText('Password')
    const confirm = canvas.getByLabelText('Confirm password')

    await userEvent.type(password, 'hunter22')
    await userEvent.type(confirm, 'hunter2')
    await waitFor(() => expect(confirm).toHaveAccessibleDescription(/do not match/i))
    await expect(confirm).toHaveAttribute('aria-invalid', 'true')
    await userEvent.type(confirm, '2')
    await waitFor(() => expect(confirm).not.toHaveAttribute('aria-invalid'))

    await userEvent.type(username, 'ada lovelace')
    await expect(username).not.toHaveAttribute('aria-invalid')
    await userEvent.tab()
    await waitFor(() => expect(username).toHaveAttribute('aria-invalid', 'true'))
    await expect(username).toHaveAccessibleDescription(/no spaces/i)
  },
}

/**
 * **What `onFormSubmit` is handed.** One entry per named Field, with each
 * control's own value type: a string from an Input or a Select, a number from a
 * NumberInput, a boolean from a Switch, an array from a Checkbox Group. Because
 * `name` is on the Field, the group is reachable at all — and its options carry
 * `value`, not `name`, since Base UI gives every checkbox in a named Field the
 * Field's name.
 */
export const OnFormSubmit: Story = {
  render: (args) => (
    <div className="w-96">
      <Form {...args}>
        <Field name="name" label="Full name">
          <Input defaultValue="Ada Lovelace" />
        </Field>
        <Field name="role" label="Role" nativeLabel={false}>
          <Select defaultValue="designer" placeholder="Select role…">
            {roleItems}
          </Select>
        </Field>
        <Field name="seats" label="Seats">
          <NumberInput min={1} max={50} defaultValue={3} />
        </Field>
        <Field name="interests" label="Send me">
          <Checkbox.Group defaultValue={['email', 'sms']}>
            <Checkbox value="email" label="Email" />
            <Checkbox value="sms" label="SMS" />
            <Checkbox value="push" label="Push" />
          </Checkbox.Group>
        </Field>
        <Field name="plan" label="Plan">
          <Radio.Group defaultValue="monthly">
            <Radio value="monthly" label="Monthly" />
            <Radio value="yearly" label="Yearly" />
          </Radio.Group>
        </Field>
        <Field name="newsletter" label="Newsletter">
          <Switch defaultChecked label="Product updates" />
        </Field>
        <Form.Actions>
          <Button type="submit">Save</Button>
        </Form.Actions>
      </Form>
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const save = canvas.getByRole('button', { name: 'Save' })

    await userEvent.click(save)
    await waitFor(() => expect(args.onFormSubmit).toHaveBeenCalledTimes(1))
    await expect(args.onFormSubmit).toHaveBeenLastCalledWith(
      {
        name: 'Ada Lovelace',
        role: 'designer',
        seats: 3,
        interests: ['email', 'sms'],
        plan: 'monthly',
        newsletter: true,
      },
      expect.anything(),
    )

    await userEvent.click(canvas.getByRole('checkbox', { name: 'SMS' }))
    await userEvent.click(canvas.getByRole('radio', { name: 'Yearly' }))
    await userEvent.click(save)
    await waitFor(() => expect(args.onFormSubmit).toHaveBeenCalledTimes(2))
    await expect(args.onFormSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ interests: ['email'], plan: 'yearly' }),
      expect.anything(),
    )
  },
}

function AddressForm(props: FormProps) {
  return (
    <Form {...props}>
      <Form.Row>
        <Field name="first" label="First name">
          <Input autoComplete="given-name" />
        </Field>
        <Field name="last" label="Last name">
          <Input autoComplete="family-name" />
        </Field>
      </Form.Row>
      <Field name="street" label="Street address">
        <Input autoComplete="street-address" />
      </Field>
      <Form.Row>
        <Field name="city" label="City">
          <Input autoComplete="address-level2" />
        </Field>
        <Field name="state" label="State">
          <Input autoComplete="address-level1" />
        </Field>
        <Field name="zip" label="ZIP">
          <Input autoComplete="postal-code" inputMode="numeric" />
        </Field>
      </Form.Row>
      <Form.Actions>
        <Button appearance="secondary">Cancel</Button>
        <Button type="submit">Save address</Button>
      </Form.Actions>
    </Form>
  )
}

/**
 * **`Form.Row` puts fields that belong together side by side** — first and
 * last name, city and state and ZIP — in equal columns at the same 16px the
 * column uses. Astryx's horizontal layout. Save it for fields that pair up;
 * unrelated fields side by side read as one question.
 */
export const Rows: Story = {
  render: (args) => (
    <div className="w-[28rem]">
      <AddressForm {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const form = canvasElement.querySelector('form')!
    const city = canvas.getByRole('textbox', { name: 'City' })
    const state = canvas.getByRole('textbox', { name: 'State' })
    const zip = canvas.getByRole('textbox', { name: 'ZIP' })
    const row = city.closest('[class*="grid"]')!

    await expect(getComputedStyle(form).rowGap).toBe('16px')
    const style = getComputedStyle(row)
    await expect(style.display).toBe('grid')
    await expect(style.gridAutoFlow).toBe('column')
    await expect(style.columnGap).toBe('16px')

    const rects = [city, state, zip].map((el) => el.getBoundingClientRect())
    await expect(rects[1].top).toBe(rects[0].top)
    await expect(rects[2].top).toBe(rects[0].top)
    await expect(Math.abs(rects[1].width - rects[0].width)).toBeLessThanOrEqual(1)
    await expect(Math.abs(rects[2].width - rects[0].width)).toBeLessThanOrEqual(1)
  },
}

/**
 * Below 640 a Row is a column. The fields keep their order and take the whole
 * width, 16px apart, and nothing about the form has to be told.
 */
export const RowsPhone: Story = {
  name: 'Rows, phone',
  parameters: phone,
  globals: { viewport: { value: 'phone' } },
  render: (args) => <AddressForm {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const city = canvas.getByRole('textbox', { name: 'City' })
    const state = canvas.getByRole('textbox', { name: 'State' })
    const row = city.closest('[class*="grid"]')!

    await expect(window.innerWidth).toBeLessThan(640)
    await expect(getComputedStyle(row).gridAutoFlow).toBe('row')
    const cityField = city.closest('[class*="flex-col"]')!
    const stateField = state.closest('[class*="flex-col"]')!
    await expect(cityField.getBoundingClientRect().width).toBe(row.getBoundingClientRect().width)
    await expect(
      stateField.getBoundingClientRect().top - cityField.getBoundingClientRect().bottom,
    ).toBe(16)
  },
}

/**
 * **`Form.Actions` is the button row**, at the 8px between buttons every
 * footer in the library uses. `end` is the default and the shape a dozen
 * stories had drawn by hand. `start` is for a form that reads left to right
 * with nothing to its right. `stretch` is the sign-in shape: every button the
 * width of the form, stacked, and the submit on **top** — the children stay in
 * the Cancel-then-Submit order the other two use, and the row reverses them.
 */
export const ActionsAlignment: Story = {
  render: (args) => (
    <div className="flex w-96 flex-col gap-8">
      {(['end', 'start', 'stretch'] as const).map((align) => (
        <Form key={align} {...args} aria-label={`Actions ${align}`}>
          <Field name={`${align}-email`} label="Email">
            <Input type="email" defaultValue="ada@example.com" />
          </Field>
          <Form.Actions align={align}>
            <Button appearance="secondary">Cancel</Button>
            <Button type="submit">Save</Button>
          </Form.Actions>
        </Form>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const actionsOf = (name: string) => {
      const form = canvas.getByRole('form', { name })
      const save = within(form).getByRole('button', { name: 'Save' })
      return { form, save, cancel: within(form).getByRole('button', { name: 'Cancel' }), row: save.parentElement! }
    }

    const end = actionsOf('Actions end')
    let style = getComputedStyle(end.row)
    await expect(style.display).toBe('flex')
    await expect(style.flexDirection).toBe('row')
    await expect(style.justifyContent).toBe('flex-end')
    await expect(style.columnGap).toBe('8px')
    await expect(end.save).toHaveAttribute('type', 'submit')
    await expect(end.cancel).toHaveAttribute('type', 'button')

    const start = actionsOf('Actions start')
    await expect(getComputedStyle(start.row).justifyContent).toBe('flex-start')

    const stretch = actionsOf('Actions stretch')
    style = getComputedStyle(stretch.row)
    await expect(style.flexDirection).toBe('column-reverse')
    await expect(style.rowGap).toBe('8px')
    const rowWidth = stretch.row.getBoundingClientRect().width
    await expect(stretch.save.getBoundingClientRect().width).toBe(rowWidth)
    await expect(stretch.cancel.getBoundingClientRect().width).toBe(rowWidth)
    await expect(stretch.save.getBoundingClientRect().top).toBeLessThan(
      stretch.cancel.getBoundingClientRect().top,
    )
  },
}

/**
 * A settings page, with one of everything: Input, TextArea, Select, Combobox,
 * Autocomplete, a Row of NumberInput and SegmentedControl, a Checkbox Group, a
 * Radio Group and a Switch, each inside a named Field, and a Reset beside the
 * Save. Nothing here carries an `aria-label` — every group takes its name from
 * its Field's label, which is what a Field is for.
 */
export const InContext: Story = {
  render: (args) => (
    <Card padding={4} className="w-[40rem]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-content-emphasized">Workspace settings</h2>
        <p className="text-sm text-content-subtle">
          Changes apply to everyone in the workspace once saved.
        </p>
      </div>
      <Form {...args} aria-label="Workspace settings">
        <Field name="workspace" label="Workspace name">
          <Input required defaultValue="Acme Design" />
        </Field>
        <Field name="description" label="Description" description="Shown on the workspace's public page">
          <TextArea rows={3} placeholder="What this workspace is for" />
        </Field>
        <Form.Row>
          <Field name="timezone" label="Timezone" nativeLabel={false}>
            <Select defaultValue="america/los_angeles" placeholder="Select timezone…">
              {timezoneItems}
            </Select>
          </Field>
          <Field name="country" label="Country" nativeLabel={false}>
            <Combobox items={countries} defaultValue={countries[6]} placeholder="Select country" />
          </Field>
        </Form.Row>
        <Field name="project" label="Default project" description="Where new files land">
          <Autocomplete items={projects} placeholder="Search projects…" />
        </Field>
        <Form.Row>
          <Field name="seats" label="Seats">
            <NumberInput min={1} max={500} defaultValue={12} />
          </Field>
          <Field name="density" label="Density">
            <SegmentedControl defaultValue="comfortable">
              <SegmentedControl.Item value="compact">Compact</SegmentedControl.Item>
              <SegmentedControl.Item value="comfortable">Comfortable</SegmentedControl.Item>
            </SegmentedControl>
          </Field>
        </Form.Row>
        <Field name="notifications" label="Notifications">
          <Checkbox.Group defaultValue={['mentions']}>
            <Checkbox value="mentions" label="Mentions" description="When somebody @-mentions you" />
            <Checkbox value="digest" label="Weekly digest" />
          </Checkbox.Group>
        </Field>
        <Field name="visibility" label="Visibility">
          <Radio.Group defaultValue="team">
            <Radio value="team" label="Team" description="Anyone in the workspace" />
            <Radio value="private" label="Private" description="Only people you invite" />
          </Radio.Group>
        </Field>
        <Field name="twoFactor" label="Security">
          <Switch label="Two-factor authentication" description="Required for admins" />
        </Field>
        <Form.Actions>
          <Button appearance="secondary" type="reset">
            Reset
          </Button>
          <Button type="submit">Save changes</Button>
        </Form.Actions>
      </Form>
    </Card>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const form = canvas.getByRole('form', { name: 'Workspace settings' })

    await expect(canvas.getByRole('textbox', { name: 'Workspace name' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Timezone' })).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Country' })).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Default project' })).toBeVisible()
    await expect(canvas.getByLabelText('Seats')).toBeVisible()
    await expect(canvas.getByRole('radiogroup', { name: 'Density' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Notifications' })).toBeVisible()
    await expect(canvas.getByRole('radiogroup', { name: 'Visibility' })).toBeVisible()
    await expect(canvas.getByRole('switch', { name: 'Two-factor authentication' })).toBeVisible()
    // Each option keeps its own name under a Field; the group takes the Field's.
    await expect(canvas.getByRole('checkbox', { name: 'Mentions' })).toHaveAccessibleDescription(
      'When somebody @-mentions you',
    )
    await expect(canvas.getByRole('radio', { name: 'Team' })).toHaveAccessibleDescription(
      'Anyone in the workspace',
    )
    await expect(
      canvas.getByRole('switch', { name: 'Two-factor authentication' }),
    ).toHaveAccessibleDescription('Required for admins')

    await expect(getComputedStyle(form).rowGap).toBe('16px')

    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(args.onFormSubmit).toHaveBeenCalledTimes(1))
    await expect(args.onFormSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workspace: 'Acme Design',
        timezone: 'america/los_angeles',
        country: 'us',
        seats: 12,
        density: 'comfortable',
        notifications: ['mentions'],
        visibility: 'team',
        twoFactor: false,
      }),
      expect.anything(),
    )
  },
}
