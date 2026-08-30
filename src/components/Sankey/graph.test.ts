import { describe, expect, it } from 'vitest'

import { resolveSeries } from '../Chart'
import { depthCount, nodeDepths, toSankeyGraph } from './graph'

/**
 * The key → index translation, pinned.
 *
 * Same reasoning as `HeatMap`'s `scale.test.ts`: every failure here draws a
 * diagram that looks completely reasonable. A link joined to the wrong node is
 * invisible in a screenshot, in a type check and to axe.
 */

const NODES = resolveSeries(
  [
    { key: 'a', label: 'Alpha' },
    { key: 'b', label: 'Beta' },
    { key: 'c', label: 'Gamma' },
  ],
  'colorSwatch',
)

describe('toSankeyGraph', () => {
  it('resolves keys to the positions Recharts addresses nodes by', () => {
    const { nodes, links, dropped } = toSankeyGraph(NODES, [
      { source: 'a', target: 'b', value: 10 },
      { source: 'b', target: 'c', value: 4 },
    ])

    expect(nodes.map((n) => n.nodeKey)).toEqual(['a', 'b', 'c'])
    expect(links).toEqual([
      { source: 0, target: 1, value: 10, groupColor: NODES[0].color },
      { source: 1, target: 2, value: 4, groupColor: NODES[1].color },
    ])
    expect(dropped).toEqual([])
  })

  it('follows the node list when it is reordered, rather than the old indices', () => {
    // The whole reason the API takes keys. Written as indices, this flow would
    // still say `0 → 1` and would now mean something else entirely.
    const reordered = resolveSeries(
      [
        { key: 'c', label: 'Gamma' },
        { key: 'a', label: 'Alpha' },
        { key: 'b', label: 'Beta' },
      ],
      'colorSwatch',
    )

    const { links } = toSankeyGraph(reordered, [{ source: 'a', target: 'b', value: 10 }])
    expect(links).toEqual([{ source: 1, target: 2, value: 10, groupColor: reordered[1].color }])
  })

  it('paints a link with the color of the node it left', () => {
    const { links } = toSankeyGraph(NODES, [
      { source: 'a', target: 'c', value: 1 },
      { source: 'b', target: 'c', value: 1 },
    ])

    // Two ribbons arriving at the same node keep the colors they left with.
    expect(links[0].groupColor).toBe(NODES[0].color)
    expect(links[1].groupColor).toBe(NODES[1].color)
    expect(links[0].groupColor).not.toBe(links[1].groupColor)
  })

  it('drops a flow naming a node that does not exist, and says so', () => {
    const { links, dropped } = toSankeyGraph(NODES, [
      { source: 'a', target: 'b', value: 10 },
      { source: 'nope', target: 'b', value: 5 },
      { source: 'a', target: 'nope', value: 5 },
    ])

    expect(links).toHaveLength(1)
    expect(dropped.map((d) => d.reason)).toEqual(['unknown-source', 'unknown-target'])
    // Reported rather than thrown — a typo in one row should not take the page
    // down — and reported as data rather than as console noise, which nobody
    // reads to the bottom of.
    expect(dropped[0].flow.source).toBe('nope')
  })

  it('drops a self-referential flow', () => {
    // It has no depth to advance to, and the layout solver spins rather than
    // failing, so it never reaches the point of looking wrong.
    const { links, dropped } = toSankeyGraph(NODES, [{ source: 'a', target: 'a', value: 3 }])

    expect(links).toEqual([])
    expect(dropped).toEqual([{ flow: { source: 'a', target: 'a', value: 3 }, reason: 'self-referential' }])
  })
})

describe('depthCount', () => {
  it('counts columns by the longest path, not the shortest', () => {
    // 0 → 1 → 2 and 0 → 2. Node 2 sits in the third column because something
    // reaches it in two steps, even though something else reaches it in one.
    expect(depthCount(3, [{ source: 0, target: 1 }, { source: 1, target: 2 }, { source: 0, target: 2 }])).toBe(3)
  })

  it('is 1 for a graph with no flows', () => {
    expect(depthCount(4, [])).toBe(1)
    expect(depthCount(0, [])).toBe(0)
  })

  it('terminates on a cycle instead of relaxing forever', () => {
    // Not a Sankey, and Recharts cannot lay one out either — but looping is a
    // worse way to say so than returning a number.
    expect(depthCount(2, [{ source: 0, target: 1 }, { source: 1, target: 0 }])).toBeGreaterThan(0)
  })
})

describe('nodeDepths', () => {
  it('puts each node in the column its longest path reaches', () => {
    // Node 2 is reachable in one step and in two. It sits in the third column,
    // which is where Recharts puts it — the renderer has to agree with the
    // layout, because it decides label placement before the layout exists.
    expect(nodeDepths(3, [{ source: 0, target: 1 }, { source: 1, target: 2 }, { source: 0, target: 2 }])).toEqual([0, 1, 2])
  })

  it('leaves an unconnected node in the first column', () => {
    expect(nodeDepths(3, [{ source: 0, target: 1 }])).toEqual([0, 1, 0])
  })

  it('agrees with depthCount', () => {
    const links = [{ source: 0, target: 1 }, { source: 1, target: 2 }, { source: 0, target: 3 }]
    expect(Math.max(...nodeDepths(4, links)) + 1).toBe(depthCount(4, links))
  })
})
