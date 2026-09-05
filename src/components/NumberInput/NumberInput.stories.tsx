import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Field } from '../Field'
import { NumberInput } from './NumberInput'

const sizes = ['small', 'default', 'large'] as const

/**
 * The three states that are not browser states. Hover and focus are real CSS,
 * so they belong to the mouse and the Tab key rather than to a column here.
 */
const states = [
  { name: 'Default', props: {} },
  { name: 'Invalid', props: { invalid: true } },
  { name: 'Disabled', props: { disabled: true } },
] as const

const meta = {
  title: 'Components/NumberInput',
  component: NumberInput,
  argTypes: {
    size: { control: 'select', options: sizes },
    steppers: { control: 'boolean' },
    scrubbable: { control: 'boolean' },
    units: { control: 'text' },
    placeholder: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  args: {
    size: 'default',
    steppers: true,
    scrubbable: false,
    placeholder: '0',
    invalid: false,
    disabled: false,
    readOnly: false,
  },
} satisfies Meta<typeof NumberInput>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One field with controls — use the Theme switch in the toolbar for dark mode.
 *
 * The label comes from the `Field` around it, as it does for every control here.
 * Base UI puts `aria-roledescription="Number field"` on the input, which tells a
 * screen reader what kind of control it is and is **not** a name — an unnamed
 * NumberInput is as unnamed as an unnamed Input.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Team size" description="People on the team" className="w-80">
      <NumberInput {...args} min={1} max={50} defaultValue={3} />
    </Field>
  ),
}

/**
 * Every size against every state that is not a browser state — the Figma variant
 * grid with its Hover and Focus columns left to the browser.
 *
 * A CSS grid rather than a `<table>`: a full-width component inside an
 * auto-layout table cell collapses to its longest word.
 *
 * The stepper cells are square at the box's **inner** height — 22 / 30 / 38, the
 * box minus its two 1px borders — so they fill the field without pushing it
 * taller. Same arithmetic as the text row.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="grid w-fit grid-cols-[auto_repeat(3,16rem)] items-start gap-x-6 gap-y-4">
      <span aria-hidden />
      {states.map((state) => (
        <span key={state.name} className="text-sm text-content-subtle">
          {state.name}
        </span>
      ))}

      {sizes.map((size) => (
        <div key={size} className="contents">
          {/* 44px label block + the 8px below it, so the row label lines up with
              the field rather than with the label above it. */}
          <span className="pt-13 text-sm text-content-subtle capitalize">{size}</span>
          {states.map((state) => (
            <Field key={state.name} label="Label" description="Sub label">
              <NumberInput {...args} size={size} defaultValue={12} {...state.props} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Hover and focus are real browser states rather than props, so there is nothing
 * to switch on here — hover a field with the mouse, and press Tab to see the
 * two-ring treatment.
 *
 * **Watch where the ring lands.** Tab once and it rings the field; Tab again and
 * it rings the − button and *not* the field. There are three focusable things
 * inside one box, so the box scopes its ring to the `<input>` and each button
 * carries its own — Combobox's tokenizer rule. A container that rings
 * identically wherever focus is inside it says nothing.
 *
 * `readOnly` is the last one, and it is deliberately undrawn: the value stays at
 * full opacity and in the tab order, and Base UI turns off the arrow keys, the
 * wheel and both buttons. The library has no read-only treatment anywhere yet,
 * and faking one with `disabled` is the thing Input's own guidance forbids.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Hover or focus me" description="Both come from the browser">
        <NumberInput {...args} defaultValue={12} />
      </Field>
      <Field label="Invalid" description="Sub label" error="Enter a number above zero">
        <NumberInput {...args} defaultValue={-5} />
      </Field>
      <Field label="Disabled" description="Sub label" disabled>
        <NumberInput {...args} defaultValue={12} />
      </Field>
      <Field label="Read only" description="Not editable, not dimmed">
        <NumberInput {...args} defaultValue={12} readOnly />
      </Field>
    </div>
  ),
}

/**
 * Without a Field, a NumberInput still needs a name — `aria-label` is the way to
 * give it one. This is the shape for a number sitting in a toolbar beside
 * something that already says what it is for.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      {sizes.map((size) => (
        <NumberInput
          key={size}
          {...args}
          size={size}
          defaultValue={12}
          aria-label="Quantity"
          className="w-40"
        />
      ))}
    </div>
  ),
}

/**
 * A unit inside the field, so the number says what it counts without spending a
 * sub-label on it. It is `Content/Subtle` like every other piece of field
 * chrome — part of the furniture rather than something the person typed.
 *
 * Astryx's rule, kept: show the unit rather than leaving somebody to guess
 * whether a storage field wants MB or GB.
 */
export const WithUnits: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Completion" description="Percent of the work done">
        <NumberInput {...args} units="%" min={0} max={100} step={5} defaultValue={75} />
      </Field>
      <Field label="Storage" description="Per workspace">
        <NumberInput {...args} units="GB" min={0} defaultValue={256} />
      </Field>
    </div>
  ),
}

/**
 * `format` and `locale` go straight through to Base UI, which shows the
 * formatted value at rest and the raw number the moment you focus the field —
 * so a thousands separator never has to be typed or deleted. Click into the
 * budget below and the commas go; click out and they come back.
 *
 * Astryx models this as a `formatValue` callback. `Intl.NumberFormatOptions` is
 * the same idea in a vocabulary both sides already share, so there is nothing to
 * write here beyond passing it on.
 */
export const Formatted: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Budget" description="Annual, before tax">
        <NumberInput
          {...args}
          defaultValue={1234234}
          step={1000}
          format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
        />
      </Field>
      <Field label="Impressions" description="Last 30 days">
        <NumberInput {...args} defaultValue={482913} step={1000} />
      </Field>
    </div>
  ),
}

/**
 * The grip at the leading edge changes the value when you drag it sideways.
 *
 * Base UI's own demo wraps the *label* in the scrub area. That is not available
 * here — Field owns the label, and this component is the control and nothing
 * else — so the affordance moves inside the field, where it is also more
 * discoverable: a grip looks draggable in a way a label does not.
 */
export const Scrubbable: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Field label="Opacity" description="Drag the grip, or use the buttons" className="w-80">
      <NumberInput {...args} scrubbable units="%" min={0} max={100} defaultValue={40} />
    </Field>
  ),
}

/**
 * The behavior, pinned. Neither Input nor Select has a play function — they have
 * no behavior of their own to pin — and this is the first form control here that
 * does: a click steps by `step`, an arrow key steps by the same amount, Shift
 * takes `largeStep`, and both ends clamp.
 *
 * The clamp is asserted from the button's *disabled* state rather than by
 * pressing past the bound, because that is the part somebody could break without
 * the value ever going wrong.
 */
export const Behavior: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Field label="Quantity" description="Between 0 and 20" className="w-80">
      <NumberInput {...args} min={0} max={20} defaultValue={5} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')

    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }))
    await expect(input).toHaveValue('6')

    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }))
    await expect(input).toHaveValue('4')

    // The keyboard steps by the same amount, and Shift takes `largeStep` — 10 by
    // default, so 4 goes to 14 rather than to 5.
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    await expect(input).toHaveValue('5')

    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
    await expect(input).toHaveValue('15')

    // Clamped at both ends, and the button that would go past says so.
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
    await expect(input).toHaveValue('20')
    await expect(canvas.getByRole('button', { name: 'Increase' })).toBeDisabled()
  },
}
