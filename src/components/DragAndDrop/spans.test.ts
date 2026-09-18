import { describe, expect, it } from 'vitest'

import { COL_SPAN, MAX_BLOCKS_PER_ROW, canAddBlock, distribute, maxSpan, reflow, resize } from './spans'

/**
 * The Dashboard story proves a block *renders* at its span. What it cannot
 * cheaply prove is the sharing rule — a wrong remainder is a row that looks
 * fine with three blocks and leaves a gap with five.
 */
describe('distribute', () => {
  it('shares twelve columns evenly', () => {
    expect(distribute(1)).toEqual([12])
    expect(distribute(2)).toEqual([6, 6])
    expect(distribute(3)).toEqual([4, 4, 4])
    expect(distribute(4)).toEqual([3, 3, 3, 3])
  })

  it('gives the remainder to the last block so the row closes on the right', () => {
    expect(distribute(5)).toEqual([2, 2, 2, 2, 4])
    expect(distribute(3, 10)).toEqual([3, 3, 4])
  })

  it('is empty for no blocks', () => {
    expect(distribute(0)).toEqual([])
    expect(distribute(-1)).toEqual([])
  })

  it('never produces a span the class map cannot draw, up to the row limit', () => {
    for (let count = 1; count <= MAX_BLOCKS_PER_ROW; count++) {
      for (const span of distribute(count)) {
        expect(COL_SPAN[span as keyof typeof COL_SPAN]).toBe(`col-span-${span}`)
      }
    }
  })
})

describe('canAddBlock', () => {
  it('closes the row at four', () => {
    expect(MAX_BLOCKS_PER_ROW).toBe(4)
    expect(canAddBlock(3)).toBe(true)
    expect(canAddBlock(4)).toBe(false)
  })
})

describe('resize', () => {
  it('snaps the block and gives the rest to the right neighbour', () => {
    expect(resize([6, 6], 0, 7)).toEqual([7, 5])
    expect(resize([6, 6], 0, 4)).toEqual([4, 8])
  })

  it('shares the remainder among the right neighbours in proportion', () => {
    // [4, 4, 4] → the left block takes 6, the two on the right split 6 evenly.
    expect(resize([4, 4, 4], 0, 6)).toEqual([6, 3, 3])
    // A wide neighbour stays the wide one.
    expect(resize([3, 3, 6], 0, 5)).toEqual([5, 3, 4])
  })

  it('never lets a right neighbour fall below the minimum', () => {
    expect(resize([6, 6], 0, 11)).toEqual([9, 3])
    expect(resize([3, 3, 3, 3], 0, 12)).toEqual([3, 3, 3, 3])
    expect(maxSpan([3, 3, 3, 3], 0)).toBe(3)
    expect(maxSpan([6, 6], 0)).toBe(9)
    expect(maxSpan([3, 3, 6], 1)).toBe(6)
  })

  it('never lets the block itself fall below the minimum', () => {
    expect(resize([6, 6], 0, 1)).toEqual([3, 9])
  })

  it('leaves the blocks to the left alone', () => {
    expect(resize([3, 3, 6], 1, 5)).toEqual([3, 5, 4])
  })

  it('always closes the row', () => {
    for (const spans of [[6, 6], [4, 4, 4], [3, 3, 3, 3], [3, 3, 6], [5, 4, 3]]) {
      for (let index = 0; index < spans.length - 1; index++) {
        for (let next = 0; next <= 12; next++) {
          const out = resize(spans, index, next)
          expect(out.reduce((a, b) => a + b, 0)).toBe(12)
          expect(Math.min(...out)).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('returns the same reference when nothing changes', () => {
    const spans = [6, 6]
    expect(resize(spans, 0, 6)).toBe(spans)
    expect(resize(spans, 1, 9)).toBe(spans)
  })
})

describe('reflow', () => {
  const none = new Set<string>()

  it('shares evenly when nothing was sized by hand', () => {
    expect(reflow(['a', 'b', 'c'], {}, none)).toEqual([4, 4, 4])
  })

  it('keeps a hand-sized block and re-shares the rest', () => {
    // `a` was dragged to 3 in a row of two; a third block arrives.
    expect(reflow(['a', 'b', 'c'], { a: 3, b: 9 }, new Set(['a']))).toEqual([3, 4, 5])
    // The hand-sized block need not be first.
    expect(reflow(['a', 'b', 'c'], { b: 6 }, new Set(['b']))).toEqual([3, 6, 3])
  })

  it('a lone block takes the row, hand-sized or not', () => {
    expect(reflow(['a'], { a: 3 }, new Set(['a']))).toEqual([12])
  })

  it('when every block was hand-sized the last one closes the row', () => {
    expect(reflow(['a', 'b'], { a: 5, b: 7 }, new Set(['a', 'b']))).toEqual([5, 7])
    expect(reflow(['a', 'b'], { a: 5, b: 3 }, new Set(['a', 'b']))).toEqual([5, 7])
  })

  it('gives up on hand sizes that leave the others no room', () => {
    expect(reflow(['a', 'b', 'c'], { a: 9 }, new Set(['a']))).toEqual([4, 4, 4])
    expect(reflow(['a', 'b'], { a: 10, b: 10 }, new Set(['a', 'b']))).toEqual([6, 6])
  })

  it('ignores a manual flag with no span behind it', () => {
    expect(reflow(['a', 'b'], {}, new Set(['a']))).toEqual([6, 6])
  })
})
