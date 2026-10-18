import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { tickets as fixtures } from '../../data/inbox'
import type { TicketEdit } from '../../data/types'
import { InboxContext, type InboxState } from './inboxState'
import type { SentItem } from './model'

/** Holds the inbox's session state for every screen and the nav. See `inboxState.ts`. */
export function InboxProvider({ children }: { children: ReactNode }) {
  const [edits, setEdits] = useState<Record<string, TicketEdit>>({})
  const [sent, setSent] = useState<Record<string, SentItem[]>>({})

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

  const value = useMemo<InboxState>(
    () => ({
      tickets: fixtures.map((t) => (edits[t.number] ? { ...t, ...edits[t.number] } : t)),
      editTicket,
      sent,
      addSent,
    }),
    [edits, sent, editTicket, addSent],
  )

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
