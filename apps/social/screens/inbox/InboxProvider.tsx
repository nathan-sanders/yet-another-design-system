import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { tickets as fixtures } from '../../data/inbox'
import type { Ticket, TicketEdit } from '../../data/types'
import { InboxContext, type InboxState } from './inboxState'
import type { SentItem } from './model'

/** Holds the inbox's session state for every screen and the nav. See `inboxState.ts`. */
export function InboxProvider({ children }: { children: ReactNode }) {
  const [edits, setEdits] = useState<Record<string, TicketEdit>>({})
  const [sent, setSent] = useState<Record<string, SentItem[]>>({})
  // Newest first, above the fixtures: the list's order is the array's.
  const [created, setCreated] = useState<Ticket[]>([])
  const [seenTickets, setSeenTickets] = useState<ReadonlySet<string>>(new Set())
  const [seenPosts, setSeenPosts] = useState<ReadonlySet<string>>(new Set())

  const editTicket = useCallback(
    (number: string, edit: TicketEdit) =>
      setEdits((all) => ({ ...all, [number]: { ...all[number], ...edit } })),
    [],
  )
  const addSent = useCallback(
    (number: string, item: SentItem) =>
      setSent((all) => ({ ...all, [number]: [...(all[number] ?? []), item] })),
    [],
  )

  const addTicket = useCallback(
    (ticket: Omit<Ticket, 'number'>) => {
      const last = Math.max(...[...fixtures, ...created].map((t) => Number(t.number)))
      const number = String(last + 1)
      setCreated((all) => [{ ...ticket, number }, ...all])
      return number
    },
    [created],
  )

  // A no-op when already seen, so opening a seen item renders nothing new.
  const markTicketSeen = useCallback(
    (number: string) => setSeenTickets((all) => (all.has(number) ? all : new Set(all).add(number))),
    [],
  )
  const markPostSeen = useCallback(
    (id: string) => setSeenPosts((all) => (all.has(id) ? all : new Set(all).add(id))),
    [],
  )

  const value = useMemo<InboxState>(
    () => ({
      tickets: [...created, ...fixtures].map((t) => {
        const edited = edits[t.number] ? { ...t, ...edits[t.number] } : t
        return edited.unseen && seenTickets.has(t.number)
          ? { ...edited, unseen: undefined }
          : edited
      }),
      editTicket,
      sent,
      addSent,
      addTicket,
      markTicketSeen,
      seenPosts,
      markPostSeen,
    }),
    [
      created,
      edits,
      sent,
      seenTickets,
      seenPosts,
      editTicket,
      addSent,
      addTicket,
      markTicketSeen,
      markPostSeen,
    ],
  )

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
