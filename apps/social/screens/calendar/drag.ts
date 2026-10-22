import { fromISODate, sameDay, toISODate } from '../../data/dates'
import type { Draft } from '../../data/drafts'
import type { Post } from '../../data/types'
import type { ScheduleAt } from './scheduleState'

// Dragging on the calendar: a scheduled post to another day or hour, or a draft
// out of the Drafts panel onto a day or hour. Pure, so the rules for where a
// drop lands are tested in node (`drag.test.ts`); the hooks are in `dragHooks.ts`.

/**
 * What a carried card holds in `data`. `label` is what the library's
 * announcements read — "Picked up veggie_vault, 9:00 am."
 */
export type CalendarDragData =
  { source: 'post'; post: Post; label: string } | { source: 'draft'; draft: Draft; label: string }

export const postDragId = (post: Post) => `post:${post.id}`
export const draftDragId = (draft: Draft) => `draft:${draft.id}`

export function isCalendarDrag(data: unknown): data is CalendarDragData {
  const source = (data as CalendarDragData | undefined)?.source
  return source === 'post' || source === 'draft'
}

/** A place a card can be let go: an hour of a day in the week or day view, or a whole month day. */
export type DropTarget = { kind: 'slot'; date: Date; hour: number } | { kind: 'day'; date: Date }

export const slotId = (date: Date, hour: number) => `slot:${toISODate(date)}:${hour}`
export const dayId = (date: Date) => `day:${toISODate(date)}`

export function parseTarget(id: string): DropTarget | null {
  const [kind, iso, hour] = id.split(':')
  const date = fromISODate(iso ?? null)
  if (!date) return null
  if (kind === 'slot' && hour !== undefined) return { kind: 'slot', date, hour: Number(hour) }
  if (kind === 'day') return { kind: 'day', date }
  return null
}

/** The hour a draft dropped on a month day goes out: 9 am, as a person would pick. */
export const DEFAULT_HOUR = 9
/** The last hour the day and week grids draw (`HOURS`): nothing is scheduled past it. */
const LAST_HOUR = 23

const hhmm = (hour: number, minute: string) => `${String(hour).padStart(2, '0')}:${minute}`

/**
 * When something with no time of its own goes out on `date`: 9 am, or on today
 * once 9 has gone, the next whole hour. Null once today's grid has run out. The
 * month view's drop and the composer's "Add post on this day" share it.
 */
export function defaultTimeOn(date: Date, now: Date): string | null {
  const nineGone = sameDay(date, now) && now.getHours() >= DEFAULT_HOUR
  const hour = nineGone ? now.getHours() + 1 : DEFAULT_HOUR
  if (hour > LAST_HOUR) return null
  return hhmm(hour, '00')
}

/**
 * When a new post started from a click on an hour of the week or day grid goes
 * out: on the hour, or, in the hour that is under way today, at the next
 * quarter still ahead in it — 10:20 makes 10:30. Null where none is left: a day
 * gone by, an hour gone by, or the last quarter of this one.
 */
export function slotTime(date: Date, hour: number, now: Date): string | null {
  for (const minute of ['00', '15', '30', '45']) {
    const time = hhmm(hour, minute)
    if (moment(date, time) > now) return time
  }
  return null
}

function moment(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  at.setHours(h!, m!)
  return at
}

/**
 * Where a card let go on `target` would go out, or null where it cannot.
 *
 * - **An hour of a day:** that hour. A post keeps its minutes — 9:15 dropped
 *   on 2 pm is 2:15 — and a draft, which has none, takes the hour itself.
 * - **A month day:** a post keeps its time. A draft goes at 9 am, or on today
 *   once 9 has gone, at the next whole hour.
 * - **Never in the past**, and never where the post already is — that drop is
 *   no move at all.
 *
 * `from` is the post's current day and time; `now` the clock.
 */
export function placeFor(
  data: CalendarDragData,
  target: DropTarget,
  { from, now }: { from?: ScheduleAt; now: Date },
): ScheduleAt | null {
  const minutes = data.source === 'post' ? data.post.time.slice(3, 5) : '00'
  let time: string
  if (target.kind === 'slot') {
    time = hhmm(target.hour, minutes)
  } else if (data.source === 'post') {
    time = data.post.time
  } else {
    const fallback = defaultTimeOn(target.date, now)
    if (fallback === null) return null
    time = fallback
  }
  if (moment(target.date, time) <= now) return null
  if (from && sameDay(from.date, target.date) && from.time === time) return null
  return { date: target.date, time }
}

/** Whether a target can take anything at all: not a day gone by, not an hour gone by today. */
export function targetOpen(target: DropTarget, now: Date): boolean {
  const day = new Date(target.date.getFullYear(), target.date.getMonth(), target.date.getDate())
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (day < startOfToday) return false
  if (target.kind === 'slot' && sameDay(day, now)) return target.hour >= now.getHours()
  return true
}
