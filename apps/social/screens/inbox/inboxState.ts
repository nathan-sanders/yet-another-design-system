import { createContext, useContext } from 'react'

import type { Ticket, TicketEdit } from '../../data/types'
import type { SentItem } from './model'

/**
 * What the inbox changes during a session: the ticket edits made from the
 * detail view's menus, and the replies and notes sent. Held above the routes
 * (`InboxProvider` in `main.tsx`) so All messages and My inbox are two views
 * of the same tickets — assign one to yourself in one and it is in the other —
 * and so the nav's My inbox count can follow along.
 */
export interface InboxState {
  /** The fixtures with every edit applied. */
  tickets: Ticket[]
  editTicket: (number: string, edit: TicketEdit) => void
  sent: Record<string, SentItem[]>
  addSent: (number: string, item: SentItem) => void
}

export const InboxContext = createContext<InboxState | null>(null)

export function useInbox(): InboxState {
  const inbox = useContext(InboxContext)
  if (!inbox) throw new Error('useInbox needs the InboxProvider around it')
  return inbox
}
