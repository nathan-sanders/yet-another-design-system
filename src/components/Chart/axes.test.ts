import { describe, expect, it } from 'vitest'

import { formatCompactNumber, formatDateTick, inferXPreset, niceMax, tickInterval } from './axes'

/**
 * The axis rules are the part of Figma's chart page that became arithmetic
 * rather than components — 13 x presets × wide/narrow and 8 y presets collapse
 * into these four functions. They are pure, so they are worth testing directly:
 * the story suite would only catch a regression here by screenshot, and a tick
 * label that is subtly wrong looks like a design choice rather than a bug.
 */

describe('inferXPreset', () => {
  const day = (n: number) => new Date(Date.UTC(2026, 0, n)).toISOString()

  it('reads a span of days as days', () => {
    expect(inferXPreset([day(1), day(15), day(31)])).toBe('days')
  })

  it('reads a span under two days as hours', () => {
    expect(inferXPreset([
      new Date(Date.UTC(2026, 0, 1, 0)).toISOString(),
      new Date(Date.UTC(2026, 0, 1, 23)).toISOString(),
    ])).toBe('hours')
  })

  it('reads a span over three months as months', () => {
    expect(inferXPreset([day(1), new Date(Date.UTC(2026, 11, 1)).toISOString()])).toBe('months')
  })

  it('treats non-dates as categories', () => {
    expect(inferXPreset(['Chrome', 'Safari', 'Firefox'])).toBe('categories')
  })

  /**
   * The regression this file was written for. A lone date has no span to
   * measure, and returning `categories` made the formatter pass the value
   * through untouched — so a one-point chart printed the full ISO string under
   * its single mark.
   */
  it('still reads a single date as a date, not a category', () => {
    expect(inferXPreset([day(1)])).toBe('days')
    expect(formatDateTick(day(1), inferXPreset([day(1)]))).toBe('Jan 1')
  })

  it('treats no data as categories', () => {
    expect(inferXPreset([])).toBe('categories')
  })
})

describe('formatDateTick', () => {
  const day = (n: number) => new Date(Date.UTC(2026, 0, n)).toISOString()

  it('writes the month only when it changes', () => {
    expect(formatDateTick(day(1), 'days')).toBe('Jan 1')
    expect(formatDateTick(day(3), 'days', day(1))).toBe('3')
    expect(formatDateTick(new Date(Date.UTC(2026, 1, 2)).toISOString(), 'days', day(31))).toBe('Feb 2')
  })

  /**
   * The bug that opened the 31-day chart on "Dec 31": a date-only value is
   * parsed as UTC midnight, so formatting it locally slides the whole axis back
   * a day for anyone west of Greenwich. Pinned with an explicit zone either
   * side so the assertion cannot pass merely because CI happens to run in UTC.
   */
  it('formats in UTC by default, whatever the machine is set to', () => {
    expect(formatDateTick('2026-01-01', 'days')).toBe('Jan 1')
  })

  it('honors an explicit zone', () => {
    expect(formatDateTick('2026-01-01T00:00:00Z', 'days', undefined, 'America/Los_Angeles')).toBe('Dec 31')
  })

  it('marks the meridiem where it flips', () => {
    const at = (h: number) => new Date(Date.UTC(2026, 0, 1, h)).toISOString()
    expect(formatDateTick(at(0), 'hours')).toBe('12AM')
    expect(formatDateTick(at(4), 'hours', at(0))).toBe('4')
    expect(formatDateTick(at(12), 'hours', at(11))).toBe('12PM')
  })
})

describe('tickInterval', () => {
  /** Figma's own 31-day chart draws sixteen labels: Jan 1, 3, 5 … 31. */
  it('reproduces the 31-day wide chart', () => {
    expect(tickInterval(31, true)).toBe(1)
  })

  it('labels everything when everything fits', () => {
    expect(tickInterval(7, true)).toBe(0)
    expect(tickInterval(1, true)).toBe(0)
  })

  it('thins out below the breakpoint', () => {
    expect(tickInterval(31, false)).toBe(5)
  })
})

describe('niceMax', () => {
  /**
   * The single-point regression: one value of 1,800 gave Recharts the ticks
   * 0, 450, 900, 1.4k, 1.8k.
   */
  it('rounds a single awkward value up to a countable scale', () => {
    expect(niceMax(1800, 5)).toBe(2000)
  })

  /** And leaves alone the cases Recharts already got right. */
  it('agrees with the existing charts', () => {
    expect(niceMax(1990, 5)).toBe(2000)
    expect(niceMax(20000, 5)).toBe(20000)
    expect(niceMax(456, 5)).toBe(600)
  })

  it('divides evenly by the gridline count, so every tick is round', () => {
    for (const lines of [2, 3, 4, 5, 6, 7, 8]) {
      for (const max of [7, 93, 456, 1800, 12345, 987654]) {
        const top = niceMax(max, lines)
        expect(top).toBeGreaterThanOrEqual(max)
        const step = top / (lines - 1)
        // A round step is what makes every intermediate tick round too.
        expect(Number.isInteger(step) || Number.isInteger(step * 2)).toBe(true)
      }
    }
  })

  it('survives empty and degenerate data', () => {
    expect(niceMax(0, 5)).toBe(4)
    expect(niceMax(Number.NaN, 5)).toBe(4)
  })
})

describe('formatCompactNumber', () => {
  it('uses a lowercase k, as Figma does', () => {
    expect(formatCompactNumber(2000)).toBe('2k')
    expect(formatCompactNumber(1500)).toBe('1.5k')
    expect(formatCompactNumber(500)).toBe('500')
    expect(formatCompactNumber(0)).toBe('0')
  })
})
