import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  MAX_BLOCKS_PER_ROW,
  createBoard,
  findContainer,
  removeBlock,
  settle,
  withSpareRow,
  type Board,
} from '../../../../src/components/DragAndDrop'
import { boardFixture, reportFor } from '../../data/reports'
import type { Widget } from '../../data/types'
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
      change(reportId, (current) => ({ ...current, board: removeBlock(current.board, widgetId) })),
    [change],
  )

  // The copy sits right after its source: in the same row while the row has
  // room, else in a new row under it.
  const duplicateWidget = useCallback(
    (reportId: string, widgetId: string) =>
      change(reportId, (current) => {
        const source = current.widgets[widgetId]
        const row = findContainer(current.board.containers, widgetId)
        if (!source || !row) return current
        let n = 2
        while (current.widgets[`${widgetId}-copy-${n}`]) n += 1
        const id = `${widgetId}-copy-${n}`
        const { containers, order } = current.board
        const items = containers[row]
        let board: Board
        if (items.length < MAX_BLOCKS_PER_ROW) {
          const at = items.indexOf(widgetId) + 1
          board = settle(current.board, { ...containers, [row]: [...items.slice(0, at), id, ...items.slice(at)] })
        } else {
          const newRow = `row-${id}`
          const at = order.indexOf(row) + 1
          board = settle(
            current.board,
            { ...containers, [newRow]: [id] },
            [...order.slice(0, at), newRow, ...order.slice(at)],
          )
        }
        return {
          board: withSpareRow(board),
          widgets: { ...current.widgets, [id]: { ...source, id, title: `${source.title} (copy)` } },
        }
      }),
    [change],
  )

  const widgetFor = useCallback(
    (reportId: string, widgetId: string) => {
      if (draft?.reportId === reportId && draft.widget.id === widgetId) return draft.widget
      const current = boardFor(reportId)
      // A removed widget is gone from the layout; its settings are kept but unreachable.
      const placed = current && Object.values(current.board.containers).some((row) => row.includes(widgetId))
      return placed ? current.widgets[widgetId] : undefined
    },
    [boardFor, draft],
  )

  const value = useMemo<ReportsState>(
    () => ({ boardFor, setBoard, widgetFor, saveWidget, removeWidget, duplicateWidget, draft, setDraft }),
    [boardFor, setBoard, widgetFor, saveWidget, removeWidget, duplicateWidget, draft],
  )

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}
