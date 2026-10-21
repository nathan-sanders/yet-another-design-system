import { createContext, useContext } from 'react'

import type { Board } from '../../../../src/components/DragAndDrop'
import type { Report, Widget } from '../../data/types'

/** One report's board as the session has left it: the layout, and each widget's settings. */
export interface ReportBoard {
  board: Board
  widgets: Record<string, Widget>
}

/**
 * What Measure changes during a session: the boards rearranged and resized,
 * and the widgets edited or removed. Held above the routes (`ReportsProvider`
 * in `main.tsx`), as the inbox's edits are, so the board, a widget's detail
 * page and the Edit panel are three views of one copy — apply an edit on the
 * detail page and the board has it when you go back.
 *
 * `draft` is the Edit panel's unapplied widget. The page behind the panel
 * draws it, so a change previews as you make it; Apply keeps it, Cancel and
 * close drop it.
 */
export interface ReportsState {
  /** Every report: those made this session first, newest first, then the fixtures. */
  reports: Report[]
  reportFor: (reportId: string | undefined) => Report | undefined
  /** Adds a report made with New report; its board is its type's template. */
  createReport: (report: Report) => void
  /**
   * Puts a widget from the Add widget catalog on a report's board, at `at`,
   * and returns it as placed: its id is `<base>-<n>`, unique on that board,
   * and its title is numbered if the board already has one by that name.
   */
  insertWidget: (
    reportId: string,
    make: (id: string) => Widget,
    base: string,
    at: WidgetPlace,
  ) => Widget
  /** A report's board, or nothing for a built-in report, which has none. */
  boardFor: (reportId: string) => ReportBoard | undefined
  setBoard: (reportId: string, update: (board: Board) => Board) => void
  /** The widget as the page should draw it — the draft, while one is open. */
  widgetFor: (reportId: string, widgetId: string) => Widget | undefined
  saveWidget: (reportId: string, widget: Widget) => void
  removeWidget: (reportId: string, widgetId: string) => void
  /** Copies a widget onto its board, right after the original. */
  duplicateWidget: (reportId: string, widgetId: string) => void
  draft: { reportId: string; widget: Widget } | null
  setDraft: (draft: { reportId: string; widget: Widget } | null) => void
}

/**
 * Where a widget goes: into a row at a position (when the row has room), into
 * a new row right under one, or into a new row at the foot of the board.
 */
export type WidgetPlace = { row: string; index: number } | { afterRow: string } | 'end'

export const ReportsContext = createContext<ReportsState | null>(null)

export function useReports(): ReportsState {
  const reports = useContext(ReportsContext)
  if (!reports) throw new Error('useReports needs the ReportsProvider around it')
  return reports
}
