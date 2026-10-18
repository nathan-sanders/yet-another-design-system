import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { createBoard, removeBlock, type Board } from '../../../../src/components/DragAndDrop'
import { boardFixture, reportFor } from '../../data/reports'
import type { Widget } from '../../data/types'
import { withSpareRow } from './model'
import { ReportsContext, type ReportBoard, type ReportsState } from './reportsState'

// One per report and kept, so an untouched board is the same object on every
// render — `dragOver` answers "nothing changed" by returning its input.
const initialBoards = new Map<string, ReportBoard | undefined>()

/** A report's board as the fixtures draw it, before anybody touches it. */
function initial(reportId: string): ReportBoard | undefined {
  if (!initialBoards.has(reportId)) {
    const report = reportFor(reportId)
    const fixture = report && boardFixture(report)
    initialBoards.set(
      reportId,
      fixture && { board: withSpareRow(createBoard(fixture.rows)), widgets: fixture.widgets },
    )
  }
  return initialBoards.get(reportId)
}

/** Holds Measure's session state for every screen and the Edit panel. See `reportsState.ts`. */
export function ReportsProvider({ children }: { children: ReactNode }) {
  // Only boards somebody changed are stored; the rest are their fixtures.
  const [boards, setBoards] = useState<Record<string, ReportBoard>>({})
  const [draft, setDraft] = useState<ReportsState['draft']>(null)

  const boardFor = useCallback(
    (reportId: string) => boards[reportId] ?? initial(reportId),
    [boards],
  )

  const change = useCallback(
    (reportId: string, update: (current: ReportBoard) => ReportBoard) =>
      setBoards((all) => {
        const current = all[reportId] ?? initial(reportId)
        return current ? { ...all, [reportId]: update(current) } : all
      }),
    [],
  )

  const setBoard = useCallback(
    (reportId: string, update: (board: Board) => Board) =>
      change(reportId, (current) => ({ ...current, board: update(current.board) })),
    [change],
  )

  const saveWidget = useCallback(
    (reportId: string, widget: Widget) =>
      change(reportId, (current) => ({
        ...current,
        widgets: { ...current.widgets, [widget.id]: widget },
      })),
    [change],
  )

  const removeWidget = useCallback(
    (reportId: string, widgetId: string) =>
      change(reportId, (current) => ({
        ...current,
        board: withSpareRow(removeBlock(current.board, widgetId)),
      })),
    [change],
  )

  const widgetFor = useCallback(
    (reportId: string, widgetId: string) => {
      if (draft?.reportId === reportId && draft.widget.id === widgetId) return draft.widget
      const current = boardFor(reportId)
      // A removed widget is gone from the layout; its settings are kept but unreachable.
      const placed =
        current && Object.values(current.board.containers).some((row) => row.includes(widgetId))
      return placed ? current.widgets[widgetId] : undefined
    },
    [boardFor, draft],
  )

  const value = useMemo<ReportsState>(
    () => ({ boardFor, setBoard, widgetFor, saveWidget, removeWidget, draft, setDraft }),
    [boardFor, setBoard, widgetFor, saveWidget, removeWidget, draft],
  )

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}
