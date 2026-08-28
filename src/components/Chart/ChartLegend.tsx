import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { monoScales, type ChartMonoScale } from './palette'
import { resolveSeries, useChart, type ChartSeries } from './context'
import { ChartSwatch, type ChartSwatchShape } from './Swatch'

/**
 * ChartLegend — the dependable identity channel.
 *
 * Figma's `Chart Legend` (`40004318:14644`), four types. **A legend is present
 * whenever a chart has two or more series**, and that is not a preference: it is
 * the only thing standing between a reader and having to match hues by eye. A
 * single-series chart gets none — there is one colour, and the block's title
 * already says what it is; a box with one swatch restates the title and spends
 * space saying nothing.
 *
 * ## Four types, two jobs
 *
 * `horizontal` and `vertical` are the **categorical** legend: one row per
 * series, each a swatch and a name. Horizontal centres above the plot and wraps;
 * vertical stacks beside it, which is what a donut or a long series list wants.
 *
 * `stepped` and `gradient` are the **continuous** legend, for a magnitude scale
 * — a heat map's cells, a choropleth. They label the two ends of one of the
 * sequential ramps rather than naming anything, because a continuous scale has
 * no categories to name. `stepped` shows the ten discrete steps a chart actually
 * paints with; `gradient` shows them blended, for a scale that is genuinely
 * continuous. Use the one that matches how the marks are coloured — a stepped
 * chart under a gradient key tells the reader they can read a value between two
 * steps, and they cannot.
 *
 * ## The labels never wear the series colour
 *
 * Text stays in `content-subtle` throughout, and identity comes from the
 * coloured swatch *beside* it. Colouring the text instead is the common version
 * of this component and it fails twice: several of the categorical hues are
 * illegible as 14px text on the canvas — yellow at 1.74:1 is the worst — and it
 * removes the one channel a reader with low colour vision was relying on.
 *
 * ## Not interactive yet, on purpose
 *
 * Figma models a clickable legend as a separate `Chart Legend Buttons` property,
 * and it appears on Donut, Gauge and Radar — not on Line Series. So this is
 * presentational, and toggling arrives with the components that ask for it.
 */

export type ChartLegendType = 'horizontal' | 'vertical' | 'stepped' | 'gradient'

export interface ChartLegendProps {
  /** Which of Figma's four types to draw. */
  type?: ChartLegendType
  /**
   * The series to name, when the legend is not inside its chart's container.
   *
   * A legend normally reads them from context, which is what lets it sit in a
   * `ChartContainer`'s header with no props. Pass them explicitly when the
   * legend lives somewhere the context does not reach — a separate grid cell
   * beside a donut, or a story showing the legend on its own.
   */
  series?: readonly ChartSeries[]
  /**
   * How many series to name before collapsing the rest into "+N more". Figma's
   * legend carries the same row, and it is the honest end of a categorical
   * scale: past twelve series there is no colour left to give, so the answer is
   * to stop naming them rather than to repeat a hue.
   */
  max?: number
  /** Which sequential ramp a `stepped` or `gradient` legend draws. */
  scale?: ChartMonoScale
  /** The low end of a continuous scale. */
  startLabel?: ReactNode
  /** The high end of a continuous scale. */
  endLabel?: ReactNode
  className?: string
}

/** One swatch and one name. Figma's `_Swatch Label`. */
function LegendItem({ shape, color, label }: { shape: ChartSwatchShape; color: string; label: ReactNode }) {
  return (
    <li className="flex items-center gap-1">
      <ChartSwatch shape={shape} color={color} />
      <span className="text-content-subtle text-base">{label}</span>
    </li>
  )
}

export function ChartLegend({
  type = 'horizontal',
  series: seriesProp,
  max = 10,
  scale = 'a',
  startLabel,
  endLabel,
  className,
}: ChartLegendProps) {
  const chart = useChart()

  if (type === 'stepped' || type === 'gradient') {
    const steps = monoScales[scale]

    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {startLabel ? <span className="text-content-subtle text-base">{startLabel}</span> : null}

        {type === 'stepped' ? (
          // Ten blocks, flush. The scale is discrete, so the key is discrete —
          // and a gap between them would read as ten categories rather than one
          // ramp.
          <div className="flex h-4 w-52 overflow-hidden rounded-xs" aria-hidden="true">
            {steps.map((step) => (
              <span key={step} className="h-full flex-1" style={{ background: step }} />
            ))}
          </div>
        ) : (
          <div
            className="h-4 w-52 rounded-xs"
            aria-hidden="true"
            // Blended across the same ten stops the stepped key shows, rather
            // than a two-stop fade between the ends: the ramp is not linear in
            // lightness, and a straight interpolation would drift off it.
            style={{ background: `linear-gradient(to right, ${steps.join(', ')})` }}
          />
        )}

        {endLabel ? <span className="text-content-subtle text-base">{endLabel}</span> : null}
      </div>
    )
  }

  const series = seriesProp ? resolveSeries(seriesProp) : (chart?.series ?? [])
  const shown = series.slice(0, max)
  const hidden = series.length - shown.length

  return (
    <ul
      className={cn(
        'flex list-none',
        type === 'vertical'
          ? 'flex-col items-start gap-1'
          : 'flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1',
        className,
      )}
    >
      {shown.map((s) => (
        <LegendItem key={s.key} shape={s.swatchShape} color={s.color} label={s.label} />
      ))}
      {hidden > 0 ? <li className="text-content-subtle text-base">+{hidden} more</li> : null}
    </ul>
  )
}

ChartLegend.displayName = 'Chart.Legend'
