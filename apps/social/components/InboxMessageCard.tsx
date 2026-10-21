import { Avatar, AvatarGroup } from '../../../src/components/Avatar'
import { ClickableCard } from '../../../src/components/Card'
import { ChatMessage } from '../../../src/components/Chat'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { customerFor } from '../data/inbox'
import { personFor } from '../data/people'
import type { Ticket } from '../data/types'
import { NetworkIcon } from './NetworkIcon'
import { TicketMeta } from './TicketMeta'

interface MessageCardProps {
  ticket: Ticket
  selected?: boolean
  onOpen: (ticket: Ticket) => void
  /** The card's own surface. `ghost` in the list, `default` in the contact panel. */
  emphasis?: 'ghost' | 'default'
}

/** Teammates with this conversation open — Figma's `Currently Viewing`. */
function Viewers({ ticket }: { ticket: Ticket }) {
  if (!ticket.viewers?.length) return null
  const names = ticket.viewers.map((id) => personFor(id).name)
  return (
    <AvatarGroup size="x-small" aria-label={`Viewing now: ${names.join(', ')}`}>
      {ticket.viewers.map((id) => {
        const person = personFor(id)
        return <Avatar key={id} name={person.name} src={person.avatar} />
      })}
    </AvatarGroup>
  )
}

const UNSEEN_LABEL = { message: 'new message', reply: 'new reply' } as const

function label(ticket: Ticket) {
  const customer = customerFor(ticket.customerId)
  const unseen = ticket.unseen ? `, ${UNSEEN_LABEL[ticket.unseen]}` : ''
  const kind = ticket.private ? ', private message' : ''
  return `${customer.handle}${kind}, ${ticket.ago} ago: ${ticket.subject}${unseen}`
}

/**
 * What a private message's card previews: the customer's latest message, not
 * the first. The conversation is a chat, and the list shows where it stands.
 */
function latestFromCustomer(ticket: Ticket): string {
  const last = ticket.history?.findLast((r) => r.authorId === ticket.customerId && !r.system)
  return last?.body ?? ticket.body
}

/**
 * The file's `New Indicator`: an 8px `Decorative/Pink/Highlight` dot, as on
 * the nav's bell and a notification row. Decoration only — the card's name
 * says it. The caller places it.
 */
export function NewDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('absolute size-2 rounded-full bg-decorative-pink-highlight', className)}
    />
  )
}

/**
 * `_Inbox Message Content` (`40005827:15534`) in a `Clickable Card`: one
 * message in the All messages list. Avatar, network, handle and age; Yak's
 * summary; the first line of the message; the ticket's meta.
 *
 * The card is `ghost` in the list, where the file draws the row with no visible
 * edge and a `Divider` between rows, and `selected` is the open conversation.
 *
 * The content pads 12 more on the left than the card does, a gutter for the
 * `New` dot (`unseen`) that the file keeps whether or not the dot shows, so
 * every row's face lines up. The dot centers on that gutter and on the header
 * row: 8 in and 20 down from the card's padding edge.
 */
export function InboxMessageCard({
  ticket,
  selected,
  onOpen,
  emphasis = 'ghost',
}: MessageCardProps) {
  const customer = customerFor(ticket.customerId)
  return (
    <ClickableCard
      emphasis={emphasis}
      selected={selected}
      onClick={() => onOpen(ticket)}
      className="relative w-full pl-6"
      aria-label={label(ticket)}
    >
      {ticket.unseen ? <NewDot className="top-5 left-2" /> : null}
      <div className="flex w-full min-w-0 flex-col gap-2 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={customer.handle} src={customer.avatar} alt="" size="small" />
          <NetworkIcon network={ticket.network} />
          <Text
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {customer.handle}
          </Text>
          <Viewers ticket={ticket} />
          <Text render={<span />} size="sm" color="subtle" className="shrink-0">
            {ticket.ago}
          </Text>
        </div>
        <Text size="sm" weight="semibold" truncate>
          {ticket.subject}
        </Text>
        <div className="flex min-w-0 items-start gap-2">
          {ticket.private ? (
            // A private message previews as a bubble, after Nathan's Sprout
            // inbox, so a chat reads differently from a comment at a glance.
            // The default bubble is Surface/Background Subtle, which is what
            // the card turns to under the pointer and when selected, so there
            // the bubble swaps to Primary rather than vanish (FINDINGS 140).
            <ChatMessage.Bubble
              size="small"
              direction="received"
              className="min-w-0 truncate whitespace-nowrap in-[button:hover]:bg-surface-background-primary in-[[aria-current=true]]:bg-surface-background-primary"
            >
              {latestFromCustomer(ticket)}
            </ChatMessage.Bubble>
          ) : (
            <Text truncate className="min-w-0 flex-1">
              {ticket.body}
            </Text>
          )}
          {ticket.photo ? (
            <img
              src={ticket.photo}
              alt={ticket.photoAlt ?? ''}
              className="size-10 shrink-0 rounded-md object-cover"
            />
          ) : null}
        </div>
        <TicketMeta ticket={ticket} />
      </div>
    </ClickableCard>
  )
}

/**
 * The collapsed list's row (`40005911:33946`, `Message / kaiya` and the rest):
 * a 36px face over the message's age, 8px of padding, at 63 × 78. It is what the
 * list folds to when a panel takes the room.
 *
 * Not a `ClickableCard`, for the reason the month chip is not one: the card
 * brings 12px of padding the drawing does not have. It is a button wearing the
 * ghost card's tokens, with `aria-current` for the open message as the card has.
 * The `New` dot centers on the content's top-left corner, 4 in from the padding.
 */
export function InboxMessageAvatar({ ticket, selected, onOpen }: MessageCardProps) {
  const customer = customerFor(ticket.customerId)
  return (
    <button
      type="button"
      onClick={() => onOpen(ticket)}
      aria-label={label(ticket)}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'relative flex w-full flex-col items-center gap-1 rounded-md border p-2',
        'border-surface-background-primary bg-surface-background-primary',
        'hover:border-surface-background-subtle hover:bg-surface-background-subtle',
        focusRing,
        selected &&
          'border-surface-border-emphasized bg-surface-background-subtle hover:border-surface-border-emphasized',
      )}
    >
      {ticket.unseen ? <NewDot className="top-1 left-1" /> : null}
      <Avatar name={customer.handle} src={customer.avatar} alt="" />
      <Text render={<span />} size="sm" color="subtle">
        {ticket.ago}
      </Text>
      {ticket.viewers?.length ? (
        <span className="absolute top-1.5 right-1.5">
          <Viewers ticket={ticket} />
        </span>
      ) : null}
    </button>
  )
}
