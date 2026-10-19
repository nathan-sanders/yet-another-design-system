import { useEffect, type ReactNode } from 'react'
import { useActiveTooltipDataPoints, useIsTooltipActive } from 'recharts'

import { useChart } from './context'
import type { ChartSeries } from './context'

/**
 * Clicking one mark — a day on a line, a slice, a bar.
 *
 * A chart that takes a click is three ways in, and every chart here wires all
 * three the same way, because each one serves someone the others do not:
 *
 * 1. **The pointer, on the mark.** Recharts' own `onClick` on the `Pie`, the
 *    `Bar`, or — for a line or an area, whose marks are too thin to aim at — the
 *    chart, where it lands on whichever x the tooltip is showing. That is the
 *    rule the tooltip already taught: hover anywhere in a day's column and the
 *    tooltip is about that day, so a click there is about that day too.
 * 2. **The keyboard, on the plot.** Recharts' `accessibilityLayer` already makes
 *    the plot a tab stop and walks the points with the arrow keys, moving the
 *    tooltip as it goes. **Enter or Space opens the point the tooltip is on.**
 *    `ChartActiveRow` keeps that row where the container's key handler can read
 *    it. Recharts' own Enter only toggles the tooltip, so the container takes the
 *    key in the capture phase when a click handler is set and Recharts never
 *    sees it.
 * 3. **A screen reader, in the hidden table.** The plot sits inside `role="img"`,
 *    which hides it from assistive technology entirely, so (2) does nothing for a
 *    screen reader. The hidden data table does: each row's header becomes a
 *    button named after the row, which opens the same thing. Those buttons are
 *    `tabIndex={-1}` on purpose — the table is visually hidden, and a tab stop
 *    nobody can see is a focus ring lost off screen. Browse mode reaches them
 *    without the tab order; a sighted keyboard user has (2).
 *
 * The handler gets an `index` into **the caller's `data`**, never into the rows
 * Recharts was handed. A donut drops slices switched off in its legend before
 * Recharts sees them, so the index Recharts reports is the wrong row as soon as
 * one is hidden.
 */

/** What a point, bar or day click hands back. */
export interface ChartPointClick {
  /** The row from the caller's `data`, as given. */
  row: Record<string, unknown>
  /** Its index in the caller's `data`. */
  index: number
  /**
   * The series the click landed on. Always set for a pointer click on a bar, a
   * line's dot or an area. From the keyboard, the hidden table, or a click on
   * empty space in a day's column, only a chart drawing **one** visible series
   * can say which one was meant, so a chart given several leaves it unset and
   * the row stands for every series in it. The caller's own object, from the
   * `series` it passed.
   */
  series?: ChartSeries
}

/** What a slice click hands back. A slice *is* its row, so there is no series. */
export interface ChartSliceClick {
  row: Record<string, unknown>
  index: number
  /** The slice's name — `row[nameKey]`, as a string. */
  name: string
}

/**
 * Reports the row the tooltip is on to the container.
 *
 * Rendered **inside** the Recharts chart, because the hooks that know the active
 * point only work there. It draws nothing.
 */
export function ChartActiveRow() {
  const report = useChart()?.reportActiveRow
  const active = useIsTooltipActive()
  const points = useActiveTooltipDataPoints()
  const row = active ? (points?.[0] as Record<string, unknown> | undefined) : undefined

  useEffect(() => {
    report?.(row)
  }, [report, row])

  return null
}

ChartActiveRow.displayName = 'Chart.ActiveRow'

/**
 * Find a row Recharts handed back in the caller's data.
 *
 * By identity first — Recharts passes the original object through — and by
 * `key` as the fallback, for the pie, which can hand back a copy.
 */
export function indexOfRow(
  data: readonly Record<string, unknown>[],
  row: Record<string, unknown> | undefined,
  key: string,
): number {
  if (!row) return -1
  const same = data.indexOf(row)
  if (same >= 0) return same
  return data.findIndex((candidate) => String(candidate[key]) === String(row[key]))
}

/**
 * The hidden table's row header, as a button when the chart takes a click.
 *
 * Unstyled — it is never seen — and out of the tab order; see the note above.
 */
export function ChartRowHeader({ children, onActivate }: { children: ReactNode; onActivate?: () => void }) {
  return (
    <th scope="row">
      {onActivate ? (
        <button type="button" tabIndex={-1} onClick={onActivate}>
          {children}
        </button>
      ) : (
        children
      )}
    </th>
  )
}

ChartRowHeader.displayName = 'Chart.RowHeader'

/**
 * The cursor a clickable chart shows, as classes for `ChartContainer`'s
 * `className`. On the marks for a pie and a bar; over the whole plot for a line
 * or an area, because a click anywhere in a day's column is a click on that day.
 */
export const clickableCursor = {
  slice: '[&_.recharts-pie-sector]:cursor-pointer',
  bar: '[&_.recharts-bar-rectangle]:cursor-pointer',
  plot: '[&_.recharts-surface]:cursor-pointer',
} as const
