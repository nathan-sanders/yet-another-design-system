import { createContext, useContext } from 'react'

import { statsFor } from '../../data/performance'
import type { Post, Ticket, TicketEdit } from '../../data/types'
import type { SentItem } from './model'

/**
 * What the inbox changes during a session: the ticket edits made from the
 * detail view's menus, the replies and notes sent, and the tickets opened from
 * Measure's mentions; and what you have seen, which puts out a card's new
 * dot. Held above the routes (`InboxProvider` in `main.tsx`) so All messages
 * and My inbox are two views of the same tickets — assign one to yourself in
 * one and it is in the other, open one and it is seen in both — and so the
 * nav's My inbox count can follow along. Comments by post keeps its seen posts
 * here too, so a read survives a trip to another screen.
 */
export interface InboxState {
  /** The fixtures with every edit applied. */
  tickets: Ticket[]
  editTicket: (number: string, edit: TicketEdit) => void
  sent: Record<string, SentItem[]>
  addSent: (number: string, item: SentItem) => void
  /** Opens a new ticket at the top of the inbox, numbered after the last; returns its number. */
  addTicket: (ticket: Omit<Ticket, 'number'>) => string
  /** Clears a ticket's `unseen`, in `tickets`, for the session. */
  markTicketSeen: (number: string) => void
  /** Ids of the posts opened in Comments by post; their comments count as read. */
  seenPosts: ReadonlySet<string>
  markPostSeen: (id: string) => void
}

export const InboxContext = createContext<InboxState | null>(null)

export function useInbox(): InboxState {
  const inbox = useContext(InboxContext)
  if (!inbox) throw new Error('useInbox needs the InboxProvider around it')
  return inbox
}

/**
 * How many of a post's comments you have not read: the fixture's count until
 * you open the post in Comments by post, then none.
 */
export function useUnreadComments(post: Post): number {
  const { seenPosts } = useInbox()
  return seenPosts.has(post.id) ? 0 : statsFor(post).unread
}
