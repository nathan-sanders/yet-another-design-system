import { describe, expect, it } from 'vitest'

import {
  ariaSort,
  nextSort,
  rowCountAttribute,
  rowIndex,
  selectAllState,
  sortLabel,
  sortRows,
  toggleAll,
  toggleKey,
} from './rows'

/**
 * None of this shows in a screenshot. A comparator that sorts numbers as text
 * looks like data in an order you did not expect; an `aria-rowindex` off by one
 * is announced confidently and wrongly to the one user who cannot check it.
 */

const get = <T,>(item: T, key: string) => (item as Record<string, never>)[key]

describe('nextSort', () => {
  it('cycles unsorted, ascending, descending, unsorted', () => {
    const a = nextSort(null, 'name')
    expect(a).toEqual({ key: 'name', direction: 'ascending' })
    const b = nextSort(a, 'name')
    expect(b).toEqual({ key: 'name', direction: 'descending' })
    expect(nextSort(b, 'name')).toBeNull()
  })

  /**
   * Sorting a different column starts that column fresh rather than inheriting
   * the old direction, which would make the first click on a new column do two
   * things at once.
   */
  it('starts a different column ascending', () => {
    expect(nextSort({ key: 'name', direction: 'descending' }, 'seats')).toEqual({
      key: 'seats',
      direction: 'ascending',
    })
  })
})

describe('ariaSort', () => {
  it('reports only the sorted column', () => {
    const sort = { key: 'name', direction: 'ascending' } as const
    expect(ariaSort(sort, 'name')).toBe('ascending')
    expect(ariaSort(sort, 'seats')).toBe('none')
    expect(ariaSort(null, 'name')).toBe('none')
  })
})

describe('sortLabel', () => {
  it('names the column, and states the order when it is the sorted one', () => {
    expect(sortLabel('Seats', null, 'seats')).toBe('Sort by Seats')
    expect(sortLabel('Seats', { key: 'seats', direction: 'descending' }, 'seats')).toBe(
      'Sorted by Seats, descending',
    )
    expect(sortLabel('Seats', { key: 'name', direction: 'ascending' }, 'seats')).toBe('Sort by Seats')
  })
})

describe('sortRows', () => {
  const rows = [{ n: 9 }, { n: 10 }, { n: 1 }]

  /** The whole reason there is a comparator: as text, "10" sorts before "9". */
  it('sorts numbers as numbers', () => {
    expect(sortRows(rows, { key: 'n', direction: 'ascending' }, get).map((r) => r.n)).toEqual([1, 9, 10])
    expect(sortRows(rows, { key: 'n', direction: 'descending' }, get).map((r) => r.n)).toEqual([10, 9, 1])
  })

  it('sorts strings by locale', () => {
    const names = [{ s: 'Zoe' }, { s: 'Ärgen' }, { s: 'Adam' }]
    expect(sortRows(names, { key: 's', direction: 'ascending' }, get).map((r) => r.s)).toEqual([
      'Adam',
      'Ärgen',
      'Zoe',
    ])
  })

  it('sorts dates by their time value', () => {
    const older = new Date('2025-01-01')
    const newer = new Date('2026-03-01')
    // getTime(), not getFullYear() — the latter reads a UTC date in the local
    // zone, so this test would pass in London and fail in New York.
    expect(sortRows([{ d: newer }, { d: older }], { key: 'd', direction: 'ascending' }, get)[0].d).toBe(older)
  })

  /**
   * A missing value is not a small one, so it goes last either way. Flipping
   * the direction should not march the blank rows to the top — the question
   * was about the values, and these rows have none.
   */
  it('puts empty values last in both directions', () => {
    const sparse = [{ v: null }, { v: 2 }, { v: undefined }, { v: 1 }]
    expect(sortRows(sparse, { key: 'v', direction: 'ascending' }, get).map((r) => r.v)).toEqual([
      1,
      2,
      null,
      undefined,
    ])
    expect(sortRows(sparse, { key: 'v', direction: 'descending' }, get).slice(0, 2).map((r) => r.v)).toEqual([
      2, 1,
    ])
  })

  it('returns the data untouched when nothing is sorted', () => {
    expect(sortRows(rows, null, get)).toBe(rows)
  })

  /** `Array.prototype.sort` mutates, and the caller's array is not ours. */
  it('does not reorder the array it was given', () => {
    const original = [...rows]
    sortRows(rows, { key: 'n', direction: 'ascending' }, get)
    expect(rows).toEqual(original)
  })
})

describe('row numbering', () => {
  /**
   * ARIA counts the header row. The off-by-one here is the kind nothing
   * catches, because the only way to see it is to listen.
   */
  it('makes the first body row 2, not 1', () => {
    expect(rowIndex(1, 0)).toBe(2)
    expect(rowIndex(1, 4)).toBe(6)
  })

  it('offsets a windowed view by where its first row really is', () => {
    // Page 3 of 20-row pages: the first rendered row is row 41 of the data.
    expect(rowIndex(41, 0)).toBe(42)
  })

  it('counts the header row in the total, and passes ARIA -1 through', () => {
    expect(rowCountAttribute(200)).toBe(201)
    expect(rowCountAttribute(-1)).toBe(-1)
    expect(rowCountAttribute(undefined)).toBeUndefined()
  })
})

describe('selectAllState', () => {
  it('is unchecked when nothing is selected', () => {
    expect(selectAllState(0, 5)).toEqual({ checked: false, indeterminate: false })
  })

  it('is indeterminate when some are', () => {
    expect(selectAllState(2, 5)).toEqual({ checked: false, indeterminate: true })
  })

  it('is checked when all are', () => {
    expect(selectAllState(5, 5)).toEqual({ checked: true, indeterminate: false })
  })

  /** There is nothing partial about nothing. */
  it('is unchecked, not indeterminate, for an empty table', () => {
    expect(selectAllState(0, 0)).toEqual({ checked: false, indeterminate: false })
  })
})

describe('toggleKey', () => {
  it('adds and removes', () => {
    expect(toggleKey([], 'a', true)).toEqual(['a'])
    expect(toggleKey(['a', 'b'], 'a', false)).toEqual(['b'])
  })

  /** The bug a `filter`/`concat` pair would have: a key selected twice. */
  it('cannot select the same row twice', () => {
    expect(toggleKey(['a'], 'a', true)).toEqual(['a'])
  })
})

describe('toggleAll', () => {
  it('selects everything from empty and from partial', () => {
    expect(toggleAll([], ['a', 'b'])).toEqual(['a', 'b'])
    // From indeterminate it fills rather than clears: a partial selection is
    // usually one in progress, and re-picking six rows is the expensive undo.
    expect(toggleAll(['a'], ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('clears when everything is already selected', () => {
    expect(toggleAll(['a', 'b'], ['a', 'b'])).toEqual([])
  })
})
