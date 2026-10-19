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

  const value = useMemo<InboxState>(
    () => ({
      tickets: [...created, ...fixtures].map((t) =>
        edits[t.number] ? { ...t, ...edits[t.number] } : t,
      ),
      editTicket,
      sent,
      addSent,
      addTicket,
    }),
    [created, edits, sent, editTicket, addSent, addTicket],
  )

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
