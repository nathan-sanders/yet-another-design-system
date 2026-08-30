import { useEffect, useMemo } from 'react'
import { Sankey as RechartsSankey, Tooltip } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  formatFullNumber,
  resolveSeries,
  surface,
  useChart,
  type ChartSeries,
} from '../Chart'
import { depthCount, toSankeyGraph, type SankeyFlow } from './graph'

/**
 * Sankey — where a quantity went, from one stage to the next.
 *
 * **Figma draws no Sankey.** Its `Sankey` section (`40004378:41237`) exists and
 * is empty, so every decision here follows from rules the library already holds
 * rather than from the file. The record beside this file says which rule each
 * one came from, and what the file owes.
 *
 * ## A ribbon takes its source node's color
 *
 * Categorical color means identity, and a flow's identity is where it came
 * from — tracing a ribbon back to its origin is the question the form exists to
 * answer. Two flows arriving at the same node therefore stay different colors,
 * which is what lets a reader see the mix that made it up.
 *
 * ## Translucent, for Radar's reason rather than for taste
 *
 * Ribbons cross, and no paint order exists that keeps them all readable — the
 * same argument `Radar` makes for its areas, arriving in a second place. So they
 * are drawn at reduced opacity and an overlap simply reads darker.
 *
 * ## The labels are on the diagram, and the legend still stays on
 *
 * A node's name is drawn beside its bar, not on it: `TreeMap` is the only chart
 * here whose marks carry their own text, and only because a tile has nowhere
 * else to put it. A Sankey node is a thin bar with clear space either side.
 *
 * That does make the legend partly redundant, and `legend={false}` is a
 * reasonable thing to pass — it is exactly the escape hatch `ChartLegend`
 * documents, "for when something else already names the series". It is not the
 * default, because the library's rule is that a legend stays on, and a label
 * that will not fit is dropped rather than clipped.
 */

/** A node. Color and legend order come from its position in the `nodes` array. */
export type SankeyNodeDef = ChartSeries

export interface SankeyProps {
  /** Every node, in a fixed order — color is assigned from position here. */
  nodes: readonly SankeyNodeDef[]
  /** The flows between them, named by node key rather than by index. */
  flows: readonly SankeyFlow[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  legend?: 'horizontal' | 'vertical' | false
  /** How a value reads in the tooltip and the table. */
  formatValue?: (value: number) => string
  className?: string
}

/**
 * The opacity a ribbon is drawn at.
 *
 * `Radar`'s number, and reached the same way: shapes that overlap in every
 * direction cannot be ordered into legibility, so translucency is the only
 * thing that works. It is written here rather than imported from `polar.ts`
 * because a Sankey is not a polar chart and borrowing that file's constant
 * would imply a shared geometry that does not exist.
 */
const LINK_OPACITY = 0.4

/** The node bar's width and corner radius — `rounded-xs`, as every small mark here is. */
const NODE_WIDTH = 12
const NODE_RADIUS = 4

/** The gap between a node bar and its label. */
const LABEL_GAP = 8
/** Room around the plot, so a label at either extreme is not flush to the edge. */
const PLOT_MARGIN = 8
/**
 * Roughly one character's width at 12px Geist Mono.
 *
 * `TreeMap`'s number, and usable for the same reason: mono is the one face whose
 * width can be counted rather than measured, which is what makes text placement
 * possible inside an SVG with no layout engine.
 */
const LABEL_CHAR = 7.2

interface NodeRenderProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  payload?: { name?: string; groupColor?: string; value?: number }
}

interface LinkRenderProps {
  sourceX?: number
  targetX?: number
  sourceY?: number
  targetY?: number
  sourceControlX?: number
  targetControlX?: number
  linkWidth?: number
  index?: number
  payload?: { groupColor?: string }
}

/**
 * Build the node renderer.
 *
 * A factory rather than a component, for `TreeMap`'s reason: Recharts clones the
 * element it is given with its own props, so the plot width cannot reach the
 * renderer any other way — and the plot width is what decides which side a label
 * goes on.
 */
function makeNode({ plotRight, labelRoom }: { plotRight: number; labelRoom: number }) {
  return function renderNode(rawProps: unknown) {
    const props = rawProps as NodeRenderProps
    const { x = 0, y = 0, width = 0, height = 0 } = props
    const name = props.payload?.name ?? ''

    // **Which side the label goes on is measured, not derived from the graph.**
    // "Is this a terminal node?" is the obvious test and gets the middle columns
    // wrong — a node halfway across with room on neither side still has to pick
    // one. Asking whether the text fits is the question that actually decides it.
    const textWidth = name.length * LABEL_CHAR

    // **Two bounds, and the second one is the one that was missing.** The plot's
    // edge is the obvious constraint; the *next column* is the real one. At a
    // wide size every label clears both and the difference is invisible, so this
    // was found by measuring at 256px, where "Paid" and "Churned" were drawn
    // straight through each other — both inside the plot, both illegible.
    const withinColumn = labelRoom <= 0 || textWidth <= labelRoom
    const fitsRight = withinColumn && (plotRight <= 0 || x + width + LABEL_GAP + textWidth <= plotRight)
    // A label with nowhere to go is dropped rather than clipped. SVG text
    // neither wraps nor clips to a box, so a narrowed label does not shrink —
    // it runs on over whatever is beside it, which is what `TreeMap` found.
    const fitsLeft = withinColumn && x - LABEL_GAP - textWidth >= 0
    const showLabel = name !== '' && (fitsRight || fitsLeft)

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={Math.min(NODE_RADIUS, width / 2, height / 2)}
          ry={Math.min(NODE_RADIUS, width / 2, height / 2)}
          fill={props.payload?.groupColor ?? surface}
        />
        {showLabel ? (
          <text
            x={fitsRight ? x + width + LABEL_GAP : x - LABEL_GAP}
            y={y + height / 2}
            textAnchor={fitsRight ? 'start' : 'end'}
            dominantBaseline="middle"
            // Mono, in `content-subtle`, like every other chart label in the
            // library — `Radar`'s conclusion, and for its reason: a name beside
            // a mark is chrome, and text never wears the series color, because
            // three of the twelve hues cannot carry it legibly.
            className="fill-content-subtle font-mono text-sm"
            // **A label goes on the side its own ribbon leaves from**, so it is
            // always over data rather than over the canvas — and at 0.4 the
            // ribbons are exactly muddy enough to swallow a subtle gray. This is
            // `Radar`'s halo, which had the same problem with its scale: the
            // stroke is drawn *under* the fill by `paint-order`, so 3px reads as
            // a 1.5px outline of canvas around each glyph rather than a smear
            // over it. Surface-colored, so it follows the theme for free.
            stroke={surface}
            strokeWidth={3}
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke' }}
          >
            {name}
          </text>
        ) : null}
      </g>
    )
  }
}

/**
 * A ribbon.
 *
 * Recharts' own default draws this as a **stroked** path — `fill: none`, with
 * the band's thickness carried by `strokeWidth`. Keeping that is deliberate:
 * the alternative is computing a filled outline by hand, and there is nothing
 * to gain from it when the only things being changed are the color and the
 * opacity.
 */
function renderLink(rawProps: unknown) {
  const props = rawProps as LinkRenderProps
  const {
    sourceX = 0,
    targetX = 0,
    sourceY = 0,
    targetY = 0,
    sourceControlX = 0,
    targetControlX = 0,
    linkWidth = 0,
  } = props

  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={props.payload?.groupColor ?? surface}
      strokeWidth={linkWidth}
      strokeOpacity={LINK_OPACITY}
    />
  )
}

export function Sankey({
  nodes,
  flows,
  label,
  height = 320,
  legend = 'horizontal',
  formatValue = formatFullNumber,
  className,
}: SankeyProps) {
  // A node is a series: color comes from its position in this array and never
  // from its position in the diagram, which the layout is free to rearrange.
  const series = useMemo(() => resolveSeries(nodes, 'colorSwatch'), [nodes])
  const graph = useMemo(() => toSankeyGraph(series, flows), [series, flows])

  // Reported once, rather than drawn wrong in silence. `toSankeyGraph` returns
  // these as data so a test can assert on them; this is what a developer sees.
  useEffect(() => {
    for (const { flow, reason } of graph.dropped) {
      console.warn(`Sankey: dropped flow ${flow.source} → ${flow.target} (${reason})`)
    }
  }, [graph.dropped])

  const table = (
    <table className="sr-only">
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">From</th>
          <th scope="col">To</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {graph.links.map((link, index) => (
          <tr key={index}>
            <th scope="row">{graph.nodes[link.source].name}</th>
            <td>{graph.nodes[link.target].name}</td>
            <td>{formatValue(link.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <ChartContainer
      series={nodes}
      data={[]}
      xKey="name"
      label={label}
      height={height}
      className={className}
      swatch="colorSwatch"
      table={table}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <SankeyPlot graph={graph} formatValue={formatValue} />
    </ChartContainer>
  )
}

Sankey.displayName = 'Sankey'

function SankeyPlot({
  graph,
  formatValue,
}: {
  graph: ReturnType<typeof toSankeyGraph>
  formatValue: (value: number) => string
}) {
  // The node renderer needs it to decide which side each label goes on, and
  // Recharts clones the element it is handed with its own props, so a closure is
  // the only way in. `ChartContainer` is already measuring for the breakpoint.
  const plotWidth = useChart()?.plotWidth ?? 0

  // The room a label has before it reaches the next column. Recharts spreads
  // the columns evenly across the plot, so the step is the plot's inner width
  // less one node, divided by the gaps between columns — the same arithmetic it
  // does, reproduced rather than waited for, since the renderer runs before the
  // layout is anywhere a caller can read it.
  const columns = depthCount(graph.nodes.length, graph.links)
  const inner = Math.max(0, plotWidth - PLOT_MARGIN * 2)
  const columnStep = columns > 1 ? (inner - NODE_WIDTH) / (columns - 1) : inner
  const labelRoom = columnStep - NODE_WIDTH - LABEL_GAP * 2

  return (
    <RechartsSankey
      data={{ nodes: graph.nodes, links: graph.links }}
      nodeWidth={NODE_WIDTH}
      nodePadding={16}
      // `sort` is left at Recharts' default, which arranges the nodes in each
      // column to reduce crossings. **Vertical position in a Sankey is a layout
      // result, not an encoding** — nothing is being said by a node sitting
      // above another one — so pinning it to the caller's order would trade a
      // legible diagram for an ordering that means nothing. The caller's order
      // still fixes what matters: the color of each node and the order of the
      // legend, neither of which the layout can touch.
      node={makeNode({ plotRight: plotWidth > 0 ? plotWidth - PLOT_MARGIN : 0, labelRoom })}
      link={renderLink}
      margin={{ top: PLOT_MARGIN, right: PLOT_MARGIN, bottom: PLOT_MARGIN, left: PLOT_MARGIN }}
    >
      <Tooltip
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ChartTooltip formatValue={(v) => (typeof v === 'number' ? formatValue(v) : String(v ?? ''))} />}
      />
    </RechartsSankey>
  )
}
