import { describe, expect, it } from 'vitest'

import { day } from '../../../data/dates'
import { projects } from '../../../data/projects'
import {
  applyChanges,
  barOf,
  capacityRows,
  changeTokenLabel,
  DRAWN_CHANGES,
  impactsOf,
  ownersToNotify,
  rangeFor,
  stagedSummary,
  xOf,
  yakCapacityLine,
} from './model'

const project = (list: typeof projects, id: string) => list.find((p) => p.id === id)!

describe('the staged changes the file draws', () => {
  it('moves Dallas three weeks, ending Apr 19 instead of Mar 29', () => {
    const after = applyChanges(projects, DRAWN_CHANGES)
    const shift = (a: string, b: string) =>
      Math.round((day(b).getTime() - day(a).getTime()) / 86_400_000)
    expect(shift(project(projects, 'dallas').due, project(after, 'dallas').due)).toBe(21)
    expect(project(after, 'dallas').due).toBe('2027-04-19')
    expect(project(after, 'loyalty').due).toBe('2027-03-16')
    expect(project(after, 'houston').ownerId).toBe('dana')
  })

  it('labels each change as its token does', () => {
    expect(DRAWN_CHANGES.map(changeTokenLabel)).toEqual(['+3 weeks', 'Ends 2w later', 'Now Dana'])
  })

  it('tells the owners once the changes land: Dana and Theo', () => {
    expect(ownersToNotify(projects, DRAWN_CHANGES)).toEqual(['dana', 'theo'])
  })

  it('writes the banner’s sentence', () => {
    expect(stagedSummary(projects, DRAWN_CHANGES)).toBe(
      'Only you can see these until you apply them. Dallas moves three weeks, and two owners will be notified.',
    )
  })

  it('finds the two things the Apply dialog lists', () => {
    const impacts = impactsOf(projects, DRAWN_CHANGES)
    expect(impacts.map((i) => i.kind)).toEqual(['goal', 'capacity'])
    expect(impacts[0].text).toMatch(/^Open 3 Texas stores misses its .+ due date by 19 days$/)
    expect(impacts[1].text).toMatch(/^Ops in \w+ drops from 124% to 104%$/)
  })
})

describe('capacity', () => {
  it('eases Ops’ third month once Dallas has moved, and only then', () => {
    expect(capacityRows(projects)[0].months[2]).toBe(124)
    expect(capacityRows(applyChanges(projects, DRAWN_CHANGES))[0].months[2]).toBe(104)
  })

  it('has Yak offer the move while Ops is over, and stop once it is made', () => {
    expect(yakCapacityLine(projects).offer).toBe(true)
    expect(yakCapacityLine(projects).text).toMatch(/^Ops hits 124% in \w+, when Austin wraps up/)
    expect(yakCapacityLine(applyChanges(projects, DRAWN_CHANGES)).offer).toBe(false)
  })
})

describe('the time axis', () => {
  const months = rangeFor('months', new Date(2026, 10, 5))

  it('opens six months on the month holding today, naming the year after December', () => {
    expect(months.columns.map((c) => c.label)).toEqual([
      'Nov',
      'Dec',
      'Jan 2027',
      'Feb 2027',
      'Mar 2027',
      'Apr 2027',
    ])
  })

  it('opens quarters on the quarter holding today', () => {
    const quarters = rangeFor('quarters', new Date(2026, 10, 5))
    expect(quarters.columns.map((c) => c.label)).toEqual([
      'Q4 2026',
      'Q1 2027',
      'Q2 2027',
      'Q3 2027',
    ])
  })

  it('puts the file’s today four days into its first of six equal columns', () => {
    // Nov 5 is 4 days into a 30-day November: 4/30 of a sixth, the file's x 221 of 200 + 960.
    expect(xOf(months, new Date(2026, 10, 5))).toBeCloseTo(4 / 30 / 6)
  })

  it('draws a bar to the end of its due day, and clips one that starts before the chart', () => {
    const range = rangeFor('months', day('2026-11-05'))
    const protein = barOf(range, '2026-09-21', '2026-11-17')!
    expect(protein.left).toBe(0)
    expect(protein.width).toBeCloseTo(xOf(range, day('2026-11-18')))
    expect(barOf(range, '2025-01-01', '2025-02-01')).toBeNull()
  })
})
