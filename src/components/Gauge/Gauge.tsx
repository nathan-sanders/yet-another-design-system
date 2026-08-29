import { useMemo, type ReactNode } from 'react'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  GAUGE_END_ANGLE,
  GAUGE_INNER_RATIO,
  GAUGE_START_ANGLE,
  SLICE_GAP,
  formatFullNumber,
  gaugeGeometry,
  surface,
  useChart,
  useVisibleSeries,
} from '../Chart'
import { activeSliceShape } from '../Donut'

/**
 * Gauge — the same parts-of-a-whole, folded into a half circle.
 *
 * Figma's `Gauge` (`40004343:23422`), section `40004343:23420`. It is a donut
 * swept 180° instead of 360°, and the reason it exists as its own component
 * rather than a `Donut` prop is what that fold does to the layout: the hole
 * stops being a hole and becomes a **shelf**, which is where the figure sits.
 * A donut's center content is centered; a gauge's sits under the arch. Those are
 * different components pretending to be one prop.
 *
 * ## The ring is thinner than a donut's, on purpose
 *
 * 80% inner radius against the donut's 72% — Figma's numbers. The same band
 * stretched over half the sweep reads much heavier, so a gauge at the donut's
 * ratio looks like an arch rather than a gauge, and it crowds the figure
 * underneath.
 *
 * ## What a gauge is for
 *
 * Progress toward one thing: a budget spent, a quota filled, a score out of a
 * maximum. It is the weakest of the three polar charts at comparison — half a
 * circle gives every slice less arc than a donut would — so reach for it when
 * the story is "how far along", and for `Donut` when it is "of what".
 */

export interface GaugeProps {
  /** One row per slice. */
  data: readonly Record<string, unknown>[]
  nameKey: string
  valueKey: string
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  /** The figure under the arch — Figma's `Metric Total`. */
  center?: ReactNode
  legend?: 'horizontal' | 'vertical' | false
  interactiveLegend?: boolean
  className?: string
}

function GaugePlot({
  data,
  nameKey,
  valueKey,
  height,
}: {
  data: readonly Record<string, unknown>[]
  nameKey: string
  valueKey: string
  height: number
}) {
  const visible = useVisibleSeries()
  const plotWidth = useChart()?.plotWidth ?? 0

  /**
   * Two things Recharts gets wrong for a half circle, both in `gaugeGeometry`:
   * it sizes a pie from `min(width, height) / 2`, which leaves a gauge at half
   * the size it should be, and it has no reason to keep the arc clear of the
   * box edges — so the apex was clipped flat and the hover halo had nowhere to
   * go.
   */
  const { cy, outerRadius } = gaugeGeometry(plotWidth, height)

  // Keep only the rows whose slice is still switched on, in the caller's order
  // so the arc does not re-sort itself as slices are toggled.
  const rows = useMemo(() => {
    const keys = new Set(visible.map((s) => s.key))
    return data.filter((row) => keys.has(String(row[nameKey])))
  }, [data, nameKey, visible])

  const colorFor = (name: string) => visible.find((s) => s.key === name)?.color ?? surface

  return (
    <PieChart accessibilityLayer>
      <Tooltip
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ChartTooltip />}
      />
      <Pie
        data={rows as Record<string, unknown>[]}
        dataKey={valueKey}
        nameKey={nameKey}
        // The arc occupies the top half, so its center belongs at the bottom of
        // the box rather than the middle — otherwise half the plot area is empty
        // space under a small arch.
        cx="50%"
        // Just above the bottom edge, not on it: the arc's flat ends are radial,
        // so their separator stroke straddles the baseline and half of it would
        // fall outside the box.
        cy={outerRadius > 0 ? cy : '100%'}
        innerRadius={outerRadius > 0 ? outerRadius * GAUGE_INNER_RATIO : `${GAUGE_INNER_RATIO * 90}%`}
        outerRadius={outerRadius > 0 ? outerRadius : '90%'}
        startAngle={GAUGE_START_ANGLE}
        endAngle={GAUGE_END_ANGLE}
        stroke={surface}
        strokeWidth={SLICE_GAP}
        isAnimationActive={false}
        activeShape={activeSliceShape}
      >
        {rows.map((row) => (
          <Cell key={String(row[nameKey])} fill={colorFor(String(row[nameKey]))} />
        ))}
      </Pie>
    </PieChart>
  )
}

export function Gauge({
  data,
  nameKey,
  valueKey,
  label,
  height = 200,
  center,
  legend = 'horizontal',
  interactiveLegend = false,
  className,
}: GaugeProps) {
  const series = useMemo(
    () => data.map((row) => ({ key: String(row[nameKey]), label: String(row[nameKey]) })),
    [data, nameKey],
  )

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
      overlay={
        center ? (
          // Under the arch rather than centered: the arc's own center is at the
          // bottom edge, so the free space is the lower half of the box.
          // The shelf under the arch: the arc's center is the bottom edge, so
          // the clear space is a semicircle of the inner radius — four fifths of
          // the box height once the gauge is sized to fill it.
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-4/5 items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-center">{center}</div>
          </div>
        ) : undefined
      }
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <GaugePlot data={data} nameKey={nameKey} valueKey={valueKey} height={height} />
    </ChartContainer>
  )
}

Gauge.displayName = 'Gauge'
