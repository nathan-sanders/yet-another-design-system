import { describe, expect, it } from 'vitest'

import { depthOf, pickActive } from './scrollspy'

/**
 * The stories prove the rows are 40px tall and the indicator lands on the
 * marked link. What they cannot cheaply prove is the choice of *which* link —
 * every wrong answer below is an outline that looks right and marks the
 * section above or below the one the reader is in.
 */

// Five headings on a page, tops in viewport pixels once the page has scrolled.
const tops = [-400, -120, 0, 260, 900]

describe('pickActive', () => {
  it('marks the last heading whose top has reached the line', () => {
    expect(pickActive(tops, 0)).toBe(2)
    expect(pickActive(tops, 100)).toBe(2)
    expect(pickActive(tops, 300)).toBe(3)
  })

  it('marks the first heading before any has been reached', () => {
    expect(pickActive([80, 400, 900], 0)).toBe(0)
  })

  it('marks the last heading once every one has passed', () => {
    expect(pickActive(tops, 5000)).toBe(4)
  })

  it('shifts with a fixed-header offset', () => {
    // A 64px header: the heading at 60 is under it, so it counts as reached.
    expect(pickActive([-300, 60, 500], 64)).toBe(1)
    expect(pickActive([-300, 60, 500], 0)).toBe(0)
  })

  it('gives a smooth scroll one pixel of slack', () => {
    // Landed 0.6px short of the target: still the target, not the section before.
    expect(pickActive([-500, 0.6, 400], 0)).toBe(1)
    expect(pickActive([-500, 1.4, 400], 0)).toBe(0)
  })

  it('marks the last heading at the end of the scroll, reached or not', () => {
    // Scrolled to the bottom with the last heading still 300px below the line.
    expect(pickActive([-900, -400, 300], 0, true)).toBe(2)
    expect(pickActive([-900, -400, 300], 0, false)).toBe(1)
  })

  it('has nothing to mark in an empty list', () => {
    expect(pickActive([], 0, true)).toBe(-1)
    expect(pickActive([], 0)).toBe(-1)
  })
})

describe('depthOf', () => {
  it('sits h1 and h2 on the base indent and steps once per level after', () => {
    expect(depthOf(1)).toBe(0)
    expect(depthOf(2)).toBe(0)
    expect(depthOf(3)).toBe(1)
    expect(depthOf(4)).toBe(2)
    expect(depthOf(6)).toBe(4)
  })

  it('defaults to a section heading', () => {
    expect(depthOf()).toBe(0)
  })
})
