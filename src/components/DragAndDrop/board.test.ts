import { describe, expect, it } from 'vitest'

import {
  addBlock,
  createBoard,
  dragEnd,
  dragOver,
  removeBlock,
  resizeBlock,
  resizeRow,
  rowSpans,
} from './board'

/**
 * `spans.test.ts` pins the arithmetic of one row and `move.test.ts` one move.
 * This pins how they compose across a whole board — which rows re-share and
 * which keep what they had, because that is the part a story would only ever
 * approve by eye.
 */
const board = createBoard({
  'row-1': ['a', 'b'],
  'row-2': ['c', 'd', 'e'],
  'row-3': ['f'],
})

describe('createBoard', () => {
  it('shares every row out evenly', () => {
    expect(rowSpans(board, 'row-1')).toEqual([6, 6])
    expect(rowSpans(board, 'row-2')).toEqual([4, 4, 4])
    expect(rowSpans(board, 'row-3')).toEqual([12])
    expect(board.order).toEqual(['row-1', 'row-2', 'row-3'])
  })
})

describe('resizeBlock', () => {
  it('resizes by the column and marks the block hand-sized', () => {
    const next = resizeBlock(board, 'a', 9)
    expect(rowSpans(next, 'row-1')).toEqual([9, 3])
    expect(next.manual).toEqual(['a'])
  })

  it('a hand-sized block keeps its span when the row changes, the others re-share', () => {
    const next = addBlock(resizeBlock(board, 'a', 3), 'row-1', 'g')
    expect(rowSpans(next, 'row-1')).toEqual([3, 4, 5])
    expect(rowSpans(removeBlock(next, 'g'), 'row-1')).toEqual([3, 9])
  })

  it('leaves the other rows exactly as they were', () => {
    const next = resizeBlock(board, 'a', 9)
    expect(next.containers['row-2']).toBe(board.containers['row-2'])
    expect(rowSpans(next, 'row-2')).toEqual([4, 4, 4])
  })
})

describe('dragOver / dragEnd', () => {
  it('carries a block into another row while still carried, and both rows re-share', () => {
    const next = dragOver(board, 'a', 'c')
    expect(next.containers['row-1']).toEqual(['b'])
    expect(next.containers['row-2']).toEqual(['a', 'c', 'd', 'e'])
    expect(rowSpans(next, 'row-1')).toEqual([12])
    expect(rowSpans(next, 'row-2')).toEqual([3, 3, 3, 3])
  })

  it('a carried hand-sized block keeps its span in the row it joins', () => {
    const next = dragOver(resizeBlock(board, 'a', 3), 'a', 'row-2')
    // Four blocks with one held at 3 leaves 9 for the other three: 3 each.
    expect(rowSpans(next, 'row-2')).toEqual([3, 3, 3, 3])
    expect(next.manual).toEqual(['a'])
  })

  it('does nothing within one row until the drop', () => {
    expect(dragOver(board, 'c', 'e')).toBe(board)
    const dropped = dragEnd(board, 'c', 'e')
    expect(dropped.containers['row-2']).toEqual(['d', 'e', 'c'])
    // A reorder keeps every span.
    expect(rowSpans(dropped, 'row-2')).toEqual([4, 4, 4])
  })

  it('drops the row a block left empty, on the drop and not before', () => {
    const carried = dragOver(board, 'f', 'a')
    expect(carried.order).toEqual(['row-1', 'row-2', 'row-3'])
    expect(carried.containers['row-3']).toEqual([])
    const dropped = dragEnd(carried, 'f', 'a')
    expect(dropped.order).toEqual(['row-1', 'row-2'])
  })

  it('a drop with no target leaves the board as it was', () => {
    expect(dragEnd(board, 'a', null)).toBe(board)
  })

  it('a block left alone in its row forgets its hand size', () => {
    const sized = resizeBlock(board, 'a', 9)
    const next = dragEnd(sized, 'b', 'c')
    expect(rowSpans(next, 'row-1')).toEqual([12])
    expect(next.manual).toEqual([])
  })
})

describe('addBlock / removeBlock / resizeRow', () => {
  it('adds a row when the row is new', () => {
    const next = addBlock(board, 'row-4', 'g')
    expect(next.order).toEqual(['row-1', 'row-2', 'row-3', 'row-4'])
    expect(rowSpans(next, 'row-4')).toEqual([12])
  })

  it('removing the last block removes the row', () => {
    const next = removeBlock(board, 'f')
    expect(next.order).toEqual(['row-1', 'row-2'])
    expect(removeBlock(board, 'zzz')).toBe(board)
  })

  it('records a row height, and only when it changes', () => {
    const next = resizeRow(board, 'row-1', 300)
    expect(next.heights['row-1']).toBe(300)
    expect(resizeRow(next, 'row-1', 300)).toBe(next)
  })
})
