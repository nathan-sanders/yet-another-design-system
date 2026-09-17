import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  ChevronDown,
  CircleHelp,
  Copy,
  Ellipsis,
  Mic,
  Plus,
  RefreshCw,
  Search,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'

import { Avatar } from '../Avatar'
import samplePhoto from '../Avatar/sample-photo.png'
import { Breadcrumbs } from '../Breadcrumbs'
import { Button } from '../Button'
import { Link } from '../Link'
import { Menu } from '../Menu'
import { NavItem, SideNav } from '../Nav'
import { Logo } from '../Nav/story-logo'
import { Tooltip } from '../Tooltip'
import { TopBar } from '../TopBar'
import { ChatComposer } from './ChatComposer'
import { ChatMessage } from './ChatMessage'
import { chats, conversation, thread } from './story-data'
import { Mark } from './story-mark'
import { ThoughtProcess } from './ThoughtProcess'
import { ToolCall } from './ToolCall'

const directions = ['sent', 'received'] as const
const appearances = ['default', 'emphasized', 'ghost'] as const
const sizes = ['default', 'small'] as const

const meta = {
  title: 'Components/ChatMessage',
  component: ChatMessage,
  argTypes: {
    direction: { control: 'inline-radio', options: directions },
  },
  args: {
    direction: 'sent',
    children: <ChatMessage.Bubble>Chat message</ChatMessage.Bubble>,
  },
} satisfies Meta<typeof ChatMessage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A chat log sits on `surface-background-primary`: the default bubble is
 * `surface-background-subtle`, which is the canvas in both themes, so on the
 * Storybook canvas it would vanish. Story-level rather than on the meta,
 * because Storybook adds a story's decorators to the meta's rather than
 * replacing them, and `InContext` draws its own surfaces.
 */
const onPrimarySurface: Story['decorators'] = [
  (Story) => (
    <div className="rounded-lg bg-surface-background-primary p-6">
      <Story />
    </div>
  ),
]

/** The four ghost buttons Figma draws in a received message's metadata row. */
function Actions() {
  return (
    <>
      <Tooltip label="Copy">
        <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy" />
      </Tooltip>
      <Tooltip label="Regenerate">
        <Button appearance="ghost" size="small" startIcon={RefreshCw} aria-label="Regenerate" />
      </Tooltip>
      <Tooltip label="Good response">
        <Button appearance="ghost" size="small" startIcon={ThumbsUp} aria-label="Good response" />
      </Tooltip>
      <Tooltip label="Bad response">
        <Button appearance="ghost" size="small" startIcon={ThumbsDown} aria-label="Bad response" />
      </Tooltip>
    </>
  )
}

/**
 * One message with a control for its side — use the Theme switch in the
 * toolbar for dark mode. Sent flips the row, right-aligns the column, and puts
 * the tail on the right; the bubble and the metadata row follow without
 * being told.
 *
 * Measured: the bubble is Figma's 40px, and the small corner is the one on
 * the sender's side.
 */
export const Playground: Story = {
  decorators: onPrimarySurface,
  render: (args) => (
    <ChatMessage
      {...args}
      avatar={<Avatar size="small" src={samplePhoto} name="Nathan Sanders" />}
      metadata={
        args.direction === 'sent' ? (
          <ChatMessage.Metadata status="read" timestamp="12:30 PM" dateTime="2026-09-17T12:30" />
        ) : (
          <ChatMessage.Metadata timestamp="12:30 PM" actions={<Actions />} />
        )
      }
    >
      <ChatMessage.Bubble data-testid="bubble">Chat message</ChatMessage.Bubble>
    </ChatMessage>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const bubble = canvas.getByTestId('bubble')
    await expect(bubble.getBoundingClientRect().height).toBe(40)

    const style = getComputedStyle(bubble)
    await expect(style.borderTopLeftRadius).toBe('16px')
    await expect(style.borderTopRightRadius).toBe('16px')
    if (args.direction === 'sent') {
      await expect(style.borderBottomRightRadius).toBe('4px')
      await expect(style.borderBottomLeftRadius).toBe('16px')
    } else {
      await expect(style.borderBottomLeftRadius).toBe('4px')
      await expect(style.borderBottomRightRadius).toBe('16px')
    }
  },
}

/**
 * Figma's twelve `Bubble` variants: `Direction` × `Appearance` × `Size`.
 * Default is the quiet fill, emphasized the inverse pair, and ghost keeps the
 * padding with no fill — for the long assistant reply that should read as
 * page text.
 *
 * Measured: 40 and 28 tall at every appearance, ghost included, so a ghost
 * bubble's text lines up with a filled one's.
 */
export const Variants: Story = {
  decorators: onPrimarySurface,
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      {directions.map((direction) =>
        sizes.map((size) =>
          appearances.map((appearance) => (
            <div
              key={`${direction}-${size}-${appearance}`}
              className={direction === 'sent' ? 'flex justify-end' : 'flex'}
            >
              <ChatMessage.Bubble
                direction={direction}
                appearance={appearance}
                size={size}
                data-testid={`bubble-${size}-${appearance}-${direction}`}
              >
                Chat message
              </ChatMessage.Bubble>
            </div>
          )),
        ),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const direction of directions) {
      for (const appearance of appearances) {
        const large = canvas.getByTestId(`bubble-default-${appearance}-${direction}`)
        const small = canvas.getByTestId(`bubble-small-${appearance}-${direction}`)
        await expect(large.getBoundingClientRect().height).toBe(40)
        await expect(small.getBoundingClientRect().height).toBe(28)
      }
    }
    // Ghost really is transparent, and emphasized really is the inverse pair.
    const ghost = canvas.getByTestId('bubble-default-ghost-sent')
    await expect(getComputedStyle(ghost).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    const emphasized = canvas.getByTestId('bubble-default-emphasized-sent')
    const plain = canvas.getByTestId('bubble-default-default-sent')
    await expect(getComputedStyle(emphasized).color).not.toBe(getComputedStyle(plain).color)
  },
}

/**
 * Consecutive bubbles from one sender go in one message — Figma's `Bubble
 * Group`, stacked at 4px, one metadata row under the last of them. The avatar
 * sits beside the last bubble, not beside the timestamp: that offset is
 * derived from the metadata row being there.
 *
 * Measured: 4px between bubbles, and the avatar's bottom edge on the last
 * bubble's.
 */
export const Group: Story = {
  decorators: onPrimarySurface,
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <ChatMessage
        direction="sent"
        avatar={<Avatar size="small" src={samplePhoto} name="Nathan Sanders" data-testid="avatar" />}
        metadata={<ChatMessage.Metadata status="delivered" timestamp={thread.sentAt} />}
      >
        {thread.sent.map((text, i) => (
          <ChatMessage.Bubble key={text} data-testid={['first', 'second', 'last'][i]}>
            {text}
          </ChatMessage.Bubble>
        ))}
      </ChatMessage>
      <ChatMessage
        sender="Agent"
        avatar={<Avatar size="small" name="Agent" />}
        metadata={<ChatMessage.Metadata timestamp={thread.receivedAt} actions={<Actions />} />}
      >
        {thread.received.map((text) => (
          <ChatMessage.Bubble key={text}>{text}</ChatMessage.Bubble>
        ))}
      </ChatMessage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvas.getByTestId('first').getBoundingClientRect()
    const second = canvas.getByTestId('second').getBoundingClientRect()
    await expect(second.top - first.bottom).toBe(4)

    const last = canvas.getByTestId('last').getBoundingClientRect()
    const avatar = canvas.getByTestId('avatar').getBoundingClientRect()
    await expect(avatar.bottom).toBe(last.bottom)
  },
}

/**
 * Figma's `Message Reactions`: 24px pills overlapping by 4px, pinned to the
 * bubble's top corner opposite the tail — 8px out and 16px up. Display-only,
 * as drawn; a picker is a component the file does not have.
 *
 * Measured: the pill's top is 16 above the bubble's, its outer edge 8 past it,
 * and the second pill overlaps the first by 4.
 */
export const WithReactions: Story = {
  decorators: onPrimarySurface,
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8 pt-4">
      <ChatMessage direction="sent" metadata={<ChatMessage.Metadata status="read" timestamp="12:30 PM" />}>
        <ChatMessage.Bubble
          data-testid="sent"
          reactions={<ChatMessage.Reactions items={[{ emoji: '👍' }, { emoji: '❤️' }]} data-testid="sent-reactions" />}
        >
          Chat message
        </ChatMessage.Bubble>
      </ChatMessage>
      <ChatMessage metadata={<ChatMessage.Metadata timestamp="12:31 PM" />}>
        <ChatMessage.Bubble
          data-testid="received"
          reactions={<ChatMessage.Reactions items={[{ emoji: '👍', count: 3 }]} data-testid="received-reactions" />}
        >
          Chat message
        </ChatMessage.Bubble>
      </ChatMessage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sent = canvas.getByTestId('sent').getBoundingClientRect()
    const sentPills = within(canvas.getByTestId('sent-reactions')).getAllByRole('listitem')
    const [one, two] = sentPills.map((pill) => pill.getBoundingClientRect())
    await expect(one!.top).toBe(sent.top - 16)
    await expect(one!.left).toBe(sent.left - 8)
    await expect(one!.height).toBe(24)
    await expect(two!.left - one!.left).toBe(one!.width - 4)

    const received = canvas.getByTestId('received').getBoundingClientRect()
    const [pill] = within(canvas.getByTestId('received-reactions'))
      .getAllByRole('listitem')
      .map((p) => p.getBoundingClientRect())
    await expect(pill!.right).toBe(received.right + 8)
  },
}

/**
 * The row under a message. A sent message reports whether it arrived —
 * Figma's `_Message Status`, Delivered · Read · Failed, where the word is the
 * signal and the danger color on Failed is a second one. A received message
 * offers things to do with it — four ghost buttons, 30×24, sitting flush.
 *
 * Measured: every row is Figma's 24px.
 */
export const Metadata: Story = {
  decorators: onPrimarySurface,
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {(['delivered', 'read', 'failed'] as const).map((status) => (
        <ChatMessage
          key={status}
          direction="sent"
          metadata={<ChatMessage.Metadata status={status} timestamp="12:30 PM" data-testid={`row-${status}`} />}
        >
          <ChatMessage.Bubble>Chat message</ChatMessage.Bubble>
        </ChatMessage>
      ))}
      <ChatMessage metadata={<ChatMessage.Metadata timestamp="12:30 PM" actions={<Actions />} data-testid="row-actions" />}>
        <ChatMessage.Bubble>Chat message</ChatMessage.Bubble>
      </ChatMessage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const id of ['row-delivered', 'row-read', 'row-failed', 'row-actions']) {
      await expect(canvas.getByTestId(id).getBoundingClientRect().height).toBe(24)
    }
    await expect(canvas.getByText('Failed')).toBeVisible()
    const buttons = within(canvas.getByTestId('row-actions')).getAllByRole('button')
    await expect(buttons).toHaveLength(4)
    await expect(buttons[0]!.getBoundingClientRect().height).toBe(24)
  },
}

/** The models in the composer's picker. */
const models = [
  { value: 'opus', label: 'Opus 5' },
  { value: 'sonnet', label: 'Sonnet 5' },
  { value: 'haiku', label: 'Haiku 4.5' },
]

function ModelPicker() {
  return (
    <Menu>
      <Menu.Trigger render={<Button appearance="ghost" endIcon={ChevronDown}>Opus 5</Button>} />
      <Menu.Popup align="end">
        <Menu.RadioGroup defaultValue="opus">
          {models.map((model) => (
            <Menu.RadioItem key={model.value} value={model.value}>
              {model.label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Popup>
    </Menu>
  )
}

/**
 * The conversation screen from the Figma mock (`40005203:43108`): the rail
 * with the chat list, a `TopBar` naming the chat, the log, the composer pinned
 * under it with its disclaimer. The mock's preview panel beside the log is
 * left out for now — it is a document viewer, not a chat part.
 *
 * The agent's turn is Figma's `Agent Reply`, which is a composition rather
 * than a component: a `ThoughtProcess` above, a ghost bubble, the actions
 * row, and the assistant's mark under the last reply. The mark is the
 * application's — it comes in through slots, and here it is a story-only SVG.
 *
 * The messages sit in `role="log"`, which announces each one once as it
 * lands; the sender is read ahead of the text.
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
          <NavItem href="#new" startIcon={Plus}>
            New
          </NavItem>
          <NavItem href="#search" startIcon={Search}>
            Search
          </NavItem>
        </SideNav.Section>
        <SideNav.Section header="Chats">
          {chats.map((chat, i) => (
            <NavItem key={chat} href={`#chat-${i}`} selected={i === 0}>
              {chat}
            </NavItem>
          ))}
        </SideNav.Section>
      </SideNav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-background-primary">
        <TopBar
          breadcrumbs={
            <Breadcrumbs>
              <Breadcrumbs.Item>{conversation.title}</Breadcrumbs.Item>
            </Breadcrumbs>
          }
          actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
        />
        <div role="log" aria-label="Conversation" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
          <ChatMessage
            direction="sent"
            sender="Nathan"
            metadata={
              <ChatMessage.Metadata
                timestamp={conversation.sentAt.label}
                dateTime={conversation.sentAt.dateTime}
              />
            }
          >
            <ChatMessage.Bubble>{conversation.prompt}</ChatMessage.Bubble>
          </ChatMessage>
          <ThoughtProcess label={conversation.thought.summary}>
            {conversation.thought.toolCalls.map((call) => (
              <ToolCall key={call.label} status={call.status}>
                {call.label}
              </ToolCall>
            ))}
          </ThoughtProcess>
          <ChatMessage
            sender="Yet"
            className="max-w-full"
            metadata={
              <ChatMessage.Metadata
                timestamp={conversation.repliedAt.label}
                dateTime={conversation.repliedAt.dateTime}
                actions={<Actions />}
              />
            }
          >
            <ChatMessage.Bubble appearance="ghost">{conversation.reply}</ChatMessage.Bubble>
          </ChatMessage>
          <div className="p-3 text-content-emphasized">
            <Mark />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 px-4 pb-2 pt-1">
          <ChatComposer
            aria-label="Reply"
            placeholder="Reply suggestion"
            actions={<Button appearance="ghost" startIcon={Plus} aria-label="Attach" />}
            endActions={
              <>
                <ModelPicker />
                <Button appearance="ghost" startIcon={Mic} aria-label="Dictate" />
              </>
            }
          />
          <Link href="#disclaimer" size="sm">
            Yet is AI and AI can make mistakes
          </Link>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const log = canvas.getByRole('log', { name: 'Conversation' })
    await expect(within(log).getAllByRole('article')).toHaveLength(2)
    await expect(within(log).getByText('Nathan:')).toBeInTheDocument()
  },
}
