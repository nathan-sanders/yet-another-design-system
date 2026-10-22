import { me } from '../../data/people'
import type { Ticket, TicketEdit, TicketPriority } from '../../data/types'

/**
 * Which tickets, by owner. `mine` is My inbox: tickets assigned to you;
 * `assigned` is All assignments: tickets anyone owns. `spam` is the one pile
 * spam is in — every other filter leaves it out.
 */
export type InboxFilter = 'all' | 'unassigned' | 'mine' | 'assigned' | 'spam'
/**
 * The Engage pages this screen draws. All messages and My inbox have a toggle
 * in the top bar; the other three are a filter already.
 */
export type InboxScope = 'all' | 'mine' | 'assigned' | 'spam' | 'complete'
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

const PRIORITY_RANK: Record<TicketPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
}

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
  const pile = filter === 'spam' ? tickets.filter((t) => t.spam) : tickets.filter((t) => !t.spam)
  const assigned =
    filter === 'unassigned'
      ? pile.filter((t) => !t.assigneeId)
      : filter === 'mine'
        ? pile.filter((t) => t.assigneeId === me.id)
        : filter === 'assigned'
          ? pile.filter((t) => t.assigneeId)
          : pile
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

/** What a scope asks `visibleTickets` for, before the toolbar's own choices. */
export function scopeFilter(
  scope: InboxScope,
  params: { unassigned: boolean; complete: boolean },
): { filter: InboxFilter; status?: StatusFilter } {
  switch (scope) {
    case 'mine':
      return { filter: 'mine', status: params.complete ? 'complete' : 'open' }
    // Assignments are work in hand. Once complete, a ticket moves to Complete.
    case 'assigned':
      return { filter: 'assigned', status: 'open' }
    case 'complete':
      return { filter: 'all', status: 'complete' }
    case 'spam':
      return { filter: 'spam' }
    default:
      return { filter: params.unassigned ? 'unassigned' : 'all' }
  }
}

/** How many tickets a scope's default view lists: its nav badge. */
export function scopeCount(tickets: Ticket[], scope: InboxScope): number {
  const { filter, status } = scopeFilter(scope, { unassigned: false, complete: false })
  return visibleTickets(tickets, filter, 'received', true, status).length
}

/**
 * The edit the Complete button makes: complete it as you, now, or put it back.
 * Shared by the conversation's toolbar and the public thread's action row.
 */
export function completeToggle(ticket: Ticket): TicketEdit {
  return ticket.status === 'complete'
    ? { status: 'new', completedBy: undefined, completedAt: undefined }
    : { status: 'complete', completedBy: me.id, completedAt: new Date().toISOString() }
}

/** Who to name on "Marked complete by": who did it, or else who owned it. */
export function completedById(ticket: Ticket): string | undefined {
  return ticket.status === 'complete' ? (ticket.completedBy ?? ticket.assigneeId) : undefined
}
