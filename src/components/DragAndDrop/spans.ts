/**
 * The 12-column arithmetic behind a composable dashboard row.
 *
 * Read off Nathan's Figma Make prototype (*Composable Grid Layout*,
 * `GridRow.tsx`): a row holds up to four blocks on twelve columns, no block
 * narrower than three, and a row that is not being resized by hand shares its
 * columns out evenly with the remainder going to the last block. A lone block
 * takes the whole row.
 *
 * Kept out of the story so the rules can be asserted rather than approved —
 * `TreeList/navigation.ts` is the precedent. Nothing here knows about the DOM.
 *
 * **Resize attaches here, later.** The prototype's drag-to-resize snaps the
 * left block to a column span, marks it as manually sized and redistributes
 * the right neighbours proportionally above `MIN_SPAN`. That is a
 * `resize(spans, index, next): number[]` beside `distribute`, plus a focusable
 * `separator` shaped like `Table.ResizeHandle` between adjacent blocks. Out of
 * scope for the foundation; the shape is written down so it lands in one place.
 */

export const GRID_COLUMNS = 12
/** A block narrower than a quarter of the row has no room for a heading. */
export const MIN_SPAN = 3
export const MAX_BLOCKS_PER_ROW = Math.floor(GRID_COLUMNS / MIN_SPAN)

/**
 * Column spans for `count` blocks sharing `columns`: an equal floor each, the
 * remainder to the last so the row always closes on the right edge. Zero
 * blocks is an empty row, which the dashboard removes rather than draws.
 */
export function distribute(count: number, columns = GRID_COLUMNS): number[] {
  if (count <= 0) return []
  const each = Math.floor(columns / count)
  const spans = Array.from({ length: count }, () => each)
  spans[count - 1] = columns - each * (count - 1)
  return spans
}

export function canAddBlock(count: number): boolean {
  return count < MAX_BLOCKS_PER_ROW
}

export type ColumnSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Written out in full rather than as `col-span-${n}` — Tailwind scans source
 * text for class names, and a template literal generates nothing. BentoGrid's
 * rule, for the same reason.
 */
export const COL_SPAN: Record<ColumnSpan, string> = {
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
}
