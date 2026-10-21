import { me } from '../../data/people'
import type { Ticket, TicketPriority } from '../../data/types'

/** `mine` is My inbox: tickets assigned to you. */
export type InboxFilter = 'all' | 'unassigned' | 'mine'
/** My inbox's Open | Complete. Every status but `complete` is open. */
export type StatusFilter = 'open' | 'complete'
export type SortKey = 'received' | 'priority'

export function isOpen(ticket: Ticket): boolean {
  return ticket.status !== 'complete'
}
export type InboxView = 'conversation' | 'thread'

/** Something sent from this screen, kept for the session. */
export interface SentItem {
  id: string
  kind: 'reply' | 'note'
  authorId: string
  body: string
}

const PRIORITY_RANK: Record<TicketPriority, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 }

/**
 * The list as the toolbar asks for it. Fixture order is newest first, so
 * "Last received" descending is the order as written; priority breaks ties by
 * that same order.
 */
export function visibleTickets(
  tickets: Ticket[],
  filter: InboxFilter,
  sort: SortKey,
  descending: boolean,
  status?: StatusFilter,
): Ticket[] {
  const assigned =
    filter === 'unassigned'
      ? tickets.filter((t) => !t.assigneeId)
      : filter === 'mine'
        ? tickets.filter((t) => t.assigneeId === me.id)
        : tickets
  const filtered = status ? assigned.filter((t) => isOpen(t) === (status === 'open')) : assigned
  const ranked = filtered
    .map((ticket, index) => ({ ticket, index }))
    .sort((a, b) =>
      sort === 'priority'
        ? PRIORITY_RANK[b.ticket.priority] - PRIORITY_RANK[a.ticket.priority] || a.index - b.index
        : a.index - b.index,
    )
    .map((r) => r.ticket)
  return descending ? ranked : ranked.reverse()
}

/**
 * Who has a ticket open right now: the teammates the fixtures say, plus you on
 * the one you are viewing. Your face moves with you; theirs stay put, so a
 * teammate on another message shows on that message's card.
 */
export function withViewer(ticket: Ticket, openNumber: string | undefined): Ticket {
  const others = (ticket.viewers ?? []).filter((id) => id !== me.id)
  const viewers = ticket.number === openNumber ? [me.id, ...others] : others
  return { ...ticket, viewers }
}
