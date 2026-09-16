import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Field } from '../Field'
import { TextArea } from './TextArea'

const sizes = ['small', 'default', 'large'] as const

/**
 * The states that are not browser states. Hover and focus are real CSS, so
 * they belong to the mouse and the Tab key rather than to a column here.
 */
const states = [
  { name: 'Default', props: {} },
  { name: 'Invalid', props: { invalid: true } },
  { name: 'Disabled', props: { disabled: true } },
] as const

/**
 * The box heights at `rows={3}` — Figma's 64 / 80 / 88, the arithmetic at the
 * top of `styles.ts`, asserted rather than trusted.
 */
const HEIGHT = { small: 64, default: 80, large: 88 } as const

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  argTypes: {
    placeholder: { control: 'text' },
    size: { control: 'select', options: sizes },
    rows: { control: { type: 'number', min: 1, max: 12 } },
    resize: { control: 'select', options: ['vertical', 'none'] },
    maxLength: { control: 'number' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Placeholder...',
    size: 'default',
    rows: 3,
    resize: 'vertical',
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof TextArea>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One field with controls — use the Theme switch in the toolbar for dark mode.
 *
 * The label comes from the `Field` around it rather than from the TextArea,
 * exactly as it does for Input. See the Field stories for the text side.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Description" description="What should reviewers know?" className="w-80">
      <TextArea {...args} />
    </Field>
  ),
}

/**
 * Every size against every state that is not a browser state — Figma's variant
 * grid with its Hover and Focus columns left to the browser.
 *
 * A CSS grid rather than a `<table>`: a full-width component inside an
 * auto-layout table cell collapses to its longest word (Input's trap).
 *
 * The play function measures the three heights. The size changes only the
 * padding and the type; three rows of it are 64 / 80 / 88 with the borders.
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
            <Field key={state.name} label={`${size} ${state.name}`} description="Sub label">
              <TextArea {...args} size={size} {...state.props} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const size of sizes) {
      const textarea = canvas.getByRole('textbox', { name: `${size} Default` })
      await expect(textarea).toHaveAttribute('rows', '3')
      // The box is the textarea's parent; its height is the number to check.
      const box = textarea.parentElement!
      await expect(box.getBoundingClientRect().height).toBe(HEIGHT[size])
    }
    // Invalid reaches the control from the Field, and standalone from the prop.
    await expect(canvas.getByRole('textbox', { name: 'default Invalid' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(canvas.getByRole('textbox', { name: 'default Disabled' })).toBeDisabled()
  },
}

/**
 * Hover and focus are real browser states rather than props — hover the first
 * field, and press Tab or click into it to see the two-ring focus treatment on
 * the box. The ring paints entirely outside, so a focused field is exactly the
 * size of an unfocused one.
 *
 * Note where `invalid` and `disabled` are set. `invalid` goes on the Field,
 * because only a Field can carry the message that explains it; `disabled` goes
 * on either, and the box notices for itself.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Hover or focus me" description="Both come from the browser">
        <TextArea {...args} />
      </Field>
      <Field label="Invalid" error="Say a little more than that.">
        <TextArea {...args} defaultValue="Fine." />
      </Field>
      <Field label="Disabled" description="Sub label" disabled>
        <TextArea {...args} />
      </Field>
      <Field label="Disabled with a value" description="Sub label" disabled>
        <TextArea {...args} defaultValue="Already filled in, across what could be several lines." />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const invalid = canvas.getByRole('textbox', { name: 'Invalid' })
    await expect(invalid).toHaveAttribute('aria-invalid', 'true')
    // Field's error is folded into the control's description by Base UI.
    await expect(invalid).toHaveAccessibleDescription('Say a little more than that.')
  },
}

/**
 * `maxLength` shows a counter and **does not stop typing** — Astryx's rule. The
 * native attribute silently truncates a paste; a person who pasted three
 * paragraphs into a 280-character field needs to see that they did. Past the
 * limit the counter turns danger, the box takes its invalid border and the
 * textarea reports `aria-invalid`.
 *
 * The count is in user-perceived characters: the flag in the second field is
 * one, not four.
 */
export const WithCounter: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Status update" description="Keep it short">
        <TextArea {...args} maxLength={80} defaultValue="Shipped the new text area today." />
      </Field>
      <Field label="One flag" description="Counted as a person would count it">
        <TextArea {...args} maxLength={10} defaultValue="🇬🇧" />
      </Field>
      <Field label="Over the limit" description="Nothing was truncated">
        <TextArea
          {...args}
          maxLength={40}
          defaultValue="This is rather more than forty characters of text, and all of it is still here."
        />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const short = canvas.getByRole('textbox', { name: 'Status update' })
    await expect(short).toHaveAccessibleDescription(/Keep it short/)
    await expect(short).toHaveAccessibleDescription(/32\/80/)
    await expect(short).not.toHaveAttribute('aria-invalid')
    // Not enforced: the native attribute is absent, so typing past the limit works.
    await expect(short).not.toHaveAttribute('maxlength')

    const flag = canvas.getByRole('textbox', { name: 'One flag' })
    await expect(flag).toHaveAccessibleDescription(/1\/10/)

    const over = canvas.getByRole('textbox', { name: 'Over the limit' })
    await expect(over).toHaveAttribute('aria-invalid', 'true')
    await expect(over).toHaveAccessibleDescription(/79\/40/)

    // Typing updates the count live in the uncontrolled case.
    await userEvent.type(short, ' Ship it.')
    await expect(short).toHaveAccessibleDescription(/41\/80/)
  },
}

/**
 * `resize="vertical"` (the default) lets the person pull the field taller and
 * never wider, so a form column keeps its width. `none` is for a fixed-height
 * slot — a card, a dialog body — where a grip would let the field push its
 * neighbours around.
 */
export const Resize: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Vertical" description="Pull the corner">
        <TextArea {...args} resize="vertical" />
      </Field>
      <Field label="None" description="Fixed at its rows">
        <TextArea {...args} resize="none" />
      </Field>
      <Field label="Six rows" description="rows={6}">
        <TextArea {...args} rows={6} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(canvas.getByRole('textbox', { name: 'Vertical' })).resize).toBe(
      'vertical',
    )
    await expect(getComputedStyle(canvas.getByRole('textbox', { name: 'None' })).resize).toBe('none')
    const six = canvas.getByRole('textbox', { name: 'Six rows' })
    await expect(six).toHaveAttribute('rows', '6')
    // 6 × 24 + 3 + 3 + 2 — the size sets the padding, the rows set the height.
    await expect(six.parentElement!.getBoundingClientRect().height).toBe(152)
  },
}

/**
 * Without a Field, a TextArea still needs a name — `aria-label` is the way to
 * give it one. Everywhere else, prefer the Field: a visible label is the
 * accessible one, and it is the only route to a sub-label or a message.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      {sizes.map((size) => (
        <TextArea key={size} {...args} size={size} aria-label={`Notes (${size})`} placeholder="Notes..." />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Notes (small)' })).toBeVisible()
  },
}
