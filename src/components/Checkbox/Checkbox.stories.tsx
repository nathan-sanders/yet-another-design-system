import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

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
 * Press Tab to see the focus ring: a 2px gap and a 3px ring, both drawn outside
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
 * A parent box summarising its children — the case indeterminate exists for.
 * The parent is ticked when every child is, indeterminate when only some are,
 * and unticked when none are.
 *
 * Base UI has a `CheckboxGroup` that wires this up (and Figma has a Checkbox
 * Group set to match), but neither is built here yet, so this story does the
 * arithmetic by hand to show the state rather than the plumbing.
 */
export const Parent: Story = {
  parameters: { controls: { disable: true } },
  render: function ParentStory(args) {
    const [items, setItems] = useState([true, false, false])
    const ticked = items.filter(Boolean).length

    return (
      <div className="flex flex-col gap-3">
        <Checkbox
          {...args}
          label="Notifications"
          checked={ticked === items.length}
          indeterminate={ticked > 0 && ticked < items.length}
          onCheckedChange={(next) => setItems(items.map(() => next))}
        />
        <div className="flex flex-col gap-3 pl-8">
          {['Mentions', 'Replies', 'Direct messages'].map((name, i) => (
            <Checkbox
              {...args}
              key={name}
              label={name}
              checked={items[i]}
              onCheckedChange={(next) =>
                setItems(items.map((value, j) => (j === i ? next : value)))
              }
            />
          ))}
        </div>
      </div>
    )
  },
}

/**
 * In context — a settings panel, which is where most checkboxes live.
 *
 * The box is centred against the whole label block rather than against its first
 * line, which is what Figma's auto-layout does. Worth a second look with a long
 * description: most systems top-align once the text runs to two lines.
 */
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
