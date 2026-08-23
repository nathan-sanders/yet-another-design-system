import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field } from '../Field'
import { Checkbox } from './Checkbox'

/**
 * Figma's `Selected State` axis. Indeterminate is not a third value of
 * `checked` — it is its own prop, exactly as `input.indeterminate` is its own
 * property in the DOM.
 */
const selectedStates = [
  { name: 'Default', props: {} },
  { name: 'Indeterminate', props: { indeterminate: true } },
  { name: 'Selected', props: { checked: true } },
] as const

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    inContainer: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
  },
  args: {
    label: 'Email me about updates',
    inContainer: false,
    invalid: false,
    disabled: false,
    indeterminate: false,
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click the *label* as well as the box: the row is a real `<label>`, so
 * the text is part of the hit target, which is what a checkbox this size needs.
 *
 * Press Tab to see the focus ring: a 2px gap and a 2px ring, both drawn outside
 * the box. Inside a container the card takes the ring instead, so a focused
 * option is never circled twice.
 */
export const Playground: Story = {}

/**
 * The full `Selected State` axis, unticked through indeterminate to ticked.
 * Ticked and indeterminate share one fill — Input/Selected for both background
 * and border — and differ only in the glyph, a check or a dash.
 */
export const SelectedStates: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {selectedStates.map(({ name, props }) => (
        <Checkbox key={name} {...args} {...props} label={name} />
      ))}
    </div>
  ),
}

/**
 * Figma's `State` axis, minus the two the browser owns. Hover any row and press
 * Tab through them to see the other two.
 *
 * `invalid` is the one member of that axis that is a prop rather than a CSS
 * state: it swaps the border for Feedback/Danger/Highlight and sets
 * `aria-invalid`. It will become `data-invalid:` once the library has a Field
 * component for Base UI to publish validity through.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Checkbox {...args} label="Default" />
      <Checkbox {...args} label="Invalid" invalid />
      <Checkbox {...args} label="Disabled" disabled />
      <Checkbox {...args} label="Disabled and ticked" disabled checked />
    </div>
  ),
}

/**
 * The Figma `Sub Label` slot. A second line under the label, at `text-sm` in
 * Content/Subtle — for the sentence that would otherwise turn the label itself
 * into a paragraph.
 */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Checkbox
        {...args}
        label="Email me about updates"
        description="Roughly one a month. Unsubscribe any time."
      />
      <Checkbox
        {...args}
        label="Share anonymous usage data"
        description="Helps us work out which features are worth keeping."
        defaultChecked
      />
    </div>
  ),
}

/**
 * Figma's `In Container` — the card form, for a checkbox that is its own choice
 * rather than one line of a list. The label goes semibold and Content/Emphasized
 * to match the bigger target, and the whole card highlights on hover.
 *
 * **The card's line is an `inset-ring`, not a border.** Figma draws the
 * container 40px tall — 24 of line-height plus 8 above and below — and a border
 * would add its 2px on top of that. A ring is a shadow, so it costs no layout.
 * **40 is the number to check** when this changes.
 */
export const InContainer: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex max-w-96 flex-col gap-4">
      <Checkbox {...args} inContainer label="Standard" description="Ships in 3–5 days." />
      <Checkbox {...args} inContainer label="Express" description="Next day, £6." defaultChecked />
      <Checkbox {...args} inContainer label="Invalid" invalid />
      <Checkbox {...args} inContainer label="Disabled" disabled />
    </div>
  ),
}

/**
 * The container's `Slot`. Anything passed as `children` lands under the row,
 * inside the card — a nested set of options, a note, a control that only
 * matters once the box is ticked.
 */
export const ContainerSlot: Story = {
  parameters: { controls: { disable: true } },
  render: function ContainerSlotStory(args) {
    const [checked, setChecked] = useState(true)

    return (
      <div className="max-w-96">
        <Checkbox
          {...args}
          inContainer
          label="Recurring donation"
          description="Charged on the first of each month."
          checked={checked}
          onCheckedChange={setChecked}
        >
          {checked && (
            <span className="text-sm text-content-subtle">
              Next charge on 1 September. Cancel any time from Settings.
            </span>
          )}
        </Checkbox>
      </div>
    )
  },
}

/**
 * `Checkbox.Group` — Figma's Checkbox Group set. It owns the array value, so a
 * checkbox inside one is identified by `name` rather than by holding its own
 * `checked` state.
 *
 * **The "select all" is the group's, not yours to compute.** This story used to
 * do the indeterminate arithmetic by hand; Base UI does it now, given
 * `allValues` — it compares those against the current value to decide whether
 * the parent is checked, unchecked or half. The `-` glyph you see is read off
 * `data-indeterminate` rather than a prop, which is what makes the computed case
 * work at all.
 */
export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: function GroupStory() {
    const allValues = ['mentions', 'replies', 'messages']
    const [value, setValue] = useState(['mentions'])

    return (
      <Checkbox.Group
        allValues={allValues}
        value={value}
        onValueChange={setValue}
        selectAll="Select all"
        aria-label="Notifications"
        className="w-80"
      >
        <Checkbox name="mentions" label="Mentions" />
        <Checkbox name="replies" label="Replies" />
        <Checkbox name="messages" label="Direct messages" />
      </Checkbox.Group>
    )
  },
}

/**
 * Figma's `Layout=Horizontal`. The options divide the width evenly rather than
 * hugging their labels, and the Select All row and its Divider stay full-width
 * above them.
 *
 * Keep it to four options at most — past that a row wraps awkwardly, which is
 * Astryx's rule for the same component.
 */
export const GroupHorizontal: Story = {
  parameters: { controls: { disable: true } },
  render: function GroupHorizontalStory() {
    const allValues = ['s', 'm', 'l']
    const [value, setValue] = useState(['m'])

    return (
      <Checkbox.Group
        orientation="horizontal"
        allValues={allValues}
        value={value}
        onValueChange={setValue}
        selectAll="Select all"
        aria-label="Sizes"
        className="w-[400px]"
      >
        <Checkbox name="s" label="Small" />
        <Checkbox name="m" label="Medium" />
        <Checkbox name="l" label="Large" />
      </Checkbox.Group>
    )
  },
}

/**
 * Without `selectAll` there is no parent row and no Divider — just the options,
 * sharing one value. And a `Field` around the group is what names it and carries
 * a message, which is the pairing Figma draws as `Type=Checkbox Group`.
 */
export const GroupPlain: Story = {
  parameters: { controls: { disable: true } },
  render: function GroupPlainStory() {
    const [value, setValue] = useState<string[]>([])

    return (
      <Field
        label="Notifications"
        description="Pick at least one"
        error={value.length === 0 ? 'Choose how you want to hear from us' : undefined}
        className="w-80"
      >
        <Checkbox.Group value={value} onValueChange={setValue}>
          <Checkbox name="email" label="Email" />
          <Checkbox name="sms" label="SMS" />
        </Checkbox.Group>
      </Field>
    )
  },
}

export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex max-w-96 flex-col gap-4 rounded-lg border border-surface-border bg-surface-card-primary p-6">
      <h2 className="text-lg font-semibold text-content-emphasized">Notifications</h2>
      <Checkbox
        {...args}
        label="Mentions"
        description="When someone @-mentions you in a comment."
        defaultChecked
      />
      <Checkbox {...args} label="Replies" description="Direct replies to your comments." />
      <Checkbox
        {...args}
        label="Weekly digest"
        description="A summary of everything you missed, every Monday."
        defaultChecked
      />
    </div>
  ),
}
