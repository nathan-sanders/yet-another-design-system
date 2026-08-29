import { useMemo } from 'react'
import { Tooltip, Treemap } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  accessibilityOverlay,
  chartTooltipWrapperStyle,
  formatFullNumber,
  resolveSeries,
  surface,
  type ChartSeries,
} from '../Chart'

/**
 * TreeMap — parts of a whole, when there are too many parts for a donut.
 *
 * Figma's `Tree Map` (`40004343:24130`), on `_Tree Map / Data Group`
 * (`40004343:24124`).
 *
 * It answers the same question a `Donut` does and stays readable where a donut
 * stops — past about six slices a donut's small arcs are unreadable, while a
 * treemap's small rectangles are merely small. The cost is that people compare
 * *areas* here rather than arc lengths, which they do less accurately, so it is
 * the right form when the story is "these few dominate" and the wrong one when
 * two similar values have to be told apart.
 *
 * ## The only chart whose marks carry their own text
 *
 * Every other chart in the library keeps text outside the data — axis labels,
 * legends, tooltips — for the reason the shared record gives: several of the
 * twelve categorical hues are illegible under text. A treemap has nowhere else
 * to put a label, so Figma solves it with a **plate**: a translucent dark panel
 * behind the text, using `Data Viz/Utility/Accessibility Overlay` at its own 56%.
 *
 * That token's first job is outlining a mark that cannot separate from its
 * ground; this is a second, and it works for the same reason — it is the neutral
 * at 56%, which is exactly what a legible plate needs, and it **flips with the
 * theme** (`neutral-900` in light, `neutral-100` in dark) so `content-inverse`
 * is the right text colour in both.
 *
 * **Figma binds `Overlay/Text` for the metric line, and that token does not
 * exist** — no `Overlay/*` token is in any of `tokens/*.json`. `content-inverse`
 * stands in for it, which is correct in both themes; the gap is in the file, not
 * here.
 *
 * ## Grouping
 *
 * Data is one level of nesting: a group, and its tiles. Colour belongs to the
 * **group**, so every tile in a group shares one hue and the twelve-colour scale
 * counts groups rather than tiles — which is what lets a treemap show forty
 * rectangles without needing forty colours.
 */

export interface TreeMapTile {
  /** The tile's label. */
  name: string
  /** Its size. */
  value: number
}

export interface TreeMapGroup extends ChartSeries {
  /** The tiles in this group. They share the group's colour. */
  tiles: readonly TreeMapTile[]
}

export interface TreeMapProps {
  /** One entry per group, in a fixed order — colour comes from position here. */
  groups: readonly TreeMapGroup[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  legend?: 'horizontal' | 'vertical' | false
  /** Show each tile's value under its name, where the tile is big enough. */
  showValues?: boolean
  formatValue?: (value: number) => string
  className?: string
}

/** Figma: `_Tree Map / Data Group` corner radius. */
const TILE_RADIUS = 4
/**
 * The gap between tiles — **2px, the same as the heat map's**.
 *
 * Both frames report `itemSpacing: 8`, and in both that is not the visual gap:
 * Figma's GRID layout does not use it as one. The heat map's real number was
 * derived from its own geometry (24 columns of 39.3px in a 992px frame leaves
 * 2.1px), and this one was taken at face value instead — same trap, caught once
 * and missed once. 8px made the tiles read as separate cards rather than parts
 * of one shape.
 */
const TILE_GAP = 2
/** Figma: the label plate's radius and padding. */
const PLATE_RADIUS = 6
const PLATE_PAD_X = 8
const PLATE_PAD_Y = 2
/** Line heights inside the plate, and the width of one character at each size. */
const LABEL_LINE = 20
const VALUE_LINE = 16
const LABEL_CHAR = 7.2
const VALUE_CHAR = 6
/** Figma: 8px inset from the tile's edge. */
const TILE_PAD = 8
/** Below this a tile cannot hold a plate without the plate becoming the tile. */
const MIN_LABEL_WIDTH = 56

interface TileProps {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  value?: number
  children?: unknown[]
  depth?: number
  index?: number
  colors?: string[]
  groupColor?: string
}

interface TileOptions {
  showValues: boolean
  formatValue: (value: number) => string
}

/**
 * Build the tile renderer.
 *
 * A factory rather than a component, because Recharts calls `content` for
 * **every** node — the invisible root and each group rectangle included — and
 * the per-chart options have to reach it without going through Recharts' own
 * prop cloning.
 *
 * **It renders leaves only, and tests for that by looking for children rather
 * than by counting depth.** Recharts calls `content` for every node — the
 * invisible root and each group rectangle included — and without the check the
 * groups paint solid over their own tiles, leaving one block per group.
 *
 * Depth was the obvious test and is the wrong one: `depth` means different
 * things under Recharts' two `type` modes, so a chart that worked would break
 * on a prop change somewhere else. "Has no children" is what a tile actually
 * is.
 */
function makeTile({ showValues, formatValue }: TileOptions) {
  return function renderTile(rawProps: unknown) {
    const props = rawProps as TileProps
    const { x = 0, y = 0, width = 0, height = 0 } = props

    // A group's rectangle has children; a tile does not.
    const isLeaf = !props.children || props.children.length === 0
    if (!isLeaf || width <= 0 || height <= 0) return <g />

    // The gap is taken *out of* the tile rather than added between them,
    // because Recharts hands over rectangles that already tile the space
    // exactly. Same move as the stacked bar's segment gap: white does the
    // separating, and no ink is spent on a border.
    const inset = TILE_GAP / 2
    const w = Math.max(0, width - TILE_GAP)
    const h = Math.max(0, height - TILE_GAP)
    if (w <= 0 || h <= 0) return <g />

    const radius = Math.min(TILE_RADIUS, w / 2, h / 2)
    const label = props.name ?? ''

    // Roughly 7.2px a character at 12px mono, and 6px at 10px — mono is the one
    // face whose width can be counted rather than measured, which is what makes
    // this possible in an SVG with no layout engine.
    const value = typeof props.value === 'number' ? formatValue(props.value) : ''
    const wantsValue = showValues && value !== ''

    const labelWidth = label.length * LABEL_CHAR
    const valueWidth = value.length * VALUE_CHAR

    // **The plate grows to hold the value; the value never sits outside it.**
    // It used to be drawn under the plate, straight onto the tile — which put
    // 10px text on a saturated categorical fill, exactly the thing the plate
    // exists to prevent, and it read as a caption that had fallen off.
    const plateWidth = Math.max(labelWidth, wantsValue ? valueWidth : 0) + PLATE_PAD_X * 2
    const plateHeight = PLATE_PAD_Y * 2 + LABEL_LINE + (wantsValue ? VALUE_LINE : 0)

    // **A label that will not fit is dropped, not narrowed.** Clamping the plate
    // to the tile leaves the *text* spilling over the edge, because SVG text
    // neither wraps nor clips to its box — which is what happened, and
    // "Retarget" hung off its tile into the next one. A label clipped by its own
    // tile is worse than no label, and the value is still in the tooltip and the
    // table either way.
    const roomForLabel =
      plateWidth <= w - TILE_PAD * 2 && plateHeight <= h - TILE_PAD * 2 && w >= MIN_LABEL_WIDTH

    const plateX = x + inset + TILE_PAD
    const plateY = y + inset + TILE_PAD
    const textX = plateX + PLATE_PAD_X

    return (
      <g>
        <rect
          x={x + inset}
          y={y + inset}
          width={w}
          height={h}
          rx={radius}
          ry={radius}
          fill={props.groupColor ?? surface}
        />

        {roomForLabel ? (
          <>
            <rect
              x={plateX}
              y={plateY}
              width={plateWidth}
              height={plateHeight}
              rx={PLATE_RADIUS}
              ry={PLATE_RADIUS}
              // Figma's plate: the accessibility overlay at its own 56%, which
              // flips with the theme, so `content-inverse` is the right text
              // colour in both.
              fill={accessibilityOverlay}
            />
            <text
              x={textX}
              y={plateY + PLATE_PAD_Y + LABEL_LINE / 2}
              dominantBaseline="middle"
              className="fill-content-inverse font-mono text-sm"
            >
              {label}
            </text>
            {wantsValue ? (
              <text
                x={textX}
                y={plateY + PLATE_PAD_Y + LABEL_LINE + VALUE_LINE / 2}
                dominantBaseline="middle"
                className="fill-content-inverse font-mono text-xs"
              >
                {value}
              </text>
            ) : null}
          </>
        ) : null}
      </g>
    )
  }
}

export function TreeMap({
  groups,
  label,
  height = 320,
  legend = 'horizontal',
  showValues = false,
  formatValue = formatFullNumber,
  className,
}: TreeMapProps) {
  // Colour belongs to the group, so the categorical scale counts groups. This is
  // what lets a treemap show forty tiles without needing forty colours.
  const resolved = useMemo(() => resolveSeries(groups, 'colorSwatch'), [groups])
  const renderTile = useMemo(() => makeTile({ showValues, formatValue }), [showValues, formatValue])

  const data = useMemo(
    () =>
      resolved.map((group, index) => ({
        name: group.label,
        groupColor: group.color,
        children: groups[index].tiles.map((tile) => ({
          name: tile.name,
          value: tile.value,
          groupColor: group.color,
        })),
      })),
    [resolved, groups],
  )

  const table = (
    <table className="sr-only">
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">Group</th>
          <th scope="col">Name</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) =>
          group.tiles.map((tile) => (
            <tr key={`${group.key}-${tile.name}`}>
              <th scope="row">{group.label}</th>
              <td>{tile.name}</td>
              <td>{formatValue(tile.value)}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  )

  return (
    <ChartContainer
      series={groups}
      data={[]}
      xKey="name"
      label={label}
      height={height}
      className={className}
      swatch="colorSwatch"
      table={table}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <Treemap
        data={data}
        dataKey="value"
        // `flat`, not `nest`.
        //
        // Recharts' `nest` is a *drill-down* mode — it renders one level and
        // waits for a click, so a nested dataset came out as an empty chart with
        // a legend above it. `flat` renders the leaves, and the squarified
        // layout still solves the top level first and recurses into each group's
        // rectangle, so groups stay contiguous and the colours read as regions
        // rather than confetti.
        type="flat"
        isAnimationActive={false}
        content={renderTile}
      >
        <Tooltip
          isAnimationActive={false}
          wrapperStyle={chartTooltipWrapperStyle}
          content={<ChartTooltip />}
        />
      </Treemap>
    </ChartContainer>
  )
}

TreeMap.displayName = 'TreeMap'
