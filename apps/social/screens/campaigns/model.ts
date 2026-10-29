import { addDays, formatTime, monthDay, sameDay, startOfDay } from '../../data/dates'
import { profileFor } from '../../data/posts'
import {
  NETWORK_NAMES,
  type Campaign,
  type CampaignCreator,
  type Network,
  type Post,
  type PostFormat,
} from '../../data/types'
import { daysBetween, postDate, postMoment, today as realToday } from '../calendar/model'

const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long' })

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

/** Weeks on screen at once. */
const WEEKS_SHOWN = WEEKS_BEFORE + 1 + WEEKS_AFTER

/**
 * The navigation's step: the anchor moved a whole window, so a press shows
 * the next twelve weeks with none skipped and none repeated.
 */
export function stepWindow(anchor: Date, steps: number): Date {
  return addDays(anchor, steps * WEEKS_SHOWN * 7)
}

/**
 * The twelve weeks drawn around `anchor`, whose week is the fifth column:
 * today, or today a whole number of windows away.
 */
export function timelineRange(anchor: Date = realToday): TimelineRange {
  const start = addDays(startOfMondayWeek(anchor), -WEEKS_BEFORE * 7)
  const count = WEEKS_SHOWN
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

/**
 * The year between the arrows: the year of the window's middle day, so a
 * window across New Year says whichever year holds most of it.
 */
export function windowYear(range: TimelineRange): number {
  return addDays(range.start, Math.floor(range.days / 2)).getFullYear()
}

/**
 * The today line: the middle of today's day, as a fraction of the range.
 * Outside 0–1 when the navigation has stepped away from today.
 */
export function todayPosition(range: TimelineRange, today: Date = realToday): number {
  return (daysBetween(range.start, today) + 0.5) / range.days
}

/**
 * A date on an edge Token ("starts Jan 13 →"). Near the range the month and
 * day are enough, as the file writes it; once the navigation has stepped a
 * few windows, a date can be a year or more away, so past six months it says
 * the year too.
 */
export function edgeDateLabel(date: Date, range: TimelineRange): string {
  const end = addDays(range.start, range.days - 1)
  const away = Math.max(daysBetween(date, range.start), daysBetween(end, date))
  const short = monthDay.format(date)
  return away > 182 ? `${short}, ${date.getFullYear()}` : short
}

// ---------------------------------------------------------------------------
// The campaign page (`40006129:38303`)

/** Days the campaign runs, both ends included; `null` for one with no end. */
export function campaignLength(campaign: Campaign): number | null {
  return campaign.end === null ? null : campaign.end - campaign.start + 1
}

/**
 * Which day of the run today is: 1 on the first day. Below 1 before it starts,
 * above the length after it ends.
 */
export function campaignDay(campaign: Campaign): number {
  return 1 - campaign.start
}

/**
 * The header's date button: "Oct 19 – Nov 1", and "Oct 5 – 26" when both ends
 * share a month, which is how the file writes a range in one month.
 */
export function dateSpanLabel(campaign: Campaign, today: Date = realToday): string {
  const start = campaignDate(campaign.start, today)
  if (campaign.end === null) return `From ${monthDay.format(start)}`
  const end = campaignDate(campaign.end, today)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  return `${monthDay.format(start)} – ${sameMonth ? end.getDate() : monthDay.format(end)}`
}

/** "3 channels", "1 channel". */
export function channelsLabel(campaign: Campaign): string {
  const n = campaign.channels.length
  return `${n} ${n === 1 ? 'channel' : 'channels'}`
}

/** A post as the page needs it: where and when it goes out, and whether it has. */
export interface PlannedPost {
  post: Post
  network: Network
  date: Date
  published: boolean
}

/** The campaign's posts, oldest first. */
export function campaignPosts(
  campaign: Campaign,
  posts: readonly Post[],
  now: Date = new Date(),
): PlannedPost[] {
  return posts
    .filter((post) => post.campaignId === campaign.id)
    .map((post) => ({
      post,
      network: profileFor(post).network,
      date: postDate(post),
      published: postMoment(post) <= now,
    }))
    .sort((a, b) => postMoment(a.post).getTime() - postMoment(b.post).getTime())
}

/** A channel with nothing on a day it would be expected to post. */
export interface PlanGap {
  date: Date
  network: Network
}

/** How far ahead the Overview looks for gaps: the file's "this week". */
export const GAP_WINDOW_DAYS = 7

/**
 * Days a channel skips between two of its own posts, from today for the next
 * seven days and inside the run. A one-day hole in a channel that posted the
 * day before and posts the day after is a gap; two quiet days in a row are a
 * rhythm, not a hole, so they are left alone. That is the file's one "Gap" —
 * TikTok on Thursday, between Wednesday's draft and Friday's post — and not
 * the other empty cells around it.
 *
 * "This week" is the next seven days rather than the calendar week, so the
 * number doesn't drop to nothing every Saturday as the week runs out.
 */
export function gapsFor(
  campaign: Campaign,
  planned: readonly PlannedPost[],
  today: Date = realToday,
): PlanGap[] {
  const last = campaign.end === null ? GAP_WINDOW_DAYS - 1 : campaign.end
  const from = Math.max(0, campaign.start)
  const to = Math.min(GAP_WINDOW_DAYS - 1, last)
  const busy = (network: Network, offset: number) =>
    planned.some((p) => p.network === network && sameDay(p.date, addDays(today, offset)))

  const gaps: PlanGap[] = []
  for (let offset = from; offset <= to; offset++) {
    for (const network of campaign.channels) {
      if (busy(network, offset)) continue
      if (busy(network, offset - 1) && busy(network, offset + 1)) {
        gaps.push({ date: addDays(today, offset), network })
      }
    }
  }
  return gaps
}

/** Creators who said yes: they count toward "2 of 3" and have work due. */
export function isOnBoard(creator: CampaignCreator): boolean {
  return creator.status === 'confirmed' || creator.status === 'live'
}

/** The creators still in the campaign: an offer withdrawn by a cancel isn't. */
export function activeCreators(campaign: Campaign): CampaignCreator[] {
  return (campaign.creators ?? []).filter((c) => c.status !== 'withdrawn')
}

export interface CampaignProgress {
  planned: number
  scheduled: number
  published: number
  creatorsOnBoard: number
  creators: number
  gaps: number
}

/** The Progress block's numbers, all but Assets ready, which the page counts. */
export function progressFor(
  campaign: Campaign,
  planned: readonly PlannedPost[],
  today: Date = realToday,
): CampaignProgress {
  const creators = activeCreators(campaign)
  return {
    planned: campaign.planned,
    scheduled: planned.filter((p) => !p.published).length,
    published: planned.filter((p) => p.published).length,
    creatorsOnBoard: creators.filter(isOnBoard).length,
    creators: creators.length,
    gaps: gapsFor(campaign, planned, today).length,
  }
}

const FORMAT_NAMES: Record<PostFormat, string> = {
  post: 'Post',
  carousel: 'Carousel',
  reel: 'Reel',
  story: 'Story',
}

/** One row of Next up. */
export type NextUpItem =
  | { kind: 'post'; date: Date; title: string; meta: string; postId: string }
  | { kind: 'deliverable'; date: Date; title: string; meta: string; creatorId: string }
  | { kind: 'gap'; date: Date; title: string; meta: string; network: Network }

export const NEXT_UP_TOKEN: Record<NextUpItem['kind'], string> = {
  post: 'Scheduled',
  deliverable: 'Draft due',
  gap: 'Gap',
}

/**
 * What's coming, one row per day, the file's three: Tuesday's post, Wednesday's
 * creator draft, Thursday's gap. A day with several things shows the one that
 * needs someone — a gap before a creator's due draft before a scheduled post,
 * and the earliest post — because the Plan tab is where the rest is.
 */
export function nextUpFor(
  campaign: Campaign,
  planned: readonly PlannedPost[],
  creatorName: (id: string) => string,
  today: Date = realToday,
  rows = 3,
): NextUpItem[] {
  if (campaign.status === 'cancelled') return []
  const gaps = gapsFor(campaign, planned, today)
  const last = campaign.end ?? Math.max(campaign.start, 0) + GAP_WINDOW_DAYS - 1
  const items: NextUpItem[] = []
  for (let offset = Math.max(0, campaign.start); offset <= last && items.length < rows; offset++) {
    const date = addDays(today, offset)
    const gap = gaps.find((g) => sameDay(g.date, date))
    if (gap) {
      items.push({
        kind: 'gap',
        date,
        title: `Nothing scheduled on ${NETWORK_NAMES[gap.network]}`,
        meta: 'Gap in the plan',
        network: gap.network,
      })
      continue
    }
    const due = activeCreators(campaign).find((c) => isOnBoard(c) && c.due === offset)
    if (due) {
      items.push({
        kind: 'deliverable',
        date,
        title: `${creatorName(due.creatorId)}’s ${NETWORK_NAMES[due.network]} draft`,
        meta: 'Creator deliverable',
        creatorId: due.creatorId,
      })
      continue
    }
    const post = planned.find((p) => !p.published && sameDay(p.date, date))
    if (post) {
      items.push({
        kind: 'post',
        date,
        title: post.post.body,
        meta: `${NETWORK_NAMES[post.network]} ${FORMAT_NAMES[post.post.format ?? 'post']} · ${formatTime(post.post.time)}`,
        postId: post.post.id,
      })
    }
  }
  return items
}

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

/**
 * Yak's summary, three lines as the file has them: where the run is and how
 * it is pacing, what is working, and what is missing. Written from the
 * numbers, so every campaign gets one; the middle line is the campaign's
 * `insight`, the one thing the numbers can't say.
 */
export function summaryFor(
  campaign: Campaign,
  planned: readonly PlannedPost[],
  today: Date = realToday,
): string[] {
  const progress = progressFor(campaign, planned, today)
  const length = campaignLength(campaign)
  const day = campaignDay(campaign)
  const lines: string[] = []

  if (campaign.status === 'cancelled') {
    lines.push(
      `Cancelled on ${monthDay.format(campaignDate(campaign.end ?? 0, today))}. ${progress.published} posts went out, and their results stay on Measure.`,
    )
  } else if (day < 1) {
    lines.push(
      `Starts ${monthDay.format(campaignDate(campaign.start, today))}, in ${campaign.start} ${
        campaign.start === 1 ? 'day' : 'days'
      }. ${progress.scheduled} of ${progress.planned} posts are scheduled.`,
    )
  } else if (length !== null && day > length) {
    lines.push(
      `Ended ${monthDay.format(campaignDate(campaign.end!, today))}. ${progress.published} of ${progress.planned} posts went out.`,
    )
  } else {
    const where = length === null ? `Day ${day}` : `Day ${day} of ${length}`
    const reach = campaign.targets?.reach
    const goal = campaign.targets?.engagements
    const engaged = campaign.engagements?.total ?? 0
    const pastGoal = goal !== undefined && engaged >= goal
    if (reach && length !== null) {
      // On pace within a tenth of the run: a day's lag isn't news.
      const onPace = reach.actual / reach.target >= day / length - 0.1
      lines.push(
        `${where} and ${onPace ? 'on pace' : 'behind pace'}: ${compactCount(reach.actual)} reach against a ${compactCount(reach.target)} target${
          pastGoal ? ', and engagements are already past goal' : ''
        }.`,
      )
    } else if (pastGoal) {
      lines.push(`${where}, and engagements are already past goal.`)
    } else {
      lines.push(
        `${where}. ${progress.published} posts are out and ${progress.scheduled} are scheduled.`,
      )
    }
  }

  if (campaign.insight && campaign.status !== 'cancelled') lines.push(campaign.insight)

  const gaps = gapsFor(campaign, planned, today)
  const first = gaps[0]
  if (first && campaign.status !== 'cancelled') {
    const when = `${NETWORK_NAMES[first.network]} on ${weekdayLong.format(first.date)}`
    lines.push(
      gaps.length === 1
        ? `One gap this week: nothing is scheduled for ${when}.`
        : `${COUNT_WORDS[gaps.length] ?? gaps.length} gaps this week, the first ${when}.`,
    )
  }
  return lines
}

/** Plain words a Yak "Ask" opens with, so the chat knows which campaign. */
export function askAbout(campaign: Campaign): string {
  return `How is ${campaign.name} doing, and what should I do next?`
}
