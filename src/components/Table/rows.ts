/**
 * The arithmetic a table does to its rows: what order they are in, which are
 * selected, and what number each one is.
 *
 * All of it is here rather than in `Table.tsx` because all of it fails
 * invisibly. A comparator that puts `10` before `9` looks like data. An
 * `aria-rowindex` off by one is announced confidently and wrongly. A select-all
 * that never reaches `mixed` looks like a checkbox that just does not work.
 */

export type TableSortDirection = 'ascending' | 'descending'

export interface TableSort {
  key: string
  direction: TableSortDirection
}

/** What a value has to be for the default comparator to order it. */
export type SortValue = string | number | Date | boolean | null | undefined

/**
 * Where the sort button takes you next: unsorted, ascending, descending, and
 * back to unsorted.
 *
 * The third click returns to the data's own order rather than sticking on
 * descending. A table's given order is often meaningful — a feed is newest
 * first, a checklist is in the order you do it in — and losing it with no way
 * back is losing information.
 */
export function nextSort(current: TableSort | null, key: string): TableSort | null {
  if (current?.key !== key) return { key, direction: 'ascending' }
  if (current.direction === 'ascending') return { key, direction: 'descending' }
  return null
}

/**
 * What goes in `aria-sort`.
 *
 * Only ever called for a column that can sort — a column with no sort control
 * gets no attribute at all, because `aria-sort="none"` on a column you cannot
 * sort announces an affordance that is not there.
 */
export function ariaSort(sort: TableSort | null, key: string): 'ascending' | 'descending' | 'none' {
  return sort?.key === key ? sort.direction : 'none'
}

/**
 * The sort button's accessible name.
 *
 * It names the *column*, because the button is one of several identical arrows
 * on the row and "Sort" alone would give a screen reader four buttons with the
 * same name. When the column is the sorted one the name states the current
 * order, so the state is available without hunting for the `aria-sort` on the
 * header around it.
 */
export function sortLabel(header: string, sort: TableSort | null, key: string): string {
  if (sort?.key !== key) return `Sort by ${header}`
  return `Sorted by ${header}, ${sort.direction}`
}

/**
 * Order the rows.
 *
 * ## Why it is not `String(a).localeCompare(String(b))`
 *
 * Because that sorts numbers as text, and "10" sorts before "9". Numbers are
 * compared as numbers, dates as their time value, and only strings go through
 * `localeCompare` — which is what gets "Ä" next to "A" instead of after "Z".
 *
 * ## Empty values sort last, in both directions
 *
 * A missing value is not a small one. Sorting a column ascending should not
 * fill the top of the table with rows that have nothing in that column, and
 * flipping to descending should not move them — the question was about the
 * values, and these rows have none.
 */
export function sortRows<T>(
  data: readonly T[],
  sort: TableSort | null,
  getValue: (item: T, key: string) => SortValue,
): readonly T[] {
  if (!sort) return data

  const direction = sort.direction === 'ascending' ? 1 : -1

  // A copy: `sort` mutates, and the caller's array is not ours to reorder.
  return [...data].sort((a, b) => {
    const left = getValue(a, sort.key)
    const right = getValue(b, sort.key)

    const leftEmpty = left === null || left === undefined || left === ''
    const rightEmpty = right === null || right === undefined || right === ''
    if (leftEmpty && rightEmpty) return 0
    if (leftEmpty) return 1
    if (rightEmpty) return -1

    return direction * compare(left, right)
  })
}

function compare(left: NonNullable<SortValue>, right: NonNullable<SortValue>): number {
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime()
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right)
  return String(left).localeCompare(String(right))
}

/* --------------------------------------------------------------- rowindex */

/**
 * The `aria-rowindex` for the *n*th rendered body row, and the `aria-rowcount`
 * for the table.
 *
 * ARIA counts the header row, so the header is row 1 and the first body row is
 * row 2. `start` is where the first *rendered* row sits in the whole data set —
 * 1 on an ordinary table, `(page - 1) * pageSize + 1` on a paginated one — so a
 * screen reader can say "row 43 of 200" on a page showing rows 41 to 50.
 */
export function rowIndex(start: number, offset: number): number {
  return start + offset + 1
}

/**
 * `aria-rowcount` for a table of `total` rows.
 *
 * `-1` is ARIA's "the total is not known", which is the honest answer for a
 * windowed view that has not counted its source.
 */
export function rowCountAttribute(total: number | undefined): number | undefined {
  if (total === undefined) return undefined
  return total < 0 ? -1 : total + 1
}

/* -------------------------------------------------------------- selection */

/** Where a select-all checkbox sits, given how much of the table is selected. */
export interface SelectAllState {
  checked: boolean
  indeterminate: boolean
}

/**
 * The three states of a select-all box.
 *
 * `indeterminate` is a separate flag rather than a third value of `checked`,
 * which is the same shape `Checkbox` already takes. An empty table reads
 * unchecked rather than indeterminate — there is nothing partial about nothing.
 */
export function selectAllState(selectedCount: number, total: number): SelectAllState {
  if (total === 0 || selectedCount === 0) return { checked: false, indeterminate: false }
  if (selectedCount >= total) return { checked: true, indeterminate: false }
  return { checked: false, indeterminate: true }
}

/**
 * Add or remove one key.
 *
 * A `Set` round-trip rather than `filter`/`concat`, so selecting a row that is
 * already selected cannot put it in the list twice.
 */
export function toggleKey(keys: readonly string[], key: string, selected: boolean): string[] {
  const next = new Set(keys)
  if (selected) next.add(key)
  else next.delete(key)
  return [...next]
}

/**
 * What the select-all box does next.
 *
 * From indeterminate it selects everything rather than clearing — the box is
 * offered as "select all", and a partial selection is usually a selection in
 * progress. Clearing is one more click away; re-picking six rows is not.
 */
export function toggleAll(keys: readonly string[], allKeys: readonly string[]): string[] {
  return keys.length >= allKeys.length ? [] : [...allKeys]
}
