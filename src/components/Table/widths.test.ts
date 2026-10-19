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
   * A percentage of the proportional share, even beside pixel columns — 50%
   * each here, of a table that is 64px wider than the space they share. That
   * over-ask is deliberate: under `table-fixed` Chromium pays the pixel column
   * first and scales the percentages down to fit the rest. The `calc()` this
   * used to emit, `calc((100% - 64px) * 0.5)`, is ignored on a `<col>`, which
   * flattened every weight to an equal share. The `ProportionalWidths` story
   * measures the rendered result; this only pins the string.
   */
  it('keeps percentages of the share beside pixel columns', () => {
    const widths = resolveWidths([
      { key: 'icon', width: pixel(64) },
      { key: 'a', width: proportional(2) },
      { key: 'b' },
    ])
    expect(widths.map((w) => w.css)).toEqual(['64px', `${(2 / 3) * 100}%`, `${(1 / 3) * 100}%`])
  })

  it('never emits a calc', () => {
    const widths = resolveWidths([
      { key: 'a', width: proportional(2.4) },
      { key: 'b', width: proportional(1.4) },
      { key: 'c', width: pixel(130) },
    ])
    for (const width of widths) expect(width.css).not.toContain('calc')
  })

  it('lets a resized column beat both', () => {
    const widths = resolveWidths([{ key: 'a' }, { key: 'b' }], { a: 300 })
    expect(widths[0].css).toBe('300px')
    // b is now the only proportional column, so it takes all of what is left.
    expect(widths[1].css).toBe('100%')
  })
})

describe('tableMinWidth', () => {
  it('sums the floors of equal shares', () => {
    expect(tableMinWidth([{ key: 'a' }, { key: 'b' }])).toBe(MIN_COLUMN_WIDTH * 2)
  })

  /**
   * Summing the floors is only right when the shares are equal. At 240px a
   * 2 : 1 pair splits 160 / 80, and the lighter column is under its floor. The
   * leftover has to be 360 for the 1-share column to get its 120.
   */
  it('grows the leftover until the lightest share meets its floor', () => {
    const columns = [
      { key: 'a', width: proportional(2) },
      { key: 'b', width: proportional(1) },
      { key: 'icon', width: pixel(64) },
    ]
    expect(tableMinWidth(columns)).toBe(MIN_COLUMN_WIDTH * 3 + 64)
  })

  it('honors a heavier column with a higher floor', () => {
    // a needs 300 of a 2/3 share, so the leftover is 450 and b gets 150.
    const columns = [
      { key: 'a', width: proportional(2, 300) },
      { key: 'b', width: proportional(1) },
    ]
    expect(tableMinWidth(columns)).toBe(450)
  })

  it('does not round float noise up a pixel', () => {
    const columns = [
      { key: 'a', width: proportional(0.1) },
      { key: 'b', width: proportional(0.2) },
    ]
    expect(tableMinWidth(columns)).toBe(MIN_COLUMN_WIDTH * 3)
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
