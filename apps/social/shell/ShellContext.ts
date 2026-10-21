import { createContext, useContext } from 'react'

import type { MentionQuery } from '../data/mentions'
import type { DetailTab as PostDetailTab } from '../screens/calendar/postDetailState'
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
  /**
   * `tab` is the one to open on, and `noteId` a note on it to scroll to: a
   * notification about a note opens on Notes, at that note.
   */
  | { type: 'post'; postId: string; tab?: PostDetailTab; noteId?: string }
  /** A day from the month view, as an ISO date (`screens/calendar/DayDetail.tsx`). */
  | { type: 'day'; date: string }
  | { type: 'contact'; customerId: string }
  /** `tab` is the one to open on, when the full view collapses back to the panel. */
  | { type: 'creator'; creatorId: string; tab?: DetailTab }
  | { type: 'widget'; reportId: string; widgetId: string }
  /**
   * A report board's Add widget catalog. The board renders it, not the shell,
   * and portals it into `screenPanelHost`, so its tiles can be dragged onto the
   * board (`screens/reports/AddWidgetPanel.tsx`).
   */
  | { type: 'add-widget'; reportId: string }
  /** The posts behind a number on Measure (`screens/mentions/MentionsPanel.tsx`). */
  | { type: 'mentions'; query: MentionQuery }
  /** The rail's bell (`screens/notifications/NotificationsPanel.tsx`). */
  | { type: 'notifications' }
  /** The calendar's saved drafts (`screens/calendar/DraftsPanel.tsx`). */
  | { type: 'drafts' }
  | null

export interface ShellState {
  panel: ShellPanel
  setPanel: (panel: ShellPanel) => void
  /** Toast for things the mock does not do yet — dictation, attachments. */
  notBuilt: (what: string) => void
  /**
   * Where a screen puts a panel it renders itself: right after the Page, where
   * a right-hand Panel belongs. For a panel that has to sit inside the
   * screen's own React context — the Add widget catalog is inside the board's
   * drag context. `null` until the shell has mounted.
   */
  screenPanelHost: HTMLElement | null
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell(): ShellState {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell needs the SocialShell around it')
  return shell
}
