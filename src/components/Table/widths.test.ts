import { describe, expect, it } from 'vitest'

import { applyResize, MIN_COLUMN_WIDTH, pixel, proportional, resolveWidths, tableMinWidth } from './widths'

/**
 * Column widths are the one place where being nearly right looks exactly like
 * being right until the table is narrow — and then the columns quietly overrun
 * their table. So the arithmetic is pinned here rather than eyeballed in a
 * story at one viewport width.
 */

describe('resolveWidths', () => {
  it('splits an all-proportional table by share', () => {
    const widths = resolveWidths([{ key: 'a' }, { key: 'b' }, { key: 'c' }])
    const third = `${(1 / 3) * 100}%`
    expect(widths.map((w) => w.css)).toEqual([third, third, third])
  })

  it('weights a proportional column by its value', () => {
    const widths = resolveWidths([
      { key: 'a', width: proportional(3) },
      { key: 'b', width: proportional(1) },
    ])
    expect(widths.map((w) => w.css)).toEqual(['75%', '25%'])
  })

  /**
   * The reason proportional columns resolve to a `calc` and not a percentage.
   * As percentages these two would be 50% each — 50% of a table that is 64px
   * wider than the space they actually have to share, so together they overrun
   * it by 64px at every table width.
   */
  it('subtracts the pixel columns before sharing the rest', () => {
    const widths = resolveWidths([
      { key: 'icon', width: pixel(64) },
      { key: 'a' },
      { key: 'b' },
    ])
    expect(widths.map((w) => w.css)).toEqual([
      '64px',
      'calc((100% - 64px) * 0.5)',
      'calc((100% - 64px) * 0.5)',
    ])
  })

  it('lets a resized column beat both', () => {
    const widths = resolveWidths([{ key: 'a' }, { key: 'b' }], { a: 300 })
    expect(widths[0].css).toBe('300px')
    // b is now the only proportional column, and a's 300px is fixed space.
    expect(widths[1].css).toBe('calc((100% - 300px) * 1)')
  })
})

describe('tableMinWidth', () => {
  it('sums the floors', () => {
    expect(tableMinWidth([{ key: 'a' }, { key: 'b' }])).toBe(MIN_COLUMN_WIDTH * 2)
  })

  /**
   * `pixel(n)` floors at `n` by default: a column asked for exactly 64px does
   * not want a 120px minimum quietly widening it.
   */
  it('floors a pixel column at its own width', () => {
    expect(tableMinWidth([{ key: 'icon', width: pixel(64) }])).toBe(64)
  })

  it('counts a resized column at the width it was dragged to', () => {
    expect(tableMinWidth([{ key: 'a' }], { a: 300 })).toBe(300)
  })
})

describe('applyResize', () => {
  it('adds the delta', () => {
    expect(applyResize({}, 'a', 200, 40, MIN_COLUMN_WIDTH)).toEqual({ a: 240 })
  })

  it('will not go below the floor', () => {
    expect(applyResize({}, 'a', 130, -100, MIN_COLUMN_WIDTH)).toEqual({ a: MIN_COLUMN_WIDTH })
  })

  it('keeps the other columns', () => {
    expect(applyResize({ b: 90 }, 'a', 200, 0, 50)).toEqual({ a: 200, b: 90 })
  })
})
