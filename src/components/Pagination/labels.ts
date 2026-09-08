/**
 * The arithmetic and the strings behind a `Pagination`.
 *
 * All of it is pure so it can be tested in the node project rather than
 * measured in a browser, the way `Table/rows.ts` is. None of it shows in a
 * screenshot: a range that says "91 – 100" on a set of 95 is a confident lie
 * that renders perfectly, and an off-by-one on the last page is invisible
 * until somebody counts.
 */

/**
 * U+2013, spaced either side.
 *
 * Figma's string is `1 – 10 of 100 items`, and the separator is an **en dash**
 * (`8211`), not a hyphen and not an em dash — read off the node rather than off
 * the screenshot, because at 14px the three are the same three pixels.
 */
const EN_DASH = '–'

/**
 * How many pages `totalItems` makes at `pageSize`.
 *
 * **Never zero.** An empty table still shows "page 1 of 1 page" rather than
 * "page 0 of 0", because the page Select needs an option to sit on and a
 * disabled control with nothing in it reads as broken rather than as empty.
 */
export function pageCount(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

/**
 * `page` brought inside `1 … count`.
 *
 * A controlled `page` can go stale — the caller drops the page size from 50 to
 * 10 while sitting on page 4 of a 30-item set, and page 4 no longer exists.
 * Clamping here means the component never renders a range it cannot fill.
 */
export function clampPage(page: number, count: number): number {
  if (!Number.isFinite(page)) return 1
  return Math.min(Math.max(1, Math.floor(page)), count)
}

/** The 1-based, inclusive item numbers on `page`. `0, 0` when there is nothing. */
export function pageBounds(
  page: number,
  pageSize: number,
  totalItems: number,
): { start: number; end: number } {
  if (totalItems <= 0 || pageSize <= 0) return { start: 0, end: 0 }

  const current = clampPage(page, pageCount(totalItems, pageSize))
  const start = (current - 1) * pageSize + 1

  return { start, end: Math.min(current * pageSize, totalItems) }
}

/**
 * Figma's `Range of Items Text`, derived rather than typed.
 *
 * Three shapes, because one template cannot say all three honestly:
 *
 * - nothing at all — `0 items`. There is no range to give.
 * - one item on the page — `5 of 95 items`. `5 ${EN_DASH} 5` is the same fact
 *   spelled twice, and it looks like a bug.
 * - anything else — `1 ${EN_DASH} 10 of 100 items`, exactly as drawn.
 */
export function rangeLabel(page: number, pageSize: number, totalItems: number): string {
  const total = Math.max(0, Math.floor(totalItems))
  const noun = total === 1 ? 'item' : 'items'

  if (total === 0) return '0 items'

  const { start, end } = pageBounds(page, pageSize, total)

  if (start === end) return `${start} of ${total} ${noun}`

  return `${start} ${EN_DASH} ${end} of ${total} ${noun}`
}

/** The text after the page Select. Figma draws `of 10 pages`. */
export function pageCountLabel(count: number): string {
  return `of ${count} ${count === 1 ? 'page' : 'pages'}`
}

/** One option in the page-size Select. Figma draws `10 per page`. */
export function pageSizeLabel(pageSize: number): string {
  return `${pageSize} per page`
}
