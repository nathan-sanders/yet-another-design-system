import type { KeyboardEvent, RefObject } from 'react'

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
 *    `ChartActiveRow` (in `ChartClickParts.tsx`) keeps that row where the container's key handler can read
 *    it. Recharts' own Enter only toggles the tooltip, so the container takes the
 *    key in the capture phase when a click handler is set and Recharts never
 *    sees it.
 * 3. **A screen reader, in the hidden table.** The plot sits inside `role="img"`,
 *    which hides it from assistive technology entirely, so (2) does nothing for a
 *    screen reader. The hidden data table does: each row's header becomes a
 *    button named after the row (`ChartRowHeader`), which opens the same thing. Those buttons are
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
 * Arrow keys across the marks, by pointing at them — for the two shapes where
 * Recharts' own arrows do nothing.
 *
 * Recharts' `accessibilityLayer` makes every chart focusable and shows the first
 * point's tooltip on focus. On a line, an area or a column chart the arrows then
 * step along the x axis, and that is left alone (`keyboard="axis"`). On two
 * shapes they do nothing at all, measured in Recharts 3.10:
 *
 * - **a pie** (`'slices'`) — its key handler steps through the tooltip axis's
 *   domain, and a pie has none, so every candidate index resolves to null;
 * - **a horizontal bar** (`'rows'`) — `layout="vertical"` leaves the same
 *   handler stuck on the first row.
 *
 * Its keyboard state cannot be set from outside. What *can* be driven is the
 * pointer, and Recharts ranks a pointer above its keyboard state anyway. So
 * each arrow moves a synthetic pointer to the next mark: for a slice, a
 * `mouseout` with the next slice as `relatedTarget`, which React turns into
 * leave-this, enter-that (a pie's tooltip is per slice, on enter); for a row, a
 * `mousemove` at the middle of the row's band, which is how Recharts finds the
 * row under a real pointer. The tooltip, the halo and the hover band follow the
 * keyboard exactly as they follow the mouse, and `ChartActiveRow` sees the mark
 * the way it sees a hovered one, so Enter opens it through the same path.
 *
 * Right and Down go forward, Left and Up back, Home and End to either end, and
 * it wraps. Returns whether it took the key.
 */
export type ChartWalk = 'slices' | 'rows'

const STEPS: Record<string, number | 'first' | 'last'> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  Home: 'first',
  End: 'last',
}

/**
 * One element per mark, in order: the sectors, or the category axis's labels.
 * The labels are one per row only because `categoryYAxisProps` sets
 * `interval: 0` — every row of a horizontal bar is labeled, which is that
 * chart's own rule.
 */
function marksOf(root: Element, walk: ChartWalk) {
  return root.querySelectorAll<SVGElement>(
    walk === 'slices' ? '.recharts-pie-sector' : '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-label',
  )
}

export function walkMarks(
  event: KeyboardEvent<HTMLElement>,
  walk: ChartWalk,
  current: RefObject<number>,
): boolean {
  const step = STEPS[event.key]
  if (step === undefined) return false

  const root = event.currentTarget
  const marks = marksOf(root, walk)
  if (marks.length === 0) return false
  event.preventDefault()
  event.stopPropagation()

  // Recharts' own focus shows the first mark, so the first arrow moves on from there.
  const from = current.current < 0 ? 0 : current.current
  const next =
    step === 'first' ? 0 : step === 'last' ? marks.length - 1 : (from + step + marks.length) % marks.length
  const target = marks[next]!

  if (walk === 'slices') {
    const previous = marks[current.current]
    if (previous) previous.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: target }))
    else target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  } else {
    const plot = root.querySelector('.recharts-cartesian-grid') ?? root
    const band = target.getBoundingClientRect()
    const area = plot.getBoundingClientRect()
    target.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: area.left + area.width / 2,
        clientY: band.top + band.height / 2,
      }),
    )
  }
  current.current = next
  return true
}

/** Take the synthetic pointer back off the plot, when focus leaves it. */
export function leaveMarks(root: HTMLElement, walk: ChartWalk, current: RefObject<number>) {
  if (current.current < 0) return
  const from = walk === 'slices' ? marksOf(root, walk)[current.current] : root.querySelector('.recharts-surface')
  from?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: null }))
  current.current = -1
}

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
