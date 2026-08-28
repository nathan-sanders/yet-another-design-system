import { describe, expect, it } from 'vitest'

import { barSegment, BAR_SEGMENT_GAP } from './bars'

/**
 * The stacked-bar geometry, pinned.
 *
 * This exists because of a bug a screenshot could not show. The gap between
 * segments was originally exempted on the *bottom* of the stack rather than the
 * top, which left the lowest two segments welded together — and at 1px, in a
 * chart of 31 columns, that is invisible to the eye and obvious to a
 * measurement. Every assertion here is about a number, not an appearance.
 */

/** Read the geometry back off the element the shape renderer returns. */
function geometry(element: ReturnType<ReturnType<typeof barSegment>>) {
  const props = element.props as Record<string, number | string | undefined>
  return {
    x: props.x as number,
    y: props.y as number,
    width: props.width as number,
    height: props.height as number,
    rx: props.rx as number,
    stroke: props.stroke as string | undefined,
  }
}

const BAR = { x: 100, y: 50, width: 18, height: 40, fill: 'red' }

describe('barSegment', () => {
  it('leaves an unstacked bar exactly as Recharts measured it', () => {
    const g = geometry(barSegment()(BAR))
    expect(g).toMatchObject({ x: 100, y: 50, width: 18, height: 40 })
  })

  /**
   * The regression. A middle segment gives up a pixel off its **top**, which is
   * what opens the space against the segment above it.
   */
  it('takes the gap off the top of a segment that is not the topmost', () => {
    const g = geometry(barSegment({ isTop: false, gap: BAR_SEGMENT_GAP })(BAR))
    expect(g.y).toBe(51)
    expect(g.height).toBe(39)
    // The bottom edge has not moved: 51 + 39 === 50 + 40.
    expect(g.y + g.height).toBe(BAR.y + BAR.height)
  })

  it('leaves the topmost segment whole, so the stack total stays accurate', () => {
    const g = geometry(barSegment({ isTop: true, gap: BAR_SEGMENT_GAP })(BAR))
    expect(g.y).toBe(50)
    expect(g.height).toBe(40)
  })

  /**
   * The property that actually matters, stated as a property: in a full stack
   * every neighbouring pair is separated by exactly the gap, and the bottom of
   * the stack has not moved off the baseline.
   */
  it('separates every pair in a stack and stays welded to the baseline', () => {
    const baseline = 250
    const heights = [60, 30, 15]
    let cursor = baseline
    const stack = heights.map((height, index) => {
      cursor -= height
      return geometry(
        barSegment({ isTop: index === heights.length - 1, gap: BAR_SEGMENT_GAP })({
          x: 0,
          y: cursor,
          width: 18,
          height,
          fill: 'red',
        }),
      )
    })

    const sorted = [...stack].sort((a, b) => a.y - b.y)
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].y - (sorted[i].y + sorted[i].height)
      expect(gap).toBe(BAR_SEGMENT_GAP)
    }

    const lowest = sorted[sorted.length - 1]
    expect(lowest.y + lowest.height).toBe(baseline)
  })

  it('clamps the radius so a short segment is a capsule, never a broken arc', () => {
    expect(geometry(barSegment()({ ...BAR, height: 40 })).rx).toBe(4)
    expect(geometry(barSegment()({ ...BAR, height: 5 })).rx).toBe(2.5)
    expect(geometry(barSegment()({ ...BAR, height: 2 })).rx).toBe(1)
    // Narrow bars clamp on width instead.
    expect(geometry(barSegment()({ ...BAR, width: 3 })).rx).toBe(1.5)
  })

  it('normalises a below-axis bar into a positive rectangle', () => {
    const g = geometry(barSegment()({ x: 10, y: 100, width: 18, height: -30, fill: 'red' }))
    expect(g.y).toBe(70)
    expect(g.height).toBe(30)
    expect(g.width).toBe(18)
  })

  it('draws nothing for a zero-height segment rather than an invisible sliver', () => {
    const element = barSegment()({ ...BAR, height: 0 })
    expect(element.type).toBe('g')
  })

  it('only carries the accessibility border when asked', () => {
    expect(geometry(barSegment()(BAR)).stroke).toBeUndefined()
    expect(geometry(barSegment({ accessibilityBorder: true })(BAR)).stroke).toContain('accessibility-border')
  })
})
