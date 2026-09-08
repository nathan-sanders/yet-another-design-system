import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { TableContext, TableRowContext, useTableContext, useTableRowContext } from './context'
import { resolveNumeric } from './numeric'
import {
  cell,
  hasColumnDivider,
  hasRowDivider,
  head,
  row,
  scrollRegion,
  tableRoot,
  type TableAlign,
  type TableDensity,
  type TableDividers,
  type TableTextOverflow,
  type TableVerticalAlign,
} from './styles'
import { resolveWidths, tableMinWidth, type TableColumnWidth } from './widths'

/**
 * Table — structured data in rows and columns.
 *
 * Drawn in Figma under `40005049:39146`: `Table Cell` (`40005049:39090`,
 * Density × Align) and `Table Head` (`40005047:38832`, Type × Align). The file
 * draws the two atoms; the API above them follows Meta's Astryx Table, which is
 * the reference Nathan brought.
 *
 * ## Numbers are mono, and nobody has to say so
 *
 * A cell whose child is a real number is set in `font-mono tabular-nums` — the
 * same pair `Metric` uses, for the same reason: a column of figures only lines
 * up if every digit is the same width. There is no prop for it, because the
 * value already said it, and a `numeric` prop on every cell is a prop somebody
 * will forget on one row of a thousand.
 *
 * A value that is digits but arrives as a *string* — `"$1.2M"`, `"82%"` — is
 * what a column's `numeric` flag is for. The column knows it is a money column;
 * the cell only sees a string. See `numeric.ts`.
 *
 * ## Two APIs, one implementation
 *
 * `<Table columns data />` is the one to reach for: it owns sorting, selection,
 * expansion and resizing, because all four need to know about every row at
 * once. `Table.Header` / `Body` / `Row` / `Head` / `Cell` / `Footer` are the
 * escape hatch for a layout the column definitions cannot describe.
 *
 * The columns API **renders through those same parts**. That is deliberate and
 * it is the thing to preserve: two renderers would drift, and the drift would
 * show up as a composed table that looks subtly unlike a generated one.
 *
 * There are no raw third-party parts to re-export here the way `Menu` does —
 * nothing in this component sits on a Base UI primitive. The absence of a
 * `Table.Root` is a decision, not an omission.
 */

/* ------------------------------------------------------------------ column */

export interface TableColumn<T> {
  /** Unique id — the React key, the sort key and the width key. */
  key: Extract<keyof T, string> | (string & {})
  /** The column heading. Figma's `colLabelText`. */
  header: ReactNode
  /** Omit and the column is `proportional(1)`. */
  width?: TableColumnWidth
  /**
   * Which edge the value hangs off. Defaults to `right` for a `numeric`
   * column and `left` otherwise.
   */
  align?: TableAlign
  /**
   * Set the whole column in mono, for values that are digits but not
   * `number`s: `"$1.2M"`, `"82%"`, `"12,400"`. A real number needs no flag.
   *
   * This *defaults* `align` to `right` but does not force it — an order-number
   * column wants mono for scanning and left alignment because it reads as a
   * label. `numeric` answers "are these digits?"; `align` answers "which edge?"
   */
  numeric?: boolean
  /** Replaces `row[key]`. Whatever it returns becomes the cell's children. */
  renderCell?: (item: T, index: number) => ReactNode
}

/* -------------------------------------------------------------------- root */

export interface TableProps<T>
  extends Omit<
    ComponentPropsWithRef<'table'>,
    /*
      Every one of these is a deprecated presentational attribute this
      component either owns or forbids. `rules` is the dangerous one: it is
      typed `"none" | "groups" | "rows" | "columns" | "all"`, which is almost
      exactly `dividers`' value set, so leaving both in the type gives a caller
      a plausible wrong prop that fails silently.
    */
    'align' | 'width' | 'border' | 'rules' | 'summary' | 'frame' | 'children'
  > {
  /**
   * Names the scrollable region, and becomes the table's `<caption>`.
   *
   * Required, and required in the *type* rather than checked at runtime: a
   * region you can only reach by dragging is unreachable from a keyboard, so
   * the frame takes focus, and a focusable region with no accessible name is an
   * axe failure. Making it a required prop is what moves that from a red CI run
   * to a red squiggle.
   */
  label: string
  /**
   * A visible caption above the table. Defaults to `label`, rendered `sr-only`
   * — the name is always in the accessibility tree even when nothing shows it.
   */
  caption?: ReactNode

  columns: ReadonlyArray<TableColumn<T>>
  data: readonly T[]
  /**
   * Which field identifies a row.
   *
   * Required, where Astryx lets it fall back to the row index. An index key is
   * fine for a static render and silently wrong the moment a sort reorders a
   * table that has selected rows — which is exactly the moment nobody is
   * watching for it.
   */
  idKey: Extract<keyof T, string>

  /** Figma's `Density` axis. */
  density?: TableDensity
  /** Which rules to draw. Figma's cell ships `rowBorder` on, so: `rows`. */
  dividers?: TableDividers
  /** What body text does when it outgrows its column. Headers always truncate. */
  textOverflow?: TableTextOverflow
  verticalAlign?: TableVerticalAlign
  /** A hover highlight on rows. */
  hasHover?: boolean
  /** A wash on every other row. See `styles.ts` for why it is not the hover fill. */
  isStriped?: boolean
  /** Rendered in one full-width cell when `data` is empty. */
  emptyState?: ReactNode
}

export function Table<T>({
  label,
  caption,
  columns,
  data,
  idKey,
  density = 'balanced',
  dividers = 'rows',
  textOverflow = 'wrap',
  verticalAlign = 'middle',
  hasHover = false,
  isStriped = false,
  emptyState = 'No data.',
  className,
  ...props
}: TableProps<T>) {
  const widths = resolveWidths(columns)
  const minWidth = tableMinWidth(columns)

  return (
    <div
      /*
        A region you can only reach by dragging is unreachable from a keyboard,
        and axe fails the story for it (`scrollable-region-focusable`). Giving
        the frame focus makes the arrow keys scroll it; the label is what a
        screen reader announces on arrival. Same three lines as
        `foundations/Showcase.tsx`, for the same reason.
      */
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label={label}
      className={scrollRegion}
    >
      <TableContext.Provider value={{ density, dividers, textOverflow, verticalAlign }}>
        <table className={cn(tableRoot, className)} style={{ minWidth }} {...props}>
          <caption className="sr-only">{caption ?? label}</caption>
          <colgroup>
            {widths.map((width) => (
              <col key={width.key} style={{ width: width.css }} />
            ))}
          </colgroup>

          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} align={alignOf(column)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-content-subtle">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={String(item[idKey])}
                  hoverable={hasHover}
                  /*
                    The stripe comes from the row's index in the *data*, never
                    from `odd:`/`even:`. An expanded row's detail panel is a
                    `<tr>` sibling, so `:nth-child` parity flips the moment
                    anything expands and the whole zebra shifts under the user.
                  */
                  striped={isStriped && index % 2 === 1}
                >
                  {columns.map((column) => {
                    const content = column.renderCell
                      ? column.renderCell(item, index)
                      : (item[column.key as keyof T] as ReactNode)
                    return (
                      <TableCell key={column.key} align={alignOf(column)} numeric={column.numeric}>
                        {content}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </TableContext.Provider>
    </div>
  )
}

/** A numeric column right-aligns unless it says otherwise. */
function alignOf<T>(column: TableColumn<T>): TableAlign {
  return column.align ?? (column.numeric ? 'right' : 'left')
}

/* ----------------------------------------------------------------- section */

export interface TableHeaderProps extends ComponentPropsWithRef<'thead'> {}

function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={className} {...props} />
}

export interface TableBodyProps extends ComponentPropsWithRef<'tbody'> {}

function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={className} {...props} />
}

export interface TableFooterProps extends ComponentPropsWithRef<'tfoot'> {}

function TableFooter({ className, ...props }: TableFooterProps) {
  return <tfoot className={className} {...props} />
}

/* --------------------------------------------------------------------- row */

export interface TableRowProps extends ComponentPropsWithRef<'tr'> {
  /** Draws the selected fill, and steps its cells' rules up to emphasized. */
  selected?: boolean
  /** The zebra wash. A prop and not `odd:`, for the reason given in `Table`. */
  striped?: boolean
  hoverable?: boolean
}

function TableRow({ selected = false, striped = false, hoverable = false, className, ...props }: TableRowProps) {
  return (
    <TableRowContext.Provider value={{ selected }}>
      <tr className={cn(row({ selected, striped, hoverable }), className)} {...props} />
    </TableRowContext.Provider>
  )
}

/* -------------------------------------------------------------------- head */

export interface TableHeadProps extends Omit<ComponentPropsWithRef<'th'>, 'align' | 'abbr'> {
  align?: TableAlign
  /** Figma's `gridDivider`. Defaults from the table. */
  divider?: boolean
}

function TableHead({ align = 'left', divider, className, children, ...props }: TableHeadProps) {
  const table = useTableContext()
  const columnDivider = divider ?? hasColumnDivider(table.dividers)
  const styles = head({ align, columnDivider })

  return (
    <th scope="col" className={cn(styles.root(), className)} {...props}>
      <span className={styles.line()}>
        <span className={styles.sortGroup()}>
          <span className={styles.label()}>{children}</span>
        </span>
      </span>
    </th>
  )
}

/* -------------------------------------------------------------------- cell */

export interface TableCellProps
  extends Omit<
    /* align/width/height/valign are ours; scope and abbr belong on a `<th>`. */
    ComponentPropsWithRef<'td'>,
    'align' | 'width' | 'height' | 'valign' | 'scope' | 'abbr'
  > {
  align?: TableAlign
  /** Force mono. A cell whose child is a real number needs no flag. */
  numeric?: boolean
  /** Figma's `rowBorder`. Defaults from the table. */
  divider?: boolean
  /** Figma's `gridDivider`. Defaults from the table. */
  columnDivider?: boolean
  /**
   * Figma's `rightAlignSortSpacer` — reserve the sort button's 30px at the end
   * of a right-aligned cell.
   *
   * Off by default, and **only correct when this column's header actually
   * draws a sort button**. The file defaults it on because its default head is
   * sortable; reserving the space under a header that has no button pushes the
   * value 32px left of the label it is supposed to line up with. The columns
   * API derives it from the column's sortability; in children mode it is
   * yours to set, alongside the sort control you passed the head.
   */
  spacer?: boolean
}

function TableCell({
  align = 'left',
  numeric,
  divider,
  columnDivider,
  spacer = false,
  className,
  children,
  ...props
}: TableCellProps) {
  const table = useTableContext()
  const { selected } = useTableRowContext()

  const styles = cell({
    density: table.density,
    align,
    verticalAlign: table.verticalAlign,
    textOverflow: table.textOverflow,
    numeric: resolveNumeric(numeric, children),
    rowDivider: divider ?? hasRowDivider(table.dividers),
    columnDivider: columnDivider ?? hasColumnDivider(table.dividers),
    selected,
  })

  return (
    <td className={cn(styles.root(), className)} {...props}>
      <span className={styles.line()}>
        <span className={styles.text()}>{children}</span>
        {/*
          Figma's `Sort By Spacer` — the sort button's own 30 x 24 box, held
          empty so a right-aligned value lands under its column's *label*
          instead of under the button beside it.
        */}
        {align === 'right' && spacer ? <span aria-hidden="true" className={styles.spacer()} /> : null}
      </span>
    </td>
  )
}

/* --------------------------------------------------------------- namespace */

Table.displayName = 'Table'

TableHeader.displayName = 'Table.Header'
TableBody.displayName = 'Table.Body'
TableFooter.displayName = 'Table.Footer'
TableRow.displayName = 'Table.Row'
TableHead.displayName = 'Table.Head'
TableCell.displayName = 'Table.Cell'

Table.Header = TableHeader
Table.Body = TableBody
Table.Footer = TableFooter
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
