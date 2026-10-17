import { addDays, sameDay, startOfDay, startOfWeek, weeksBetween } from '../../data/dates'
import { posts } from '../../data/posts'
import type { Post } from '../../data/types'

export type CalendarView = 'day' | 'week' | 'month'

/**
 * The mock's today: **the Monday of the real current week**, read once per load.
 *
 * Figma draws the calendar from a Monday — Sunday hatched as past, the rest of
 * the week ahead, Saturday empty — and the posts and Yak's insights are written
 * around that. Using the real date would make the same data read differently
 * every day: opened on a Saturday, six of seven days are history and "Saturday
 * is empty" is about today. So the weekday is pinned and the dates are real
 * (the month and year are always the current ones), and the now line still
 * follows the real clock.
 */
export const today = addDays(startOfWeek(startOfDay(new Date())), 1)

/** The posts on one calendar day, earliest first. */
export function postsOn(date: Date): Post[] {
  const week = weeksBetween(today, date)
  return posts
    .filter((post) => post.week === week && post.day === date.getDay())
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function postHour(post: Post): number {
  return Number(post.time.slice(0, 2))
}

/** The date a post sits on, for the detail panel's header. */
export function postDate(post: Post): Date {
  return addDays(startOfWeek(today), post.week * 7 + post.day)
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
