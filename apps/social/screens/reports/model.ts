import type { Board } from '../../../../src/components/DragAndDrop'
import type { GroupBy, WidgetViz } from '../../data/types'

/** The charts default to UTC; a report's days and hours are the reader's (FINDINGS 31). */
export const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// ---------------------------------------------------------------------------
// The board's spare row
// ---------------------------------------------------------------------------

let spareCount = 0

/**
 * Keeps one empty row at the foot of a board. It is the file's dashed "Add
 * widget" zone, and a drop target too: `DragAndDrop`'s board only moves a
 * block into a row that exists, so without it two widgets sharing a row could
 * never be taken apart again. Carry one into the spare row and it has a row of
 * its own; a new spare appears under it.
 */
export function withSpareRow(board: Board): Board {
  const last = board.order[board.order.length - 1]
  if (last !== undefined && board.containers[last]?.length === 0) return board
  spareCount += 1
  const id = `spare-${spareCount}`
  return {
    ...board,
    containers: { ...board.containers, [id]: [] },
    order: [...board.order, id],
  }
}

// ---------------------------------------------------------------------------
// Words and numbers
// ---------------------------------------------------------------------------

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** `48.2K`, `1.31M` — the file's capital K in a number that stands alone. */
export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value)
  }
  return compact.format(value)
}

/** `12.1K/hr`, the velocity column. */
export function formatVelocity(perHour: number): string {
  return `${formatCount(perHour)}/hr`
}

/** `+12%`, `−6%` with a real minus, as the file sets it. */
export function formatChange(percent: number, unit = '%'): string {
  if (percent === 0) return `0${unit}`
  return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}${unit}`
}

/** `Edited 4m ago` … `Edited yesterday` … `Edited 2d ago`. */
export function editedLabel(minutes: number): string {
  if (minutes < 60) return `Edited ${minutes}m ago`
  if (minutes < 60 * 24) return `Edited ${Math.round(minutes / 60)}h ago`
  if (minutes < 60 * 48) return 'Edited yesterday'
  return `Edited ${Math.round(minutes / (60 * 24))}d ago`
}

/** `3h ago`, `1d ago`. */
export function agoLabel(hours: number): string {
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}

export const peakDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
export const peakHour = new Intl.DateTimeFormat('en-US', { hour: 'numeric' })

export const GROUP_BY_LABEL: Record<GroupBy, string> = { hour: 'Hour', day: 'Day', week: 'Week' }

/** Whether a chart widget's viz draws time (a line or an area) or totals per series. */
export function isTimeViz(viz: WidgetViz): boolean {
  return viz === 'line' || viz === 'area'
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const reportsPath = '/measure/reports'
export const boardPath = (reportId: string) => `${reportsPath}/${reportId}`
export const widgetPath = (reportId: string, widgetId: string) =>
  `${boardPath(reportId)}/widgets/${widgetId}`
