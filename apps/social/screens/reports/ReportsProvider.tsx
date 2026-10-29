import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  MAX_BLOCKS_PER_ROW,
  createBoard,
  findContainer,
  removeBlock,
  settle,
  spareRow,
  withSpareRow,
  type Board,
} from '../../../../src/components/DragAndDrop'
import {
  boardFixture,
  campaignReports,
  reportFor as fixtureFor,
  reports as fixtures,
} from '../../data/reports'
import type { Report, Widget } from '../../data/types'
import {
  ReportsContext,
  type ReportBoard,
  type ReportsState,
  type WidgetPlace,
} from './reportsState'

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

// Every widget id `insertWidget` has handed out, by report, this session.
const issuedIds = new Set<string>()

/** A report's board as the fixtures draw it, before anybody touches it. */
function initial(reportId: string): ReportBoard | undefined {
  if (!initialBoards.has(reportId)) {
    const report =
      madeReports.get(reportId) ??
      fixtureFor(reportId) ??
      campaignReports.find((r) => r.id === reportId)
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
  // A campaign's report is found by id, for its Measure tab and its widgets'
  // pages, but isn't one of the reports the list shows.
  const reportFor = useCallback(
    (reportId: string | undefined) =>
      reports.find((r) => r.id === reportId) ?? campaignReports.find((r) => r.id === reportId),
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

  // The widget is made here, before the change runs, so it can be handed back:
  // the board scrolls to it and says its title. `issuedIds` keeps two adds in
  // one render, before the state has caught up, from sharing one.
  const insertWidget = useCallback(
    (reportId: string, make: (id: string) => Widget, base: string, at: WidgetPlace) => {
      const current = boards[reportId] ?? initial(reportId)
      const taken = (id: string) => current?.widgets[id] || issuedIds.has(`${reportId}/${id}`)
      let n = 1
      while (taken(`${base}-${n}`)) n += 1
      const id = `${base}-${n}`
      issuedIds.add(`${reportId}/${id}`)
      // A second Top stories is "Top stories 2": a widget's title names its
      // table's region, and two regions with one name fail axe.
      const made = make(id)
      const placed = new Set(
        Object.values(current?.board.containers ?? {})
          .flat()
          .map((placedId) => current?.widgets[placedId]?.title),
      )
      let copy = 1
      while (placed.has(copy === 1 ? made.title : `${made.title} ${copy}`)) copy += 1
      const widget = copy === 1 ? made : { ...made, title: `${made.title} ${copy}` }
      change(reportId, (current) => {
        const { containers, order } = current.board
        const spare = spareRow(current.board)
        let board: Board
        if (
          typeof at === 'object' &&
          'row' in at &&
          containers[at.row]!.length < MAX_BLOCKS_PER_ROW
        ) {
          const items = containers[at.row]!
          const index = Math.max(0, Math.min(at.index, items.length))
          board = settle(current.board, {
            ...containers,
            [at.row]: [...items.slice(0, index), id, ...items.slice(index)],
          })
        } else {
          // A row of its own: under the row asked for (or under a full one), else at the foot.
          const newRow = `row-${id}`
          const after = at === 'end' ? undefined : 'row' in at ? at.row : at.afterRow
          const rest = order.filter((row) => row !== spare)
          const index = after === undefined ? rest.length : rest.indexOf(after) + 1
          board = settle(current.board, { ...containers, [newRow]: [id] }, [
            ...rest.slice(0, index),
            newRow,
            ...rest.slice(index),
            ...(spare === undefined ? [] : [spare]),
          ])
        }
        return { board: withSpareRow(board), widgets: { ...current.widgets, [id]: widget } }
      })
      return widget
    },
    [boards, change],
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
      insertWidget,
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
      insertWidget,
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
