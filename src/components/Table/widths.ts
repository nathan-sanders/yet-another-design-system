/**
 * How a table decides how wide each column is.
 *
 * `table-fixed` means the browser stops sizing columns to their contents, so
 * every column has a width whether the caller gave it one or not. These are the
 * two ways to give it one, plus the arithmetic that turns them into CSS.
 */

/**
 * The floor a proportional column will not shrink below.
 *
 * Astryx's number, and its reasoning holds here: without a floor, a column of
 * long text in a five-column table squishes toward nothing on a phone and the
 * table becomes unreadable rather than scrollable. With one, the table refuses
 * to go below the sum of its floors and the region scrolls instead.
 */
export const MIN_COLUMN_WIDTH = 120

export interface TableColumnWidth {
  kind: 'pixel' | 'proportional'
  value: number
  /** Below this the column stops shrinking and the table scrolls instead. */
  min: number
}

/** A column of a fixed number of pixels. `pixel(64)` for an icon column. */
export function pixel(value: number, min: number = value): TableColumnWidth {
  return { kind: 'pixel', value, min }
}

/**
 * A column that shares the leftover space. `proportional(2)` takes twice what
 * `proportional(1)` does.
 */
export function proportional(value: number = 1, min: number = MIN_COLUMN_WIDTH): TableColumnWidth {
  return { kind: 'proportional', value, min }
}

/** Every column omits its width, so every column is `proportional(1)`. */
const DEFAULT_WIDTH: TableColumnWidth = { kind: 'proportional', value: 1, min: MIN_COLUMN_WIDTH }

export interface ResolvedWidth {
  key: string
  /** What goes on the `<col>`'s `width`. */
  css: string
}

interface WidthInput {
  key: string
  width?: TableColumnWidth
}

/**
 * Turn the column definitions into one `<col>` width each.
 *
 * A proportional column resolves to `calc((100% - <fixed>px) * <share>)` rather
 * than a bare percentage. The two agree only when there are no pixel columns;
 * the moment one exists, a percentage of the *whole* table over-allocates by
 * exactly the pixel column's width, and the columns drift wider than the table.
 *
 * `resized` wins over both, because a width somebody dragged to is a width they
 * meant.
 */
export function resolveWidths(
  columns: readonly WidthInput[],
  resized: Readonly<Record<string, number>> = {},
): ResolvedWidth[] {
  const widths = columns.map((column) => column.width ?? DEFAULT_WIDTH)

  const fixedTotal = columns.reduce((total, column, index) => {
    if (resized[column.key] !== undefined) return total + resized[column.key]
    return widths[index].kind === 'pixel' ? total + widths[index].value : total
  }, 0)

  const proportionalTotal = columns.reduce((total, column, index) => {
    if (resized[column.key] !== undefined) return total
    return widths[index].kind === 'proportional' ? total + widths[index].value : total
  }, 0)

  return columns.map((column, index) => {
    const resizedWidth = resized[column.key]
    if (resizedWidth !== undefined) return { key: column.key, css: `${resizedWidth}px` }

    const width = widths[index]
    if (width.kind === 'pixel') return { key: column.key, css: `${width.value}px` }

    // Every column is proportional and none is fixed: a plain percentage is
    // exact, and reads better in devtools than a calc against zero.
    if (fixedTotal === 0) {
      return { key: column.key, css: `${(width.value / proportionalTotal) * 100}%` }
    }
    return {
      key: column.key,
      css: `calc((100% - ${fixedTotal}px) * ${width.value / proportionalTotal})`,
    }
  })
}

/**
 * The width the table refuses to go below — the sum of every column's floor.
 *
 * This is what makes the scroll region scroll instead of the columns collapsing.
 */
export function tableMinWidth(
  columns: readonly WidthInput[],
  resized: Readonly<Record<string, number>> = {},
): number {
  return columns.reduce((total, column) => {
    const resizedWidth = resized[column.key]
    if (resizedWidth !== undefined) return total + resizedWidth
    return total + (column.width ?? DEFAULT_WIDTH).min
  }, 0)
}

/**
 * One step of a resize.
 *
 * Pure, so the drag handler and the keyboard handler share it and cannot
 * disagree about the floor. There is no ceiling: a column may be dragged as
 * wide as somebody likes, and the region scrolls.
 */
export function applyResize(
  resized: Readonly<Record<string, number>>,
  key: string,
  current: number,
  delta: number,
  min: number,
): Record<string, number> {
  return { ...resized, [key]: Math.max(min, Math.round(current + delta)) }
}
