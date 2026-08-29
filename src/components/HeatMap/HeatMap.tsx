import { useMemo, useState } from 'react'

import { cn } from '../../lib/cn'
import { ChartContainer, ChartLegend, ChartTooltip, formatFullNumber, type ChartMonoScale } from '../Chart'
import { heatScale } from './scale'

/**
 * HeatMap — how much, across two dimensions at once.
 *
 * Figma's `Heat Map` (`40004343:21701`), on `_Heat Map / Cell` (`40004343:21697`).
 *
 * ## It is a CSS grid, not a chart
 *
 * The only component in the data viz set that draws no SVG. Recharts has nothing
 * to offer a grid of rounded squares — no axis to scale, no path to compute, no
 * layout to solve — and forcing it through a `ScatterChart` with a custom shape,
 * which is the usual trick, would buy a harder version of `grid-template-columns`.
 *
 * It still goes through `ChartContainer` (with `responsive={false}`, since
 * `ResponsiveContainer` needs a Recharts child) because everything *else* the
 * container does is wanted here: the `role="img"` labelling, the hidden data
 * table, the legend header. `Spark` is the opposite call — it wants none of
 * them, so it uses no container at all.
 *
 * ## Colour is a sequential ramp, and never a categorical one
 *
 * Cells encode **magnitude**, so they take one hue getting darker — one of
 * `monoScales`. The twelve categorical colours are for identity and would say
 * that Tuesday at 9am is a different *kind* of thing from Tuesday at 10am rather
 * than more of the same. The domain is computed once over the whole grid; see
 * `scale.ts` for why per-row scaling destroys the chart.
 *
 * ## An empty cell is drawn as nothing
 *
 * Figma leaves gaps where there is no data, and that is right: painting a
 * missing value with the lightest step claims a measurement of "almost none"
 * where there was no measurement. `null` in, nothing out.
 *
 * ## The tooltip
 *
 * A cell shows a colour and nothing else, so without hover the only way to read
 * an exact value is the hidden table — which sighted readers never see. Figma
 * draws no hover state; this is a deliberate addition.
 *
 * It is `ChartTooltip` positioned from local state rather than Recharts' —
 * there is no Recharts here to provide one. One tooltip for the whole grid, not
 * one per cell: a 7 × 24 grid is 168 cells, and 168 mounted popups is a real
 * cost for a thing only ever visible once.
 */

export interface HeatMapProps {
  /** Row labels, top to bottom. Figma's example is days of the week. */
  rows: readonly string[]
  /** Column labels, left to right. Figma's example is hours. */
  columns: readonly string[]
  /**
   * Values as `[row][column]`, matching `rows` and `columns`. `null` for a cell
   * with no measurement, which is drawn as nothing.
   */
  values: readonly (readonly (number | null)[])[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  /** Which sequential ramp. */
  scale?: ChartMonoScale
  /** Hold the scale still across charts by fixing its ends. */
  min?: number
  max?: number
  /** Row height in px. Columns share the width equally. */
  cellHeight?: number
  /** Labels for the two ends of the gradient legend, or `false` for no legend. */
  legend?: { start: string; end: string } | false
  /** How a value reads in the tooltip and the table. */
  formatValue?: (value: number) => string
  /** What the numbers are, named once for the tooltip row. */
  valueLabel?: string
  className?: string
}

/** Figma: `_Heat Map / Cell` corner radius. */
const CELL_RADIUS = 'rounded-xs'
/**
 * The gap between cells.
 *
 * Read out of Figma's own numbers rather than its `itemSpacing`, which its GRID
 * layout does not use as the visual gap: 24 columns of 39.3px in a 992px frame
 * leaves 2.1px per gap, and 7 rows of 32.3px in 240px leaves 2.0.
 */
const CELL_GAP = 2

interface HoverState {
  row: number
  column: number
  x: number
  y: number
}

export function HeatMap({
  rows,
  columns,
  values,
  label,
  scale = 'a',
  min,
  max,
  cellHeight = 32,
  legend = { start: 'Low', end: 'High' },
  formatValue = formatFullNumber,
  valueLabel = 'Value',
  className,
}: HeatMapProps) {
  const [hover, setHover] = useState<HoverState | null>(null)

  const colorFor = useMemo(
    () => heatScale(values.flat().filter((v): v is number => v !== null), { scale, min, max }),
    [values, scale, min, max],
  )

  // Its height is its data, not a prop: rows times the row height plus the gaps
  // between them, and the column labels underneath.
  const gridHeight = rows.length * cellHeight + (rows.length - 1) * CELL_GAP
  const height = gridHeight + 24

  const hovered = hover ? { row: rows[hover.row], column: columns[hover.column], value: values[hover.row]?.[hover.column] } : null

  const table = (
    <table className="sr-only">
      <caption>{label}</caption>
      <thead>
        <tr>
          <td />
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={row}>
            <th scope="row">{row}</th>
            {columns.map((column, c) => {
              const value = values[r]?.[c]
              return <td key={column}>{value === null || value === undefined ? 'No data' : formatValue(value)}</td>
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <ChartContainer
      // A heat map has no categorical series — its colour is a magnitude ramp,
      // and its legend is the gradient rather than a list of names.
      series={[]}
      data={[]}
      xKey=""
      label={label}
      height={height}
      responsive={false}
      table={table}
      className={className}
      header={
        legend === false ? undefined : (
          <ChartLegend type="gradient" scale={scale} startLabel={legend.start} endLabel={legend.end} />
        )
      }
    >
      <div className="flex h-full w-full min-w-0 gap-2">
        {/* Row labels, right-aligned against the grid they belong to. */}
        <div
          className="flex shrink-0 flex-col justify-start"
          style={{ gap: CELL_GAP }}
          aria-hidden="true"
        >
          {rows.map((row) => (
            <span
              key={row}
              className="text-content-subtle flex items-center justify-end font-mono text-sm"
              style={{ height: cellHeight }}
            >
              {row}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            className="relative grid min-w-0"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              gap: CELL_GAP,
            }}
            onMouseLeave={() => setHover(null)}
          >
            {rows.map((row, r) =>
              columns.map((column, c) => {
                const value = values[r]?.[c] ?? null
                const color = colorFor(value)

                return (
                  <div
                    key={`${row}-${column}`}
                    className={cn(CELL_RADIUS, 'min-w-0')}
                    style={{ height: cellHeight, background: color ?? 'transparent' }}
                    onMouseEnter={(event) => {
                      const cell = event.currentTarget.getBoundingClientRect()
                      const grid = event.currentTarget.parentElement!.getBoundingClientRect()
                      setHover({
                        row: r,
                        column: c,
                        x: cell.left - grid.left + cell.width / 2,
                        y: cell.top - grid.top,
                      })
                    }}
                  />
                )
              }),
            )}

            {hovered && hovered.value !== null && hovered.value !== undefined ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full pt-0"
                style={{ left: hover!.x, top: hover!.y - 8 }}
              >
                <ChartTooltip
                  active
                  label={`${hovered.row} · ${hovered.column}`}
                  // A cell is an area, not a point on a line, so its key is the
                  // plain colour square — the same rule Area, Bar and Donut follow.
                  swatch="colorSwatch"
                  series={[{ key: 'value', label: valueLabel, color: colorFor(hovered.value) ?? undefined }]}
                  payload={[{ dataKey: 'value', value: hovered.value }]}
                />
              </div>
            ) : null}
          </div>

          {/* Column labels under the grid, as Figma places them. */}
          <div
            className="grid min-w-0"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, gap: CELL_GAP }}
            aria-hidden="true"
          >
            {columns.map((column) => (
              <span key={column} className="text-content-subtle truncate text-center font-mono text-sm">
                {column}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ChartContainer>
  )
}

HeatMap.displayName = 'HeatMap'
