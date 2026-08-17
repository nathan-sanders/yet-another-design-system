import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Slider } from './Slider'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  decorators: [
    (Story) => (
      <div className="max-w-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    bounds: { control: 'boolean' },
    valueTooltip: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  args: {
    label: 'Volume',
    defaultValue: 40,
    bounds: true,
    valueTooltip: true,
    disabled: false,
  },
} satisfies Meta<typeof Slider>

export default meta

/**
 * `StoryObj<typeof Slider>` rather than the `StoryObj<typeof meta>` every other
 * story file here uses, and not by preference. `SliderProps` is a union — `label`
 * or `aria-label`, one of them required — and Storybook works out which args a
 * story still owes by running `Omit` over the component's props. `Omit` does not
 * distribute across a union: it collapses to the keys the branches share, so the
 * inference either demands `args` on every story or reduces them to `never`.
 * Naming the component directly skips that step. Button has the same shape of
 * union and does not hit this, because its discriminator (`children`) is a prop
 * Storybook is already tracking as an arg.
 */
type Story = StoryObj<typeof Slider>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Nothing here carries a `dark:` class: the fill is `Input/Selected`, which
 * is stone-600 in light and stone-100 in dark, so the track inverts itself.
 *
 * Three things to try. **Drag the handle** and watch it grow, 16px to 20px, which
 * is what Figma draws (node `40004155:14467`) and what Switch's knob also does.
 * **Press anywhere on the track** — the handle comes to you, because the hit area
 * is the whole 24px control rather than the handle. **Press Tab, then the arrow
 * keys**: Shift or Page Up/Down moves by the large step of 10, and Home and End
 * jump to the bounds.
 *
 * The focus ring is the library's one ring, and it arrives here by a slightly
 * different door: focus actually lands on a hidden `<input type="range">` *inside*
 * the handle, so this is `focusRingWithin` — the same export the card around a
 * Checkbox uses.
 */
export const Playground: Story = {}

/**
 * Figma's `Type` axis, and **it is not a prop.** Pass a number and you get one
 * handle; pass an array and you get one per value. The component counts them.
 *
 * Drag the two range handles into each other. They push rather than swap, which
 * is Base UI's default and the right one for a price filter: the lower bound
 * staying the lower bound is the whole point of the control.
 */
export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider {...args} label="Default" defaultValue={40} />
      <Slider
        {...args}
        label="Range"
        defaultValue={[20, 80]}
        thumbLabels={['Minimum', 'Maximum']}
      />
    </div>
  ),
}

/**
 * Figma's `minValue` / `maxValue` booleans, and their `minValueText` /
 * `maxValueText` overrides.
 *
 * **The bounds are in `font-mono`**, which is the file's choice and worth keeping:
 * a monospaced digit means the label does not change width as the number does, so
 * the track cannot shift under your cursor mid-drag. They label the *bounds*, not
 * the value — the value lives in the tooltip.
 */
export const Bounds: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider {...args} label="Bounds from min and max" />
      <Slider {...args} label="Overridden" minLabel="Quiet" maxLabel="Loud" />
      <Slider {...args} label="No bounds" bounds={false} />
    </div>
  ),
}

/**
 * Figma's hidden `Marks` layer, and Astryx's marks.
 *
 * **A tick paints behind the track**, so all you see of it is the 2px poking out
 * above and below. That is deliberate: the Marks frame is z-1 under Figma's
 * filled and empty segments, and the tick uses the same `Surface/Border` token as
 * the unfilled track.
 *
 * Marks are explicit rather than a boolean, so they need not be evenly spaced —
 * Figma's `justify-between` only works because its five are. A bare number
 * labels itself; `{ value }` with no label is a tick on its own.
 *
 * **Marks and bounds are alternatives in practice.** Turn both on and the scale's
 * first and last labels sit next to the bounds labels saying the same thing, so
 * these have `bounds={false}`.
 */
export const Marks: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider
        {...args}
        label="Figma's five"
        bounds={false}
        marks={[0, 25, 50, 75, 100]}
        step={25}
      />
      <Slider
        {...args}
        label="Unevenly spaced"
        bounds={false}
        defaultValue={30}
        marks={[0, 10, 30, 60, 100]}
      />
      <Slider
        {...args}
        label="Ticks with no labels"
        bounds={false}
        marks={[{ value: 0 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }]}
      />
    </div>
  ),
}

/**
 * Astryx's first rule for this component: format the value with its unit, so it
 * reads "60%" rather than "60". `format` and `locale` go straight to Base UI,
 * which uses them for the tooltip, for `aria-valuetext`, **and** — through the
 * same formatter — for the bounds and tick labels, so a slider cannot end up
 * reading "60%" between a bare 0 and 100.
 */
export const Formatted: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider
        {...args}
        label="Opacity"
        defaultValue={0.6}
        min={0}
        max={1}
        step={0.01}
        format={{ style: 'percent' }}
      />
      <Slider
        {...args}
        label="Budget"
        defaultValue={[250, 750]}
        min={0}
        max={1000}
        step={50}
        format={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
        thumbLabels={['Lowest price', 'Highest price']}
      />
    </div>
  ),
}

/**
 * The value in a Tooltip above the handle — a composition of the existing
 * component, not a second popup implementation. Figma's handle draws it in its
 * Hover state (node `40004155:14470`), so it is on by default.
 *
 * It reads the live value out of the slider's own context rather than holding
 * state, which is why an uncontrolled slider still gets an accurate tooltip. The
 * description also reaches the right element: Base UI's `Thumb` hoists
 * `aria-describedby` onto its hidden input, and the input is what takes focus.
 *
 * Turn it off when something else already shows the value — a readout beside the
 * control, or the number input this component is waiting on.
 */
export const ValueTooltip: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider {...args} label="With the tooltip" />
      <Slider {...args} label="Without it" valueTooltip={false} />
    </div>
  ),
}

/**
 * Hover and focus are the browser's, so this axis is really just the disabled
 * state — which **Figma does not draw at all.** Its handle set is Default | Hover
 * | Focus, so `disabled` goes past the file and wants adding to it: the same
 * build-then-sync-back direction as Divider's `emphasis`, SegmentedControl's
 * `layout` and Switch's `invalid`.
 *
 * It is `opacity-40` plus `pointer-events-none`, the library's idiom. Note what
 * that costs: a disabled slider swallows hover, so it cannot explain itself with
 * a Tooltip — Astryx warns about exactly this. Put the reason next to the
 * control.
 *
 * There is no `invalid` here, unlike Checkbox, Radio and Switch. Base UI only
 * publishes `data-invalid` for a control inside a `Field`, and Figma's Slider has
 * no invalid state to mirror, so it belongs with that PR.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider {...args} label="Default" />
      <Slider {...args} label="Disabled" disabled />
      <Slider {...args} label="Disabled range" defaultValue={[20, 80]} disabled />
    </div>
  ),
}

/**
 * No visible label. The props are a union, so this form **requires**
 * `aria-label` — a slider with neither will not compile. Astryx's rule is to
 * always provide a label even when it is invisible, and Base UI forwards this one
 * onto the hidden input, which is the element a screen reader reads.
 *
 * A range wants one name per handle: `thumbLabels`. Left off, Base UI's
 * `aria-valuetext` still says "start range" and "end range", which is a floor
 * rather than a finish.
 */
export const Unlabelled: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Slider {...args} label={undefined} aria-label="Volume" />
      <Slider
        {...args}
        label={undefined}
        aria-label="Price range"
        defaultValue={[20, 80]}
        thumbLabels={['Minimum price', 'Maximum price']}
      />
    </div>
  ),
}

/**
 * Controlled, and reading the value back out — the case the deferred number input
 * will eventually cover properly. `onValueChange` fires as you drag;
 * `onValueCommitted` fires once you let go, which is the one to send to a server.
 */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory(args) {
    const [value, setValue] = useState(40)

    return (
      <div className="flex flex-col gap-3">
        <Slider
          {...args}
          label="Brightness"
          value={value}
          onValueChange={(next) => setValue(next as number)}
        />
        <p className="font-mono text-sm text-content-subtle">value: {value}</p>
      </div>
    )
  },
}

/**
 * In context — an audio panel, which is where most sliders live.
 *
 * Worth reading against SegmentedControl's own panel: a segmented control picks
 * one of a few named options, a slider explores a continuous range. Astryx puts
 * that boundary in terms of the step — if a slider only has a handful of
 * positions, it should have been radios or a segmented control instead.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6 rounded-lg border border-surface-border bg-surface-card-primary p-6">
      <h2 className="text-lg font-semibold text-content-emphasized">Output</h2>
      <Slider
        {...args}
        label="Master volume"
        defaultValue={0.7}
        min={0}
        max={1}
        step={0.01}
        format={{ style: 'percent' }}
      />
      <Slider {...args} label="Balance" defaultValue={0} min={-50} max={50} />
      <Slider
        {...args}
        label="Playback range"
        defaultValue={[10, 90]}
        thumbLabels={['Start', 'End']}
      />
    </div>
  ),
}
