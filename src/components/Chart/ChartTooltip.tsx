import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { formatFullNumber } from './axes'
import { resolveSeries, seriesByKey, useChart, type ChartSeries } from './context'
import { ChartSwatch } from './Swatch'

/**
 * ChartTooltip — the exact numbers, on hover.
 *
 * Figma's `Chart Tooltip` (`40004318:14625`): 208px wide, the primary surface
 * with a 1px border, `rounded-lg` and the medium drop shadow — the same card
 * recipe every popup in the library uses, so a tooltip over a chart looks like a
 * tooltip over anything else.
 *
 * It replaces Recharts' default entirely, through the `content` prop. That is
 * not cosmetic: the default renders its own inline-styled box, paints the
 * *label text* in the series colour — which several of the twelve hues cannot
 * carry legibly — and has no idea the library has tokens.
 *
 * ## Why a tooltip at all, rather than labelling the points
 *
 * A number beside every point is unreadable at thirty-one points times three
 * series, and it is the single most common way a good chart is ruined. The axis
 * carries the shape, direct labels carry the one or two values the story is
 * about, and the tooltip carries the rest on demand. That division is what lets
 * the plot stay quiet.
 *
 * ## The value column is mono, and the labels are not
 *
 * Values are `font-mono` with `tabular-nums` so a column of them aligns on the
 * decimal and the eye can compare down the list; names are the sans the rest of
 * the library uses. Figma binds exactly this pair — `text-sm/mono regular` for
 * values against `text-base/normal` for labels — and it is the reason the card
 * reads as a table rather than a paragraph.
 *
 * ## Rows are ordered by the series, not by value
 *
 * Sorting a tooltip by magnitude makes rows jump between positions as the
 * pointer moves, so the reader loses the row they were tracking. The order here
 * is the caller's `series` order — the same order as the legend — and it does
 * not move.
 */

/** One entry as Recharts hands it over. Typed narrowly: we read four fields and ignore the rest. */
export interface ChartTooltipPayloadEntry {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
}

export interface ChartTooltipProps {
  /** Recharts sets this. Nothing renders when the pointer is off the plot. */
  active?: boolean
  /** Recharts sets this — one entry per series at the hovered x. */
  payload?: ChartTooltipPayloadEntry[]
  /** Recharts sets this — the hovered x value. */
  label?: unknown
  /**
   * The series, when the tooltip is rendered outside its chart's container.
   * Normally it reads them from context; a story showing the card at rest does
   * not have one.
   */
  series?: readonly ChartSeries[]
  /** How the heading reads. Defaults to the raw x value. */
  formatLabel?: (label: unknown) => ReactNode
  /** How a value reads. Defaults to a thousands-separated integer. */
  formatValue?: (value: number | string | undefined) => ReactNode
  /**
   * Add a Total row under a rule. Right for a stacked chart, where the parts sum
   * to something meaningful — and wrong for a line chart, where summing three
   * unrelated series produces a number that means nothing.
   */
  showTotal?: boolean
  className?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
  series: seriesProp,
  formatLabel = (value) => String(value ?? ''),
  formatValue = (value) => (typeof value === 'number' ? formatFullNumber(value) : String(value ?? '')),
  showTotal = false,
  className,
}: ChartTooltipProps) {
  const chart = useChart()
  const contextSeries = seriesProp ? resolveSeries(seriesProp) : (chart?.series ?? [])

  if (!active || !payload?.length) return null

  // Walk the caller's series order and pick the matching payload entry, rather
  // than walking the payload — Recharts orders that by draw order, which is not
  // the legend's order once a series is hidden.
  const rows = contextSeries.flatMap((s) => {
    const entry = payload.find((p) => p.dataKey === s.key)
    return entry ? [{ series: s, value: entry.value }] : []
  })

  // Fall back to the payload when there is no context — a chart used bare, or a
  // series drawn outside the resolved list.
  const items = rows.length
    ? rows
    : payload.map((entry) => ({
        series: seriesByKey(contextSeries, entry.dataKey) ?? {
          key: String(entry.dataKey),
          label: String(entry.name ?? entry.dataKey),
          color: entry.color ?? 'currentColor',
          swatchShape: 'colorSwatch' as const,
        },
        value: entry.value,
      }))

  const total = items.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0)

  return (
    <div
      className={cn(
        'bg-surface-background-primary border-surface-border w-52 rounded-lg border shadow-medium',
        'flex flex-col gap-1 p-3',
        className,
      )}
    >
      <p className="text-content-emphasized text-base font-semibold">{formatLabel(label)}</p>

      <ul className="flex list-none flex-col">
        {items.map((item) => (
          <li key={item.series.key} className="flex items-center gap-1">
            <ChartSwatch shape={item.series.swatchShape} color={item.series.color} />
            <span className="text-content-subtle min-w-0 flex-1 truncate text-base">{item.series.label}</span>
            <span className="text-content-primary font-mono text-sm tabular-nums">{formatValue(item.value)}</span>
          </li>
        ))}
      </ul>

      {showTotal ? (
        <div className="border-surface-border flex items-center gap-1 border-t pt-1">
          <span className="text-content-emphasized flex-1 text-base font-semibold">Total</span>
          <span className="text-content-emphasized font-mono text-sm font-bold tabular-nums">
            {formatValue(total)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

ChartTooltip.displayName = 'Chart.Tooltip'
