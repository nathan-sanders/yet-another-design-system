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
 * Resizing is the other half, from the same file. Dragging the handle between
 * two blocks snaps the left one to a column span and shares what is left
 * among the blocks to its right in proportion to what they had (`resize`).
 * The block that was dragged is then *manually sized*: when the row's members
 * change it keeps its span and only the others re-share the remainder
 * (`reflow`). A block on its own always takes the whole row.
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

/**
 * Clamp, then share `total` columns among `weights.length` blocks in
 * proportion to `weights`, every block at least `MIN_SPAN`, the sum exactly
 * `total`. Largest-remainder rounding, so nothing is lost to `Math.round`.
 */
function share(total: number, weights: readonly number[]): number[] {
  const count = weights.length
  if (count === 0) return []
  const weightTotal = weights.reduce((sum, w) => sum + w, 0)
  const exact = weights.map((w) => (weightTotal > 0 ? (total * w) / weightTotal : total / count))
  const spans = exact.map((x) => Math.max(MIN_SPAN, Math.floor(x)))
  let left = total - spans.reduce((sum, n) => sum + n, 0)
  // Hand the leftover columns to the blocks that lost the most in flooring.
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac)
    .map((entry) => entry.i)
  for (let k = 0; left > 0; k = (k + 1) % count) {
    spans[order[k]] += 1
    left -= 1
  }
  // Only reachable when `total` cannot seat every block at MIN_SPAN.
  for (let k = count - 1; left < 0 && k >= 0; k--) {
    const give = Math.min(-left, spans[k] - MIN_SPAN)
    spans[k] -= give
    left += give
  }
  return spans
}

/**
 * The block at `index` wants `next` columns. It gets as many as it can —
 * at least `MIN_SPAN`, and no more than leaves every block to its right at
 * `MIN_SPAN` — and the blocks to its right share what remains in proportion
 * to what they had, so a wide neighbour stays the wide one. Blocks to the
 * left are untouched. The last block has nothing to its right and cannot be
 * resized; the row always closes on its right edge.
 */
export function resize(
  spans: readonly number[],
  index: number,
  next: number,
  columns = GRID_COLUMNS,
): number[] {
  const rights = spans.slice(index + 1)
  if (index < 0 || rights.length === 0) return spans as number[]
  const before = spans.slice(0, index).reduce((sum, n) => sum + n, 0)
  const max = columns - before - MIN_SPAN * rights.length
  const left = Math.max(MIN_SPAN, Math.min(Math.round(next), max))
  if (left === spans[index]) return spans as number[]
  return [...spans.slice(0, index), left, ...share(columns - before - left, rights)]
}

/** The widest the block at `index` can be dragged, given what sits to its right. */
export function maxSpan(spans: readonly number[], index: number, columns = GRID_COLUMNS): number {
  const before = spans.slice(0, index).reduce((sum, n) => sum + n, 0)
  return columns - before - MIN_SPAN * (spans.length - index - 1)
}

/**
 * Spans for a row whose members just changed. A block somebody sized by hand
 * (`manual`) keeps its span; the others share what is left evenly, the
 * remainder to the last of them. A lone block takes the row whatever it was.
 * When the hand-sized blocks between them leave no room — fewer than
 * `MIN_SPAN` columns per remaining block — the row gives up on them and
 * shares evenly, which is the one honest answer and the prototype's
 * `Math.max(3, …)` overflowing the grid is the alternative.
 */
export function reflow(
  items: readonly string[],
  spans: Readonly<Record<string, number>>,
  manual: ReadonlySet<string>,
  columns = GRID_COLUMNS,
): number[] {
  const count = items.length
  if (count === 0) return []
  if (count === 1) return [columns]

  const isManual = items.map((id) => manual.has(id) && spans[id] !== undefined)
  const manualTotal = items.reduce((sum, id, i) => sum + (isManual[i] ? spans[id] : 0), 0)
  const autos = isManual.filter((m) => !m).length

  if (autos === 0) {
    // Every block was sized by hand: keep all but the last, which closes the row.
    const kept = items.slice(0, -1).map((id) => spans[id])
    const last = columns - kept.reduce((sum, n) => sum + n, 0)
    return last >= MIN_SPAN ? [...kept, last] : distribute(count, columns)
  }

  const remaining = columns - manualTotal
  if (remaining < MIN_SPAN * autos) return distribute(count, columns)
  const autoSpans = distribute(autos, remaining)
  let cursor = 0
  return items.map((id, i) => (isManual[i] ? spans[id] : autoSpans[cursor++]))
}
