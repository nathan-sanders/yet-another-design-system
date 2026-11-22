import { describe, expect, it } from 'vitest'

import { loads } from '../../../data/workload'
import { loadOfDay, loadOfShare } from '../../../components/load'
import {
  daysFor,
  previewSummary,
  suggestion,
  teamShares,
  teamsYakLine,
  weekHours,
  weeklyShares,
  weekSummary,
  windowDays,
} from './model'

const load = (id: string) => loads.find((l) => l.personId === id)!

describe('the People view, as drawn', () => {
  it('shows two working weeks, Monday to Friday', () => {
    expect(windowDays().map((d) => d.getDay())).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5])
  })

  it('adds every row’s week to the hours under its name', () => {
    const drawn: Record<string, number> = {
      marcus: 40,
      dana: 38,
      sofia: 32,
      priya: 24,
      katie: 36,
      maya: 18,
      theo: 40,
    }
    for (const l of loads) expect(weekHours(daysFor(l, 'marcus'), 0)).toBe(drawn[l.personId])
  })

  it('keeps each row’s days in the file’s order, with or without the task', () => {
    for (const l of loads) expect(daysFor(l, 'marcus')).toEqual(l.days)
  })

  it('writes Marcus over next week in red, and nobody else', () => {
    expect(weekSummary(load('marcus'), 'marcus')).toEqual({
      text: '40h / 40h · then 52h',
      over: true,
    })
    expect(weekSummary(load('dana'), 'marcus')).toEqual({ text: '38h / 40h', over: false })
  })

  it('colors a day the way the cells are drawn', () => {
    expect(load('marcus').days.map((h) => loadOfDay(h))).toEqual([
      'full',
      'over',
      'balanced',
      'full',
      'full',
      'over',
      'over',
      'over',
      'over',
      'over',
    ])
    expect(loadOfDay(null)).toBe('off')
    expect(loadOfDay(4)).toBe('light')
  })
})

describe('the rebalance', () => {
  it('is what Yak suggests while Marcus holds the task', () => {
    expect(suggestion('marcus')?.text).toBe(
      'Marcus is 12 hours over next week. Moving Signage install prep to Maya evens it out.',
    )
    expect(suggestion('maya')).toBeNull()
  })

  it('says what it does, as the preview’s banner does', () => {
    expect(previewSummary('marcus', 'maya')).toEqual({
      title: 'Moves 12 hours to Maya',
      detail:
        'Marcus drops from 52h to 40h next week. Maya goes from 18h to 30h, and no dates change.',
    })
  })

  it('writes both changed weeks in the preview', () => {
    expect(weekSummary(load('marcus'), 'marcus', 'maya').text).toBe('40h / 40h · then 40h')
    expect(weekSummary(load('maya'), 'marcus', 'maya').text).toBe('18h / 40h · then 30h')
  })
})

describe('the By team view', () => {
  it('adds hours, not percents: Ops is 98% and then 111%', () => {
    expect(teamShares('ops', 'marcus').slice(0, 4)).toEqual([98, 111, 94, 84])
    expect(weeklyShares(load('marcus'), 'marcus').slice(0, 2)).toEqual([100, 130])
    expect(weeklyShares(load('dana'), 'marcus').slice(0, 2)).toEqual([95, 93])
  })

  it('matches the file’s Marketing, which is Katie and Maya together', () => {
    expect(teamShares('marketing', 'marcus')).toEqual([68, 69, 88, 92, 96, 98, 92, 90])
  })

  it('lets Ops off its peak once Maya has the task', () => {
    expect(teamShares('ops', 'maya')[1]).toBe(96)
  })

  it('writes Yak’s line from the numbers', () => {
    expect(teamsYakLine('marcus')).toMatch(
      /^Ops peaks at 111% the week of .+, and that’s all Marcus\./,
    )
    expect(teamsYakLine('marcus')).toMatch(/Digital stays above 100% through December\.$/)
  })
})

describe('shares on the Capacity scale', () => {
  it('steps light, balanced, full, over at 85, 100 and 110', () => {
    expect([80, 85, 100, 102, 110, 111].map(loadOfShare)).toEqual([
      'light',
      'balanced',
      'balanced',
      'full',
      'full',
      'over',
    ])
  })
})
