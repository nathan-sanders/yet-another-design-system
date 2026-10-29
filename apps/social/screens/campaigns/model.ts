import { addDays, monthDay, startOfDay } from '../../data/dates'
import type { Campaign } from '../../data/types'
import { daysBetween, today as realToday } from '../calendar/model'

export type CampaignsView = 'table' | 'timeline'

/**
 * A campaign day as a date. Like the calendar's `dayDate`, the offsets are
 * counted from the real today, so the set slides with the date the mock is
 * opened on and something is always live.
 */
export function campaignDate(offset: number, today: Date = realToday): Date {
  return addDays(today, offset)
}

/** "Oct 5 – Oct 26", or "From Sep 1" for a campaign with no end date. */
export function dateRangeLabel(campaign: Campaign, today: Date = realToday): string {
  const start = monthDay.format(campaignDate(campaign.start, today))
  if (campaign.end === null) return `From ${start}`
  return `${start} – ${monthDay.format(campaignDate(campaign.end, today))}`
}

/** "14 posts" on a timeline bar; an open-ended campaign says so. */
export function postsLabel(campaign: Campaign): string {
  const posts = `${campaign.planned} ${campaign.planned === 1 ? 'post' : 'posts'}`
  return campaign.end === null ? `${posts} · no end date` : posts
}

/** 8.9K, 21.3K, as the Engagements column writes them. */
export function compactCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n)
}

/** Weeks drawn before this one, and after it: the frame's Sep 28 … Dec 14 around Oct 26. */
export const WEEKS_BEFORE = 4
export const WEEKS_AFTER = 7

export interface TimelineRange {
  /** The first day drawn: a Monday. */
  start: Date
  /** Days drawn, a whole number of weeks. */
  days: number
  /** Each column's Monday. */
  weeks: Date[]
}

/** The Monday that starts `date`'s week — the timeline's weeks start Monday, the file's do. */
export function startOfMondayWeek(date: Date): Date {
  const day = startOfDay(date)
  return addDays(day, -((day.getDay() + 6) % 7))
}

export function timelineRange(today: Date = realToday): TimelineRange {
  const start = addDays(startOfMondayWeek(today), -WEEKS_BEFORE * 7)
  const count = WEEKS_BEFORE + 1 + WEEKS_AFTER
  return {
    start,
    days: count * 7,
    weeks: Array.from({ length: count }, (_, i) => addDays(start, i * 7)),
  }
}

export type BarPlacement =
  /** `left` and `width` are fractions of the range; a clipped side is drawn square. */
  | { kind: 'bar'; left: number; width: number; clipStart: boolean; clipEnd: boolean }
  /** Over before the first day drawn. */
  | { kind: 'before'; end: Date }
  /** Starts after the last day drawn. */
  | { kind: 'after'; start: Date }

/**
 * Where a campaign's bar sits on the timeline. Both of its days are included,
 * so a one-day campaign is one day wide. An open-ended campaign runs off the
 * right edge.
 */
export function placeBar(
  campaign: Campaign,
  range: TimelineRange,
  today: Date = realToday,
): BarPlacement {
  const from = daysBetween(range.start, campaignDate(campaign.start, today))
  // The day after the last one, so the arithmetic is half-open.
  const to =
    campaign.end === null
      ? Number.POSITIVE_INFINITY
      : daysBetween(range.start, campaignDate(campaign.end, today)) + 1
  if (to <= 0) return { kind: 'before', end: campaignDate(campaign.end!, today) }
  if (from >= range.days) return { kind: 'after', start: campaignDate(campaign.start, today) }
  const left = Math.max(from, 0)
  const right = Math.min(to, range.days)
  return {
    kind: 'bar',
    left: left / range.days,
    width: (right - left) / range.days,
    clipStart: from < 0,
    clipEnd: to > range.days,
  }
}

/** The today line: the middle of today's day, as a fraction of the range. */
export function todayPosition(range: TimelineRange, today: Date = realToday): number {
  return (daysBetween(range.start, today) + 0.5) / range.days
}
