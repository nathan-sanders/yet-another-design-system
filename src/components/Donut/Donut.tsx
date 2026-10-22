import { useMemo, type ReactNode } from 'react'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'

import { cn } from '../../lib/cn'
import {
  ChartActiveRow,
  ChartContainer,
  ChartRowHeader,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  DONUT_END_ANGLE,
  DONUT_INNER_RATIO,
  DONUT_START_ANGLE,
  SLICE_GAP,
  clickableCursor,
  donutRadius,
  formatFullNumber,
  indexOfRow,
  surface,
  useChart,
  useVisibleSeries,
  type ChartSliceClick,
} from '../Chart'
import { activeSliceShape } from './slices'

/**
 * Donut — parts of one whole.
 *
 * Figma's `Donut` (`40004333:11705`), section `40004333:11690`.
 *
 * ## The data is shaped the other way round, and that is the interesting part
 *
 * Every other chart in this library has one row per *x value* and one series per
 * column. A donut has one row per **slice** — the row *is* the category. So
 * `Donut` takes `nameKey` and `valueKey` instead of a `series` array, and builds
 * the series list from the rows themselves.
 *
 * Doing it that way rather than inventing a pie-shaped context means everything
 * downstream keeps working unchanged: the legend, the twelve-color order, the
 * `+N more` overflow and the interactive toggle are all series machinery, and a
 * slice is just a series with one value.
 *
 * The one thing it cannot reuse is the hidden data table, whose default shape is
 * rows × series. A pie's natural table is category and value, so this passes its
 * own through `ChartContainer`'s `table`.
 *
 * ## A hole, not a pie
 *
 * The inner radius is 72% of the outer — Figma's number, and not a style
 * choice. A thin band makes the eye compare arc *lengths*, which people are
 * tolerably good at; a full pie asks them to compare wedge *areas*, which they
 * are not. The hole is what makes the form defensible, and it is also where the
 * total goes.
 *
 * ## Hover is a halo, and does not resize the slice
 *
 * See `slices.tsx`. Growing the hovered slice — Recharts' own documented example
 * — makes pointing at a slice look like it changed its value, on a chart whose
 * whole encoding is size.
 *
 * ## When not to use it
 *
 * Past about six slices the small ones become unreadable arcs and the legend
 * does the work the chart was supposed to. Group the tail into "Other", or use
 * a bar chart, which stays readable at any count — `HorizontalBar` when the
 * slices have names, since it labels every row. Figma's own example uses six.
 */

export interface DonutProps {
  /** One row per slice. */
  data: readonly Record<string, unknown>[]
  /** The property holding each slice's name. */
  nameKey: string
  /** The property holding each slice's value. */
  valueKey: string
  /**
   * The property holding a slice's own color, for when the categories *are*
   * a scale with colors of their own — sentiment's positive, neutral and
   * negative (`sentiment` from `Chart`). Rows without it keep their
   * categorical color by position, so a partial map never repaints the rest.
   * The default is still the right answer almost always: two charts on one
   * dashboard agree about a category's color because neither overrides it.
   */
  colorKey?: string
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  /**
   * Content for the hole — Figma's `Metric Total`. Usually the sum and a label.
   * It is a slot rather than a prop pair because what belongs there is a metric,
   * and metrics are their own component.
   */
  center?: ReactNode
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch slices off by clicking the legend. */
  interactiveLegend?: boolean
  /**
   * Open one slice. Fires for a click on the slice, Enter or Space on the
   * focused chart with the tooltip on it, and the slice's button in the hidden
   * table — see `Chart/clicks.ts`. `index` is into `data`, so it stays right
   * when the legend has switched slices off.
   */
  onSliceClick?: (slice: ChartSliceClick) => void
  className?: string
}

function DonutPlot({
  data,
  nameKey,
  valueKey,
  height,
  onActivate,
}: {
  data: readonly Record<string, unknown>[]
  nameKey: string
  valueKey: string
  height: number
  onActivate?: (index: number) => void
}) {
  const visible = useVisibleSeries()
  const plotWidth = useChart()?.plotWidth ?? 0

  // Sized to leave the halo somewhere to go. At `100%` the ring reaches the edge
  // of the SVG and the hover halo — which is drawn *outside* it — is cut off top
  // and bottom. See `POLAR_MARGIN`.
  const outerRadius = donutRadius(plotWidth, height)

  // Keep only the rows whose slice is still switched on, and keep them in the
  // caller's order so the ring does not re-sort itself as slices are toggled.
  const rows = useMemo(() => {
    const keys = new Set(visible.map((s) => s.key))
    return data.filter((row) => keys.has(String(row[nameKey])))
  }, [data, nameKey, visible])

  const colorFor = (name: string) => visible.find((s) => s.key === name)?.color ?? surface

  return (
    <PieChart accessibilityLayer>
      {onActivate ? <ChartActiveRow /> : null}
      <Tooltip
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ChartTooltip />}
      />
      <Pie
        data={rows as Record<string, unknown>[]}
        dataKey={valueKey}
        nameKey={nameKey}
        innerRadius={outerRadius > 0 ? outerRadius * DONUT_INNER_RATIO : `${DONUT_INNER_RATIO * 90}%`}
        outerRadius={outerRadius > 0 ? outerRadius : '90%'}
        startAngle={DONUT_START_ANGLE}
        endAngle={DONUT_END_ANGLE}
        // The separator is surface-colored rather than a gap in the geometry,
        // exactly as Figma strokes it — the same "white does the separating"
        // move as the stacked bar and the solid area.
        stroke={surface}
        strokeWidth={SLICE_GAP}
        isAnimationActive={false}
        activeShape={activeSliceShape}
        // The row comes back on the sector's `payload`; it is matched in the
        // caller's `data` because `rows` has dropped any hidden slices.
        onClick={
          onActivate
            ? (sector: { payload?: Record<string, unknown> }) => {
                const index = indexOfRow(data, sector.payload, nameKey)
                if (index >= 0) onActivate(index)
              }
            : undefined
        }
      >
        {rows.map((row) => (
          <Cell key={String(row[nameKey])} fill={colorFor(String(row[nameKey]))} />
        ))}
      </Pie>
    </PieChart>
  )
}

export function Donut({
  data,
  nameKey,
  valueKey,
  colorKey,
  label,
  height = 280,
  center,
  legend = 'horizontal',
  interactiveLegend = false,
  onSliceClick,
  className,
}: DonutProps) {
  // A slice is a series with one value, so the whole series machinery — color
  // order, overflow, toggling — applies unchanged.
  const series = useMemo(
    () =>
      data.map((row) => {
        const color = colorKey ? row[colorKey] : undefined
        return {
          key: String(row[nameKey]),
          label: String(row[nameKey]),
          ...(typeof color === 'string' ? { color } : {}),
        }
      }),
    [data, nameKey, colorKey],
  )

  const activate = onSliceClick
    ? (index: number) => {
        const row = data[index]
        if (row) onSliceClick({ row, index, name: String(row[nameKey]) })
      }
    : undefined

  const table = (
    <table>
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">{nameKey}</th>
          <th scope="col">{valueKey}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={String(row[nameKey])}>
            <ChartRowHeader onActivate={activate ? () => activate(index) : undefined}>
              {String(row[nameKey])}
            </ChartRowHeader>
            <td>{typeof row[valueKey] === 'number' ? formatFullNumber(row[valueKey] as number) : String(row[valueKey])}</td>
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
      className={cn(activate && clickableCursor.slice, className)}
      swatch="colorSwatch"
      interactiveLegend={interactiveLegend}
      table={table}
      onRowActivate={activate}
      keyboard="slices"
      overlay={center ? <DonutCenter>{center}</DonutCenter> : undefined}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <DonutPlot data={data} nameKey={nameKey} valueKey={valueKey} height={height} onActivate={activate} />
    </ChartContainer>
  )
}

Donut.displayName = 'Donut'

/**
 * The hole's contents, centered over the ring.
 *
 * A sibling absolutely positioned over the plot rather than SVG text, so what
 * goes in the middle can be anything the library already has — a heading, a
 * `Badge`, a metric — instead of a second, worse text renderer. `pointer-events-none`
 * keeps it from stealing hover from the slices underneath.
 */
export function DonutCenter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-1 text-center">{children}</div>
    </div>
  )
}

DonutCenter.displayName = 'Donut.Center'

Donut.Center = DonutCenter
