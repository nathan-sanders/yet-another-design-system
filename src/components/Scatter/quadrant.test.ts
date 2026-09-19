import { describe, expect, it } from 'vitest'

import { describeQuadrant, quadrantOf, resolveThresholds } from './quadrant'

describe('resolveThresholds', () => {
  it('defaults each threshold to the midpoint of its drawn domain', () => {
    expect(resolveThresholds({}, [0, 2000], [0, 100])).toEqual({ x: 1000, y: 50 })
  })

  it('keeps a threshold the caller stated, and defaults only the other', () => {
    expect(resolveThresholds({ x: 300 }, [0, 2000], [0, 100])).toEqual({ x: 300, y: 50 })
    expect(resolveThresholds({ y: 80 }, [0, 2000], [0, 100])).toEqual({ x: 1000, y: 80 })
  })
})

describe('quadrantOf', () => {
  const at = { x: 1000, y: 50 }

  it('puts each corner in its box', () => {
    expect(quadrantOf({ x: 200, y: 90 }, at)).toBe('top-left')
    expect(quadrantOf({ x: 1800, y: 90 }, at)).toBe('top-right')
    expect(quadrantOf({ x: 200, y: 10 }, at)).toBe('bottom-left')
    expect(quadrantOf({ x: 1800, y: 10 }, at)).toBe('bottom-right')
  })

  /** A point on the line goes up and to the right: it has reached the threshold, not left it. */
  it('breaks a tie upward and rightward', () => {
    expect(quadrantOf({ x: 1000, y: 50 }, at)).toBe('top-right')
    expect(quadrantOf({ x: 999.99, y: 50 }, at)).toBe('top-left')
    expect(quadrantOf({ x: 1000, y: 49.99 }, at)).toBe('bottom-right')
  })
})

describe('describeQuadrant', () => {
  it('reads the end labels back as a sentence fragment', () => {
    const labels = { top: 'High impact', bottom: 'Low impact', left: 'Low effort', right: 'High effort' }
    expect(describeQuadrant('top-left', labels)).toBe('High impact · Low effort')
    expect(describeQuadrant('bottom-right', labels)).toBe('Low impact · High effort')
  })

  it('never leaves a cell empty when an end is unlabeled', () => {
    expect(describeQuadrant('bottom-left', { top: 'High' })).toBe('bottom · left')
    expect(describeQuadrant('top-right')).toBe('top · right')
  })
})
