import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Radio } from './Radio'

const meta = {
  title: 'Components/Radio',
  component: Radio,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    inContainer: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    // `value` is required on a Radio — it is what the group selects by — so it
    // has to be here for the stories to typecheck. Every story overrides it.
    value: 'date',
    label: 'Label',
    inContainer: false,
    invalid: false,
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click a label as well as a dial: each row is a real `<label>`, so the
 * text is part of the hit target.
 *
 * Tab in and then use the arrow keys. **Selection follows focus** — arrowing
 * onto an option selects it, which is what a radiogroup is supposed to do, and
 * the deliberate opposite of Tabs. The whole group is one tab stop.
 */
export const Playground: Story = {
  render: (args) => (
    <Radio.Group aria-label="Sort by" defaultValue="date">
      <Radio {...args} value="date" label="Date" />
      <Radio {...args} value="name" label="Name" />
      <Radio {...args} value="type" label="Type" />
    </Radio.Group>
  ),
}

/**
 * Figma's `Selected State`. The selected dial is a solid disc — Figma fills the
 * background and the stroke with Input/Selected — carrying an 8px glyph in
 * Input/Selected Foreground. Those numbers came off the exported SVG, because
 * Figma draws this state as a flattened vector with no variables bound to it.
 */
export const SelectedStates: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Radio.Group aria-label="Selected states" defaultValue="selected">
      <Radio {...args} value="default" label="Default" />
      <Radio {...args} value="selected" label="Selected" />
    </Radio.Group>
  ),
}

/**
 * Figma's `State` axis, minus the two the browser owns. Hover the rows and tab
 * through them for those.
 *
 * A disabled option keeps its place in the group but cannot be selected.
 * `invalid` swaps the dial's border for Feedback/Danger/Highlight and sets
 * `aria-invalid`; it stays a prop rather than a CSS state until the library has
 * a Field component for Base UI to publish validity through.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Radio.Group aria-label="Default states" defaultValue="a">
        <Radio {...args} value="a" label="Default, selected" />
        <Radio {...args} value="b" label="Default" />
      </Radio.Group>
      <Radio.Group aria-label="Invalid states">
        <Radio {...args} value="a" label="Invalid" invalid />
      </Radio.Group>
      <Radio.Group aria-label="Disabled states" defaultValue="b">
        <Radio {...args} value="a" label="Disabled" disabled />
        <Radio {...args} value="b" label="Disabled and selected" disabled />
      </Radio.Group>
    </div>
  ),
}

/**
 * The Figma `Sub Label` slot — the reason to reach for a radio list rather than
 * a SegmentedControl. Both are one-of-many built on the same Base UI primitive;
 * this is the one with room to explain the options.
 */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Radio.Group aria-label="Plan" defaultValue="team">
      <Radio
        {...args}
        value="solo"
        label="Solo"
        description="One editor. Everything else included."
      />
      <Radio
        {...args}
        value="team"
        label="Team"
        description="Up to ten editors, shared libraries, and roles."
      />
      <Radio
        {...args}
        value="org"
        label="Organisation"
        description="Unlimited editors, SSO, and an audit log."
      />
    </Radio.Group>
  ),
}

/**
 * Figma's `In Container` — the card form, for when the choice is the page rather
 * than one field on it. The label goes semibold and Content/Emphasized, and the
 * whole card highlights on hover.
 *
 * **The card's line is an `inset-ring`, not a border**, for the reason
 * Checkbox's is: Figma draws the container 40px tall — 24 of line-height plus 8
 * above and below — and a border would add its 2px on top. **40 is the number
 * to check** when this changes.
 */
export const InContainer: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Radio.Group aria-label="Delivery" defaultValue="express">
      <Radio {...args} inContainer value="standard" label="Standard" />
      <Radio {...args} inContainer value="express" label="Express" />
      <Radio {...args} inContainer value="invalid" label="Invalid" invalid />
      <Radio {...args} inContainer value="disabled" label="Disabled" disabled />
    </Radio.Group>
  ),
}

/**
 * Container plus sub-labels, which is the shape most "pick a plan" screens want:
 * a stack of cards, each explaining itself, one of them selected.
 */
export const ContainerWithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: function ContainerWithDescriptionStory(args) {
    const [plan, setPlan] = useState('team')

    return (
      <Radio.Group aria-label="Plan" value={plan} onValueChange={setPlan}>
        <Radio
          {...args}
          inContainer
          value="solo"
          label="Solo"
          description="One editor. Everything else included."
        />
        <Radio
          {...args}
          inContainer
          value="team"
          label="Team"
          description="Up to ten editors, shared libraries, and roles."
        />
        <Radio
          {...args}
          inContainer
          value="org"
          label="Organisation"
          description="Unlimited editors, SSO, and an audit log."
        />
      </Radio.Group>
    )
  },
}

/**
 * In context — a settings panel. Note that the group needs `aria-label`: Base UI
 * only fills `aria-labelledby` from a surrounding Field or Fieldset, and neither
 * exists yet, so without it the group announces as an unnamed radio group. The
 * visible heading here and the `aria-label` say the same thing on purpose.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4 rounded-lg border border-surface-border bg-surface-card-primary p-6">
      <h2 className="text-lg font-semibold text-content-emphasized">Who can comment</h2>
      <Radio.Group aria-label="Who can comment" defaultValue="editors">
        <Radio {...args} value="anyone" label="Anyone with the link" />
        <Radio {...args} value="editors" label="Editors only" />
        <Radio
          {...args}
          value="nobody"
          label="No one"
          description="Existing comments stay visible."
        />
      </Radio.Group>
    </div>
  ),
}
