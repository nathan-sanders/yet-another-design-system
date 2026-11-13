import { addDays, day } from '../../data/dates'
import type { Task } from '../../data/types'

/*
 * The arithmetic under a project's Timeline (`Project - Timeline`,
 * `40006272:7631`): which days the chart spans, how wide a day is at each
 * zoom, where a bar sits, and which rows the chart stacks. Kept apart from
 * the view so it can be tested, because every way it can be wrong still draws
 * a plausible chart.
 */

export type Zoom = 'weeks' | 'months' | 'quarters'

export const ZOOMS: { value: Zoom; label: string }[] = [
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'quarters', label: 'Quarters' },
]

/**
 * A day's width. Weeks is the file's: 80 a week. Months and Quarters are not
 * drawn, so they are set to show a month about 120 wide and a quarter about
 * 200.
 */
export const DAY_PX: Record<Zoom, number> = { weeks: 80 / 7, months: 4, quarters: 2.2 }

/** The Task column, the header, and every row, as the frame measures them. */
export const TASK_COLUMN = 280
export const HEADER_HEIGHT = 40
export const ROW_HEIGHT = 36

const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days from `a` to `b`, safe across a clock change. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

export function mondayOf(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return addDays(start, -((start.getDay() + 6) % 7))
}

export interface Column {
  start: Date
  label: string
  /** From the chart's left edge, in px. */
  x: number
  width: number
}

export interface Range {
  start: Date
  days: number
  dayPx: number
  width: number
  columns: Column[]
}

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const month = new Intl.DateTimeFormat('en-US', { month: 'short' })
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

/**
 * The days the chart spans: from the project's first week, month or quarter,
 * far enough past its end to scroll a little. Weeks opens on the Monday of
 * the project's start, as the file does (Nov 2); a month or a quarter is
 * labeled with the year when it is the first or a January.
 */
export function timelineRange(startIso: string, zoom: Zoom): Range {
  const first = day(startIso)
  const dayPx = DAY_PX[zoom]
  const starts: Date[] = []
  let label: (date: Date, i: number) => string
  if (zoom === 'weeks') {
    const monday = mondayOf(first)
    for (let i = 0; i <= 16; i++) starts.push(addDays(monday, i * 7))
    label = (date) => monthDay.format(date)
  } else {
    const step = zoom === 'months' ? 1 : 3
    const count = zoom === 'months' ? 9 : 6
    const firstMonth =
      zoom === 'months' ? first.getMonth() : first.getMonth() - (first.getMonth() % 3)
    for (let i = 0; i <= count; i++) {
      starts.push(new Date(first.getFullYear(), firstMonth + i * step, 1))
    }
    label =
      zoom === 'months'
        ? (date, i) =>
            i === 0 || date.getMonth() === 0 ? monthYear.format(date) : month.format(date)
        : (date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
  }
  const start = starts[0]
  const columns = starts.slice(0, -1).map((columnStart, i) => ({
    start: columnStart,
    label: label(columnStart, i),
    x: daysBetween(start, columnStart) * dayPx,
    width: daysBetween(columnStart, starts[i + 1]) * dayPx,
  }))
  const days = daysBetween(start, starts[starts.length - 1])
  return { start, days, dayPx, width: days * dayPx, columns }
}

/** Where a day begins, from the chart's left edge. */
export function xOf(range: Range, date: Date): number {
  return daysBetween(range.start, date) * range.dayPx
}

/** A bar from the morning of its start to the end of its due day. */
export function barOf(
  range: Range,
  startIso: string,
  dueIso: string,
): { x: number; width: number } {
  const x = xOf(range, day(startIso))
  return { x, width: xOf(range, addDays(day(dueIso), 1)) - x }
}

/** Days later than planned: the due date against the baseline's. */
export function slipDays(task: Task): number {
  return task.baseline ? daysBetween(day(task.baseline.due), day(task.due)) : 0
}

export type TimelineRow =
  | { kind: 'group'; phase: string; y: number; count: number }
  | { kind: 'task'; task: Task; y: number }

/**
 * The rows under the milestones, in order, with where each one starts: a
 * band per phase, then that phase's open tasks, unless it is collapsed. Done
 * work is not on the Timeline, as the file has it — it is behind today.
 */
export function timelineRows(tasks: Task[], collapsed: ReadonlySet<string>): TimelineRow[] {
  const open = tasks.filter((task) => task.status !== 'done' && task.start)
  const phases = [...new Set(open.map((task) => task.phase))]
  const rows: TimelineRow[] = []
  let y = HEADER_HEIGHT + ROW_HEIGHT
  for (const phase of phases) {
    const inPhase = open.filter((task) => task.phase === phase)
    rows.push({ kind: 'group', phase, y, count: inPhase.length })
    y += ROW_HEIGHT
    if (collapsed.has(phase)) continue
    for (const task of inPhase) {
      rows.push({ kind: 'task', task, y })
      y += ROW_HEIGHT
    }
  }
  return rows
}

/**
 * A dependency's line, from the end of the bar it waits on to the start of
 * its own: out 40 to the right, down, and in, as the file draws the permit's.
 * When the next bar starts too close for that, the line drops to the gap
 * between the rows, comes back left of the bar, and goes in from there.
 */
export function dependencyPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { d: string; elbow: { x: number; y1: number; y2: number } } {
  const elbowX = Math.min(from.x + 40, to.x - 8)
  if (elbowX >= from.x + 8) {
    return {
      d: `M ${from.x} ${from.y} H ${elbowX} V ${to.y} H ${to.x}`,
      elbow: { x: elbowX, y1: from.y, y2: to.y },
    }
  }
  const out = from.x + 8
  const back = to.x - 8
  const gap = from.y + (to.y > from.y ? ROW_HEIGHT / 2 : -ROW_HEIGHT / 2)
  return {
    d: `M ${from.x} ${from.y} H ${out} V ${gap} H ${back} V ${to.y} H ${to.x}`,
    elbow: { x: out, y1: from.y, y2: gap },
  }
}
