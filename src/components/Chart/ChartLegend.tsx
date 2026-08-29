import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { monoScales, placeholder, type ChartMonoScale } from './palette'
import { resolveSeries, useChart, type ChartSeries } from './context'
import { ChartSwatch, type ChartSwatchShape } from './Swatch'

/**
 * ChartLegend — the dependable identity channel.
 *
 * Figma's `Chart Legend` (`40004318:14644`), four types. **A legend is present
 * by default on every chart**, and that is not a preference: it is the only
 * thing standing between a reader and having to match hues by eye.
 *
 * **It does not depend on the series count, and it does not depend on how much
 * data there is.** Both exceptions are tempting and both are wrong. A
 * single-series chart still gets one, because the swatch is what says *which*
 * color means the thing the title names — and in grayscale, or for a reader who
 * cannot separate two hues, that mapping is the only thing carrying it. A chart
 * narrowed to a single data point still gets one, because a series with one
 * reading is still a series, and a chart that shed its key exactly when a filter
 * narrowed it would be at its least readable at the moment it changed.
 *
 * `legend={false}` on a chart remains available for the case where something
 * else already names the series — a caption, a heading, a surrounding table.
 *
 * ## Four types, two jobs
 *
 * `horizontal` and `vertical` are the **categorical** legend: one row per
 * series, each a swatch and a name. Horizontal centers above the plot and wraps;
 * vertical stacks beside it, which is what a donut or a long series list wants.
 *
 * `stepped` and `gradient` are the **continuous** legend, for a magnitude scale
 * — a heat map's cells, a choropleth. They label the two ends of one of the
 * sequential ramps rather than naming anything, because a continuous scale has
 * no categories to name. `stepped` shows the ten discrete steps a chart actually
 * paints with; `gradient` shows them blended, for a scale that is genuinely
 * continuous. Use the one that matches how the marks are colored — a stepped
 * chart under a gradient key tells the reader they can read a value between two
 * steps, and they cannot.
 *
 * ## The labels never wear the series color
 *
 * Text stays in `content-subtle` throughout, and identity comes from the
 * colored swatch *beside* it. Coloring the text instead is the common version
 * of this component and it fails twice: several of the categorical hues are
 * illegible as 14px text on the canvas — yellow at 1.74:1 is the worst — and it
 * removes the one channel a reader with low color vision was relying on.
 *
 * ## Interactive when, and only when, the chart says so
 *
 * Figma models a clickable legend as a separate `Chart Legend Buttons` property
 * and puts it on Donut, Gauge and Radar — the charts where series overlap and
 * switching one off is how you read the others.
 *
 * A row becomes a real `<button>` only when the chart passed
 * `interactiveLegend` to `ChartContainer`, which the legend detects by the
 * presence of `toggleSeries` in context. That is deliberate: a legend that looks
 * clickable and is not is worse than a plain one, and deriving the affordance
 * from the capability means the two cannot disagree.
 *
 * A switched-off series keeps its row — you have to be able to click it back —
 * and drops to the placeholder gray with its label struck through. Two channels,
 * because the gray alone is a color difference and this is a state a reader has
 * to be sure about.
 *
 * The state is `aria-pressed`, not `aria-hidden` or a disabled attribute: the
 * button is a toggle that is still very much available, and pressed/unpressed is
 * exactly what a screen reader should hear.
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
   * scale: past twelve series there is no color left to give, so the answer is
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
function LegendItem({
  shape,
  color,
  label,
  hidden = false,
  onToggle,
}: {
  shape: ChartSwatchShape
  color: string
  label: ReactNode
  hidden?: boolean
  onToggle?: () => void
}) {
  const content = (
    <>
      <ChartSwatch shape={shape} color={hidden ? placeholder : color} />
      <span className={cn('text-content-subtle text-base', hidden && 'line-through')}>{label}</span>
    </>
  )

  if (!onToggle) return <li className="flex items-center gap-1">{content}</li>

  return (
    <li className="flex">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={!hidden}
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded-xs',
          // The swatch and label already carry the state; the hover is only
          // saying "this is a control".
          'hover:opacity-80',
          focusRing,
        )}
      >
        {content}
      </button>
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
  // A legend given its series explicitly is standing outside a chart, so there
  // is nothing for it to toggle.
  const toggle = seriesProp ? undefined : chart?.toggleSeries
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
        <LegendItem
          key={s.key}
          shape={s.swatchShape}
          color={s.color}
          label={s.label}
          hidden={chart?.hidden.has(s.key) ?? false}
          onToggle={toggle ? () => toggle(s.key) : undefined}
        />
      ))}
      {hidden > 0 ? <li className="text-content-subtle text-base">+{hidden} more</li> : null}
    </ul>
  )
}

ChartLegend.displayName = 'Chart.Legend'
