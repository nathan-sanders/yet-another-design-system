import { createContext, useContext } from 'react'

import type { MentionQuery } from '../data/mentions'
import type { DetailTab } from '../screens/creators/paths'

/**
 * What is open in the shell's right-hand `Panel`. One at a time: the Figma
 * screens never show two side panels, and a second would be stacked *inside*
 * the first (Yak's history is), not beside it.
 */
export type ShellPanel =
  | {
      type: 'yak'
      history?: boolean
    }
  /** Yak's history beside the full view, which has no panel to stack it on. */
  | { type: 'yak-history' }
  | { type: 'post'; postId: string }
  /** A day from the month view, as an ISO date (`screens/calendar/DayDetail.tsx`). */
  | { type: 'day'; date: string }
  | { type: 'contact'; customerId: string }
  /** `tab` is the one to open on, when the full view collapses back to the panel. */
  | { type: 'creator'; creatorId: string; tab?: DetailTab }
  | { type: 'widget'; reportId: string; widgetId: string }
  /** The posts behind a number on Measure (`screens/mentions/MentionsPanel.tsx`). */
  | { type: 'mentions'; query: MentionQuery }
  /** The rail's bell (`screens/notifications/NotificationsPanel.tsx`). */
  | { type: 'notifications' }
  | null

export interface ShellState {
  panel: ShellPanel
  setPanel: (panel: ShellPanel) => void
  /** Toast for things the mock does not do yet — dictation, attachments. */
  notBuilt: (what: string) => void
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell(): ShellState {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell needs the SocialShell around it')
  return shell
}
