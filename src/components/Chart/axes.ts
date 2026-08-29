import { axisLine, gridline } from './palette'

/**
 * The axes and the grid — as configuration, not as components.
 *
 * Figma models these as component sets because it has to: `_X-Axis Presets`
 * carries 26 variants (13 time ranges × wide/narrow) and `_Y-Axis Presets`
 * carries 8, since a Figma component cannot compute a tick from data. Recharts
 * can. So none of those variants becomes a component here — they become the
 * *rules* that pick a tick interval and a label format, and the caller passes
 * data rather than a preset name.
 *
 * That is the whole reason this file is `.ts` and not `.tsx`. A preset the
 * caller states can disagree with the data it labels; a preset the data implies
 * cannot. `preset` is still available as an override for the case where the data
 * is genuinely ambiguous — a 28-row array that means four weeks, not 28 days.
 *
 * ## What Figma pins, and what it leaves to the data
 *
 * Pinned: gridlines are `Surface/Border` at 1px, **horizontal only**; the x
 * baseline is `Surface/Border Emphasized`, a step heavier, because a baseline is
 * the thing values are measured from and a gridline is scenery; the y axis draws
 * no line at all, only labels. Tick labels are 12px Geist Mono in
 * `Content/Subtle` — mono so digits line up column-to-column, and subtle because
 * axis text is the most recessive thing on a chart.
 *
 * Left to the data: how many ticks, and what they say.
 */

/**
 * The width at which a chart stops being "wide", from Figma's own
 * `Chart Breakpoint` variable (600). Every axis preset in the file is drawn
 * twice, either side of this number, and the only thing that changes between
 * them is how many labels fit.
 */
export const CHART_BREAKPOINT = 600

/** Most labels that fit without colliding, either side of the breakpoint. */
const MAX_TICKS_WIDE = 16
const MAX_TICKS_NARROW = 6

/** The y-label column, `width/w-10`. */
const Y_AXIS_WIDTH = 40
/** Gap between a tick label and its axis, `spacing/2`. */
const TICK_MARGIN = 8

/** Tick labels: 12px mono, subtle, and tabular so a column of numbers aligns. */
const TICK_CLASS = 'fill-content-subtle font-mono text-sm tabular-nums'

/** What the x axis is counting. Derived from the data unless the caller overrides it. */
export type ChartXPreset = 'hours' | 'days' | 'months' | 'categories'

/**
 * Round a value to something a reader can hold in their head: `2k`, `1.5k`,
 * `2.4M`. Lowercase `k` is Figma's, and it is the one that matters — thousands
 * are the common case on these charts and `2K` reads as a shout beside 12px
 * axis text. `M` and `B` stay capital, as they conventionally are.
 */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'

  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

  return formatted.replace('K', 'k')
}

/** The full value, thousands-separated, for tooltips — where there is room to be exact. */
export function formatFullNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat('en-US').format(value)
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/**
 * Work out what the x axis is counting from the values themselves.
 *
 * Anything that is not a parseable date is `categories`, which is the honest
 * answer — a bar chart of country names has no interval to infer.
 */
export function inferXPreset(values: readonly unknown[]): ChartXPreset {
  const dates = values.map(toDate)
  if (dates.length === 0 || dates.some((d) => d === null)) return 'categories'

  // One point has no span to measure, but it is still a date, and falling
  // through to `categories` here was a real bug: the tick formatter passes a
  // category straight through, so a single-point chart printed the whole ISO
  // string — `2026-01-01T00:00:00.000Z` — under its one mark. `days` is the safe
  // guess because a bucketed series is nearly always daily; `xPreset` overrides
  // it for the chart that is genuinely one hour or one month.
  if (dates.length === 1) return 'days'

  const first = dates[0]!
  const last = dates[dates.length - 1]!
  const spanHours = Math.abs(last.getTime() - first.getTime()) / 36e5

  if (spanHours <= 48) return 'hours'
  if (spanHours <= 24 * 92) return 'days'
  return 'months'
}

/**
 * How many ticks to skip between labels.
 *
 * Recharts' `interval` is a skip count, so 0 labels every tick and 1 labels
 * every other one. Reproducing Figma's own 31-day chart is the check: 31 points
 * in a wide chart gives `ceil(31/16) - 1 = 1`, which labels days 1, 3, 5 … 31 —
 * exactly the sixteen labels the file draws.
 */
export function tickInterval(count: number, wide: boolean): number {
  const max = wide ? MAX_TICKS_WIDE : MAX_TICKS_NARROW
  if (count <= max) return 0
  return Math.ceil(count / max) - 1
}

/**
 * Label a date tick.
 *
 * The month is written **only when it changes** — "Jan 1", then 3, 5, 7 — which
 * is how Figma's chart reads and how a person would write it. Repeating "Jan" on
 * sixteen labels is noise that also costs the width the numbers need.
 *
 * ## Why this formats in UTC by default
 *
 * A chart like this plots **buckets** — a day's sessions, a month's signups —
 * and a bucket's label has to be the same for every reader. Formatting in local
 * time breaks that: `new Date('2026-01-01')` is parsed by JavaScript as UTC
 * midnight, so a reader in California sees it as 31 December and the whole axis
 * slides back a day. It is the most common date bug there is, and on a chart it
 * is invisible — the shape is still right, only the labels lie.
 *
 * So the default is UTC, which makes a date-only value render as the day it
 * says. Pass a `timeZone` for the case this is wrong for: wall-clock times that
 * genuinely belong to a place, like an hourly chart of one shop's trading day.
 */
export function formatDateTick(
  value: unknown,
  preset: ChartXPreset,
  previous?: unknown,
  timeZone = 'UTC',
): string {
  const date = toDate(value)
  if (!date) return String(value ?? '')

  const previousDate = toDate(previous)
  const parts = (d: Date, options: Intl.DateTimeFormatOptions) =>
    d.toLocaleString('en-US', { ...options, timeZone })

  // Read the fields through the same zone the labels are written in, so
  // "has the month changed?" cannot disagree with what the label says.
  const fieldsOf = (d: Date) => ({
    day: Number(parts(d, { day: 'numeric' })),
    month: parts(d, { month: 'short' }),
    year: parts(d, { year: 'numeric' }),
    hour24: Number(parts(d, { hour: 'numeric', hour12: false }).replace('24', '0')),
  })

  const now = fieldsOf(date)
  const before = previousDate ? fieldsOf(previousDate) : null

  switch (preset) {
    case 'hours': {
      const suffix = now.hour24 < 12 ? 'AM' : 'PM'
      const twelve = now.hour24 % 12 === 0 ? 12 : now.hour24 % 12
      // The meridiem is worth the width only where it flips, or at the start.
      return !before || twelve === 12 ? `${twelve}${suffix}` : String(twelve)
    }
    case 'months':
      return !before || before.year !== now.year ? `${now.month} ${now.year.slice(-2)}` : now.month
    case 'days':
      return !before || before.month !== now.month ? `${now.month} ${now.day}` : String(now.day)
    case 'categories':
      return String(value ?? '')
  }
}

/**
 * `CartesianGrid` props.
 *
 * **Horizontal lines only.** Vertical gridlines would box every point into a
 * cell and the chart would start reading as a table; the x labels already say
 * where a point sits. Solid, never dashed — a dashed gridline competes with a
 * dashed *series*, which in this library means a projection or a benchmark and
 * has to stay the only dashed thing on the plot.
 */
export const chartGridProps = {
  stroke: gridline,
  strokeWidth: 1,
  vertical: false,
  horizontal: true,
} as const

export interface XAxisOptions {
  /** Whether the chart is at or past `CHART_BREAKPOINT`. Decides how many labels fit. */
  wide?: boolean
  /** How many points there are, for the tick interval. */
  count?: number
  /** Override the inferred preset where the data is ambiguous. */
  preset?: ChartXPreset
}

/**
 * `XAxis` props: the emphasized baseline, no tick marks, mono labels, and an
 * interval chosen from the point count.
 *
 * Tick *marks* are off deliberately — the label sits directly under its point
 * and a little serif pointing at it adds ink without adding information. The
 * baseline stays, because it is the zero the bars and lines grow from.
 */
export function xAxisProps({ wide = true, count = 0 }: XAxisOptions = {}) {
  return {
    axisLine: { stroke: axisLine, strokeWidth: 1 },
    tickLine: false,
    tickMargin: TICK_MARGIN,
    tick: { className: TICK_CLASS },
    interval: tickInterval(count, wide),
    minTickGap: 0,
  }
}

/**
 * Round a step up to something a reader can count in: 1, 1.5, 2, 2.5, 5 or 10
 * times a power of ten. The ladder is the usual one plus 1.5, which is worth
 * having — without it a max of 456 over four intervals rounds to a step of 200
 * and the plot uses barely half its height, where 150 fills it and still reads
 * as a round number.
 */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1

  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalized = raw / magnitude
  const step =
    normalized <= 1 ? 1 : normalized <= 1.5 ? 1.5 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10

  return step * magnitude
}

/**
 * The top of the y axis: the smallest round number at or above the data that
 * divides evenly by the gridline count.
 *
 * **Why this is not left to Recharts.** Its automatic domain ends at the largest
 * value present and divides that by the tick count, which is fine when the data
 * happens to be round and poor when it does not. A single-point chart is the
 * case that exposes it — one value of 1,800 produced the ticks 0, 450, 900,
 * 1.4k, 1.8k, and a scale a reader cannot count in is a scale they have to read
 * every label of.
 *
 * Rounding the *top* rather than the ticks is what keeps them all round at once,
 * because every tick is then `max × n / intervals`.
 *
 * This reproduces what Recharts already got right — 1,990 over four intervals
 * still gives 2k, and 20,000 still gives 20k — so it changes the bad cases and
 * leaves the good ones alone. That is the property the unit tests pin.
 */
export function niceMax(dataMax: number, lines: number): number {
  const intervals = Math.max(1, lines - 1)
  if (!Number.isFinite(dataMax) || dataMax <= 0) return intervals
  return niceStep(dataMax / intervals) * intervals
}

export interface YAxisOptions {
  /**
   * How many gridlines, 2–8 — Figma's `_Y-Axis Presets` `Lines` axis. Five is
   * the default and the one the file draws: four intervals divides a range into
   * quarters, which a reader can halve twice by eye.
   */
  lines?: number
}

/**
 * `YAxis` props: labels only, no axis line, no ticks, compact numbers.
 *
 * The y axis draws no line of its own because the gridlines already run the full
 * width at every labeled value — a vertical rule beside them would be a fifth
 * line saying nothing. This is Figma's `_Chart Grid`, which has horizontal rules
 * and one heavier baseline, and no left edge.
 */
export function yAxisProps({ lines = 5 }: YAxisOptions = {}) {
  return {
    axisLine: false as const,
    tickLine: false as const,
    tickCount: lines,
    // Only the upper bound is rounded, and only when the data is entirely
    // non-negative — which is the case a zero baseline is right for. Anything
    // with negatives needs a floor as well as a ceiling and a midpoint that
    // stays at zero, so it is left to Recharts rather than half-handled here.
    domain: [
      (dataMin: number) => (dataMin >= 0 ? 0 : dataMin),
      (dataMax: number) => niceMax(dataMax, lines),
    ] as [(min: number) => number, (max: number) => number],
    allowDecimals: false,
    width: Y_AXIS_WIDTH,
    tickMargin: TICK_MARGIN,
    tick: { className: TICK_CLASS },
    tickFormatter: formatCompactNumber,
  }
}
