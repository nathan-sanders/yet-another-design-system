import { Avatar, AvatarGroup } from '../../../src/components/Avatar'
import { ClickableCard } from '../../../src/components/Card'
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

function label(ticket: Ticket) {
  const customer = customerFor(ticket.customerId)
  return `${customer.handle}, ${ticket.ago} ago: ${ticket.subject}`
}

/**
 * `_Inbox Message Content` (`40005827:15534`) in a `Clickable Card`: one
 * message in the All messages list. Avatar, network, handle and age; Yak's
 * summary; the first line of the message; the ticket's meta.
 *
 * The card is `ghost` in the list, where the file draws the row with no visible
 * edge and a `Divider` between rows, and `selected` is the open conversation.
 */
export function InboxMessageCard({ ticket, selected, onOpen, emphasis = 'ghost' }: MessageCardProps) {
  const customer = customerFor(ticket.customerId)
  return (
    <ClickableCard
      emphasis={emphasis}
      selected={selected}
      onClick={() => onOpen(ticket)}
      className="w-full"
      aria-label={label(ticket)}
    >
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
          <Text truncate className="min-w-0 flex-1">
            {ticket.body}
          </Text>
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
