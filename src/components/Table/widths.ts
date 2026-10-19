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
 * A proportional column resolves to a **plain percentage of the proportional
 * share** — `proportional(2)` beside `proportional(1)` is `66.6667%` and
 * `33.3333%` — even when pixel columns sit beside it, so the percentages and
 * the pixels together ask for more than 100% of the table.
 *
 * That over-ask is the point. Under `table-fixed`, Chromium gives every pixel
 * column its pixels and then scales the percentage columns down, in proportion,
 * to fill what is left — which is exactly the leftover split by weight. The
 * table stays at its own width; nothing overruns it.
 *
 * The obvious-looking alternative, `calc((100% - <fixed>px) * <share>)`, is what
 * this used to emit, and Chromium does not honor it: a `calc()` mixing a
 * percentage and a length on a `<col>` is treated as no width at all, so every
 * proportional column fell back to an equal share of the leftover whatever its
 * weight. A 2.4 : 1.4 pair rendered 350 / 350 in a 1220px table, where the
 * percentages render 442 / 258.
 *
 * `resized` wins over both, because a width somebody dragged to is a width they
 * meant.
 */
export function resolveWidths(
  columns: readonly WidthInput[],
  resized: Readonly<Record<string, number>> = {},
): ResolvedWidth[] {
  const widths = columns.map((column) => column.width ?? DEFAULT_WIDTH)

  const proportionalTotal = columns.reduce((total, column, index) => {
    if (resized[column.key] !== undefined) return total
    return widths[index].kind === 'proportional' ? total + widths[index].value : total
  }, 0)

  return columns.map((column, index) => {
    const resizedWidth = resized[column.key]
    if (resizedWidth !== undefined) return { key: column.key, css: `${resizedWidth}px` }

    const width = widths[index]
    if (width.kind === 'pixel') return { key: column.key, css: `${width.value}px` }
    return { key: column.key, css: `${(width.value / proportionalTotal) * 100}%` }
  })
}

/**
 * The width the table refuses to go below.
 *
 * This is what makes the scroll region scroll instead of the columns
 * collapsing. Pixel and resized columns count at their floor. The proportional
 * columns share whatever is left by weight, so the leftover has to be wide
 * enough that the column with the *least* weight for its floor still meets it:
 * `proportional(2)` and `proportional(1)`, both floored at 120, need 360px
 * between them, not 240 — at 240 the lighter one would get 80.
 */
export function tableMinWidth(
  columns: readonly WidthInput[],
  resized: Readonly<Record<string, number>> = {},
): number {
  let fixed = 0
  let weights = 0
  let leftover = 0

  for (const column of columns) {
    const resizedWidth = resized[column.key]
    const width = column.width ?? DEFAULT_WIDTH
    if (resizedWidth !== undefined) fixed += resizedWidth
    else if (width.kind === 'pixel') fixed += width.min
    else weights += width.value
  }

  for (const column of columns) {
    const width = column.width ?? DEFAULT_WIDTH
    if (resized[column.key] !== undefined || width.kind !== 'proportional') continue
    if (width.value <= 0) continue
    leftover = Math.max(leftover, (width.min * weights) / width.value)
  }

  // The epsilon keeps float noise (0.1 + 0.2) from ceiling a whole extra pixel.
  return fixed + Math.ceil(leftover - 1e-9)
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
