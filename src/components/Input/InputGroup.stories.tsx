import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtSign, Bold, Copy, Italic, Link as LinkIcon, Paperclip, Search } from 'lucide-react'

import { Button } from '../Button'
import { Field } from '../Field'
import { InputGroup } from './InputGroup'

const sizes = ['small', 'default', 'large'] as const

const meta = {
  title: 'Components/InputGroup',
  component: InputGroup,
  argTypes: {
    size: { control: 'select', options: sizes },
    invalid: { control: 'boolean' },
    children: { control: false },
  },
  args: {
    size: 'default',
    invalid: false,
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

/**
 * One group with controls — use the Theme switch in the toolbar for dark mode.
 * The label comes from the `Field` around it, as it does for `Input`.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Label" description="Sub label" className="w-80">
      <InputGroup {...args} />
    </Field>
  ),
}

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
        <Field key={size} label={size} description="Leading and trailing">
          <InputGroup {...args} size={size}>
            <InputGroup.Addon align="inline-start" icon={Search} />
            <InputGroup.Input placeholder="Search..." />
            <InputGroup.Addon align="inline-end" icon={AtSign} />
          </InputGroup>
        </Field>
      ))}

      <Field label="With a button" description="Ghost, so it sits inside the border">
        <InputGroup {...args}>
          <InputGroup.Addon align="inline-start" icon={LinkIcon} />
          <InputGroup.Input defaultValue="https://yads.example.com/invite/8bRBn0" readOnly />
          <InputGroup.Addon align="inline-end">
            <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy link" />
          </InputGroup.Addon>
        </InputGroup>
      </Field>
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
        <Field key={size} label={size} description="Above and below">
          <InputGroup {...args} size={size}>
            <InputGroup.Addon align="block-start" icon={Search} />
            <InputGroup.Input placeholder="Placeholder..." />
            <InputGroup.Addon align="block-end" icon={AtSign} />
          </InputGroup>
        </Field>
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
    <Field label="Add a comment" description="Markdown is supported" className="w-96">
      <InputGroup {...args}>
        <InputGroup.Addon align="inline-start" icon={AtSign} />
        <InputGroup.Input placeholder="Write something..." />
        <InputGroup.Addon align="block-end">
          <Button appearance="ghost" size="small" startIcon={Bold} aria-label="Bold" />
          <Button appearance="ghost" size="small" startIcon={Italic} aria-label="Italic" />
          <Button appearance="ghost" size="small" startIcon={Paperclip} aria-label="Attach a file" />
        </InputGroup.Addon>
      </InputGroup>
    </Field>
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
      <Field label="Website" description="Include the protocol">
        <InputGroup {...args}>
          <InputGroup.Addon align="inline-start">
            <InputGroup.Text>https://</InputGroup.Text>
          </InputGroup.Addon>
          <InputGroup.Input placeholder="example.com" />
        </InputGroup>
      </Field>

      <Field label="Budget" description="Per month">
        <InputGroup {...args}>
          <InputGroup.Addon align="inline-start">
            <InputGroup.Text>$</InputGroup.Text>
          </InputGroup.Addon>
          <InputGroup.Input placeholder="0.00" inputMode="decimal" />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Text>USD</InputGroup.Text>
          </InputGroup.Addon>
        </InputGroup>
      </Field>
    </div>
  ),
}

/**
 * Invalid, disabled and a message all come from the `Field` around the group,
 * which is where they come from for a plain `Input` too. Hover and focus are
 * still the browser's: focus the text and the ring goes round the whole group,
 * addons included, because that is the thing you are typing into.
 *
 * **A Button in an addon is not disabled by the Field.** Nothing reaches into
 * arbitrary children, so the box fades and stops taking pointers but the button
 * keeps its place in the tab order unless you disable it too — as the last one
 * here does.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Invalid" description="Sub label" invalid>
        <InputGroup {...args}>
          <InputGroup.Addon align="inline-start" icon={Search} />
          <InputGroup.Input placeholder="Placeholder..." />
        </InputGroup>
      </Field>

      <Field
        label="With a message"
        description="Sub label"
        error="That handle is already taken"
      >
        <InputGroup {...args}>
          <InputGroup.Addon align="inline-start">
            <InputGroup.Text>@</InputGroup.Text>
          </InputGroup.Addon>
          <InputGroup.Input defaultValue="nathan" />
        </InputGroup>
      </Field>

      <Field label="Disabled" description="Sub label" disabled>
        <InputGroup {...args}>
          <InputGroup.Addon align="inline-start" icon={Search} />
          <InputGroup.Input placeholder="Placeholder..." />
          <InputGroup.Addon align="inline-end">
            <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy" disabled />
          </InputGroup.Addon>
        </InputGroup>
      </Field>
    </div>
  ),
}

/**
 * **The ghost appearance, and the case it exists for.** A global search entry
 * that should sit quieter than a form field: no fill and no stroke at rest, the
 * translucent wash from Button's ghost on hover, and the whole chrome back on
 * focus — so from the moment you are typing it looks like any other field.
 *
 * The magnifier is what makes this safe. A borderless box has no 3:1 boundary
 * identifying it as a control, so the icon and the placeholder carry that job
 * instead; Astryx's rule for hiding a search label is the same one. Reach for
 * `ghost` where there is an icon, a `Field` label or a placeholder doing that
 * work, and not otherwise.
 *
 * Shown on a card so the "no fill" reads honestly — against the story canvas a
 * transparent field and a white one look the same.
 */
export const GhostSearch: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[32rem] flex-col gap-4 rounded-lg bg-surface-background-primary p-4 inset-ring inset-ring-surface-border">
      <div className="flex items-center gap-3">
        <InputGroup appearance="ghost" className="flex-1">
          <InputGroup.Addon align="inline-start" icon={Search} />
          <InputGroup.Input aria-label="Search" placeholder="Search everything..." />
        </InputGroup>
        <Button appearance="secondary">New</Button>
      </div>

      <p className="text-sm text-content-subtle">
        Hover the field for the wash, then click into it for the full chrome.
      </p>
    </div>
  ),
}

/**
 * Ghost against default, at all three sizes, so the difference at rest is
 * visible side by side. The invalid row is the one to look at: a ghost field
 * keeps its red border **at rest**, because validity is the one state that must
 * never be the thing you have to hover to discover.
 */
export const GhostVsDefault: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-fit grid-cols-[auto_18rem_18rem] items-center gap-x-6 gap-y-4 rounded-lg bg-surface-background-primary p-6 inset-ring inset-ring-surface-border">
      <span aria-hidden />
      <span className="text-sm text-content-subtle">Default</span>
      <span className="text-sm text-content-subtle">Ghost</span>

      {sizes.map((size) => (
        <div key={size} className="contents">
          <span className="text-sm text-content-subtle capitalize">{size}</span>
          {(['default', 'ghost'] as const).map((appearance) => (
            <InputGroup key={appearance} appearance={appearance} size={size}>
              <InputGroup.Addon align="inline-start" icon={Search} />
              <InputGroup.Input aria-label={`Search ${size} ${appearance}`} placeholder="Search..." />
            </InputGroup>
          ))}
        </div>
      ))}

      <span className="text-sm text-content-subtle">Invalid</span>
      {(['default', 'ghost'] as const).map((appearance) => (
        <InputGroup key={appearance} appearance={appearance} invalid>
          <InputGroup.Addon align="inline-start" icon={Search} />
          <InputGroup.Input aria-label={`Invalid ${appearance}`} placeholder="Search..." />
        </InputGroup>
      ))}
    </div>
  ),
}

/**
 * A share panel, where the addons are doing real work rather than decorating —
 * the leading glyph says what the field is for, and the trailing button acts on
 * what you typed.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[28rem] flex-col gap-5 rounded-lg bg-surface-background-primary p-6 inset-ring inset-ring-surface-border">
      <h2 className="text-lg font-semibold text-content-emphasized">Share this file</h2>

      <Field label="Invite by email" description="They'll get a link straight away">
        <InputGroup>
          <InputGroup.Addon align="inline-start" icon={AtSign} />
          <InputGroup.Input type="email" placeholder="ada@example.com" />
          <InputGroup.Addon align="inline-end">
            <Button appearance="secondary" size="small">
              Invite
            </Button>
          </InputGroup.Addon>
        </InputGroup>
      </Field>

      <Field label="Or copy the link">
        <InputGroup>
          <InputGroup.Addon align="inline-start" icon={LinkIcon} />
          <InputGroup.Input defaultValue="https://yads.example.com/f/8bRBn0" readOnly />
        </InputGroup>
      </Field>
    </div>
  ),
}
