import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ChevronsUp,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Ellipsis,
  MessageCircle,
  Plus,
} from 'lucide-react'

import { ClickableCard } from './ClickableCard'
import { Avatar, AvatarGroup } from '../Avatar'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Divider } from '../Divider'
import { Token } from '../Token'

const emphases = ['default', 'ghost'] as const
const paddings = ['none', 'tight', 'default', 'loose'] as const

const meta = {
  title: 'Components/ClickableCard',
  component: ClickableCard,
  argTypes: {
    emphasis: { control: 'select', options: emphases },
    padding: { control: 'select', options: paddings },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    href: { control: 'text' },
  },
  args: {
    emphasis: 'default',
    padding: 'default',
    selected: false,
    disabled: false,
    // `children` is required on the component, so the meta has to carry one for
    // `satisfies Meta` to hold. Every story below renders its own.
    children: null,
  },
} satisfies Meta<typeof ClickableCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One clickable card, with controls. Tab to it to see the ring — it is the
 * library's shared one, painted entirely outside the card, so a focused card is
 * exactly the size of an unfocused one.
 *
 * Give it an `href` in the controls and it becomes an `<a>`; leave it empty and
 * it is a `<button type="button">`. The element follows the value, which is the
 * library's rule about not adding a prop that can contradict what you passed.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-80">
      <ClickableCard {...args}>
        <p className="font-semibold">Card Title</p>
        <p className="text-content-subtle">
          Card content goes here. This is a flexible container for organizing related information.
        </p>
      </ClickableCard>
    </div>
  ),
}

/**
 * The two emphases, on `surface-card-primary` — which is the surface `ghost` is
 * drawn against.
 *
 * **`ghost` has no visible edge and is exactly the same size as `default`.**
 * Figma binds its border to `Surface/Card Primary`, the same token as its fill,
 * rather than removing the border — so a ghost row and a bordered card line up
 * in a mixed list, and the hover is one colour move rather than a border
 * appearing from nowhere. Hover both to see it.
 */
export const Emphasis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-card-primary border-surface-border flex max-w-100 flex-col gap-2 rounded-lg border p-4">
      {emphases.map((emphasis) => (
        <ClickableCard key={emphasis} emphasis={emphasis}>
          <p className="font-semibold">emphasis="{emphasis}"</p>
          <p className="text-content-subtle">
            {emphasis === 'ghost' ? 'No edge — a list row.' : 'A card that happens to be clickable.'}
          </p>
        </ClickableCard>
      ))}
    </div>
  ),
}

/**
 * Every state of both emphases, side by side. Hover and focus come from the
 * browser rather than from props, so those two columns are yours to produce:
 * point at one, tab to the next.
 *
 * `selected` is code-first — Figma's `State` axis has no such value, and the
 * file owes it one. It is the subtle fill *plus* the emphasized border, so it
 * stays legible on the row the pointer is also on. `disabled` is Figma's flat
 * 40% opacity.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-card-primary border-surface-border grid max-w-200 gap-4 rounded-lg border p-4 sm:grid-cols-2">
      {emphases.map((emphasis) => (
        <div key={emphasis} className="flex flex-col gap-2">
          <p className="text-content-subtle text-sm font-semibold">emphasis="{emphasis}"</p>
          <ClickableCard emphasis={emphasis}>
            <p className="font-semibold">Default</p>
            <p className="text-content-subtle">Hover me, then tab to me.</p>
          </ClickableCard>
          <ClickableCard emphasis={emphasis} selected>
            <p className="font-semibold">Selected</p>
            <p className="text-content-subtle">aria-current, not aria-pressed.</p>
          </ClickableCard>
          <ClickableCard emphasis={emphasis} disabled>
            <p className="font-semibold">Disabled</p>
            <p className="text-content-subtle">Out of the tab order.</p>
          </ClickableCard>
        </div>
      ))}
    </div>
  ),
}

/**
 * The two elements the component renders, and the third that `disabled` forces.
 *
 * A disabled link is not a link: `<a>` has no `disabled` attribute and
 * `pointer-events-none` alone would leave it tabbable, so it renders as a
 * `<span>` carrying `aria-disabled`. Link's answer, and it is not decoration —
 * `opacity-40` puts the text below 4.5:1, and axe only exempts an inactive
 * component when it can find a disabled control or `aria-disabled` above the
 * text. Inspect the three to see which tag each one is.
 */
export const ElementTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-200 gap-4 sm:grid-cols-3">
      <ClickableCard href="#card-as-link">
        <p className="font-semibold">With href</p>
        <p className="text-content-subtle">Renders an &lt;a&gt;.</p>
      </ClickableCard>
      <ClickableCard onClick={() => {}}>
        <p className="font-semibold">With onClick</p>
        <p className="text-content-subtle">Renders a &lt;button type="button"&gt;.</p>
      </ClickableCard>
      <ClickableCard href="#card-as-link" disabled>
        <p className="font-semibold">Disabled link</p>
        <p className="text-content-subtle">Renders a &lt;span&gt;.</p>
      </ClickableCard>
    </div>
  ),
}

/**
 * A card that navigates, with a button inside it that does something else.
 *
 * This works because a click on the Button stops at the Button — nothing has to
 * be wired up for it. What does **not** work is nesting one hit target inside
 * another kind: an `<a>` inside a `<button>` is invalid HTML. Here the card is
 * the link and the inner control is a button, which is the pairing that is
 * always safe.
 */
export const NestedInteractive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-80">
      <ClickableCard href="#headphones">
        <p className="font-semibold">Wireless Headphones</p>
        <p className="text-content-subtle">Noise-cancelling, 30-hour battery.</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="font-mono font-semibold">$79.99</p>
          <Button
            appearance="secondary"
            onClick={(event) => {
              event.preventDefault()
            }}
          >
            Add to cart
          </Button>
        </div>
      </ClickableCard>
    </div>
  ),
}

/**
 * The kanban board from the Figma composition (`40004220:13045`): three
 * `ContentBlock` columns, each holding a stack of clickable cards.
 *
 * The cards are `emphasis="default"` here, not `ghost` — a board is a set of
 * objects you drag between columns, so each one wants its own edge. Compare with
 * `EmailList`, where the rows are one list and `ghost` is right.
 */
export const Kanban: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const columns = [
      { name: 'Todo', icon: CircleDashed, count: 5 },
      { name: 'In Progress', icon: CircleDot, count: 2 },
      { name: 'Done', icon: CircleCheck, count: 3 },
    ]

    return (
      <div className="grid max-w-280 gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <ContentBlock key={column.name}>
            <ContentBlock.Header
              icon={column.icon}
              titleSlot={<Badge color="neutral">{column.count}</Badge>}
              actions={
                <>
                  <Button appearance="ghost" startIcon={Plus} aria-label={`Add to ${column.name}`} />
                  <Button
                    appearance="ghost"
                    startIcon={Ellipsis}
                    aria-label={`${column.name} options`}
                  />
                </>
              }
            >
              {column.name}
            </ContentBlock.Header>
            <ContentBlock.Content>
              {Array.from({ length: column.count }, (_, index) => (
                <ClickableCard key={index} href={`#${column.name}-${index}`}>
                  <div className="flex flex-col">
                    <span className="text-content-subtle font-mono text-sm">ABC-12{index}</span>
                    <span className="font-semibold">Task title</span>
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between gap-2">
                    <AvatarGroup>
                      <Avatar name="Ada Lovelace" />
                      <Avatar name="Grace Hopper" />
                      <Avatar name="Alan Turing" />
                    </AvatarGroup>
                    <div className="flex items-center gap-2">
                      <Token startIcon={ChevronsUp}>3</Token>
                      <Token startIcon={MessageCircle}>2</Token>
                    </div>
                  </div>
                </ClickableCard>
              ))}
            </ContentBlock.Content>
          </ContentBlock>
        ))}
      </div>
    )
  },
}

/**
 * The mail layout: `ghost` cards as the message list, and the open message in a
 * `ContentBlock` beside it.
 *
 * **This is what `ghost` and `selected` are both for.** The rows sit on the
 * list's `surface-card-primary`, so at rest they have no edge and read as one
 * list rather than as a stack of cards; they grey under the pointer, and the one
 * you are reading keeps the emphasized outline whether you are pointing at it or
 * not. `aria-current` is what carries that to a screen reader — it is a
 * navigation state, not a toggle, which is why it is not `aria-pressed`.
 */
export const EmailList: Story = {
  parameters: { controls: { disable: true } },
  render: function EmailListStory() {
    const messages = [
      {
        from: 'Ada Lovelace',
        subject: 'Re: analytical engine notes',
        preview: 'I have annotated the second half — the recurrence is the interesting part.',
        unread: true,
      },
      {
        from: 'Grace Hopper',
        subject: 'Compiler timings for Q3',
        preview: 'Down 40% on the previous build. Numbers attached.',
        unread: false,
      },
      {
        from: 'Alan Turing',
        subject: 'Morphogenesis draft',
        preview: 'Draft two is with the typist. Happy to walk through the reaction terms.',
        unread: false,
      },
    ]
    const [openIndex, setOpenIndex] = useState(0)
    const open = messages[openIndex]

    return (
      <div className="grid max-w-280 gap-4 lg:grid-cols-[20rem_1fr]">
        <ContentBlock>
          <ContentBlock.Header>Inbox</ContentBlock.Header>
          <ContentBlock.Content className="gap-0">
            {messages.map((message, index) => (
              <ClickableCard
                key={message.subject}
                emphasis="ghost"
                selected={index === openIndex}
                onClick={() => setOpenIndex(index)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{message.from}</span>
                  {message.unread && <Badge color="green">New</Badge>}
                </div>
                <span className="truncate">{message.subject}</span>
                <span className="text-content-subtle truncate text-sm">{message.preview}</span>
              </ClickableCard>
            ))}
          </ContentBlock.Content>
        </ContentBlock>

        <ContentBlock>
          <ContentBlock.Header
            actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Message options" />}
          >
            {open.subject}
          </ContentBlock.Header>
          <ContentBlock.Content>
            <div className="flex items-center gap-2">
              <Avatar name={open.from} />
              <span className="font-semibold">{open.from}</span>
            </div>
            <p className="text-content-subtle">{open.preview}</p>
          </ContentBlock.Content>
        </ContentBlock>
      </div>
    )
  },
}
