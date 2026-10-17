import type { Ticket, TicketPriority } from '../../data/types'

export type InboxFilter = 'all' | 'unassigned'
export type SortKey = 'received' | 'priority'
export type InboxView = 'conversation' | 'thread'

/** Something sent from this screen, kept for the session. */
export interface SentItem {
  id: string
  kind: 'reply' | 'note'
  authorId: string
  body: string
}

const PRIORITY_RANK: Record<TicketPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 }

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
): Ticket[] {
  const filtered = filter === 'unassigned' ? tickets.filter((t) => !t.assigneeId) : tickets
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
