import { useEffect, type ReactNode } from 'react'
import { useActiveTooltipDataPoints, useIsTooltipActive } from 'recharts'

import { useChart } from './context'

/**
 * The two components a clickable chart renders. The mechanism, and why it is
 * three ways in, is in `clicks.ts`; these live apart from it only so each
 * module exports components or functions, never both (Fast Refresh).
 */

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
