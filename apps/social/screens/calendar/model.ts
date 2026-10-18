import { addDays, sameDay, startOfDay, startOfWeek } from '../../data/dates'
import { posts } from '../../data/posts'
import type { Post } from '../../data/types'

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
  return addDays(today, post.week * 7 + post.day - 1)
}

/** The posts on one calendar day, earliest first. */
export function postsOn(date: Date): Post[] {
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
