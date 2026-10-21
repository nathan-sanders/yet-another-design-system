import { addDays, sameDay, startOfDay, startOfWeek } from '../../data/dates'
import type { CalendarDay, CalendarNote, Post } from '../../data/types'

export type CalendarView = 'day' | 'week' | 'month'

/** Today — the real date, read once per load. */
export const today = startOfDay(new Date())

/**
 * Where a post lands: **the whole schedule slides so that Figma's today lands
 * on the real today.** The data is written as Figma draws it — weeks and
 * weekdays around a Monday that is "today" (`40005911:33082`) — so a post's
 * date is its offset from that Monday, counted from the real date. Whatever
 * day the mock is opened, today has posts, the days after it are scheduled
 * (spilling into next week as the week runs out), and the days before it hold
 * what was published.
 */
export function postDate(post: Post): Date {
  return dayDate(post)
}

/** A `{week, day}` as a date — the same slide as `postDate`. */
export function dayDate({ week, day }: CalendarDay): Date {
  return addDays(today, week * 7 + day - 1)
}

/** A date back in `{week, day}` terms, counted from today in the Figma week. */
export function toCalendarDay(date: Date): CalendarDay {
  return { week: 0, day: daysBetween(today, date) + 1 }
}

/** Whole days from `from` to `to`; rounded, so a DST hour does not cost a day. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000)
}

/** The posts on one calendar day, earliest first — out of the schedule's `posts`. */
export function postsOn(posts: Post[], date: Date): Post[] {
  return posts
    .filter((post) => sameDay(postDate(post), date))
    .sort((a, b) => a.time.localeCompare(b.time))
}

/** When a post goes out, to the minute. */
export function postMoment(post: Post): Date {
  const at = postDate(post)
  const [h, m] = post.time.split(':').map(Number)
  at.setHours(h!, m!)
  return at
}

/**
 * Whether a post has gone out: its moment is behind the clock. Read once per
 * load like `today`, so a post does not flip state under an open panel.
 */
export function isPublished(post: Post): boolean {
  return postMoment(post) <= loadedAt
}

const loadedAt = new Date()

/** Whether a post can still be moved: only one that has not gone out. */
export function canMove(post: Post): boolean {
  return !isPublished(post)
}

export function postHour(post: Post): number {
  return Number(post.time.slice(0, 2))
}

export function isPast(date: Date): boolean {
  return date < today && !sameDay(date, today)
}

/** The seven days of `anchor`'s week. */
export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/**
 * Six whole weeks covering `anchor`'s month, Sunday first — Figma's month
 * (`40005911:33286`) always draws six rows, so the grid never changes height
 * between months.
 */
export function monthDays(anchor: Date): Date[] {
  const start = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/** Hours the day and week grids draw: 6 am to 11 pm, Figma's start. */
export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

/**
 * Figma's `_Past Day Pattern` (`40005824:15445`): fine diagonal hatching over a
 * day that has gone by. The file ships it as an image at 80% opacity; here it is
 * a repeating gradient drawn in `Surface/Border`, so it follows the theme and the
 * neutral ramp. The library has no hatch token, so the stripe pitch is written
 * here — see FINDINGS.md.
 */
export const pastDayPattern =
  'bg-[repeating-linear-gradient(135deg,var(--surface-border)_0_1px,transparent_1px_8px)]'

/** One note's piece of a run of days: where it starts, how far it reaches, which lane. */
export interface NoteSegment {
  note: CalendarNote
  /** Index into the days drawn. */
  column: number
  span: number
  lane: number
  /** The note started before the first day drawn, or runs past the last. */
  continuesBefore: boolean
  continuesAfter: boolean
}

/**
 * Lays notes over a run of consecutive days — a week, or one day — as bars in
 * lanes, the way a calendar's all-day strip does. Each note is clipped to the
 * days drawn; earlier starts go first, and the longer of two that start
 * together, so a campaign's run keeps the top lane and one-day callouts fill in
 * below it. Greedy: a note takes the first lane that is free across its span.
 */
export function layoutNotes(notes: CalendarNote[], days: Date[]): NoteSegment[] {
  if (days.length === 0) return []
  const first = days[0]!
  const last = days.length - 1
  const placed = notes
    .map((note) => {
      const from = daysBetween(first, dayDate(note.start))
      const to = daysBetween(first, dayDate(note.end))
      return { note, from, to }
    })
    .filter(({ from, to }) => to >= 0 && from <= last)
    .sort((a, b) => a.from - b.from || b.to - a.to)

  const laneEnds: number[] = []
  return placed.map(({ note, from, to }) => {
    const column = Math.max(0, from)
    const end = Math.min(last, to)
    let lane = laneEnds.findIndex((taken) => taken < column)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = end
    return {
      note,
      column,
      span: end - column + 1,
      lane,
      continuesBefore: from < 0,
      continuesAfter: to > last,
    }
  })
}
