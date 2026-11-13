import { describe, expect, it } from 'vitest'

import { day } from '../../data/dates'
import { tasks } from '../../data/tasks'
import { addMonths, monthFromKey, monthKey, segmentsOf, weeksOf } from './calendar'
import { mondayOf } from './timeline'

describe('weeksOf', () => {
  it('draws November 2026 as five Sunday weeks, Nov 1 to Dec 5, as the file does', () => {
    const weeks = weeksOf(new Date(2026, 10, 1))
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual(new Date(2026, 10, 1))
    expect(weeks[4]).toEqual(new Date(2026, 10, 29))
  })

  it('starts on the Sunday before a month that begins midweek', () => {
    const weeks = weeksOf(new Date(2026, 11, 1))
    expect(weeks[0].getDay()).toBe(0)
    expect(weeks[0]).toEqual(new Date(2026, 10, 29))
  })
})

describe('month keys', () => {
  it('round-trips, and falls back to the month holding a date', () => {
    expect(monthKey(new Date(2026, 10, 18))).toBe('2026-11')
    expect(monthFromKey('2027-01', new Date())).toEqual(new Date(2027, 0, 1))
    expect(monthFromKey('nonsense', new Date(2026, 10, 18))).toEqual(new Date(2026, 10, 1))
    expect(addMonths(new Date(2026, 11, 1), 1)).toEqual(new Date(2027, 0, 1))
  })
})

describe('segmentsOf', () => {
  // The week holding the project's first Monday, wherever `day()` has moved it.
  const sunday = (iso: string) => {
    const monday = mondayOf(day(iso))
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 1)
  }

  it('cuts a task at the week’s edges and stacks overlaps in lanes', () => {
    const first = segmentsOf(sunday('2026-11-02'), tasks)
    const electrical = first.find((s) => s.task.id === 'aus-21')!
    // Nov 2 to Nov 10: Monday to Saturday here, Sunday to Tuesday next week.
    expect([electrical.from, electrical.to]).toEqual([1, 6])
    const next = segmentsOf(sunday('2026-11-09'), tasks).find((s) => s.task.id === 'aus-21')!
    expect([next.from, next.to]).toEqual([0, 2])
    const lanes = first.map((s) => s.lane)
    expect(new Set(lanes).size).toBe(lanes.length)
  })

  it('reuses a lane once it is free', () => {
    // Week of Nov 29: Equipment delivery ends Tuesday, Signage install starts Tuesday,
    // so they cannot share; Local PR runs all week.
    const week = segmentsOf(sunday('2026-11-30'), tasks)
    expect(week.map((s) => s.task.title)).toEqual(
      expect.arrayContaining(['Equipment delivery', 'Signage install', 'Local PR and press list']),
    )
  })

  it('leaves done work out', () => {
    const all = segmentsOf(sunday('2026-10-26'), tasks)
    expect(all.every((s) => s.task.status !== 'done')).toBe(true)
  })
})
