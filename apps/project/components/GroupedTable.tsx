import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Badge } from '../../../src/components/Badge'
import { Icon } from '../../../src/components/Icon'
import { Table } from '../../../src/components/Table'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'

export interface GroupedColumn<T> {
  key: string
  header: string
  /** Pixels, as the file's Table Head is drawn. Leave one out to take the rest. */
  width?: number
  render: (item: T) => ReactNode
  /** This cell holds the row's link: a press anywhere on the row follows it. */
  rowTarget?: boolean
  /**
   * The cell's content runs to its right edge, for a name with a meta at the
   * far end. `Table.Cell` wraps its children in a span that hugs them
   * (FINDINGS 4), so this stretches that span from outside.
   */
  spread?: boolean
}

export interface TableGroup<T> {
  id: string
  label: string
  items: T[]
  /** Subtle text after the count — "1 of 4 done", "Yak flagged these…". */
  note?: string
}

/**
 * A table in groups, each under a `Group /` row: a chevron, the group's name
 * in sm semibold, a neutral count Badge and a subtle note, on the subtle
 * background with a 1px rule at its top (`Project - List`, `40006268:6554`;
 * All projects, `40006264:1069`). The chevron folds the group.
 *
 * The library's `Table` has no group rows (FINDINGS 1), so this composes its
 * children-mode parts — `Table.Head`, `Table.Row`, `Table.Cell` — and owns the
 * frame, the widths and one `<tbody>` per group, whose first row is a
 * `<th scope="rowgroup">` naming it.
 */
export function GroupedTable<T extends { id: string }>({
  label,
  columns,
  groups,
  clickableRows = false,
  className,
}: {
  label: string
  columns: GroupedColumn<T>[]
  groups: TableGroup<T>[]
  /** Rows with a `rowTarget` cell: the hover fill and the pointer. */
  clickableRows?: boolean
  className?: string
}) {
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set())
  const toggle = (id: string) =>
    setFolded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    // The frame is the caller's in children mode, and so is its label; a
    // region that scrolls sideways has to be reachable from the keyboard.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div
      tabIndex={0}
      role="region"
      aria-label={label}
      className={cn(
        'isolate shrink-0 overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary',
        focusRing,
        className,
      )}
    >
      <table className="w-full min-w-240 table-fixed border-separate border-spacing-0 font-sans">
        <caption className="sr-only">{label}</caption>
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.key}
              // A runtime width, so it is a custom property a utility reads.
              style={column.width ? { ['--col-width' as string]: `${column.width}px` } : undefined}
              className={column.width ? 'w-(--col-width)' : undefined}
            />
          ))}
        </colgroup>
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.Head key={column.key}>{column.header}</Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        {groups.map((group) => {
          const open = !folded.has(group.id)
          return (
            <Table.Body key={group.id}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={columns.length}
                  className={cn(
                    'relative bg-surface-background-subtle p-0 text-left font-normal',
                    'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-surface-border',
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggle(group.id)}
                    className={cn(
                      'flex h-9 w-full cursor-pointer items-center gap-2 px-4 text-sm text-content-primary',
                      focusRing,
                    )}
                  >
                    <Icon icon={open ? ChevronDown : ChevronRight} />
                    <span className="font-semibold">{group.label}</span>
                    <Badge>
                      <span className="sr-only">, </span>
                      {group.items.length}
                      <span className="sr-only">
                        {' '}
                        {group.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </Badge>
                    {group.note ? (
                      <span className="truncate text-content-subtle">
                        <span className="sr-only">, </span>
                        {group.note}
                      </span>
                    ) : null}
                  </button>
                </th>
              </tr>
              {open
                ? group.items.map((item) => (
                    <Table.Row key={item.id} clickable={clickableRows} hoverable={clickableRows}>
                      {columns.map((column) => (
                        <Table.Cell
                          key={column.key}
                          rowTarget={column.rowTarget}
                          className={column.spread ? '*:*:flex-1' : undefined}
                        >
                          {column.render(item)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                : null}
            </Table.Body>
          )
        })}
      </table>
    </div>
  )
}
