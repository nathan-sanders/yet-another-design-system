import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { seedNotes } from '../../data/notes'
import type { CalendarNote } from '../../data/types'
import { CalendarNotesContext, type CalendarNotesState } from './calendarNotesState'

/** Holds the calendar's notes for every screen. See `calendarNotesState.ts`. */
export function CalendarNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<CalendarNote[]>(seedNotes)
  const nextId = useRef(1)

  const addNote = useCallback((note: Omit<CalendarNote, 'id'>) => {
    const id = `note-new-${nextId.current++}`
    setNotes((all) => [...all, { ...note, id }])
    return id
  }, [])

  const updateNote = useCallback(
    (id: string, note: Omit<CalendarNote, 'id'>) =>
      setNotes((all) => all.map((each) => (each.id === id ? { ...note, id } : each))),
    [],
  )

  const removeNote = useCallback(
    (id: string) => setNotes((all) => all.filter((each) => each.id !== id)),
    [],
  )

  const value = useMemo<CalendarNotesState>(
    () => ({ notes, addNote, updateNote, removeNote }),
    [notes, addNote, updateNote, removeNote],
  )

  return <CalendarNotesContext.Provider value={value}>{children}</CalendarNotesContext.Provider>
}
