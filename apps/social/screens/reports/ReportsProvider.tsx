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
import { boardFixture, reportFor as fixtureFor, reports as fixtures } from '../../data/reports'
import type { Report, Widget } from '../../data/types'
import { ReportsContext, type ReportBoard, type ReportsState } from './reportsState'

// One per report and kept, so an untouched board is the same object on every
// render — `dragOver` answers "nothing changed" by returning its input.
const initialBoards = new Map<string, ReportBoard | undefined>()

// Reports made with New report this session. Kept beside the boards' cache,
// outside React, so `initial` can find one; `created` state below is what
// makes the screens redraw when one is added.
const madeReports = new Map<string, Report>()

// Reports made with New report survive a reload, in this browser only. Their
// boards are their type's template, so the report is all that needs keeping.
const STORAGE_KEY = 'yet-social:created-reports'

// Kept with the time each was made, so "Edited 2h ago" still counts after a reload.
const madeAt = new Map<string, number>()

function loadCreated(): Report[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as {
      report: Report
      at: number
    }[]
    return saved.map(({ report, at }) => {
      const aged = { ...report, editedMinutes: Math.floor((Date.now() - at) / 60_000) }
      madeAt.set(report.id, at)
      madeReports.set(report.id, aged)
      return aged
    })
  } catch {
    return []
  }
}

function saveCreated(created: Report[]) {
  try {
    const saved = created.map((report) => ({ report, at: madeAt.get(report.id) ?? Date.now() }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Storage blocked or full: the reports still last the session.
  }
}

/** A report's board as the fixtures draw it, before anybody touches it. */
function initial(reportId: string): ReportBoard | undefined {
  if (!initialBoards.has(reportId)) {
    const report = madeReports.get(reportId) ?? fixtureFor(reportId)
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
  const [created, setCreated] = useState<Report[]>(loadCreated)

  const reports = useMemo(() => [...created, ...fixtures], [created])
  const reportFor = useCallback(
    (reportId: string | undefined) => reports.find((r) => r.id === reportId),
    [reports],
  )
  const createReport = useCallback((report: Report) => {
    madeReports.set(report.id, report)
    madeAt.set(report.id, Date.now())
    setCreated((all) => {
      const next = [report, ...all]
      saveCreated(next)
      return next
    })
  }, [])

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
          board = settle(current.board, {
            ...containers,
            [row]: [...items.slice(0, at), id, ...items.slice(at)],
          })
        } else {
          const newRow = `row-${id}`
          const at = order.indexOf(row) + 1
          board = settle(current.board, { ...containers, [newRow]: [id] }, [
            ...order.slice(0, at),
            newRow,
            ...order.slice(at),
          ])
        }
        return {
          board: withSpareRow(board),
          widgets: { ...current.widgets, [id]: { ...source, id, title: `${source.title} (copy)` } },
        }
      }),
    [change],
  )

  const addWidget = useCallback(
    (reportId: string, widget: Widget) =>
      change(reportId, (current) => {
        const row = `row-${widget.id}`
        const { containers, order } = current.board
        return {
          board: withSpareRow(
            settle(current.board, { ...containers, [row]: [widget.id] }, [...order, row]),
          ),
          widgets: { ...current.widgets, [widget.id]: widget },
        }
      }),
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
    () => ({
      reports,
      reportFor,
      createReport,
      addWidget,
      boardFor,
      setBoard,
      widgetFor,
      saveWidget,
      removeWidget,
      duplicateWidget,
      draft,
      setDraft,
    }),
    [
      reports,
      reportFor,
      createReport,
      addWidget,
      boardFor,
      setBoard,
      widgetFor,
      saveWidget,
      removeWidget,
      duplicateWidget,
      draft,
    ],
  )

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}
