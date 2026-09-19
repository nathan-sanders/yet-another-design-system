import { useMemo } from 'react'
import { CartesianGrid, ReferenceLine, Scatter as RechartsScatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  chartGridProps,
  cursorHighlight,
  formatFullNumber,
  markerShape,
  numericXAxisProps,
  seriesByKey,
  surface,
  axisLine,
  useChart,
  useVisibleSeries,
  yAxisProps,
  type ChartSeries,
  type ChartTooltipPayloadEntry,
  type ChartTooltipRow,
  type ResolvedChartSeries,
} from '../Chart'
import { niceMax } from '../Chart/axes'
import { describeQuadrant, quadrantOf, resolveThresholds, type QuadrantOptions } from './quadrant'

/**
 * Scatter — two measures against each other, one mark per observation.
 *
 * The only chart in the family with **no shared x**: a line, an area or a bar
 * has one row per x value with a column per series, and a scatter has a cloud
 * of `(x, y)` pairs per series with nothing lining them up. So the points live
 * on the series rather than in a shared `data` array — the same move `Donut`
 * makes when it says a slice is a series with one value.
 *
 * ## Built code-first, the Sankey way
 *
 * Figma's `Scatter` section was empty when this was written, so nothing here
 * was read off a node of its own. What *was* read is everything the chart
 * borrows: the plot point (8px square, 9px circle, 1.5px ring) from
 * `_Line Series / Plot Point`, the grid and axes from `_Chart Grid`, and the
 * crosshair and its end labels from `_Quadrant Grid` — a 1px
 * `Surface/Border Emphasized` line with a 12px mono label on a surface-colored
 * plate at each end. The drawing in the file was then transcribed from this
 * chart's rendered geometry, so the two cannot disagree; if they ever do, the
 * code is the older authority.
 *
 * ## Two forms, one prop
 *
 * A plain scatter reads values off the axes. A **quadrant** chart reads a
 * point's *box* — high impact and low effort, say — and needs no tick labels
 * at all, because a threshold is a line the reader compares against, not a
 * number they look up. So `quadrant` switches the grid and the tick labels off
 * and draws the crosshair with its four end labels instead. The axes are still
 * there underneath, scaling the points; only their chrome goes.
 *
 * ## The marks are the file's plot points, at full opacity
 *
 * An outline marker is filled with the surface color so it hides what is under
 * it — that is how the file draws a plot point on a line, and a scatter inherits
 * the rule rather than inventing a translucent one. Two channels already keep
 * overlapping series apart: color, and a marker cycle that puts a hollow shape
 * between every two solid ones. Radar and Sankey go translucent because their
 * *areas* cross; a point is small enough that a second marker beside it is
 * still a second marker.
 */

/** One observation. `label` names it in the tooltip's heading — a product, a region, a person. */
export interface ScatterPoint {
  x: number
  y: number
  label?: string
}

/** A series, and the cloud of points it owns. */
export interface ScatterSeries extends ChartSeries {
  points: readonly ScatterPoint[]
}

export interface ScatterProps {
  /** The series, in a fixed order — color and marker come from position here. */
  series: readonly ScatterSeries[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  /** What the x axis measures — a tooltip row, a table column, and the quadrant form's horizontal ends. */
  xLabel: string
  /** What the y axis measures. */
  yLabel: string
  /** Plot height in px. */
  height?: number
  /** Gridlines, 2–8. Figma's `_Y-Axis Presets` `Lines`. Ignored by the quadrant form, which draws none. */
  yLines?: number
  /** Where the legend goes, or `false` for none. */
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch series off by clicking the legend. */
  interactiveLegend?: boolean
  /**
   * Draw the quadrant form: a crosshair at `x` / `y` (each defaulting to the
   * middle of its axis) with a label at each of its four ends, and no grid or
   * tick labels. Pass `{}` for a crosshair through the center of the plot.
   */
  quadrant?: QuadrantOptions
  className?: string
}

/** Plot-point geometry, from Figma: an 8px square, and a 1.5px ring on the hollow shapes. */
const POINT_SIZE = 8
const POINT_STROKE = 1.5
/** The hovered point grows to the swatch's numbers — the same shape, the size the legend draws it at. */
const ACTIVE_SIZE = 12
const ACTIVE_STROKE = 2
/** The x axis's wide tick count; the y takes `yLines`. See `numericXAxisProps`. */
const X_TICKS_WIDE = 5

/** A point as it is handed to Recharts: the datum plus which series it came from. */
interface PlotPoint extends ScatterPoint {
  seriesKey: string
}

/**
 * The drawn domain of one axis — the same rule the axis props apply, made
 * explicit so the quadrant form can pin it. Zero floor when nothing is
 * negative, a rounded top otherwise.
 */
function drawnDomain(values: readonly number[], lines: number): [number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return [min >= 0 ? 0 : min, niceMax(max, lines)]
}

/**
 * The four end labels of the crosshair, drawn from the reference line's own
 * rectangle.
 *
 * Each is an HTML plate inside a `<foreignObject>` rather than SVG text on a
 * hand-sized rect: SVG cannot size a rectangle to the text it holds, and a
 * plate that is not hugging its label is either clipping it or leaking the
 * line it was meant to cover. The plate is Figma's `_Quadrant Grid` label —
 * surface fill, 8px padding on every side but the one facing the edge, 12px
 * mono `content-subtle` — sitting *on* the line's end, so the surface color
 * is what separates the label from the rule. No ink that is not data.
 */
const LABEL_BOX = 240
const LABEL_HEIGHT = 36
const PLATE = 'bg-surface-background-primary text-content-subtle font-mono text-sm whitespace-nowrap'

function VerticalEndLabels({
  viewBox,
  top,
  bottom,
}: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
  top?: string
  bottom?: string
}) {
  if (!viewBox || viewBox.x === undefined || viewBox.y === undefined || viewBox.height === undefined) return null
  const x = viewBox.x - LABEL_BOX / 2
  return (
    <>
      {top ? (
        <foreignObject x={x} y={viewBox.y} width={LABEL_BOX} height={LABEL_HEIGHT} className="overflow-visible">
          <div className="flex justify-center">
            <span data-quadrant-label="top" className={`${PLATE} px-2 pb-2`}>
              {top}
            </span>
          </div>
        </foreignObject>
      ) : null}
      {bottom ? (
        <foreignObject
          x={x}
          y={viewBox.y + viewBox.height - LABEL_HEIGHT}
          width={LABEL_BOX}
          height={LABEL_HEIGHT}
          className="overflow-visible"
        >
          <div className="flex h-full items-end justify-center">
            <span data-quadrant-label="bottom" className={`${PLATE} px-2 pt-2`}>
              {bottom}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </>
  )
}

function HorizontalEndLabels({
  viewBox,
  left,
  right,
}: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
  left?: string
  right?: string
}) {
  if (!viewBox || viewBox.x === undefined || viewBox.y === undefined || viewBox.width === undefined) return null
  const y = viewBox.y - LABEL_HEIGHT / 2
  return (
    <>
      {left ? (
        <foreignObject x={viewBox.x} y={y} width={LABEL_BOX} height={LABEL_HEIGHT} className="overflow-visible">
          <div className="flex h-full items-center justify-start">
            <span data-quadrant-label="left" className={`${PLATE} py-2 pr-2`}>
              {left}
            </span>
          </div>
        </foreignObject>
      ) : null}
      {right ? (
        <foreignObject
          x={viewBox.x + viewBox.width - LABEL_BOX}
          y={y}
          width={LABEL_BOX}
          height={LABEL_HEIGHT}
          className="overflow-visible"
        >
          <div className="flex h-full items-center justify-end">
            <span data-quadrant-label="right" className={`${PLATE} py-2 pl-2`}>
              {right}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </>
  )
}

/**
 * The tooltip, with the rows a scatter needs.
 *
 * Recharts hands a scatter's tooltip two entries for one point — `x` and `y` —
 * and puts the series on the datum, not the entry. `ChartTooltip`'s default
 * matcher expects one entry per series, so this builds the rows itself: the
 * heading is the point's own name when it has one, otherwise the series; the
 * series gets a swatch row only when the heading did not already name it;
 * then the two measures.
 */
function ScatterTooltip({
  active,
  payload,
  series,
  xLabel,
  yLabel,
}: {
  active?: boolean
  payload?: ChartTooltipPayloadEntry[]
  series: readonly ResolvedChartSeries[]
  xLabel: string
  yLabel: string
}) {
  const point = payload?.[0]?.payload as PlotPoint | undefined
  const owner = point ? seriesByKey(series, point.seriesKey) : undefined

  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={point?.label ?? owner?.label}
      rows={(): ChartTooltipRow[] => {
        if (!point) return []
        const rows: ChartTooltipRow[] = []
        if (point.label && owner) {
          rows.push({
            key: 'series',
            label: owner.label,
            swatch: { shape: owner.swatchShape, color: owner.color },
          })
        }
        rows.push({ key: 'x', label: xLabel, value: point.x })
        rows.push({ key: 'y', label: yLabel, value: point.y })
        return rows
      }}
    />
  )
}

/**
 * The chart body. Sits inside `ChartContainer` so it can read `wide` and the
 * visible series from context.
 */
function ScatterPlot({
  yLines,
  xLabel,
  yLabel,
  quadrant,
  xDomain,
  yDomain,
}: {
  yLines: number
  xLabel: string
  yLabel: string
  quadrant?: QuadrantOptions
  xDomain: [number, number]
  yDomain: [number, number]
}) {
  const chart = useChart()
  const series = useVisibleSeries()
  const wide = chart?.wide ?? true

  const thresholds = quadrant ? resolveThresholds(quadrant, xDomain, yDomain) : null
  const xAxis = numericXAxisProps({ wide })
  const yAxis = yAxisProps({ lines: yLines })

  return (
    <ScatterChart
      // Room for a hovered marker at the edge of the domain: the active shape
      // is 12px, so 8 keeps its far side inside the plot. The plain form gets
      // that room on the left and bottom from the axes themselves; the quadrant
      // form has no axis chrome, so it reserves it on every side.
      margin={quadrant ? { top: 8, right: 8, bottom: 8, left: 8 } : { top: 8, right: 8, bottom: 0, left: 0 }}
      accessibilityLayer
    >
      {quadrant ? null : <CartesianGrid {...chartGridProps} />}

      <XAxis
        dataKey="x"
        name={xLabel}
        {...xAxis}
        // The quadrant form pins its domain from every series, hidden ones
        // included, so switching a series off cannot move the crosshair.
        domain={quadrant ? xDomain : xAxis.domain}
        tick={quadrant ? false : xAxis.tick}
        axisLine={quadrant ? false : xAxis.axisLine}
        height={quadrant ? 0 : undefined}
      />
      <YAxis
        dataKey="y"
        name={yLabel}
        type="number"
        {...yAxis}
        domain={quadrant ? yDomain : yAxis.domain}
        tick={quadrant ? false : yAxis.tick}
        width={quadrant ? 0 : yAxis.width}
      />

      {thresholds ? (
        <>
          <ReferenceLine
            x={thresholds.x}
            stroke={axisLine}
            strokeWidth={1}
            label={(props: { viewBox?: { x?: number; y?: number; width?: number; height?: number } }) => (
              <VerticalEndLabels viewBox={props.viewBox} top={quadrant?.labels?.top} bottom={quadrant?.labels?.bottom} />
            )}
          />
          <ReferenceLine
            y={thresholds.y}
            stroke={axisLine}
            strokeWidth={1}
            label={(props: { viewBox?: { x?: number; y?: number; width?: number; height?: number } }) => (
              <HorizontalEndLabels viewBox={props.viewBox} left={quadrant?.labels?.left} right={quadrant?.labels?.right} />
            )}
          />
        </>
      ) : null}

      <Tooltip
        // A crosshair through the hovered point, in the accessibility overlay —
        // the one element the reader is actively following.
        cursor={{ stroke: cursorHighlight, strokeWidth: 1 }}
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ScatterTooltip series={series} xLabel={xLabel} yLabel={yLabel} />}
      />

      {series.map((s) => {
        const marker = s.marker === false ? 'circle' : s.marker
        const points: PlotPoint[] = (s as ResolvedChartSeries & ScatterSeries).points.map((p) => ({
          ...p,
          seriesKey: s.key,
        }))

        return (
          <RechartsScatter
            key={s.key}
            name={s.label}
            data={points}
            fill={s.color}
            isAnimationActive={false}
            shape={(props: { cx?: number; cy?: number }) =>
              markerShape({
                marker,
                color: s.color,
                surface,
                size: POINT_SIZE,
                strokeWidth: POINT_STROKE,
                cx: props.cx ?? 0,
                cy: props.cy ?? 0,
              })
            }
            activeShape={(props: { cx?: number; cy?: number }) =>
              markerShape({
                marker,
                color: s.color,
                surface,
                size: ACTIVE_SIZE,
                strokeWidth: ACTIVE_STROKE,
                cx: props.cx ?? 0,
                cy: props.cy ?? 0,
              })
            }
          />
        )
      })}
    </ScatterChart>
  )
}

export function Scatter({
  series,
  label,
  xLabel,
  yLabel,
  height = 280,
  yLines = 5,
  legend = 'horizontal',
  interactiveLegend = false,
  quadrant,
  className,
}: ScatterProps) {
  const { xDomain, yDomain } = useMemo(() => {
    const xs = series.flatMap((s) => s.points.map((p) => p.x))
    const ys = series.flatMap((s) => s.points.map((p) => p.y))
    return {
      xDomain: xs.length ? drawnDomain(xs, X_TICKS_WIDE) : ([0, 1] as [number, number]),
      yDomain: ys.length ? drawnDomain(ys, yLines) : ([0, 1] as [number, number]),
    }
  }, [series, yLines])

  const thresholds = quadrant ? resolveThresholds(quadrant, xDomain, yDomain) : null

  // One row per point. The quadrant form adds the box the crosshair puts it
  // in, so what the picture encodes by position is said in words.
  const table = (
    <table>
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">Series</th>
          <th scope="col">{xLabel}</th>
          <th scope="col">{yLabel}</th>
          {thresholds ? <th scope="col">Quadrant</th> : null}
        </tr>
      </thead>
      <tbody>
        {series.flatMap((s) =>
          s.points.map((p, index) => (
            <tr key={`${s.key}-${index}`}>
              <th scope="row">{p.label ? `${s.label}: ${p.label}` : s.label}</th>
              <td>{formatFullNumber(p.x)}</td>
              <td>{formatFullNumber(p.y)}</td>
              {thresholds ? <td>{describeQuadrant(quadrantOf(p, thresholds), quadrant?.labels)}</td> : null}
            </tr>
          )),
        )}
      </tbody>
    </table>
  )

  return (
    <ChartContainer
      series={series}
      data={[]}
      xKey="x"
      label={label}
      height={height}
      className={className}
      interactiveLegend={interactiveLegend}
      table={table}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <ScatterPlot
        yLines={yLines}
        xLabel={xLabel}
        yLabel={yLabel}
        quadrant={quadrant}
        xDomain={xDomain}
        yDomain={yDomain}
      />
    </ChartContainer>
  )
}

Scatter.displayName = 'Scatter'
