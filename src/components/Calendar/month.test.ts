import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonths,
  buildMonth,
  clampDate,
  compareDays,
  dayKey,
  daysInMonth,
  formatDateInput,
  formatMonthYear,
  isDateDisabled,
  isSameDay,
  monthLabels,
  parseDateInput,
  rangePosition,
  selectionInRow,
  weekdayLabels,
} from './month'

/**
 * The arithmetic behind the grid, checked without a browser.
 *
 * `Calendar` has no headless primitive underneath it, so these are the only
 * assertions in the library that a month has the right number of days in it.
 * The cases worth having are the ones that are wrong for one month a year:
 * leap February, a month that needs a sixth row, and the year boundary.
 *
 * `Intl` assertions pin the locale explicitly. The suite runs in whatever
 * timezone and locale the machine has, and `en-US` is the one the Figma file
 * is drawn in.
 */

const jan2025 = new Date(2025, 0, 1)

describe('buildMonth', () => {
  it('lays January 2025 out Sunday-first', () => {
    const weeks = buildMonth(jan2025)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    // The file's first row: 29, 30, 31 from December, then 1–4.
    expect(weeks[0].map((d) => d.date.getDate())).toEqual([29, 30, 31, 1, 2, 3, 4])
    expect(weeks[0].map((d) => d.outside)).toEqual([true, true, true, false, false, false, false])
    // The month's own days end on row five, and row six is all February.
    expect(weeks[4].map((d) => d.date.getDate())).toEqual([26, 27, 28, 29, 30, 31, 1])
    expect(weeks[5].map((d) => d.outside)).toEqual([true, true, true, true, true, true, true])
  })

  /**
   * The grid is a fixed six rows, so the panel does not change height as you
   * navigate — Astryx's `hasVariableRowCount: false`, chosen over the file's
   * 5-row January. The check that matters is that it is *always* six, since a
   * single short month slipping through is the whole bug.
   */
  it('is six rows for every month, however short', () => {
    for (let year = 2024; year <= 2027; year += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (const start of [0, 1, 6] as const) {
          expect(buildMonth(new Date(year, m, 1), start)).toHaveLength(6)
        }
      }
    }
    // February 2026 is the tightest case: 28 days starting on a Sunday fills
    // four rows exactly, so two whole rows are trailing outside days.
    const february = buildMonth(new Date(2026, 1, 1))
    expect(february[0][0].date.getDate()).toBe(1)
    expect(february[5].every((d) => d.outside)).toBe(true)
  })

  it('crosses the year boundary in both directions', () => {
    const december = buildMonth(new Date(2025, 11, 1))
    const last = december.at(-1)!.at(-1)!
    expect(last.date.getFullYear()).toBe(2026)
    expect(last.outside).toBe(true)

    const january = buildMonth(new Date(2026, 0, 1))
    const first = january[0][0]
    expect(first.date.getFullYear()).toBe(2025)
    expect(first.outside).toBe(true)
  })

  it('marks every cell outside the month, and only those', () => {
    for (const day of buildMonth(jan2025).flat()) {
      expect(day.outside).toBe(day.date.getMonth() !== 0)
    }
  })

  it('rotates to a Monday-first week', () => {
    const weeks = buildMonth(jan2025, 1)
    // Monday 30 December leads instead of Sunday 29.
    expect(weeks[0][0].date.getDate()).toBe(30)
    expect(weeks[0].map((d) => d.date.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('gives every month a whole number of weeks with no gaps', () => {
    for (let m = 0; m < 12; m += 1) {
      const days = buildMonth(new Date(2024, m, 1)).flat()
      expect(days.length % 7).toBe(0)
      days.slice(1).forEach((day, i) => {
        expect(isSameDay(day.date, addDays(days[i].date, 1))).toBe(true)
      })
    }
  })

  it('counts February in a leap year and out of one', () => {
    expect(daysInMonth(new Date(2024, 1, 1))).toBe(29)
    expect(daysInMonth(new Date(2025, 1, 1))).toBe(28)
    // 2000 is a leap year, 1900 is not — the rule most implementations get wrong.
    expect(daysInMonth(new Date(2000, 1, 1))).toBe(29)
    expect(daysInMonth(new Date(1900, 1, 1))).toBe(28)
  })
})

describe('navigation', () => {
  it('lands on the first of the month, from any day of it', () => {
    expect(addMonths(new Date(2025, 0, 31), 1)).toEqual(new Date(2025, 1, 1))
    expect(addMonths(new Date(2025, 0, 15), -1)).toEqual(new Date(2024, 11, 1))
  })

  it('moves by a whole day across a DST boundary', () => {
    // US DST starts 9 March 2025 and ends 2 November. Adding milliseconds
    // would land at 23:00 or 01:00 and report the wrong day.
    expect(addDays(new Date(2025, 2, 8), 1).getDate()).toBe(9)
    expect(addDays(new Date(2025, 10, 1), 1).getDate()).toBe(2)
    expect(addDays(new Date(2025, 2, 9), 1).getHours()).toBe(0)
  })
})

describe('rangePosition', () => {
  const range: [Date, Date] = [new Date(2025, 0, 12), new Date(2025, 0, 20)]

  it('marks both ends and everything between', () => {
    expect(rangePosition(new Date(2025, 0, 12), range)).toBe('start')
    expect(rangePosition(new Date(2025, 0, 20), range)).toBe('end')
    expect(rangePosition(new Date(2025, 0, 16), range)).toBe('middle')
    expect(rangePosition(new Date(2025, 0, 11), range)).toBe('none')
    expect(rangePosition(new Date(2025, 0, 21), range)).toBe('none')
  })

  it('draws a one-day range as a single day, not a start touching an end', () => {
    const day = new Date(2025, 0, 12)
    expect(rangePosition(day, [day, new Date(2025, 0, 12)])).toBe('single')
  })

  it('reads an inverted range rather than drawing nothing', () => {
    const inverted: [Date, Date] = [range[1], range[0]]
    expect(rangePosition(new Date(2025, 0, 12), inverted)).toBe('start')
    expect(rangePosition(new Date(2025, 0, 16), inverted)).toBe('middle')
  })

  it('marks a half-picked range as a single day', () => {
    expect(rangePosition(new Date(2025, 0, 12), [new Date(2025, 0, 12), null])).toBe('single')
    expect(rangePosition(new Date(2025, 0, 13), [new Date(2025, 0, 12), null])).toBe('none')
    expect(rangePosition(new Date(2025, 0, 12), [null, null])).toBe('none')
  })

  it('ignores the time of day on either side', () => {
    const withTime: [Date, Date] = [new Date(2025, 0, 12, 23, 59), new Date(2025, 0, 20, 0, 1)]
    expect(rangePosition(new Date(2025, 0, 20, 18), withTime)).toBe('end')
  })
})

/**
 * The rule the Figma file supplied and the first implementation missed: a range
 * is continuous in time but broken into one bar per week on screen, so a
 * mid-range day at the edge of its row still has to be rounded there.
 */
describe('selectionInRow', () => {
  it('rounds a mid-range day at either edge of its row', () => {
    expect(selectionInRow('middle', false, false)).toBe('middle')
    expect(selectionInRow('middle', true, false)).toBe('start')
    expect(selectionInRow('middle', false, true)).toBe('end')
  })

  it('collapses a day that is the only one in its bar', () => {
    // A range starting on the last day of a row, or ending on the first.
    expect(selectionInRow('start', false, true)).toBe('single')
    expect(selectionInRow('end', true, false)).toBe('single')
    expect(selectionInRow('middle', true, true)).toBe('single')
  })

  it('leaves the true ends alone in the middle of a row', () => {
    expect(selectionInRow('start', true, false)).toBe('start')
    expect(selectionInRow('end', false, true)).toBe('end')
    expect(selectionInRow('start', false, false)).toBe('start')
  })

  it('never touches an unselected or single day', () => {
    expect(selectionInRow('none', true, true)).toBe('none')
    expect(selectionInRow('single', true, false)).toBe('single')
  })
})

describe('limits', () => {
  const limits = { min: new Date(2025, 0, 10), max: new Date(2025, 2, 20) }

  it('disables outside min and max but includes both endpoints', () => {
    expect(isDateDisabled(new Date(2025, 0, 9), limits)).toBe(true)
    expect(isDateDisabled(new Date(2025, 0, 10), limits)).toBe(false)
    expect(isDateDisabled(new Date(2025, 2, 20), limits)).toBe(false)
    expect(isDateDisabled(new Date(2025, 2, 21), limits)).toBe(true)
  })

  it('treats a constraint as "is this selectable"', () => {
    const weekdaysOnly = [(d: Date) => d.getDay() !== 0 && d.getDay() !== 6]
    // 18 January 2025 is a Saturday, 20 January a Monday.
    expect(isDateDisabled(new Date(2025, 0, 18), { dateConstraints: weekdaysOnly })).toBe(true)
    expect(isDateDisabled(new Date(2025, 0, 20), { dateConstraints: weekdaysOnly })).toBe(false)
  })

  it('requires every constraint to pass', () => {
    const constraints = [() => true, (d: Date) => d.getDate() !== 15]
    expect(isDateDisabled(new Date(2025, 0, 15), { dateConstraints: constraints })).toBe(true)
    expect(isDateDisabled(new Date(2025, 0, 16), { dateConstraints: constraints })).toBe(false)
  })

  it('clamps into the window and normalizes to midnight', () => {
    expect(clampDate(new Date(2024, 5, 1), limits)).toEqual(limits.min)
    expect(clampDate(new Date(2026, 5, 1), limits)).toEqual(limits.max)
    expect(clampDate(new Date(2025, 1, 3, 17, 30), limits)).toEqual(new Date(2025, 1, 3))
  })
})

describe('comparison', () => {
  it('compares days, not instants', () => {
    expect(compareDays(new Date(2025, 0, 1, 23), new Date(2025, 0, 1, 0))).toBe(0)
    expect(compareDays(new Date(2025, 0, 1, 23), new Date(2025, 0, 2, 0))).toBe(-1)
    expect(isSameDay(new Date(2025, 0, 1, 9), new Date(2025, 0, 1, 21))).toBe(true)
    expect(isSameDay(null, new Date(2025, 0, 1))).toBe(false)
  })
})

describe('formatting', () => {
  it('keys a day by its local date, not its UTC one', () => {
    // `toISOString` would report 2024-12-31 anywhere west of Greenwich.
    expect(dayKey(new Date(2025, 0, 1))).toBe('2025-01-01')
    expect(dayKey(new Date(2025, 11, 25))).toBe('2025-12-25')
  })

  it('labels the columns the way the file draws them', () => {
    expect(weekdayLabels(0, 'en-US').map((d) => d.short)).toEqual([
      'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa',
    ])
    expect(weekdayLabels(1, 'en-US').map((d) => d.short)).toEqual([
      'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su',
    ])
    expect(weekdayLabels(0, 'en-US')[0].long).toBe('Sunday')
  })

  it('writes the caption and the month options', () => {
    expect(formatMonthYear(jan2025, 'en-US')).toBe('January 2025')
    expect(monthLabels('en-US')).toHaveLength(12)
    expect(monthLabels('en-US')[0]).toBe('Jan')
  })

  it('round-trips the footer input', () => {
    const date = new Date(2025, 0, 12)
    expect(formatDateInput(date, 'en-US')).toBe('1/12/2025')
    expect(parseDateInput(formatDateInput(date, 'en-US'), 'en-US')).toEqual(date)
    // A locale that puts the day first has to read it back the same way.
    expect(parseDateInput(formatDateInput(date, 'en-GB'), 'en-GB')).toEqual(date)
  })

  it('refuses what it cannot read rather than guessing', () => {
    expect(parseDateInput('', 'en-US')).toBeNull()
    expect(parseDateInput('next tuesday', 'en-US')).toBeNull()
    expect(parseDateInput('1/12', 'en-US')).toBeNull()
    expect(parseDateInput('13/40/2025', 'en-US')).toBeNull()
    // 2025 is not a leap year, so 29 February does not exist.
    expect(parseDateInput('2/29/2025', 'en-US')).toBeNull()
    expect(parseDateInput('2/29/2024', 'en-US')).toEqual(new Date(2024, 1, 29))
    // A two-digit year would silently resolve to 1925.
    expect(parseDateInput('1/12/25', 'en-US')).toBeNull()
  })
})
