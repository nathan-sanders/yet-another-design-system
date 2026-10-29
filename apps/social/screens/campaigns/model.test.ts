import { describe, expect, it } from 'vitest'

import type { Campaign } from '../../data/types'
import {
  compactCount,
  dateRangeLabel,
  edgeDateLabel,
  placeBar,
  postsLabel,
  shiftYears,
  startOfMondayWeek,
  timelineRange,
  todayPosition,
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

describe('year navigation', () => {
  const nextYear = timelineRange(shiftYears(today, 1))

  it('draws the same weeks a year on, still starting Monday', () => {
    expect(nextYear.start).toEqual(new Date(2027, 8, 27))
    expect(nextYear.start.getDay()).toBe(1)
  })

  it('puts today off the range, so no line is drawn', () => {
    expect(todayPosition(nextYear, today)).toBeLessThan(0)
    expect(todayPosition(timelineRange(shiftYears(today, -1)), today)).toBeGreaterThan(1)
  })

  it('keeps an open-ended campaign running across the next year', () => {
    expect(placeBar(campaign(-57, null), nextYear, today)).toMatchObject({
      kind: 'bar',
      left: 0,
      width: 1,
    })
    expect(placeBar(campaign(-23, -2), nextYear, today).kind).toBe('before')
  })

  it('adds the year to an edge date only once it is far from the weeks drawn', () => {
    expect(edgeDateLabel(new Date(2027, 0, 12), range)).toBe('Jan 12')
    expect(edgeDateLabel(new Date(2027, 0, 12), timelineRange(shiftYears(today, -1)))).toBe(
      'Jan 12, 2027',
    )
    expect(edgeDateLabel(new Date(2026, 9, 26), nextYear)).toBe('Oct 26, 2026')
  })

  it('rolls a leap day to Mar 1', () => {
    expect(shiftYears(new Date(2028, 1, 29), 1)).toEqual(new Date(2029, 2, 1))
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
