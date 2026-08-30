import { useMemo, type ReactNode } from 'react'
import { Cell, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart, Tooltip } from 'recharts'

import { cn } from '../../lib/cn'
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  RADIAL_CORNER_RADIUS,
  RADIAL_END_ANGLE,
  RADIAL_START_ANGLE,
  chartTooltipWrapperStyle,
  formatFullNumber,
  placeholder,
  radialGeometry,
  surface,
  useChart,
  useVisibleSeries,
} from '../Chart'

/**
 * Radial — how much, per category, against a common scale.
 *
 * Figma's `Radial` section (`40004355:41100`), on `_Radial / Slice Sweep`
 * (`40004355:41215`) and `_Radial / Radial` (`40004355:41236`).
 *
 * ## Its data is shaped like a Donut's, not like a bar chart's
 *
 * One row per **ring** — the row *is* the category — so it takes `nameKey` and
 * `valueKey` rather than a `series` array, exactly as `Donut` and `Gauge` do.
 * Everything downstream then works unchanged: the fixed twelve-color order, the
 * legend's `+N more` overflow and the interactive toggle are all series
 * machinery, and a ring is a series with one value.
 *
 * ## The track is not decoration
 *
 * Every ring is drawn over a full-sweep band in the placeholder gray, which is
 * what `_Radial / Radial` is. It is the one thing that makes the form readable:
 * **a radial bar's length is an angle, and an angle at a small radius covers
 * less ink than the same angle further out.** Without a track showing each
 * ring's full extent, an inner ring reads as smaller than an outer ring holding
 * the same value. It is also why the placeholder gray is right here and is not
 * an identity — it is the *absence* of value, drawn.
 *
 * ## Where it stops working, and what to reach for instead
 *
 * A reader compares arc lengths at different radii, which is harder than
 * comparing bar lengths on a shared baseline. Use it when the shape — a few
 * values against a common ceiling — is the point, and `VerticalBar` when the
 * exact comparison is. Past about eight rings the bands are too thin to carry a
 * color and the whole thing becomes a target.
 */

export interface RadialProps {
  /** One row per ring. */
  data: readonly Record<string, unknown>[]
  /** The property holding each ring's name. */
  nameKey: string
  /** The property holding each ring's value. */
  valueKey: string
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  /**
   * The top of the angular scale — a full sweep.
   *
   * The one prop `Donut` and `Gauge` do not need. Those two are *parts of a
   * whole*, so their own sum is the domain; a radial bar's rings are independent
   * values measured against a shared ceiling, and a chart of percentages wants
   * `100` whatever its largest value happens to be. Defaults to the largest
   * value present, which is what the track behind each bar then means.
   */
  max?: number
  /**
   * Content for the hole — usually a total or the headline figure. A slot rather
   * than a label/value pair, because what belongs there is a metric and metrics
   * are their own component.
   */
  center?: ReactNode
  /**
   * What the number is, named once for the tooltip's row.
   *
   * **Recharts' `RadialBar` has no `nameKey`** — its own source says so — so a
   * row's name is either a constant or the raw data key, and "complete" is not
   * a label anyone chose. `HeatMap` needed the same prop for the same reason.
   * Defaults to `valueKey`.
   */
  valueLabel?: string
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch rings off by clicking the legend. */
  interactiveLegend?: boolean
  className?: string
}

function RadialPlot({
  data,
  nameKey,
  valueKey,
  height,
  max,
  valueLabel,
}: {
  data: readonly Record<string, unknown>[]
  nameKey: string
  valueKey: string
  height: number
  max: number
  valueLabel: string
}) {
  const visible = useVisibleSeries()
  const plotWidth = useChart()?.plotWidth ?? 0

  // Keep the caller's order, so the rings do not re-sort themselves as one is
  // switched off in the legend.
  const rows = useMemo(() => {
    const keys = new Set(visible.map((s) => s.key))
    return data.filter((row) => keys.has(String(row[nameKey])))
  }, [data, nameKey, visible])

  // The geometry depends on how many rings are actually drawn, so hiding one
  // makes the rest thicker rather than leaving a gap where it was.
  const geometry = radialGeometry(plotWidth, height, rows.length)

  const colorFor = (name: string) => visible.find((s) => s.key === name)?.color ?? surface

  // Recharts stacks the first row innermost. The legend and the tooltip read
  // top-down, so the first series should be the *outermost* ring — reversing
  // here is what makes the chart agree with its own key.
  const plotted = useMemo(() => [...rows].reverse(), [rows])

  return (
    <RadialBarChart
      data={plotted as Record<string, unknown>[]}
      accessibilityLayer
      startAngle={RADIAL_START_ANGLE}
      endAngle={RADIAL_END_ANGLE}
      innerRadius={geometry.barSize > 0 ? geometry.innerRadius : '25%'}
      outerRadius={geometry.barSize > 0 ? geometry.outerRadius : '100%'}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {/*
        Without a value axis the bars do not map to a scale at all — Recharts
        falls back to its own domain and every ring comes out full. `tick` and
        `axisLine` are off because the scale is stated by the track behind each
        bar, not by a ring of numbers over the data.
      */}
      <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />

      {/*
        The category axis, and it is here for the tooltip rather than for the
        geometry. Without it the hovered ring has no name — Recharts labels the
        card with the row's *index*, so every tooltip was headed "0", "1", "2" —
        and the rings are addressed by position rather than by what they are.
      */}
      <PolarRadiusAxis type="category" dataKey={nameKey} tick={false} axisLine={false} />

      <Tooltip
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ChartTooltip />}
      />

      <RadialBar
        dataKey={valueKey}
        name={valueLabel}
        // Figma's full-sweep track. See the note above: this is what stops an
        // inner ring reading as smaller than an outer one at the same value.
        background={{ fill: placeholder }}
        cornerRadius={RADIAL_CORNER_RADIUS}
        barSize={geometry.barSize > 0 ? geometry.barSize : undefined}
        isAnimationActive={false}
      >
        {plotted.map((row) => (
          <Cell key={String(row[nameKey])} fill={colorFor(String(row[nameKey]))} />
        ))}
      </RadialBar>
    </RadialBarChart>
  )
}

export function Radial({
  data,
  nameKey,
  valueKey,
  label,
  height = 280,
  max,
  center,
  valueLabel,
  legend = 'horizontal',
  interactiveLegend = false,
  className,
}: RadialProps) {
  // A ring is a series with one value, so the whole series machinery — color
  // order, overflow, toggling — applies unchanged.
  const series = useMemo(
    () => data.map((row) => ({ key: String(row[nameKey]), label: String(row[nameKey]) })),
    [data, nameKey],
  )

  const domainMax = useMemo(() => {
    if (max !== undefined) return max
    const values = data.map((row) => (typeof row[valueKey] === 'number' ? (row[valueKey] as number) : 0))
    // A zero domain would divide by zero in the angle scale; one ring of nothing
    // is better than a chart of NaN.
    return Math.max(1, ...values)
  }, [data, valueKey, max])

  const table = (
    <table className="sr-only">
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">{nameKey}</th>
          <th scope="col">{valueKey}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={String(row[nameKey])}>
            <th scope="row">{String(row[nameKey])}</th>
            <td>
              {typeof row[valueKey] === 'number' ? formatFullNumber(row[valueKey] as number) : String(row[valueKey])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <ChartContainer
      series={series}
      data={data}
      xKey={nameKey}
      label={label}
      height={height}
      className={className}
      swatch="colorSwatch"
      interactiveLegend={interactiveLegend}
      table={table}
      overlay={center ? <RadialCenter>{center}</RadialCenter> : undefined}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <RadialPlot
        data={data}
        nameKey={nameKey}
        valueKey={valueKey}
        height={height}
        max={domainMax}
        valueLabel={valueLabel ?? valueKey}
      />
    </ChartContainer>
  )
}

Radial.displayName = 'Radial'

/**
 * The hole's contents.
 *
 * A sibling absolutely positioned over the plot rather than SVG text, for the
 * reason `ChartContainer`'s `overlay` exists: `role="img"` makes its own subtree
 * opaque to assistive technology, so a figure placed inside the plot would be a
 * number nobody could reach. `pointer-events-none` keeps it from stealing hover
 * from the rings underneath.
 */
export function RadialCenter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-1 text-center">{children}</div>
    </div>
  )
}

RadialCenter.displayName = 'Radial.Center'

Radial.Center = RadialCenter
