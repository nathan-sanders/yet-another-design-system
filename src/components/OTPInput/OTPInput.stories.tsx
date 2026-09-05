import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { Field } from '../Field'
import { OTPInput } from './OTPInput'

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
  title: 'Components/OTPInput',
  component: OTPInput,
  argTypes: {
    length: { control: { type: 'number', min: 2, max: 10 } },
    size: { control: 'select', options: sizes },
    mask: { control: 'boolean' },
    validationType: {
      control: 'select',
      options: ['numeric', 'alpha', 'alphanumeric', 'none'],
    },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
  args: {
    length: 6,
    size: 'default',
    mask: false,
    invalid: false,
    disabled: false,
    readOnly: false,
  },
} satisfies Meta<typeof OTPInput>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One code field with controls — use the Theme switch in the toolbar for dark
 * mode.
 *
 * Paste a whole code into any slot and it fills the row; type and the caret
 * walks forward on its own. `validationType` decides what a slot will accept,
 * and it is `numeric` by default, so letters are rejected rather than shown.
 *
 * The label comes from the `Field`, and lands on the **first** slot: Base UI
 * derives every other slot's id from the Root's, so `htmlFor` has exactly one
 * place to point and clicking the label puts the caret in slot one.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Verification code" description="We sent it to your email">
      <OTPInput {...args} />
    </Field>
  ),
}

/**
 * Every size against every state that is not a browser state.
 *
 * The slot is **square at the field's own height** — 24 / 32 / 40, the same
 * scale as Input, Select and Button — so a row of them lines up with any other
 * control beside it. Most systems draw an OTP slot wider than it is tall; that
 * would put a fourth width in a library that has three.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="grid w-fit grid-cols-[auto_repeat(3,auto)] items-start gap-x-6 gap-y-4">
      <span aria-hidden />
      {states.map((state) => (
        <span key={state.name} className="text-sm text-content-subtle">
          {state.name}
        </span>
      ))}

      {sizes.map((size) => (
        <div key={size} className="contents">
          <span className="pt-13 text-sm text-content-subtle capitalize">{size}</span>
          {states.map((state) => (
            <Field key={state.name} label="Label" description="Sub label">
              <OTPInput {...args} size={size} defaultValue="417" {...state.props} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Hover and focus come from the browser. Tab into the row and the ring lands on
 * the slot you are in, never on the row around it — six focusable inputs share
 * one component, so a container ring would say nothing about where you are.
 *
 * A **filled** slot takes the hover border rather than the resting one, which is
 * the only per-slot styling here. It rides `data-filled`, which Base UI scopes to
 * each box rather than to the whole value, so nothing has to be passed down.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Field label="Hover or focus me" description="Both come from the browser">
        <OTPInput {...args} />
      </Field>
      <Field label="Partly filled" description="Filled slots take a stronger border">
        <OTPInput {...args} defaultValue="417" />
      </Field>
      <Field label="Invalid" description="Sub label" error="That code has expired">
        <OTPInput {...args} defaultValue="417293" />
      </Field>
      <Field label="Disabled" description="Sub label" disabled>
        <OTPInput {...args} defaultValue="417293" />
      </Field>
    </div>
  ),
}

/**
 * `mask` hides the characters as they are typed, for a code being entered on a
 * shared or projected screen. The slot still says it is filled.
 */
export const Masked: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Field label="Recovery code" description="Hidden while you type">
      <OTPInput {...args} mask defaultValue="4172" />
    </Field>
  ),
}

/**
 * Without a Field, the row still needs a name. There is no single element to put
 * one on — every slot is its own input — so the name goes on the first slot,
 * which is the one that has focus when somebody arrives, and the rest keep the
 * positional labels they always have.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      {sizes.map((size) => (
        <OTPInput key={size} {...args} size={size} aria-label="Verification code" />
      ))}
    </div>
  ),
}

/**
 * The behavior, pinned: typing walks the caret forward, Backspace walks it back,
 * and a pasted code fills the whole row and reports itself complete.
 *
 * The paste is the case worth having a test for. It is the way most people
 * actually enter one of these — straight out of a text message — and it is
 * handled entirely inside the primitive, so nothing in this file would notice if
 * it stopped working.
 */
export const Behavior: Story = {
  parameters: { controls: { disable: true } },
  args: { onValueComplete: fn() },
  render: (args) => (
    <Field label="Verification code" description="Six digits">
      <OTPInput {...args} />
    </Field>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const slots = canvas.getAllByRole('textbox')
    await expect(slots).toHaveLength(6)

    // The first slot's name comes from the Field; the rest name their position,
    // or a screen reader reads six identical boxes.
    await expect(slots[0]).toHaveAccessibleName('Verification code')
    await expect(slots[1]).toHaveAccessibleName('Character 2 of 6')

    await userEvent.click(slots[0])
    await userEvent.keyboard('41')
    await expect(slots[0]).toHaveValue('4')
    await expect(slots[1]).toHaveValue('1')
    await expect(slots[2]).toHaveFocus()

    await userEvent.keyboard('{Backspace}{Backspace}')
    await expect(slots[1]).toHaveValue('')

    await userEvent.click(slots[0])
    await userEvent.paste('417293')
    await expect(slots[5]).toHaveValue('3')
    await expect(args.onValueComplete).toHaveBeenCalledWith('417293', expect.anything())
  },
}
