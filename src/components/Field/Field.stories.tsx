import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtSign, Search } from 'lucide-react'

import { Checkbox } from '../Checkbox'
import { Input, InputGroup } from '../Input'
import { Radio } from '../Radio'
import { Switch } from '../Switch'
import { Field } from './Field'

const meta = {
  title: 'Components/Field',
  component: Field,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: false },
  },
  args: {
    label: 'Label',
    description: 'Sub label',
    invalid: false,
    disabled: false,
    children: <Input placeholder="Placeholder..." />,
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

/** One field with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args} />
    </div>
  ),
}

/**
 * The label and its sub-label are one 44px block — 24px of label then 20px of
 * sub-label, hard against each other — sitting 8px above the control.
 *
 * **The sub-label is off unless you give it one**, as it is in Figma: the label
 * is the requirement and this is the extra. Both are real: Base UI points the
 * label's `htmlFor` at the control and folds the sub-label into its
 * `aria-describedby`, so a screen reader reads one as the name and the other as
 * detail.
 */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field {...args} label="Display name" description="Shown next to your comments" />
      <Field {...args} label="Display name" description={undefined} />
    </div>
  ),
}

/**
 * Figma's `Validation Message` — Content/Danger at text-sm, and italic, which is
 * this system's mark for text that is not something the person entered. The
 * placeholder inside the field is italic for the same reason.
 *
 * **Passing `error` is enough.** It puts the field in the invalid state on its
 * own, so `invalid` is only needed for the rarer case of colouring the control
 * without saying anything. Like the sub-label, the message lands in
 * `aria-describedby`, so it is read out rather than just seen.
 */
export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field
        {...args}
        label="Email"
        description="We'll only use it to sign you in"
        error="Email must include an @"
      >
        <Input defaultValue="nathan.example.com" />
      </Field>
      <Field {...args} label="Border only" description="`invalid` with no message" invalid />
    </div>
  ),
}

/**
 * Disabled fades the whole field at 40%, message included. The `aria-disabled`
 * on the root is doing real work: at that opacity the sub-label measures around
 * 2:1, and axe only exempts disabled text by walking up from it looking for a
 * disabled control or `aria-disabled="true"`. The label gets that exemption free
 * — it is a `<label>` for a disabled input — but the sub-label and the message
 * are not labels, and the story suite would fail on `color-contrast` without it.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field {...args} label="Default" />
      <Field {...args} label="Invalid" invalid />
      <Field {...args} label="With a message" error="That name is already taken" />
      <Field {...args} label="Disabled" disabled />
      <Field {...args} label="Disabled with a message" error="Still readable at 40%" disabled />
    </div>
  ),
}

/**
 * Figma's `Type` property — Input, Input Group, Autocomplete, Select, Combobox,
 * Checkbox, Checkbox Group, Radio. In code it is **derived rather than declared**:
 * what you pass as children decides it, the way Avatar's content follows from
 * `src` / `name` / `count`. A Field cannot be wrong about what is inside it.
 *
 * The three shown here are the ones that exist so far. Note the last two: their
 * controls carry their own `<label>`, which is what makes their text a hit
 * target, so this label sits **above** them as the name for the set — a legend,
 * not a second name for one box.
 */
export const ControlTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-8">
      <Field label="Input" description="A single line of free text">
        <Input placeholder="Placeholder..." />
      </Field>

      <Field label="Input Group" description="The same field, with addons">
        <InputGroup>
          <InputGroup.Addon align="inline-start" icon={Search} />
          <InputGroup.Input placeholder="Search..." />
          <InputGroup.Addon align="inline-end" icon={AtSign} />
        </InputGroup>
      </Field>

      <Field label="Checkbox" description="The label above names the set">
        <Checkbox label="Email me about updates" />
      </Field>

      <Field label="Radio" description="Ditto — each option keeps its own label">
        <Radio.Group aria-label="Plan" defaultValue="monthly">
          <Radio value="monthly" label="Monthly" />
          <Radio value="yearly" label="Yearly" />
        </Radio.Group>
      </Field>
    </div>
  ),
}

/**
 * **One Field drives the validity of whatever is inside it.** Setting `invalid`
 * — or just passing `error` — puts `data-invalid` on the control through Base
 * UI's `fieldValidityMapping`, and each control's own styling hangs off that.
 * So the red border on a checkbox here is not a prop anyone passed to the
 * checkbox; it is the Field's state reaching it.
 *
 * Each control keeps its own `invalid` prop for standing alone, which is what
 * Figma draws as `State=Invalid`. The two compose — either lights the border —
 * but only the Field can carry the message that says what is wrong, so prefer
 * it whenever there is one.
 *
 * Switch is the odd one out: the code lets a Field drive it, but Figma's Field
 * does not list Switch among the controls it wraps, so that is a composition
 * the code allows rather than one the file asks for.
 */
export const DrivesValidity: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-8">
      <Field label="Email" error="Email must include an @">
        <Input defaultValue="nathan.example.com" />
      </Field>

      <Field label="Terms" error="You'll need to accept these to continue">
        <Checkbox label="I accept the terms of service" />
      </Field>

      <Field label="Plan" error="Pick a plan to continue">
        <Radio.Group aria-label="Plan">
          <Radio value="monthly" label="Monthly" />
          <Radio value="yearly" label="Yearly" />
        </Radio.Group>
      </Field>

      <Field label="Notifications" error="Turn this on to receive your receipts">
        <Switch label="Email me receipts" />
      </Field>
    </div>
  ),
}

/**
 * A sign-up form, so the rhythm of label, sub-label and message is visible with
 * several fields stacked rather than one at a time.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <form
      className="flex w-96 flex-col gap-5 rounded-lg bg-surface-primary p-6 inset-ring inset-ring-surface-border"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-content-emphasized">Create your account</h2>
        <p className="text-sm text-content-subtle">Free for 14 days. No card needed.</p>
      </div>

      <Field label="Full name">
        <Input placeholder="Ada Lovelace" autoComplete="name" />
      </Field>

      <Field label="Email" description="We'll only use it to sign you in">
        <Input type="email" placeholder="ada@example.com" autoComplete="email" />
      </Field>

      <Field label="Password" description="At least 12 characters" error="Password is too short">
        <Input type="password" defaultValue="hunter2" autoComplete="new-password" />
      </Field>
    </form>
  ),
}
