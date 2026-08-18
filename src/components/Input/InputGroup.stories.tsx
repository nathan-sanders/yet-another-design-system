import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtSign, Bold, Copy, Italic, Link as LinkIcon, Paperclip, Search } from 'lucide-react'

import { Button } from '../Button'
import { InputGroup } from './InputGroup'

const sizes = ['small', 'default', 'large'] as const

const meta = {
  title: 'Components/InputGroup',
  component: InputGroup,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'select', options: sizes },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: false },
  },
  args: {
    label: 'Label',
    description: 'Sub label',
    size: 'default',
    invalid: false,
    disabled: false,
    children: (
      <>
        <InputGroup.Addon align="inline-start" icon={Search} />
        <InputGroup.Input placeholder="Placeholder..." />
        <InputGroup.Addon align="inline-end" icon={AtSign} />
      </>
    ),
  },
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

/** One group with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

/**
 * Addons on the same line as the text, which is Figma's `Display=Inline`.
 *
 * Pass a single glyph as `icon` rather than as children: the addon renders it
 * through `<Icon>` at the group's own size, so it lands at Figma's 12px in a
 * small field and 16px above it without the call site having to know that.
 * Anything that is not one icon — a Button, a chip, a Select — goes in as
 * children instead.
 */
export const InlineAddons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      {sizes.map((size) => (
        <InputGroup key={size} {...args} size={size} label={size} description="Leading and trailing">
          <InputGroup.Addon align="inline-start" icon={Search} />
          <InputGroup.Input placeholder="Search..." />
          <InputGroup.Addon align="inline-end" icon={AtSign} />
        </InputGroup>
      ))}

      <InputGroup {...args} label="With a button" description="Ghost, so it sits inside the border">
        <InputGroup.Addon align="inline-start" icon={LinkIcon} />
        <InputGroup.Input defaultValue="https://yads.example.com/invite/8bRBn0" readOnly />
        <InputGroup.Addon align="inline-end">
          <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy link" />
        </InputGroup.Addon>
      </InputGroup>
    </div>
  ),
}

/**
 * Addons on rows of their own, which is Figma's `Display=Block`. The box grows
 * rather than being switched to a column: a block addon is `w-full`, so it takes
 * a line to itself and pushes everything else onto the next one.
 *
 * The stacked heights are exactly three inline ones — 72 / 96 / 120 against
 * 24 / 32 / 40 — and that falls out of the parts rather than being set.
 */
export const BlockAddons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-96 flex-col gap-6">
      {sizes.map((size) => (
        <InputGroup key={size} {...args} size={size} label={size} description="Above and below">
          <InputGroup.Addon align="block-start" icon={Search} />
          <InputGroup.Input placeholder="Placeholder..." />
          <InputGroup.Addon align="block-end" icon={AtSign} />
        </InputGroup>
      ))}
    </div>
  ),
}

/**
 * The case per-addon `align` exists for, and the one thing here Figma cannot
 * express: its `Display` property switches both slots together, so an icon
 * beside the text *and* a row of actions underneath is not a variant it can
 * draw.
 *
 * Note that `align` is authoritative, not DOM order — each placement carries its
 * own `order`, so the addons could be written in any sequence and still land
 * where they say they do.
 */
export const MixedAlignment: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <InputGroup
      {...args}
      label="Add a comment"
      description="Markdown is supported"
      className="w-96"
    >
      <InputGroup.Addon align="inline-start" icon={AtSign} />
      <InputGroup.Input placeholder="Write something..." />
      <InputGroup.Addon align="block-end">
        <Button appearance="ghost" size="small" startIcon={Bold} aria-label="Bold" />
        <Button appearance="ghost" size="small" startIcon={Italic} aria-label="Italic" />
        <Button appearance="ghost" size="small" startIcon={Paperclip} aria-label="Attach a file" />
      </InputGroup.Addon>
    </InputGroup>
  ),
}

/**
 * Text addons — a protocol, a currency, a handle prefix. `InputGroup.Text` is
 * Content/Subtle rather than Content/Primary, so it reads as part of the field's
 * chrome and not as something the person typed.
 */
export const TextAddons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <InputGroup {...args} label="Website" description="Include the protocol">
        <InputGroup.Addon align="inline-start">
          <InputGroup.Text>https://</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Input placeholder="example.com" />
      </InputGroup>

      <InputGroup {...args} label="Budget" description="Per month">
        <InputGroup.Addon align="inline-start">
          <InputGroup.Text>$</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Input placeholder="0.00" inputMode="decimal" />
        <InputGroup.Addon align="inline-end">
          <InputGroup.Text>USD</InputGroup.Text>
        </InputGroup.Addon>
      </InputGroup>
    </div>
  ),
}

/**
 * Invalid, disabled, and an error message — the same three the plain `Input`
 * carries, because the label block and the message belong to the group rather
 * than being reinvented here. Hover and focus are still the browser's: focus the
 * text and the ring goes round the whole group, addons included, because that is
 * the thing you are typing into.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <InputGroup {...args} label="Invalid" description="Sub label" invalid>
        <InputGroup.Addon align="inline-start" icon={Search} />
        <InputGroup.Input placeholder="Placeholder..." />
      </InputGroup>

      <InputGroup
        {...args}
        label="With a message"
        description="Sub label"
        error="That handle is already taken"
      >
        <InputGroup.Addon align="inline-start">
          <InputGroup.Text>@</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Input defaultValue="nathan" />
      </InputGroup>

      <InputGroup {...args} label="Disabled" description="Sub label" disabled>
        <InputGroup.Addon align="inline-start" icon={Search} />
        <InputGroup.Input placeholder="Placeholder..." />
        <InputGroup.Addon align="inline-end">
          <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy" disabled />
        </InputGroup.Addon>
      </InputGroup>
    </div>
  ),
}

/**
 * A filter bar, where the addons are doing real work rather than decorating —
 * the leading glyph says what the field is for, and the trailing button acts on
 * what you typed.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[28rem] flex-col gap-5 rounded-lg bg-surface-card-primary p-6 inset-ring inset-ring-surface-border">
      <h2 className="text-lg font-semibold text-content-emphasized">Share this file</h2>

      <InputGroup label="Invite by email" description="They'll get a link straight away">
        <InputGroup.Addon align="inline-start" icon={AtSign} />
        <InputGroup.Input type="email" placeholder="ada@example.com" />
        <InputGroup.Addon align="inline-end">
          <Button appearance="secondary" size="small">
            Invite
          </Button>
        </InputGroup.Addon>
      </InputGroup>

      <InputGroup label="Or copy the link" size="small">
        <InputGroup.Addon align="inline-start" icon={LinkIcon} />
        <InputGroup.Input defaultValue="https://yads.example.com/f/8bRBn0" readOnly />
      </InputGroup>
    </div>
  ),
}
