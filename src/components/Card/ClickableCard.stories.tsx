import { Fragment, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Archive,
  ArchiveX,
  ChevronsUp,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Ellipsis,
  Flag,
  Folder,
  Forward,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Paperclip,
  Plus,
  Reply,
  ReplyAll,
  Signature,
  Smile,
  SquarePen,
  Tag as TagIcon,
  Trash2,
  WandSparkles,
} from 'lucide-react'

import { ClickableCard } from './ClickableCard'
import { Autocomplete } from '../Autocomplete'
import { Avatar, AvatarGroup } from '../Avatar'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Divider } from '../Divider'
import { Icon } from '../Icon'
import { InputGroup } from '../Input'
import { SegmentedControl } from '../SegmentedControl'
import { Token } from '../Token'

const emphases = ['default', 'ghost'] as const
const paddings = [0, 2, 3, 4] as const

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
    padding: 3,
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
 * The two emphases, on `surface-background-primary` — which is the surface `ghost` is
 * drawn against.
 *
 * **`ghost` has no visible edge and is exactly the same size as `default`.**
 * Figma binds its border to `Surface/Background Primary`, the same token as its fill,
 * rather than removing the border — so a ghost row and a bordered card line up
 * in a mixed list, and the hover is one color move rather than a border
 * appearing from nowhere. Hover both to see it.
 */
export const Emphasis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-background-primary border-surface-border flex max-w-100 flex-col gap-2 rounded-lg border p-4">
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
    <div className="bg-surface-background-primary border-surface-border grid max-w-200 gap-4 rounded-lg border p-4 sm:grid-cols-2">
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
 *
 * **Two props on the AvatarGroup that are easy to leave off, and both are
 * measured rather than preferred.** `size="small"` because the composition
 * draws three 24px avatars at 64px total — the library's standing rule is to
 * reach for the default size in an application story, and this is the kind of
 * constraint that overrides it. `surface="card-primary"` because the ring
 * between overlapping avatars is a band of the *background*, and the background
 * here is the card, not the page. Without it the rings are painted in
 * `surface-canvas` and read as grey halos.
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
                    <AvatarGroup size="small" surface="card-primary">
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
 * The inbox from the Figma composition (`40004297:8827`): a message list beside
 * the message you are reading.
 *
 * **This is what `ghost` and `selected` are both for.** The rows sit on the
 * list's `surface-background-primary`, so at rest they have no edge and read as one
 * list rather than as a stack of cards; they grey under the pointer, and the one
 * you are reading keeps the emphasized outline whether you are pointing at it or
 * not. `aria-current` is what carries that to a screen reader — it is a
 * navigation state, not a toggle, which is why it is not `aria-pressed`.
 *
 * Nine components in one screen, which is the other reason this story exists:
 * ContentBlock, Autocomplete, SegmentedControl, ClickableCard, Avatar, Divider,
 * Token, InputGroup and Button all have to agree about spacing and surfaces for
 * it to look like one thing.
 *
 * Two sizes here are the design's, not the default: the row avatars are
 * `x-small` because a row is two 20px lines, and the sender's is `large`
 * because it stands beside two. The copy is the library's rather than Figma's —
 * the mockup's "Subject" and lorem are placeholders for a layout, not content
 * to port.
 *
 * **The sender's status dot is an addition, not something the mockup draws.**
 * It is here because a dot on a card is the other half of what `surface` fixes
 * — its ring is the same band of background the group ring is — and nothing
 * else in the library exercises that path on a real surface.
 */
export const EmailList: Story = {
  parameters: { controls: { disable: true } },
  render: function EmailListStory() {
    const messages = [
      {
        from: 'Ada Lovelace',
        address: 'ada@analyticalengine.org',
        subject: 'Re: analytical engine notes',
        preview: 'I have annotated the second half — the recurrence is the interesting part.',
        time: '9:34 AM',
        unread: true,
      },
      {
        from: 'Grace Hopper',
        address: 'grace@compiler.mil',
        subject: 'Compiler timings for Q3',
        preview: 'Down 40% on the previous build. Numbers attached.',
        time: '8:12 AM',
        unread: true,
      },
      {
        from: 'Katherine Johnson',
        address: 'katherine@orbital.gov',
        subject: 'Re-entry figures, checked by hand',
        preview: 'Ran them twice. The second pass agrees with the machine to four places.',
        time: 'Yesterday',
        unread: true,
      },
      {
        from: 'Alan Turing',
        address: 'alan@morphogenesis.ac.uk',
        subject: 'Morphogenesis draft',
        preview: 'Draft two is with the typist. Happy to walk through the reaction terms.',
        time: 'Yesterday',
        unread: false,
        flagged: true,
      },
      {
        from: 'Margaret Hamilton',
        address: 'margaret@onboard.systems',
        subject: 'Priority display, one more time',
        preview: 'The scheduler should drop the low-priority jobs, not queue them. Notes inside.',
        time: 'Tuesday',
        unread: false,
      },
      {
        from: 'Radia Perlman',
        address: 'radia@spanningtree.net',
        subject: 'Loops in the bridge topology',
        preview: 'There is an algorithm for this. Eight lines of verse attached, regrettably.',
        time: 'Monday',
        unread: false,
      },
    ]

    const recentSearches = [
      { value: 'compiler', label: 'compiler' },
      { value: 'draft', label: 'draft' },
      { value: 'from:ada', label: 'from:ada' },
    ]

    // The open message is index 3 to start, so the story opens showing a
    // selected row that is neither the first nor the last — the case where
    // `selected` has to hold its outline against the rows either side of it.
    const [openIndex, setOpenIndex] = useState(3)
    const open = messages[openIndex]!

    return (
      <div className="grid max-w-320 gap-4 lg:grid-cols-[22.75rem_1fr]">
        <ContentBlock>
          <ContentBlock.Header
            actions={
              <>
                <Button appearance="ghost" startIcon={Ellipsis} aria-label="Inbox options" />
                <Button startIcon={SquarePen} aria-label="Compose" />
              </>
            }
          >
            Inbox
          </ContentBlock.Header>

          <ContentBlock.Content className="gap-3">
            {/* Autocomplete's start icon is already Search, so it is not passed. */}
            <Autocomplete items={recentSearches} placeholder="Search inbox…" aria-label="Search inbox" />

            <SegmentedControl layout="fill" defaultValue="all" aria-label="Filter messages">
              <SegmentedControl.Item value="all">All</SegmentedControl.Item>
              <SegmentedControl.Item value="unread">Unread</SegmentedControl.Item>
              <SegmentedControl.Item value="archived">Archived</SegmentedControl.Item>
            </SegmentedControl>

            <div className="flex flex-col gap-2">
              {messages.map((message, index) => (
                <Fragment key={message.subject}>
                  {index > 0 && <Divider />}
                  {/* pl-6 opens the gutter the unread dot sits in; the rest is
                      padding={3}'s 12px, which is what the design draws. */}
                  <ClickableCard
                    emphasis="ghost"
                    className="relative pl-6"
                    selected={index === openIndex}
                    onClick={() => setOpenIndex(index)}
                  >
                    {message.unread && (
                      <span
                        aria-hidden="true"
                        className="absolute top-4.5 left-2.5 size-2 rounded-full bg-decorative-pink-highlight"
                      />
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Avatar size="x-small" name={message.from} />
                      <span className="min-w-0 flex-1 truncate">{message.from}</span>
                      {message.unread && <span className="sr-only">Unread</span>}
                      {message.flagged && (
                        <Icon
                          icon={Flag}
                          className="text-decorative-orange-highlight"
                          aria-label="Flagged"
                        />
                      )}
                      <span className="shrink-0 text-content-subtle">{message.time}</span>
                    </div>

                    {/* gap-0 between subject and preview: Figma sets the two as
                        one block of 14/24 with no space between the lines. */}
                    <div className="flex flex-col gap-0">
                      <span className="truncate font-semibold text-content-emphasized">
                        {message.subject}
                      </span>
                      <span className="truncate text-content-subtle">{message.preview}</span>
                    </div>
                  </ClickableCard>
                </Fragment>
              ))}
            </div>
          </ContentBlock.Content>
        </ContentBlock>

        <ContentBlock>
          {/* The actions bar has ContentBlock.Header's geometry — min-h-12, px-4,
              py-2 — but it is not a heading, so it is not ContentBlock.Header. */}
          <div className="flex min-h-12 items-center gap-4 px-4 py-2">
            <div className="flex flex-1 items-center gap-2">
              <Button appearance="ghost" startIcon={Reply} aria-label="Reply" />
              <Button appearance="ghost" startIcon={ReplyAll} aria-label="Reply all" />
              <Button appearance="ghost" startIcon={Forward} aria-label="Forward" />
            </div>
            <div className="flex items-center gap-2">
              <Button appearance="ghost" startIcon={Archive} aria-label="Archive" />
              <Button appearance="ghost" startIcon={Trash2} aria-label="Delete" />
              <Button appearance="ghost" startIcon={ArchiveX} aria-label="Move to junk" />
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <Button appearance="ghost" startIcon={Folder} aria-label="Move to folder" />
              <Button appearance="ghost" startIcon={TagIcon} aria-label="Add label" />
              <Button appearance="ghost" startIcon={Flag} aria-label="Flag" />
            </div>
          </div>

          <ContentBlock.Content className="flex-1 gap-4 pt-2 pb-0">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {/* surface="card-primary" for the same reason the kanban group
                    needs it: the status ring is a band of what is behind. */}
                <Avatar
                  size="large"
                  name={open.from}
                  status="online"
                  surface="card-primary"
                />
                <div className="flex min-w-0 flex-1 flex-col text-sm">
                  <span className="truncate font-semibold">{open.from}</span>
                  <span className="truncate text-content-subtle">{open.address}</span>
                </div>
              </div>
              <span className="shrink-0 text-sm text-content-subtle">{open.time}</span>
              <Button appearance="ghost" size="small">
                Unsubscribe
              </Button>
            </div>

            <Divider />

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-content-subtle">To</span>
                <Token avatar={<Token.Avatar name="Nathan Sanders" />}>Nathan Sanders</Token>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-content-subtle">Cc</span>
                <div className="flex flex-wrap items-center gap-1">
                  <Token avatar={<Token.Avatar name="Grace Hopper" />}>Grace Hopper</Token>
                  <Token avatar={<Token.Avatar name="Alan Turing" />}>Alan Turing</Token>
                </div>
              </div>
            </div>

            <Divider />

            <h4 className="text-lg font-semibold text-content-emphasized">{open.subject}</h4>

            <div className="flex flex-col gap-4 text-sm">
              <p>{open.preview}</p>
              <p>
                The part I keep coming back to is the middle section, where the same argument is
                made twice in slightly different notation. One of the two should go, and I do not
                think it matters much which.
              </p>
              <p>
                No rush on any of this — I am away until the end of the week and will not be able
                to look at a reply before then.
              </p>
            </div>
          </ContentBlock.Content>

          <div className="p-4">
            <InputGroup>
              <InputGroup.Addon align="block-start">
                <Button appearance="ghost" startIcon={Reply} aria-label="Reply to sender" />
                <InputGroup.Text>{open.address}</InputGroup.Text>
              </InputGroup.Addon>

              <InputGroup.Input placeholder="Continue the conversation…" aria-label="Reply" />

              <InputGroup.Addon align="block-end">
                <div className="flex flex-1 items-center gap-2">
                  <Button appearance="ghost" startIcon={WandSparkles} aria-label="Draft with AI" />
                  <Button appearance="ghost" startIcon={Paperclip} aria-label="Attach a file" />
                  <Button appearance="ghost" startIcon={ImageIcon} aria-label="Insert an image" />
                  <Button appearance="ghost" startIcon={Link2} aria-label="Insert a link" />
                  <Button appearance="ghost" startIcon={Smile} aria-label="Insert an emoji" />
                  <Button appearance="ghost" startIcon={Signature} aria-label="Insert signature" />
                </div>
                <Button>Send</Button>
              </InputGroup.Addon>
            </InputGroup>
          </div>
        </ContentBlock>
      </div>
    )
  },
}
