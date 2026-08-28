import { createContext, useContext } from 'react'

import { categorical, benchmark as benchmarkColor } from './palette'
import { markerForIndex, type ChartMarker } from './shapes'
import type { ChartSwatchShape } from './Swatch'

/**
 * What a chart tells its legend and its tooltip.
 *
 * A legend row and a tooltip row both have to draw the same swatch as the mark
 * they stand for, and neither of them is given the chart's `series` array by
 * Recharts. Recharts' tooltip payload carries a `color`, but not the *shape* — a
 * plot point's marker is something we draw, so Recharts has no idea it exists.
 * Passing `series` down as a prop through Recharts' `content` and `legend` slots
 * is not possible either; those take elements, and Recharts clones them with its
 * own props.
 *
 * So the resolved series list travels by context, provided once by
 * `ChartContainer`. This is the same shape `AvatarGroup` uses for the one thing
 * a child cannot work out for itself.
 *
 * Deliberately not exported from the package.
 */

/** A series as the caller declares it. Everything but `key` and `label` has a default. */
export interface ChartSeries {
  /** The property to read from each row of `data`. */
  key: string
  /** The name a human reads, in the legend and the tooltip. */
  label: string
  /**
   * Override the colour. Almost never needed — the default is this series'
   * position in the categorical scale, which is what keeps two charts on the
   * same dashboard agreeing about which colour "sessions" is.
   */
  color?: string
  /**
   * The plot-point shape, or `false` for a line with no points. Defaults to this
   * series' position in the marker cycle.
   */
  marker?: ChartMarker | false
  /** Draw the line dashed. Conventionally a projection, or an incomplete period. */
  dashed?: boolean
  /**
   * Mark this as a reference line — a target, a prior period, an average. It
   * takes the chromaless benchmark colour instead of a categorical one and is
   * dashed by default, and it does **not** consume a categorical slot: a
   * benchmark is the thing the series are measured against, not one of them.
   */
  benchmark?: boolean
}

/** A series after defaults are filled in. What the legend and tooltip actually read. */
export interface ResolvedChartSeries extends ChartSeries {
  color: string
  marker: ChartMarker | false
  dashed: boolean
  /** The swatch that stands for this series: its marker, or a rule if it has none. */
  swatchShape: ChartSwatchShape
}

/**
 * Fill in every default.
 *
 * **Colour is assigned from the index in this array, not from a running
 * counter over the visible ones.** Toggling a series off in the legend must
 * leave every other series the colour it already had — a palette that
 * re-flows on filter repaints the survivors and silently invalidates what the
 * reader just learned. Benchmarks are skipped when counting, so adding a target
 * line does not shift every series' colour by one.
 */
export function resolveSeries(series: readonly ChartSeries[]): ResolvedChartSeries[] {
  let categoricalIndex = 0

  return series.map((s) => {
    const index = s.benchmark ? -1 : categoricalIndex++
    const color = s.color ?? (s.benchmark ? benchmarkColor : categorical(index))
    const marker = s.marker ?? (s.benchmark ? false : markerForIndex(index))
    const dashed = s.dashed ?? Boolean(s.benchmark)

    return {
      ...s,
      color,
      marker,
      dashed,
      swatchShape: marker === false ? (dashed ? 'dashedLine' : 'solidLine') : marker,
    }
  })
}

export interface ChartContextValue {
  series: ResolvedChartSeries[]
  /**
   * Whether the plot area has reached Figma's `Chart Breakpoint` (600px).
   *
   * It travels by context for the same reason `series` does — the chart element
   * is a child of the container that measures, and Recharts owns the props it is
   * cloned with. A chart reads it to decide how many x labels to draw.
   *
   * It is `true` before the first measurement lands rather than `false`: an
   * unmeasured chart renders once at its default, and starting narrow makes a
   * wide chart visibly drop most of its labels and put them back.
   */
  wide: boolean
}

export const ChartContext = createContext<ChartContextValue | null>(null)

export function useChart(): ChartContextValue | null {
  return useContext(ChartContext)
}

/** Look one series up by the `dataKey` Recharts hands back in a payload entry. */
export function seriesByKey(
  series: readonly ResolvedChartSeries[],
  key: string | number | undefined,
): ResolvedChartSeries | undefined {
  return series.find((s) => s.key === key)
}
