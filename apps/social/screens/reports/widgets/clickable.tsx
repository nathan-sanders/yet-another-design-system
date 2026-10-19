import type { MouseEvent, ReactNode } from 'react'

import { ClickableCard } from '../../../../../src/components/Card'
import { Metric, type MetricProps } from '../../../../../src/components/Metric'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import { clickableRows } from '../../../components/clickableRows'

// What makes a thing inside a report widget open its mentions, the way every
// count on Discover does. One hover color for all of it, Discover's: Surface /
// Background Subtle — a ghost `ClickableCard`'s, and a `hasHover` table row's
// (FINDINGS 83).

/**
 * The button in a row's first cell: the keyboard and screen-reader path to
 * the row's mentions. A pointer can press anywhere on the row (`forwardRow`).
 */
export function RowButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      data-row-button
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn('flex w-full min-w-0 items-center gap-3 rounded-xs text-left', focusRing)}
    >
      {children}
    </button>
  )
}

/**
 * A press anywhere on a row but its own controls goes to its `RowButton` —
 * Discover's Creators table, and the Reports list before it (FINDINGS 48).
 */
function forwardRow(event: MouseEvent) {
  const target = event.target as HTMLElement
  const button = target.closest('tbody tr')?.querySelector<HTMLElement>('[data-row-button]')
  if (!button || target.closest('a, button')) return
  button.click()
}

/**
 * Around a table whose rows open mentions. `data-opens-mentions` tells the
 * board's widget not to open its detail page as well (`WidgetBlock`).
 */
export function MentionRows({ children }: { children: ReactNode }) {
  return (
    <div data-opens-mentions onClick={forwardRow} className={clickableRows}>
      {children}
    </div>
  )
}

/**
 * A metric you press to see the mentions behind it: `MetricCard`'s number on
 * a `ClickableCard`, so it hovers to the same fill as every other clickable
 * thing, and stays filled with an emphasized edge while its list is open.
 */
export function ClickableMetric({
  selected,
  onClick,
  ...metric
}: MetricProps & { selected: boolean; onClick: () => void }) {
  return (
    <ClickableCard
      selected={selected}
      onClick={onClick}
      padding={3}
      data-opens-mentions
      className="h-full text-left"
    >
      <Metric {...metric} />
    </ClickableCard>
  )
}
