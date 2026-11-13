/**
 * Every frame on ↪ Yet Project is drawn on Thursday, November 5, 2026, and its
 * dates are cross-checked against that day (the permit's 5-day lag, the 6
 * buffer days before crew training). So the data is written in the file's
 * dates, and `day()` slides each one by whole weeks, so that the file's
 * Thursday lands on this week's. Weekdays and the gaps between dates never
 * change; "today" is always a Thursday, with this week's work around it.
 *
 * Yet Social does the same around a Monday (`social/screens/calendar/model.ts`).
 */
const FIGMA_TODAY = new Date(2026, 10, 5)
const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Thursday of the week holding the real date, weeks starting Monday. */
function thisThursday(): Date {
  const now = startOfDay(new Date())
  const sinceMonday = (now.getDay() + 6) % 7
  return addDays(now, 3 - sinceMonday)
}

export const today = thisThursday()

/** Whole weeks between the file's Thursday and this one, in days. */
const SHIFT = Math.round((today.getTime() - FIGMA_TODAY.getTime()) / DAY_MS)

/** A date as the file writes it (`'2026-11-18'`), moved onto this week. */
export function day(iso: string): Date {
  const [year, month, date] = iso.split('-').map(Number)
  return addDays(new Date(year, month - 1, date), SHIFT)
}

/** A date as the file writes it, moved by whole days and written back the same way. */
export function shiftIso(iso: string, days: number): string {
  const [year, month, date] = iso.split('-').map(Number)
  const next = addDays(new Date(year, month - 1, date), days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
export const fullDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
export const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

/** "Nov 2 – Jan 12", as the project header's Dates button reads. */
export function rangeLabel(start: Date, end: Date): string {
  return `${shortDate.format(start)} – ${shortDate.format(end)}`
}

/** "18th", for a date written as the day of the month. */
function ordinal(n: number): string {
  const tens = n % 100
  const suffix = tens >= 11 && tens <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
  return `${n}${suffix}`
}

/**
 * Prose with dates in it, each moved onto this week: `{2026-11-18}` reads
 * "Nov 18", and `{2026-11-18:th}` the way people write it in a comment,
 * "18th". Data writes its dates this way so the words agree with the List.
 */
export function datedText(text: string): string {
  return text.replace(/\{(\d{4}-\d{2}-\d{2})(:th)?\}/g, (_, iso: string, th?: string) =>
    th ? ordinal(day(iso).getDate()) : shortDate.format(day(iso)),
  )
}

export const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
