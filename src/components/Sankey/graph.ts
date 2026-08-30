/**
 * Turning a named graph into the shape Recharts wants.
 *
 * **Recharts' `Sankey` addresses nodes by their position in the array** — a link
 * is `{ source: 0, target: 2, value: n }`. That is a fine internal
 * representation and a poor API: a caller who writes `source: 3` has written
 * something that silently means a different node the moment one is inserted
 * above it, and nothing about the resulting diagram looks wrong.
 *
 * So the component takes flows by node *key* and this module resolves them.
 * It lives in its own file, with its own tests, for the reason `HeatMap`'s
 * `scale.ts` does: **none of its failures is visible.** A link joined to the
 * wrong node draws a perfectly plausible diagram, and there is nothing in the
 * picture to compare it against.
 */

import type { ResolvedChartSeries } from '../Chart'

/** One flow, by node key. */
export interface SankeyFlow {
  /** The key of the node it leaves. */
  source: string
  /** The key of the node it arrives at. */
  target: string
  value: number
}

/**
 * A node as Recharts receives it.
 *
 * `name` is what Recharts reads for the tooltip (its `nameKey` defaults to it).
 * `groupColor` is read by `ChartTooltip`'s `pickColor` — see the note there:
 * a chart whose *marks* carry the color rather than its series has to put it on
 * the datum, or every swatch in the tooltip paints in `currentColor`, which is
 * the text color.
 */
export interface SankeyNodeDatum extends Record<string, unknown> {
  name: string
  nodeKey: string
  groupColor: string
}

/** A link as Recharts receives it: endpoints as indices, color already resolved. */
export interface SankeyLinkDatum extends Record<string, unknown> {
  source: number
  target: number
  value: number
  groupColor: string
}

export interface SankeyGraph {
  nodes: SankeyNodeDatum[]
  links: SankeyLinkDatum[]
  /**
   * Flows that could not be drawn, and why.
   *
   * Returned rather than thrown. A chart is not worth taking a page down for,
   * and it is not worth silently drawing wrong either — the component reports
   * these once, and a test can assert on them, which console noise cannot.
   */
  dropped: { flow: SankeyFlow; reason: 'unknown-source' | 'unknown-target' | 'self-referential' }[]
}

/**
 * Resolve flows against a node list.
 *
 * **A link takes its source node's color**, at the opacity the component
 * applies. Categorical color means identity, and a flow's identity is where it
 * came from — reading a ribbon back to its origin is the question a Sankey
 * exists to answer. Figma draws no Sankey, so this is a decision the library
 * made rather than one the file settled; see the record.
 */
export function toSankeyGraph(
  series: readonly ResolvedChartSeries[],
  flows: readonly SankeyFlow[],
): SankeyGraph {
  const index = new Map(series.map((s, i) => [s.key, i]))

  const nodes: SankeyNodeDatum[] = series.map((s) => ({
    name: s.label,
    nodeKey: s.key,
    groupColor: s.color,
  }))

  const links: SankeyLinkDatum[] = []
  const dropped: SankeyGraph['dropped'] = []

  for (const flow of flows) {
    const source = index.get(flow.source)
    const target = index.get(flow.target)

    if (source === undefined) {
      dropped.push({ flow, reason: 'unknown-source' })
      continue
    }
    if (target === undefined) {
      dropped.push({ flow, reason: 'unknown-target' })
      continue
    }
    // A node flowing into itself has no depth to advance to, and the layout
    // solver loops rather than failing — so it is caught here instead.
    if (source === target) {
      dropped.push({ flow, reason: 'self-referential' })
      continue
    }

    links.push({ source, target, value: flow.value, groupColor: series[source].color })
  }

  return { nodes, links, dropped }
}

/**
 * How many columns the diagram will have.
 *
 * A node's column is the **longest** path that reaches it, which is what
 * Recharts' layout uses too — so this reproduces its column count without
 * waiting for it to lay the diagram out.
 *
 * It is needed for one thing: a label has to know how much room it has before
 * it runs into the next column. Checking only the plot's edges is not enough
 * and looks like it is — at a wide size every label fits either way, and the
 * two rules only diverge once the columns are close together, which is exactly
 * when a label overrunning into its neighbour matters.
 *
 * The relaxation is capped at one pass per node so a cycle cannot spin. A cycle
 * is not a Sankey and Recharts' own layout does not survive one either, but
 * looping forever is a worse way to say so.
 */
export function depthCount(nodeCount: number, links: readonly { source: number; target: number }[]): number {
  if (nodeCount <= 0) return 0

  const depth = new Array<number>(nodeCount).fill(0)

  for (let pass = 0; pass < nodeCount; pass++) {
    let changed = false
    for (const link of links) {
      if (depth[link.target] < depth[link.source] + 1) {
        depth[link.target] = depth[link.source] + 1
        changed = true
      }
    }
    if (!changed) break
  }

  return Math.max(...depth) + 1
}
