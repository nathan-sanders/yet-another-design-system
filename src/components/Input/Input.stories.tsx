import type { Meta, StoryObj } from '@storybook/react-vite'

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
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
    size: { control: 'select', options: sizes },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Label',
    description: 'Sub label',
    placeholder: 'Placeholder...',
    size: 'default',
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

/** One field with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

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
            <Input key={state.name} {...args} size={size} {...state.props} />
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
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Input {...args} label="Hover or focus me" description="Both come from the browser" />
      <Input {...args} label="Invalid" description="Sub label" invalid />
      <Input {...args} label="Disabled" description="Sub label" disabled />
      <Input {...args} label="Disabled with a value" defaultValue="Already filled in" disabled />
    </div>
  ),
}

/**
 * The label and its sub-label are one 44px block — 24px of label then 20px of
 * sub-label, hard against each other — sitting 8px above the field. The
 * sub-label is a real description: Base UI folds it into the input's
 * `aria-describedby`, so a screen reader reads the label as the name and this as
 * extra detail.
 */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Input {...args} label="Display name" description="Shown next to your comments" />
      <Input {...args} label="Display name" description={undefined} />
    </div>
  ),
}

/**
 * An error message, which the Figma does not draw yet — it stops at a red
 * border, leaving a screen reader with `aria-invalid` and no explanation of what
 * is wrong. Astryx's own guidance is that "Email must include @" beats turning
 * the border red.
 *
 * **Passing `error` is enough.** It puts the field in the invalid state on its
 * own, so `invalid` is only needed for the rarer case of colouring the border
 * without saying anything. Like the sub-label, the message lands in
 * `aria-describedby`.
 */
export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Input
        {...args}
        label="Email"
        description="We'll only use it to sign you in"
        defaultValue="nathan.example.com"
        error="Email must include an @"
      />
      <Input {...args} label="Border only" description="`invalid` with no message" invalid />
    </div>
  ),
}

/**
 * A sign-in form, so the rhythm of label, sub-label and message is visible with
 * several fields stacked rather than one at a time.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <form
      className="flex w-96 flex-col gap-5 rounded-lg bg-surface-card-primary p-6 inset-ring inset-ring-surface-border"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-content-emphasized">Create your account</h2>
        <p className="text-sm text-content-subtle">Free for 14 days. No card needed.</p>
      </div>

      <Input label="Full name" placeholder="Ada Lovelace" autoComplete="name" />
      <Input
        label="Email"
        description="We'll only use it to sign you in"
        type="email"
        placeholder="ada@example.com"
        autoComplete="email"
      />
      <Input
        label="Password"
        description="At least 12 characters"
        type="password"
        defaultValue="hunter2"
        error="Password is too short"
        autoComplete="new-password"
      />
    </form>
  ),
}
