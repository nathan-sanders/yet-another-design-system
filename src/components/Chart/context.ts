import { createContext, useContext } from 'react'

import { categorical, benchmark as benchmarkColor } from './palette'
import { markerForIndex, type ChartMarker } from './shapes'
import type { ChartSwatchShape } from './Swatch'

/**
 * **Which swatch a chart's legend uses is decided by what its marks are, not by
 * taste.** A line chart's key is a rule with the series' point shape sitting on
 * it, because that is literally what the reader will look for on the plot. A
 * chart made of *areas* — an area fill, a bar segment, a donut slice, a heat-map
 * cell — has no line and no point to echo, so its key is the plain color
 * square. Figma binds exactly this: `Area Series` and `Vertical Bar` both key
 * with `Style=Color Swatch`, while `Line Series` keys with the marker styles.
 *
 * A chart states it once by passing `swatch` to `ChartContainer`; every series
 * inherits it unless it names a marker of its own.
 */

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
   * Override the color. Almost never needed — the default is this series'
   * position in the categorical scale, which is what keeps two charts on the
   * same dashboard agreeing about which color "sessions" is.
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
   * takes the chromaless benchmark color instead of a categorical one and is
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
 * **Color is assigned from the index in this array, not from a running
 * counter over the visible ones.** Toggling a series off in the legend must
 * leave every other series the color it already had — a palette that
 * re-flows on filter repaints the survivors and silently invalidates what the
 * reader just learned. Benchmarks are skipped when counting, so adding a target
 * line does not shift every series' color by one.
 */
export function resolveSeries(
  series: readonly ChartSeries[],
  defaultSwatch?: ChartSwatchShape,
): ResolvedChartSeries[] {
  let categoricalIndex = 0

  return series.map((s) => {
    const index = s.benchmark ? -1 : categoricalIndex++
    const color = s.color ?? (s.benchmark ? benchmarkColor : categorical(index))
    // A chart whose marks are areas has no plot points to echo, so it has no
    // marker either — `defaultSwatch` is how it says so, and the two travel
    // together rather than being set independently and disagreeing.
    const marker = s.marker ?? (s.benchmark || defaultSwatch ? false : markerForIndex(index))
    const dashed = s.dashed ?? Boolean(s.benchmark)

    return {
      ...s,
      color,
      marker,
      dashed,
      swatchShape:
        marker !== false
          ? marker
          : dashed
            ? 'dashedLine'
            : (defaultSwatch ?? 'solidLine'),
    }
  })
}

export interface ChartContextValue {
  /**
   * Every series, including any currently hidden. The legend walks this, so a
   * hidden series still has a row to click to bring it back.
   */
  series: ResolvedChartSeries[]
  /**
   * The series a plot should actually draw.
   *
   * **Color is assigned before this filter, never after.** That is the whole
   * reason hiding a series is safe: `resolveSeries` numbers the full array, and
   * this is a filter over the result, so switching one series off leaves every
   * other one the color it already had. Assigning color to the visible list
   * instead would repaint the survivors every time the reader clicked — and
   * silently invalidate the legend they had just learned.
   */
  visibleSeries: ResolvedChartSeries[]
  /** Keys currently switched off in the legend. */
  hidden: ReadonlySet<string>
  /**
   * Toggle one series. Present only when the chart was given an interactive
   * legend — the legend uses its absence to decide whether to render rows or
   * buttons, so a static legend cannot accidentally look clickable.
   */
  toggleSeries?: (key: string) => void
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
  /**
   * The measured plot width in px, or 0 before the first measurement.
   *
   * Exposed because a **semicircle cannot size itself from Recharts' rules.**
   * Recharts derives a pie's radius from `min(width, height) / 2`, which is
   * right for a full circle and wrong for a gauge: a half circle needs `R`
   * vertically but `2R` horizontally, so the sensible radius is
   * `min(width / 2, height)` and Recharts has no way to know that. The
   * container is already measuring for the breakpoint, so the number is free.
   */
  plotWidth: number
}

export const ChartContext = createContext<ChartContextValue | null>(null)

export function useChart(): ChartContextValue | null {
  return useContext(ChartContext)
}

/**
 * A single stable empty array.
 *
 * `useChart()?.visibleSeries ?? []` looks harmless and is not: the literal is a
 * new array on every render, so any `useMemo` or effect depending on it never
 * hits its cache. Every chart derives something from the visible series, so this
 * would have been six quiet re-computations per render.
 */
const NO_SERIES: ResolvedChartSeries[] = []

/**
 * The series a plot should draw, with a stable identity when there is no chart
 * context. Use this rather than reading `visibleSeries` off `useChart()`.
 */
export function useVisibleSeries(): ResolvedChartSeries[] {
  return useContext(ChartContext)?.visibleSeries ?? NO_SERIES
}

/** Look one series up by the `dataKey` Recharts hands back in a payload entry. */
export function seriesByKey(
  series: readonly ResolvedChartSeries[],
  key: string | number | undefined,
): ResolvedChartSeries | undefined {
  return series.find((s) => s.key === key)
}
