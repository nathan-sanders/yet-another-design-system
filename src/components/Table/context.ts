import { createContext, useContext } from 'react'

import type { TableDensity, TableDividers, TableTextOverflow, TableVerticalAlign } from './styles'

/**
 * What every cell in a table needs to know, set once by `Table`.
 *
 * These are settings of the *table*, not of the cell: a cell cannot be a
 * different density from the table it sits in, and a caller who wrote
 * `<Table.Cell density="compact">` inside a spacious table would have written a
 * bug. Passing them as props would also mean threading four values through
 * every row in children mode, which is exactly the threading `SelectContext`
 * and `CalendarContext` exist to avoid.
 *
 * Deliberately not exported from the package.
 */
export interface TableContextValue {
  density: TableDensity
  dividers: TableDividers
  textOverflow: TableTextOverflow
  verticalAlign: TableVerticalAlign
}

export const TableContext = createContext<TableContextValue | null>(null)

/**
 * The table's settings, or the library defaults.
 *
 * Unlike `Calendar`'s, this one does **not** throw when there is no provider.
 * A bare `<Table.Cell>` in a story's variant matrix — or inside somebody's own
 * `<table>` — is a legitimate thing to render, and it should look like a
 * default cell rather than crash. The defaults here are the same ones
 * `TableProps` declares.
 */
export function useTableContext(): TableContextValue {
  return (
    useContext(TableContext) ?? {
      density: 'balanced',
      dividers: 'rows',
      textOverflow: 'wrap',
      verticalAlign: 'middle',
    }
  )
}

/**
 * What a cell needs to know about the row it is in.
 *
 * Only `selected` today, because that is the only row state a *cell* draws —
 * the row draws its own fill, but the emphasized rule is on the cell's
 * pseudo-element and so has to reach it. Separate from `TableContextValue`
 * because it changes per row and that one does not.
 */
export interface TableRowContextValue {
  selected: boolean
}

export const TableRowContext = createContext<TableRowContextValue | null>(null)

export function useTableRowContext(): TableRowContextValue {
  return useContext(TableRowContext) ?? { selected: false }
}
