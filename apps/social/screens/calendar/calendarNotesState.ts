import { createContext, useContext } from 'react'

import type { CalendarNote } from '../../data/types'

/**
 * The calendar's notes for the session. Held above the routes
 * (`CalendarNotesProvider` in `main.tsx`), like the post notes, so a note made
 * on the week is still there after a trip to another screen.
 */
export interface CalendarNotesState {
  notes: CalendarNote[]
  /** Adds a note and returns its new id. */
  addNote: (note: Omit<CalendarNote, 'id'>) => string
  updateNote: (id: string, note: Omit<CalendarNote, 'id'>) => void
  removeNote: (id: string) => void
}

export const CalendarNotesContext = createContext<CalendarNotesState | null>(null)

export function useCalendarNotes(): CalendarNotesState {
  const notes = useContext(CalendarNotesContext)
  if (!notes) throw new Error('useCalendarNotes needs the CalendarNotesProvider around it')
  return notes
}
