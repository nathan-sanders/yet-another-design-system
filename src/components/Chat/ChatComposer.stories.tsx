import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ChevronDown, CircleHelp, Ellipsis, Mic, Plus, Search } from 'lucide-react'

import { Avatar } from '../Avatar'
import samplePhoto from '../Avatar/sample-photo.png'
import { Breadcrumbs } from '../Breadcrumbs'
import { Button } from '../Button'
import { Menu } from '../Menu'
import { NavItem, SideNav } from '../Nav'
import { Logo } from '../Nav/story-logo'
import { TopBar } from '../TopBar'
import { ChatComposer } from './ChatComposer'
import { chats } from './story-data'
import { Mark } from './story-mark'

const sizes = ['default', 'small'] as const

/** The models in the picker — a `Menu.RadioGroup` on a ghost trigger, as Figma draws it. */
const models = [
  { value: 'opus', label: 'Opus 5' },
  { value: 'sonnet', label: 'Sonnet 5' },
  { value: 'haiku', label: 'Haiku 4.5' },
]

function ModelPicker({ size = 'default' }: { size?: 'default' | 'small' }) {
  const [model, setModel] = useState('opus')
  const current = models.find((m) => m.value === model)!
  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button appearance="ghost" size={size} endIcon={ChevronDown}>
            {current.label}
          </Button>
        }
      />
      <Menu.Popup align="end">
        <Menu.RadioGroup value={model} onValueChange={setModel}>
          {models.map((m) => (
            <Menu.RadioItem key={m.value} value={m.value}>
              {m.label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Popup>
    </Menu>
  )
}

const meta = {
  title: 'Components/ChatComposer',
  component: ChatComposer,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
    streaming: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    'aria-label': 'Message',
    placeholder: 'How can I help today?',
    size: 'default',
    streaming: false,
    disabled: false,
    onSubmit: fn(),
    onStop: fn(),
  },
} satisfies Meta<typeof ChatComposer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma draws the composer at 700 wide. A story-level decorator rather than a
 * meta-level one, because Storybook adds a story's decorators to the meta's
 * rather than replacing them, and `InContext` needs the whole viewport.
 */
const atFigmaWidth: Story['decorators'] = [
  (Story) => (
    <div className="max-w-175">
      <Story />
    </div>
  ),
]

/**
 * The composer with every control, filled the way the Figma mock fills it: an
 * attach button at the start, the model picker and dictation at the end, and
 * the send button last.
 *
 * Type and press Enter: `onSubmit` fires with the text and the field clears.
 * Shift+Enter breaks the line instead, and Enter on an empty field does
 * nothing. Measured, not assumed — the play function does all three.
 */
export const Playground: Story = {
  decorators: atFigmaWidth,
  args: {
    actions: <Button appearance="ghost" startIcon={Plus} aria-label="Attach" />,
    endActions: (
      <>
        <ModelPicker />
        <Button appearance="ghost" startIcon={Mic} aria-label="Dictate" />
      </>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const send = canvas.getByRole('button', { name: 'Send' })

    // Empty: the send button is held back, and Enter sends nothing.
    await expect(send).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(field)
    await userEvent.keyboard('{Enter}')
    await expect(args.onSubmit).not.toHaveBeenCalled()

    // Shift+Enter is a newline, not a send.
    await userEvent.type(field, 'First line{Shift>}{Enter}{/Shift}second line')
    await expect(field).toHaveValue('First line\nsecond line')
    await expect(args.onSubmit).not.toHaveBeenCalled()
    await expect(send).not.toHaveAttribute('aria-disabled')

    // Enter sends and clears.
    await userEvent.keyboard('{Enter}')
    await expect(args.onSubmit).toHaveBeenCalledTimes(1)
    await expect(args.onSubmit).toHaveBeenCalledWith('First line\nsecond line')
    await expect(field).toHaveValue('')
  },
}

/**
 * Figma's `Size` axis: 96px at default and 72 at small, with one line of
 * text. Both are 14/24 — the small composer tightens its chrome and keeps its
 * reading size, unlike Input's small — and the buttons are Button's 32 and 24.
 *
 * Measured: the two outer heights and the send button's.
 */
export const Sizes: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <ChatComposer
          key={size}
          {...args}
          size={size}
          data-testid={`composer-${size}`}
          actions={<Button appearance="ghost" size={size} startIcon={Plus} aria-label="Attach" />}
          endActions={
            <>
              <ModelPicker size={size} />
              <Button appearance="ghost" size={size} startIcon={Mic} aria-label="Dictate" />
            </>
          }
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const large = canvas.getByTestId('composer-default')
    const small = canvas.getByTestId('composer-small')
    await expect(large.getBoundingClientRect().height).toBe(96)
    await expect(small.getBoundingClientRect().height).toBe(72)
    await expect(within(large).getByRole('button', { name: 'Send' }).getBoundingClientRect().height).toBe(32)
    await expect(within(small).getByRole('button', { name: 'Send' }).getBoundingClientRect().height).toBe(24)
  },
}

/**
 * Figma's `Type=Stop`, derived: while a reply is arriving the send button
 * becomes a secondary stop button, and Enter is held back. `streaming` is the
 * one prop; there is no `type`.
 */
export const Streaming: Story = {
  decorators: atFigmaWidth,
  args: { streaming: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument()
    const stop = canvas.getByRole('button', { name: 'Stop' })
    await userEvent.click(stop)
    await expect(args.onStop).toHaveBeenCalledTimes(1)

    const field = canvas.getByRole('textbox', { name: 'Message' })
    await userEvent.type(field, 'Wait{Enter}')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

/**
 * The field grows with what is typed, to eight lines, and scrolls past that.
 * `field-sizing: content` does the growing — Chromium and Safari have it;
 * Firefox keeps to `rows`.
 *
 * Measured: taller after three lines, capped after twelve.
 */
export const Grows: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const oneLine = field.getBoundingClientRect().height

    await userEvent.type(field, 'one{Shift>}{Enter}{/Shift}two{Shift>}{Enter}{/Shift}three')
    const threeLines = field.getBoundingClientRect().height
    await expect(threeLines).toBe(oneLine + 48)

    await userEvent.type(field, '{Shift>}{Enter}{/Shift}'.repeat(9) + 'twelve')
    await waitFor(() => expect(field.getBoundingClientRect().height).toBe(208))
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight)
  },
}

/** The whole composer fades and stops taking pointers — `box`'s disabled rule. */
export const Disabled: Story = {
  decorators: atFigmaWidth,
  args: { disabled: true, defaultValue: 'A draft that cannot be sent right now.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toBeDisabled()
    await expect(getComputedStyle(canvas.getByRole('textbox').closest('form')!).opacity).toBe('0.4')
  },
}

/**
 * Controlled: the value lives outside, and sending is the caller's to clear.
 * The one story where the field keeps its text after Enter — because this
 * caller chooses to.
 */
export const Controlled: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState('')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [sent, setSent] = useState<string[]>([])
    return (
      <div className="flex flex-col gap-4">
        <ChatComposer
          {...args}
          value={value}
          onValueChange={setValue}
          onSubmit={(text) => {
            setSent((all) => [...all, text])
            setValue('')
          }}
        />
        <ul className="m-0 list-none p-0 text-sm text-content-subtle" aria-label="Sent">
          {sent.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    await userEvent.type(field, 'Hello{Enter}')
    await expect(within(canvas.getByRole('list', { name: 'Sent' })).getByText('Hello')).toBeInTheDocument()
    await expect(field).toHaveValue('')
  },
}

/**
 * Tab into the field and the box takes the ring; tab on to the send button
 * and the ring moves with focus, leaving the box alone. One ring at a time,
 * on the thing that has focus — the reason `box` grew `ring="textarea"`.
 *
 * Real keyboard input, because `element.focus()` never matches
 * `:focus-visible` and would report the ring missing when it is fine.
 */
export const FocusRing: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  args: { defaultValue: 'Draft' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const form = field.closest('form')!
    const send = canvas.getByRole('button', { name: 'Send' })

    // The ring is two box-shadows, the outer one spread to 4px (2 of gap, 2 of
    // stroke) — ContextMenu's assertion. The elevation shadow has no spread.
    const ring = '0px 0px 0px 4px'
    await expect(getComputedStyle(form).boxShadow).not.toContain(ring)

    await userEvent.tab()
    await expect(field).toHaveFocus()
    await expect(getComputedStyle(form).boxShadow).toContain(ring)

    await userEvent.tab()
    await expect(send).toHaveFocus()
    await expect(getComputedStyle(form).boxShadow).not.toContain(ring)
    await expect(getComputedStyle(send).boxShadow).toContain(ring)
  },
}

/**
 * The welcome screen from the Figma mock (`40005203:42343`): the rail with the
 * chat list, a `TopBar` reading "New chat", and the greeting with the
 * composer under it, centred on the page. The mark beside the greeting is the
 * application's — a story-only SVG here.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <div className="flex h-[calc(100dvh-3rem)] gap-2 p-2">
      <SideNav
        aria-label="Main"
        logo={<Logo />}
        utilities={
          <>
            <NavItem href="#help" startIcon={CircleHelp}>
              Help
            </NavItem>
            <NavItem
              href="#account"
              start={<Avatar size="x-small" src={samplePhoto} name="Nathan Sanders" status="online" />}
            >
              Nathan · Pro
            </NavItem>
          </>
        }
      >
        <SideNav.Section>
          <NavItem href="#new" startIcon={Plus} selected>
            New
          </NavItem>
          <NavItem href="#search" startIcon={Search}>
            Search
          </NavItem>
        </SideNav.Section>
        <SideNav.Section header="Chats">
          {chats.map((chat, i) => (
            <NavItem key={chat} href={`#chat-${i}`}>
              {chat}
            </NavItem>
          ))}
        </SideNav.Section>
      </SideNav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-background-primary">
        <TopBar
          start={
            <Breadcrumbs>
              <Breadcrumbs.Item>New chat</Breadcrumbs.Item>
            </Breadcrumbs>
          }
          end={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
        />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
          <h1 className="m-0 flex items-center gap-2 text-2xl font-bold text-content-emphasized">
            <Mark />
            Welcome back, Nathan!
          </h1>
          <ChatComposer
            aria-label="Message"
            placeholder="How can I help today?"
            className="max-w-175"
            actions={<Button appearance="ghost" startIcon={Plus} aria-label="Attach" />}
            endActions={
              <>
                <ModelPicker />
                <Button appearance="ghost" startIcon={Mic} aria-label="Dictate" />
              </>
            }
          />
        </main>
      </div>
    </div>
  ),
}
