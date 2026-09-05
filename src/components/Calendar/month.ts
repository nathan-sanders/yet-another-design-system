/**
 * The calendar's arithmetic — every date calculation `Calendar` and
 * `DatePicker` need, with no React in sight.
 *
 * ## Why this is a module and not inline
 *
 * Base UI ships no calendar, so unlike every other component in the library
 * there is no headless primitive underneath this one doing the hard part. The
 * grid, the range logic and the bounds checks are ours, and they are the kind
 * of thing that is wrong in February of a leap year and right for the eleven
 * months either side. Splitting them out buys a **node test** — `month.test.ts`
 * runs in the fast project with no browser, the same trade `Chart/axes.ts`
 * makes.
 *
 * ## Two rules that keep it correct
 *
 * **Never move a date by adding milliseconds.** `+ 86_400_000` is a day only
 * when the clocks do not change; across a DST boundary it lands at 23:00 the
 * previous day or 01:00 the next, and the grid quietly duplicates or drops a
 * cell twice a year. Every function here goes through the `new Date(y, m, d)`
 * constructor instead, which normalizes out-of-range components for free —
 * `new Date(2025, 0, 32)` is 1 February, and `new Date(2025, 12, 1)` is
 * January 2026. That normalization is what makes the leading and trailing
 * cells of a month fall out of one expression rather than needing a branch.
 *
 * **Everything is local midnight.** A `Date` is an instant, but a calendar
 * deals in days, so every value that crosses this module's boundary is
 * normalized with `startOfDay`. Two dates on the same day then compare with
 * `<` and `>` directly, and `getTime()` equality means "the same day" rather
 * than "the same millisecond". Skipping this is how a range whose end came
 * from `new Date()` excludes its own end date.
 *
 * Names come from Astryx's Calendar where it has one, since Nathan reads that
 * documentation alongside this library.
 */

/** A start and an end, either of which may not have been picked yet. */
export type DateRange = [Date | null, Date | null]

/** One cell of the grid. `outside` marks a day belonging to a neighbouring month. */
export interface CalendarDay {
  date: Date
  outside: boolean
}

/**
 * Where a day sits in the current selection — the one thing the day cell's
 * `selection` variant reads.
 *
 * `single` covers both a single-date selection and a range whose two ends are
 * the same day, because Figma draws them identically: a fully rounded cell.
 */
export type DaySelection = 'none' | 'single' | 'start' | 'end' | 'middle'

/** Sunday is 0, matching `Date.prototype.getDay` and Figma's Su-first grid. */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** What makes a day unselectable. */
export interface DateLimits {
  min?: Date
  max?: Date
  /**
   * Extra rules, each answering **"is this date selectable?"** — so a
   * weekdays-only calendar passes `[(d) => d.getDay() !== 0 && d.getDay() !== 6]`.
   * Every function must return `true` for the day to be selectable. Astryx's
   * prop name; the polarity is stated here because the name alone does not
   * settle it.
   */
  dateConstraints?: Array<(date: Date) => boolean>
}

/** Midnight local time on the same day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Midnight local time on the first of the same month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** `n` months on, always landing on the first — the unit month navigation moves in. */
export function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

/** `n` days on. Negative `n` goes back. */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}

/**
 * `n` months on, keeping the day of the month.
 *
 * What PageUp / PageDown move by, so it has to hold the day rather than land on
 * the first the way `addMonths` does. The day is **clamped** to the target
 * month's length: a page down from 31 January is 28 February, not the 3 March
 * the constructor would roll it over to.
 */
export function shiftMonths(date: Date, n: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1)
  const day = Math.min(date.getDate(), daysInMonth(target))
  return new Date(target.getFullYear(), target.getMonth(), day)
}

/** `n` years on, with the same day-clamping — 29 February goes to the 28th. */
export function addYears(date: Date, n: number): Date {
  return shiftMonths(date, n * 12)
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** `-1`, `0` or `1`, comparing days rather than instants. */
export function compareDays(a: Date, b: Date): number {
  const t = startOfDay(a).getTime() - startOfDay(b).getTime()
  return t < 0 ? -1 : t > 0 ? 1 : 0
}

/** How many days the month containing `date` has. Day 0 of the next month is the last of this one. */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * A stable string for one day — `2025-01-22`.
 *
 * Used as the React key and as the `data-day` attribute the roving-focus
 * effect queries. Built by hand rather than with `toISOString`, which converts
 * to UTC first and so reports the previous day for anyone west of Greenwich.
 */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/**
 * How many rows every month grid has.
 *
 * **Always six, never five.** The file draws five — its month card is 304px
 * tall, which is a 5-row January 2025 exactly — and following that measurement
 * meant the panel changed height by 40px as you navigated between a 5-row
 * month and a 6-row one. Nathan asked for Astryx's side of it
 * (`hasVariableRowCount: false` is its default), so the grid is fixed and the
 * card is **344**, not the file's 304.
 *
 * That is a deliberate divergence from the canvas, and the file owes it a
 * redraw. Six is the maximum any month needs: 31 days can start at most 6 days
 * into a week, and 6 + 31 = 37, which fits in 42.
 */
const GRID_ROWS = 6

/**
 * The grid for one month, as six rows of seven.
 *
 * Leading and trailing cells are always computed; `hasOutsideDays` is a
 * rendering decision the caller makes from the `outside` flag, so the grid
 * keeps its shape either way and the columns stay aligned.
 */
export function buildMonth(month: Date, weekStartsOn: WeekDay = 0): CalendarDay[][] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const first = new Date(year, monthIndex, 1)

  // How many cells of the previous month lead the first, given where the week
  // starts. `+ 7` before the modulo keeps it positive for a late `weekStartsOn`.
  const lead = (first.getDay() - weekStartsOn + 7) % 7

  return Array.from({ length: GRID_ROWS }, (_, row) =>
    Array.from({ length: 7 }, (_, column) => {
      // The constructor normalizes a zero or negative day into the previous
      // month and an over-long one into the next, so one expression covers all
      // three regions of the grid.
      const date = new Date(year, monthIndex, 1 - lead + row * 7 + column)
      return { date, outside: date.getMonth() !== monthIndex }
    }),
  )
}

/** Whether `date` falls outside `min`/`max` or fails any of `dateConstraints`. */
export function isDateDisabled(date: Date, limits: DateLimits = {}): boolean {
  const { min, max, dateConstraints } = limits
  if (min && compareDays(date, min) < 0) return true
  if (max && compareDays(date, max) > 0) return true
  return dateConstraints?.some((allows) => !allows(date)) ?? false
}

/**
 * Where `date` sits in `range`.
 *
 * A one-day range reports `single` rather than `start` — two half-rounded
 * halves of the same cell would draw a full radius anyway, and the file has a
 * variant that says so.
 */
export function rangePosition(date: Date, range: DateRange): DaySelection {
  const [start, end] = range
  if (!start && !end) return 'none'

  if (start && end) {
    if (isSameDay(start, end)) return isSameDay(date, start) ? 'single' : 'none'
    // Guard against a caller handing over an inverted range rather than
    // silently drawing nothing.
    const [from, to] = compareDays(start, end) <= 0 ? [start, end] : [end, start]
    if (isSameDay(date, from)) return 'start'
    if (isSameDay(date, to)) return 'end'
    return compareDays(date, from) > 0 && compareDays(date, to) < 0 ? 'middle' : 'none'
  }

  return isSameDay(date, start ?? end) ? 'single' : 'none'
}

/** `date` held inside `min`/`max`. Used to pick a sensible day to open on. */
export function clampDate(date: Date, limits: DateLimits = {}): Date {
  const { min, max } = limits
  if (min && compareDays(date, min) < 0) return startOfDay(min)
  if (max && compareDays(date, max) > 0) return startOfDay(max)
  return startOfDay(date)
}

/**
 * The seven column headings, rotated to start on `weekStartsOn`.
 *
 * `short` is the two-letter form Figma and Astryx both draw (Su, Mo, Tu). No
 * `Intl` width produces it — `narrow` is one letter and `short` is three — so
 * it is `short` truncated, which lands on exactly the file's labels in English
 * and on a reasonable abbreviation elsewhere. `long` is the real name, and it
 * goes in the `<th abbr>` so a screen reader says "Sunday" rather than
 * spelling out "Su".
 *
 * The anchor is 5 January 2025, a Sunday, so `getDay()` and the array index
 * line up without arithmetic.
 */
export function weekdayLabels(
  weekStartsOn: WeekDay = 0,
  locale?: string,
): Array<{ short: string; long: string }> {
  const short = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' })
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(2025, 0, 5 + ((weekStartsOn + i) % 7))
    return { short: short.format(day).slice(0, 2), long: long.format(day) }
  })
}

/** "January 2025" — the month header's caption, and its live-region announcement. */
export function formatMonthYear(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
}

/** "January 22, 2025" — every day button's accessible name. */
export function formatDayLabel(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)
}

/** The twelve month names, for the month `Select`. */
export function monthLabels(locale?: string): string[] {
  const format = new Intl.DateTimeFormat(locale, { month: 'short' })
  return Array.from({ length: 12 }, (_, m) => format.format(new Date(2025, m, 1)))
}

/**
 * "1/12/2025" — the footer inputs' text form.
 *
 * Explicitly numeric rather than `dateStyle: 'short'`, which abbreviates the
 * year to two digits in en-US and would show the file's `1/12/2025` as
 * `1/12/25`.
 */
export function formatDateInput(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * The inverse of `formatDateInput`, or `null` if the text is not a date.
 *
 * Deliberately narrow: three numbers with any single separator, read in the
 * order `Intl` puts them for the active locale, so the field round-trips what
 * it displayed. It does **not** fall back to `Date.parse`, which accepts
 * "Tuesday" and a great deal else, and which reads a bare `2025-01-12` as UTC
 * — the one input shape most likely to be pasted in, and the one it would
 * shift by a day. A caller typing something this cannot read gets `null`, and
 * the field reverts to the value it had.
 */
export function parseDateInput(text: string, locale?: string): Date | null {
  const parts = text.trim().split(/[^0-9]+/).filter(Boolean)
  if (parts.length !== 3) return null

  const order = new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
    .formatToParts(new Date(2025, 0, 22))
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.type)

  const numbers = parts.map(Number)
  if (numbers.some((n) => !Number.isFinite(n))) return null

  const year = numbers[order.indexOf('year')]
  const month = numbers[order.indexOf('month')]
  const day = numbers[order.indexOf('day')]
  if (year == null || month == null || day == null) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  // A two-digit year is ambiguous, and the constructor resolves it to the 1900s
  // without complaining — `new Date(25, 0, 12)` is 1925. `formatDateInput`
  // always writes four digits, so requiring them keeps the round-trip and
  // refuses the guess.
  if (year < 100) return null

  const date = new Date(year, month - 1, day)
  // The constructor rolls 31 April over to 1 May rather than refusing it, so
  // check the parts survived rather than trusting it to have failed.
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null
}
