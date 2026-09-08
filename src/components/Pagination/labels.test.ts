import { describe, expect, it } from 'vitest'

import { clampPage, pageBounds, pageCount, pageCountLabel, pageSizeLabel, rangeLabel } from './labels'

/**
 * A pagination bar is a component whose whole job is to be numerically true,
 * and every way it can be wrong renders perfectly. "91 – 100 of 95 items" is
 * laid out correctly, spaced correctly, and a lie. So the arithmetic is pulled
 * out here and pinned, and the stories are left to prove the geometry.
 */

describe('pageCount', () => {
  it('divides, rounding up so a partial last page still counts', () => {
    expect(pageCount(100, 10)).toBe(10)
    expect(pageCount(95, 10)).toBe(10)
    expect(pageCount(101, 10)).toBe(11)
  })

  /**
   * An empty set still has a page 1. The page Select needs an option to sit on,
   * and "page 0 of 0 pages" reads as a component that failed to load rather
   * than as a table with nothing in it.
   */
  it('never returns zero', () => {
    expect(pageCount(0, 10)).toBe(1)
    expect(pageCount(100, 0)).toBe(1)
  })
})

describe('clampPage', () => {
  it('brings a page inside the range', () => {
    expect(clampPage(0, 10)).toBe(1)
    expect(clampPage(11, 10)).toBe(10)
    expect(clampPage(3, 10)).toBe(3)
  })

  /**
   * The case this exists for: a controlled `page` that outlived its page size.
   * Sitting on page 4 of a 30-item set at 10 per page, then dropping to 50 per
   * page, leaves page 4 pointing at nothing.
   */
  it('rescues a stale controlled page', () => {
    expect(clampPage(4, pageCount(30, 50))).toBe(1)
  })
})

describe('pageBounds', () => {
  it('numbers the items on a full page', () => {
    expect(pageBounds(1, 10, 100)).toEqual({ start: 1, end: 10 })
    expect(pageBounds(3, 10, 100)).toEqual({ start: 21, end: 30 })
  })

  it('stops the last page at the total, not at the page size', () => {
    expect(pageBounds(10, 10, 95)).toEqual({ start: 91, end: 95 })
  })

  it('has no bounds to give for an empty set', () => {
    expect(pageBounds(1, 10, 0)).toEqual({ start: 0, end: 0 })
  })
})

describe('rangeLabel', () => {
  /**
   * Byte for byte the string Figma draws on node 40004379:65926 — the
   * separator is U+2013 with a space either side, which is why it is asserted
   * by codepoint here as well as by eye.
   */
  it('matches the drawn string exactly', () => {
    const label = rangeLabel(1, 10, 100)
    expect(label).toBe('1 – 10 of 100 items')
    expect(label.codePointAt(2)).toBe(8211)
  })

  it('shortens the last page to the items that are actually there', () => {
    expect(rangeLabel(10, 10, 95)).toBe('91 – 95 of 95 items')
  })

  /** `5 – 5` is one fact spelled twice, and it looks like a bug. */
  it('collapses a page holding a single item', () => {
    expect(rangeLabel(10, 10, 91)).toBe('91 of 91 items')
  })

  it('says nothing about a range when there is nothing', () => {
    expect(rangeLabel(1, 10, 0)).toBe('0 items')
  })

  it('drops the plural at one item', () => {
    expect(rangeLabel(1, 10, 1)).toBe('1 of 1 item')
  })
})

describe('pageCountLabel', () => {
  it('matches the drawn string', () => {
    expect(pageCountLabel(10)).toBe('of 10 pages')
  })

  it('drops the plural at one page', () => {
    expect(pageCountLabel(1)).toBe('of 1 page')
  })
})

describe('pageSizeLabel', () => {
  it('matches the drawn string', () => {
    expect(pageSizeLabel(10)).toBe('10 per page')
  })
})
