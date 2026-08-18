import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field } from '../Field'
import { Input } from './Input'

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
  title: 'Components/Input',
  component: Input,
  argTypes: {
    placeholder: { control: 'text' },
    size: { control: 'select', options: sizes },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Placeholder...',
    size: 'default',
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One field with controls — use the Theme switch in the toolbar for dark mode.
 *
 * The label comes from the `Field` around it rather than from the Input, which
 * is what Figma's Field set says by nesting every control with its own `Label`
 * switched off. See the Field stories for the text side of this.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Email" description="We'll only use it to sign you in" className="w-80">
      <Input {...args} />
    </Field>
  ),
}

/**
 * Every size against every state that is not a browser state — the Figma variant
 * grid with its Hover and Focus columns left to the browser.
 *
 * A CSS grid rather than Badge's `<table>`: a full-width component inside an
 * auto-layout table cell collapses to its longest word.
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
              <Input {...args} size={size} {...state.props} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Hover and focus are real browser states rather than props, so there is nothing
 * to switch on here — hover the first field with the mouse, and press Tab to see
 * the two-ring focus treatment. The ring paints entirely outside the box, so a
 * focused field is exactly the size of an unfocused one and nothing reflows.
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
        <Input {...args} />
      </Field>
      <Field label="Invalid" description="Sub label" invalid>
        <Input {...args} />
      </Field>
      <Field label="Disabled" description="Sub label" disabled>
        <Input {...args} />
      </Field>
      <Field label="Disabled with a value" description="Sub label" disabled>
        <Input {...args} defaultValue="Already filled in" />
      </Field>
    </div>
  ),
}

/**
 * Without a Field, an Input still needs a name — `aria-label` is the way to give
 * it one. This is the shape for a search box in a toolbar, where the surrounding
 * context already says what the field is for and a visible label would be noise.
 *
 * Everywhere else, prefer the Field: a visible label is the accessible one, and
 * it is the only route to a sub-label or a validation message.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      {sizes.map((size) => (
        <Input key={size} {...args} size={size} aria-label="Search" placeholder="Search..." />
      ))}
    </div>
  ),
}
