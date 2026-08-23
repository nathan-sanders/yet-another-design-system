import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Switch } from './Switch'

/**
 * Figma's `Selected State` axis. Named for what a switch actually is rather than
 * for the Figma property: a switch is off or on, where a checkbox is ticked.
 */
const selectedStates = [
  { name: 'Off', props: {} },
  { name: 'On', props: { checked: true } },
] as const

const meta = {
  title: 'Components/Switch',
  component: Switch,
  decorators: [
    (Story) => (
      <div className="max-w-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    inContainer: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Aeroplane mode',
    inContainer: false,
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click the *label* as well as the track: the row is a real `<label>`, so
 * the text is part of the hit target.
 *
 * Watch the knob as you flip it. It slides 11px **and grows**, 14px to 16px,
 * which is what Figma draws (node 40004060:16435) rather than a rounding error.
 * The whole move is one 130ms transition on `translate`, `width`, `height` and
 * `background-color`.
 *
 * Press Tab to see the focus ring: a 2px gap and a 2px ring, both outside the
 * pill. Inside a container the card takes the ring instead, so a focused option
 * is never circled twice.
 */
export const Playground: Story = {}

/**
 * The full `Selected State` axis. Off is a white track with a grey knob on the
 * left; on fills track and border with Input/Selected and swaps the knob to
 * Input/Selected Foreground.
 *
 * These two are `checked`, not `defaultChecked` — they are held in place so the
 * ends of the travel can be compared side by side.
 */
export const SelectedStates: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {selectedStates.map(({ name, props }) => (
        <Switch key={name} {...args} {...props} label={name} />
      ))}
    </div>
  ),
}

/**
 * Figma's `State` axis, minus the two the browser owns. Hover any row and press
 * Tab through them to see the other two.
 *
 * `invalid` is the one here that Figma does not draw at all — its Switch has no
 * Invalid state, where Checkbox's and Radio's do. It is included so the three
 * form controls carry the same prop, and it wants adding to the file.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Switch {...args} label="Default" />
      <Switch {...args} label="Invalid" invalid />
      <Switch {...args} label="Disabled" disabled />
      <Switch {...args} label="Disabled and on" disabled checked />
    </div>
  ),
}

/**
 * The Figma `Sub Label` slot. A second line under the label, at `text-sm` in
 * Content/Subtle — and it earns its place more often on a switch than on a
 * checkbox, because a switch takes effect immediately and the sentence is
 * usually explaining what just happened.
 */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Switch
        {...args}
        label="Aeroplane mode"
        description="Turns off Wi-Fi, Bluetooth and mobile data."
      />
      <Switch
        {...args}
        label="Automatic updates"
        description="Installs overnight, while the machine is plugged in."
        defaultChecked
      />
    </div>
  ),
}

/**
 * Figma's `In Container` — the card form, for a switch that is its own setting
 * rather than one line of a list. The label goes semibold and
 * Content/Emphasized to match the bigger target, and the whole card highlights
 * on hover.
 *
 * **The card's line is an `inset-ring`, not a border.** Figma draws the
 * container 40px tall — 24 of line-height plus 8 above and below — and a border
 * would add its 2px on top of that. A ring is a shadow, so it costs no layout.
 * **40 is the number to check** when this changes.
 */
export const InContainer: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Switch {...args} inContainer label="Two-factor authentication" defaultChecked />
      <Switch {...args} inContainer label="Public profile" description="Anyone can find you." />
      <Switch {...args} inContainer label="Invalid" invalid />
      <Switch {...args} inContainer label="Disabled" disabled />
    </div>
  ),
}

/**
 * The container's `Slot`. Anything passed as `children` lands under the row,
 * inside the card — the detail that only matters once the switch is on.
 *
 * This is the shape that suits a switch best: flipping it commits, so the
 * consequence can be stated underneath straight away rather than waiting for a
 * Save.
 */
export const ContainerSlot: Story = {
  parameters: { controls: { disable: true } },
  render: function ContainerSlotStory(args) {
    const [checked, setChecked] = useState(true)

    return (
      <Switch
        {...args}
        inContainer
        label="Out of office"
        description="Auto-reply to everyone who writes to you."
        checked={checked}
        onCheckedChange={setChecked}
      >
        {checked && (
          <span className="text-sm text-content-subtle">
            Replying since 09:00. Turn this off to stop.
          </span>
        )}
      </Switch>
    )
  },
}

/**
 * In context — a settings panel, which is where nearly every switch lives.
 *
 * Worth reading against Checkbox's `InContext` story, which is a list of pending
 * choices waiting on a Save. Nothing here is pending: each row takes effect as
 * you flip it, which is the whole reason to reach for this component instead.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4 rounded-lg border border-surface-border bg-surface-card-primary p-6">
      <h2 className="text-lg font-semibold text-content-emphasized">Privacy</h2>
      <Switch
        {...args}
        label="Public profile"
        description="Anyone with the link can see your work."
        defaultChecked
      />
      <Switch {...args} label="Show activity status" description="When you were last online." />
      <Switch
        {...args}
        label="Share anonymous usage data"
        description="Helps us work out which features are worth keeping."
        defaultChecked
      />
    </div>
  ),
}
