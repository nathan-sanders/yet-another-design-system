import { describe, expect, it } from 'vitest'

import { barSegment, horizontalBarHeight, BAR_ROW_HEIGHT, BAR_SEGMENT_GAP } from './bars'

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
   * every neighboring pair is separated by exactly the gap, and the bottom of
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

  it('normalizes a below-axis bar into a positive rectangle', () => {
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
    expect(geometry(barSegment({ accessibilityOverlay: true })(BAR)).stroke).toContain('accessibility-overlay')
  })

  /**
   * The same rule turned on its side. `HorizontalBar` stacks left to right, so
   * the gap comes off the **right** edge and the rightmost segment is the whole
   * one. Recharts hands the shape the same props; only the axis it grows along
   * has changed, and so the assertions are the vertical ones on x and width.
   */
  describe('horizontal', () => {
    const ROW = { x: 100, y: 50, width: 40, height: 18, fill: 'red' }

    it('takes the gap off the right of a segment that is not the rightmost', () => {
      const g = geometry(barSegment({ orientation: 'horizontal', isTop: false, gap: BAR_SEGMENT_GAP })(ROW))
      expect(g.x).toBe(100)
      expect(g.width).toBe(39)
      // The top and bottom edges have not moved.
      expect(g.y).toBe(50)
      expect(g.height).toBe(18)
    })

    it('leaves the rightmost segment whole', () => {
      const g = geometry(barSegment({ orientation: 'horizontal', isTop: true, gap: BAR_SEGMENT_GAP })(ROW))
      expect(g).toMatchObject({ x: 100, width: 40 })
    })

    it('separates every pair in a row and stays welded to the left baseline', () => {
      const baseline = 56
      const widths = [120, 60, 30]
      let cursor = baseline
      const row = widths.map((width, index) => {
        const segment = geometry(
          barSegment({ orientation: 'horizontal', isTop: index === widths.length - 1, gap: BAR_SEGMENT_GAP })({
            x: cursor,
            y: 0,
            width,
            height: 18,
            fill: 'red',
          }),
        )
        cursor += width
        return segment
      })

      for (let i = 0; i < row.length - 1; i++) {
        const gap = row[i + 1].x - (row[i].x + row[i].width)
        expect(gap).toBe(BAR_SEGMENT_GAP)
      }
      expect(row[0].x).toBe(baseline)
    })

    it('normalizes a left-of-axis bar into a positive rectangle', () => {
      const g = geometry(barSegment({ orientation: 'horizontal' })({ x: 100, y: 50, width: -30, height: 18, fill: 'red' }))
      expect(g.x).toBe(70)
      expect(g.width).toBe(30)
      expect(g.height).toBe(18)
    })
  })
})

/**
 * The default height follows the rows, the way a table's does. Pinned as
 * arithmetic because every way it can be wrong renders perfectly.
 */
describe('horizontalBarHeight', () => {
  it('gives a single or stacked chart one table row per category, plus the axis', () => {
    expect(horizontalBarHeight(8)).toBe(8 * BAR_ROW_HEIGHT + 34)
    expect(horizontalBarHeight(8, { seriesCount: 3, stacked: true })).toBe(8 * BAR_ROW_HEIGHT + 34)
  })

  it('grows a grouped row so each of its bars still reaches 16', () => {
    // Three bars at 16 with two 4px gaps is 56, and the band only spends 80% of
    // itself on bars, so the row is 70.
    expect(horizontalBarHeight(4, { seriesCount: 3 })).toBe(4 * 70 + 34)
  })

  it('never collapses to the chrome alone', () => {
    expect(horizontalBarHeight(0)).toBe(BAR_ROW_HEIGHT + 34)
  })
})
