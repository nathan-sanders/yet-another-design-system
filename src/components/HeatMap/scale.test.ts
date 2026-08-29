import { describe, expect, it } from 'vitest'

import { monoScales } from '../Chart'
import { HEAT_STEPS, heatScale } from './scale'

/**
 * The heat map's whole encoding is this function, and none of its failures is
 * visible: a cell one step too dark looks exactly like a cell with a slightly
 * higher value. So every edge is pinned here rather than checked by eye.
 */

const RAMP = monoScales.a
const first = RAMP[0]
const last = RAMP[RAMP.length - 1]

describe('heatScale', () => {
  it('spreads the data across the whole ramp', () => {
    const color = heatScale([0, 50, 100])
    expect(color(0)).toBe(first)
    expect(color(100)).toBe(last)
    expect(color(50)).toBe(RAMP[Math.round((HEAT_STEPS - 1) / 2)])
  })

  /**
   * A missing value is not a zero. Figma draws nothing for an empty cell, and
   * painting it the lightest step would claim a measurement of "almost none"
   * where there was no measurement.
   */
  it('returns null for a missing value rather than the lightest step', () => {
    const color = heatScale([10, 20, 30])
    expect(color(null)).toBeNull()
    expect(color(undefined)).toBeNull()
    expect(color(Number.NaN)).toBeNull()
    expect(color(10)).toBe(first)
  })

  it('survives a flat grid without dividing by zero', () => {
    const color = heatScale([7, 7, 7])
    expect(color(7)).toBe(last)
  })

  it('survives an empty grid', () => {
    const color = heatScale([])
    expect(color(0)).toBe(last)
    expect(color(null)).toBeNull()
  })

  /**
   * An explicit domain narrower than the data is a deliberate choice — usually
   * holding the scale still across two charts — so values outside it belong at
   * the ends, not off the end of the array.
   */
  it('clamps to an explicit domain instead of indexing past the ramp', () => {
    const color = heatScale([0, 1000], { min: 0, max: 100 })
    expect(color(500)).toBe(last)
    expect(color(-50)).toBe(first)
    expect(color(100)).toBe(last)
  })

  it('only ever returns a color from the ramp it was given', () => {
    for (const scale of ['a', 'b', 'c'] as const) {
      const color = heatScale([0, 33, 66, 99], { scale })
      for (const value of [0, 12, 33, 47, 66, 80, 99]) {
        expect(monoScales[scale]).toContain(color(value))
      }
    }
  })

  it('holds the domain still when min and max are given', () => {
    // The same value must read the same in two charts that share a domain, even
    // when their own data spans differ — the reason the override exists.
    const a = heatScale([0, 40], { min: 0, max: 100 })
    const b = heatScale([60, 100], { min: 0, max: 100 })
    expect(a(40)).toBe(b(40))
  })
})
