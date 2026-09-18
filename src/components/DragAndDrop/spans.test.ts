import { describe, expect, it } from 'vitest'

import { COL_SPAN, MAX_BLOCKS_PER_ROW, canAddBlock, distribute } from './spans'

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
