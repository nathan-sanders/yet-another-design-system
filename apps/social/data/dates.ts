// Small date helpers. Everything is local time and day-precision — a mock
// calendar has no business with time zones.

const DAY = 24 * 60 * 60 * 1000

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** The Sunday that starts `date`'s week. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date)
  return addDays(day, -day.getDay())
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Whole weeks between two week starts. */
export function weeksBetween(from: Date, to: Date): number {
  return Math.round((startOfWeek(to).getTime() - startOfWeek(from).getTime()) / (7 * DAY))
}

/** `2025-07-07`, for the URL. */
export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function fromISODate(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

/** `9:00 am`, Figma's spelling. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h! < 12 ? 'am' : 'pm'
  const hour = h! % 12 === 0 ? 12 : h! % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

/** `9 am`, for the hour gutter. */
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm'
  return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`
}

export const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
export const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
export const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' })
export const fullDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
