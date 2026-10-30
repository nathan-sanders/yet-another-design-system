import { describe, expect, it } from 'vitest'

import { campaigns as seed } from '../../data/campaigns'
import { addDays } from '../../data/dates'
import { drafts } from '../../data/drafts'
import { initialIdeas } from '../../data/ideas'
import { posts } from '../../data/posts'
import type { Campaign } from '../../data/types'
import { today as realToday } from '../calendar/model'
import {
  campaignPencilled,
  campaignWeeks,
  currentWeekIndex,
  weekLabel,
  campaignPosts,
  compactCount,
  dateSpanLabel,
  gapsFor,
  nextUpFor,
  progressFor,
  summaryFor,
  dateRangeLabel,
  edgeDateLabel,
  placeBar,
  postsLabel,
  stepWindow,
  startOfMondayWeek,
  timelineRange,
  todayPosition,
  windowYear,
} from './model'

// Wednesday 28 October 2026: the day the file's today line sits on.
const today = new Date(2026, 9, 28)
const range = timelineRange(today)

function campaign(start: number, end: number | null): Campaign {
  return {
    id: 'c',
    name: 'C',
    color: 'blue',
    status: 'planning',
    start,
    end,
    channels: [],
    ownerId: 'nathan',
    scheduled: 0,
    planned: 6,
  }
}

describe('timelineRange', () => {
  it('draws the frame’s twelve Monday weeks, Sep 28 to Dec 14', () => {
    expect(range.start).toEqual(new Date(2026, 8, 28))
    expect(range.weeks).toHaveLength(12)
    expect(range.weeks.at(-1)).toEqual(new Date(2026, 11, 14))
    expect(range.days).toBe(84)
  })

  it('starts the week on Monday, even from a Sunday', () => {
    expect(startOfMondayWeek(new Date(2026, 10, 1))).toEqual(new Date(2026, 9, 26))
    expect(startOfMondayWeek(new Date(2026, 9, 26))).toEqual(new Date(2026, 9, 26))
  })
})

describe('window navigation', () => {
  const next = timelineRange(stepWindow(today, 1))
  const previous = timelineRange(stepWindow(today, -1))

  it('steps a whole window, so the next twelve weeks follow on with none skipped', () => {
    expect(next.start).toEqual(new Date(2026, 11, 21))
    expect(addDays(range.start, range.days)).toEqual(next.start)
    expect(addDays(previous.start, previous.days)).toEqual(range.start)
    expect(next.start.getDay()).toBe(1)
  })

  it('names the year holding most of the window', () => {
    expect(windowYear(range)).toBe(2026)
    // Dec 21 – Mar 14: the middle is in February.
    expect(windowYear(next)).toBe(2027)
    expect(windowYear(previous)).toBe(2026)
  })

  it('puts today off the range, so no line is drawn', () => {
    expect(todayPosition(next, today)).toBeLessThan(0)
    expect(todayPosition(previous, today)).toBeGreaterThan(1)
  })

  it('keeps an open-ended campaign running into the next window', () => {
    expect(placeBar(campaign(-57, null), next, today)).toMatchObject({
      kind: 'bar',
      left: 0,
      width: 1,
    })
    expect(placeBar(campaign(-23, -2), next, today).kind).toBe('before')
    // Austin (Jan 12 – 25) lands in the next window, as a bar.
    expect(placeBar(campaign(76, 89), next, today).kind).toBe('bar')
  })

  it('adds the year to an edge date only once it is far from the weeks drawn', () => {
    expect(edgeDateLabel(new Date(2027, 0, 12), range)).toBe('Jan 12')
    const ahead = timelineRange(stepWindow(today, 4))
    expect(edgeDateLabel(new Date(2026, 9, 26), ahead)).toBe('Oct 26, 2026')
  })
})

describe('placeBar', () => {
  it('places Fall Harvest Bowls where the file does (x 97, w 301 of 1156)', () => {
    const bar = placeBar(campaign(-23, -2), range, today)
    expect(bar.kind).toBe('bar')
    if (bar.kind !== 'bar') return
    expect(bar.left * 1156).toBeCloseTo(96.3, 0)
    expect(bar.width * 1156).toBeCloseTo(302.8, 0)
    expect(bar.clipStart || bar.clipEnd).toBe(false)
  })

  it('squares both sides of an open-ended campaign that started before the range', () => {
    const bar = placeBar(campaign(-57, null), range, today)
    expect(bar).toEqual({ kind: 'bar', left: 0, width: 1, clipStart: true, clipEnd: true })
  })

  it('squares only the end of a campaign that runs past the range', () => {
    const bar = placeBar(campaign(34, 64), range, today)
    expect(bar.kind === 'bar' && [bar.clipStart, bar.clipEnd]).toEqual([false, true])
  })

  it('makes a one-day campaign one day wide', () => {
    const bar = placeBar(campaign(0, 0), range, today)
    expect(bar.kind === 'bar' && bar.width).toBeCloseTo(1 / 84)
  })

  it('says when a campaign starts after the range or ended before it', () => {
    expect(placeBar(campaign(76, 89), range, today)).toEqual({
      kind: 'after',
      start: new Date(2027, 0, 12),
    })
    expect(placeBar(campaign(-60, -31), range, today)).toEqual({
      kind: 'before',
      end: new Date(2026, 8, 27),
    })
  })

  it('keeps a campaign that ends on the first day drawn', () => {
    expect(placeBar(campaign(-60, -30), range, today).kind).toBe('bar')
  })
})

describe('labels', () => {
  it('writes the date range and the open-ended form', () => {
    expect(dateRangeLabel(campaign(-23, -2), today)).toBe('Oct 5 – Oct 26')
    expect(dateRangeLabel(campaign(-57, null), today)).toBe('From Sep 1')
  })

  it('writes the posts count on a bar', () => {
    expect(postsLabel(campaign(0, 3))).toBe('6 posts')
    expect(postsLabel(campaign(0, null))).toBe('6 posts · no end date')
  })

  it('writes counts the way the Engagements column does', () => {
    expect(compactCount(8_900)).toBe('8.9K')
    expect(compactCount(21_300)).toBe('21.3K')
    expect(compactCount(12_000)).toBe('12K')
    expect(compactCount(640)).toBe('640')
  })

  it('puts the today line in the middle of today', () => {
    // The file draws it at x 419 of 1156.
    expect(todayPosition(range, today) * 1156).toBeCloseTo(419.7, 0)
  })
})

describe('the campaign page', () => {
  // The real seed, against the real today: the posts slide with the date, so
  // the page's numbers are the same whatever day the mock is opened on. `now`
  // is the start of today, so today's posts are all still scheduled.
  const summer = seed.find((c) => c.id === 'summer-menu')!
  const now = realToday
  const planned = campaignPosts(summer, posts, now)
  const pencilled = campaignPencilled(summer, drafts, Object.values(initialIdeas))

  it('counts the file’s Progress: 7 published, 9 scheduled, 2 of 3 creators, 1 gap', () => {
    expect(progressFor(summer, planned, realToday, pencilled)).toEqual({
      planned: 18,
      scheduled: 9,
      published: 7,
      creatorsOnBoard: 2,
      creators: 3,
      gaps: 1,
    })
  })

  it('finds the one gap: TikTok, two days out, between its draft and its next post', () => {
    const gaps = gapsFor(summer, [...planned, ...pencilled], realToday)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]!.network).toBe('tiktok')
    expect(gaps[0]!.date).toEqual(addDays(realToday, 2))
  })

  it('has no gap without the draft: then TikTok is two quiet days, a rhythm', () => {
    expect(gapsFor(summer, planned, realToday)).toEqual([])
  })

  it('calls two quiet days a rhythm, not a gap', () => {
    // Facebook posts tomorrow and nothing after: no gap, however empty it looks.
    expect(
      gapsFor(summer, [...planned, ...pencilled], realToday).some((g) => g.network === 'facebook'),
    ).toBe(false)
  })

  it('lists Next up one day at a time: a post, a creator draft, the gap', () => {
    const names: Record<string, string> = { alena: 'Alena Kenter' }
    const rows = nextUpFor(summer, planned, (id) => names[id] ?? id, realToday, pencilled)
    expect(rows.map((r) => r.kind)).toEqual(['post', 'deliverable', 'gap'])
    expect(rows[1]!.title).toBe('Alena Kenter’s TikTok draft')
    expect(rows[2]!.title).toBe('Nothing scheduled on TikTok')
    expect(rows[0]!.meta).toBe('TikTok Video · 7:00 pm')
  })

  it('writes the summary from the numbers, with the insight in the middle', () => {
    const lines = summaryFor(summer, planned, realToday, pencilled)
    expect(lines[0]).toMatch(
      /^Day 10 of 14 and on pace: 168K reach against a 250K target, and engagements are already past goal\.$/,
    )
    expect(lines[1]).toBe(summer.insight)
    expect(lines[2]).toMatch(/^One gap this week: nothing is scheduled for TikTok on \w+day\.$/)
  })

  it('says a campaign that has not started when it starts', () => {
    const austin = seed.find((c) => c.id === 'austin-store-opening')!
    expect(summaryFor(austin, [], realToday)[0]).toMatch(/^Starts \w+ \d+, in 76 days\./)
  })

  it('draws the run as the Sunday weeks it touches', () => {
    // Oct 19 (Mon) – Nov 1 (Sun) around the file's Wednesday: three weeks.
    const weeks = campaignWeeks(campaign(-9, 4), today)
    expect(weeks.map((w) => w.getDate())).toEqual([18, 25, 1])
    expect(currentWeekIndex(weeks, today)).toBe(1)
    expect(weekLabel(weeks[1]!)).toBe('Oct 25 – 31')
    expect(weekLabel(weeks[2]!)).toBe('Nov 1 – 7')
  })

  it('writes one month once in a date span', () => {
    expect(dateSpanLabel(campaign(-9, 4), today)).toBe('Oct 19 – Nov 1')
    expect(dateSpanLabel(campaign(-23, -2), today)).toBe('Oct 5 – 26')
    expect(dateSpanLabel(campaign(-57, null), today)).toBe('From Sep 1')
  })
})
