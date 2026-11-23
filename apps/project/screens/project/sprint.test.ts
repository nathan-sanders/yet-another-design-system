import { describe, expect, it } from 'vitest'

import { sprints } from '../../data/sprints'
import { tasks } from '../../data/tasks'
import {
  averagePace,
  behindBy,
  burndown,
  daysLeft,
  nextSprint,
  sprintRange,
  sprintTasks,
  summarize,
  workdays,
} from './sprint'

const sprint14 = sprints.find((s) => s.number === 14)!
const inSprint = sprintTasks(tasks, 'mobile-ordering', 14, {})

describe('Sprint 14', () => {
  it('holds the frame’s ten tasks', () => {
    expect(inSprint.map((t) => t.number).sort((a, b) => a - b)).toEqual([
      44, 45, 48, 49, 51, 52, 53, 55, 56, 57,
    ])
  })

  it('runs ten weekdays with six left after today, a Thursday', () => {
    expect(workdays(sprint14)).toHaveLength(10)
    expect(daysLeft(sprint14)).toBe(6)
    // The frame's Nov 2 – 13 is one month, but today is this week's Thursday,
    // so some weeks the sprint crosses one and the end gets its own month.
    expect(sprintRange(sprint14)).toMatch(/^\w{3} \d+ – (\w{3} )?\d+$/)
  })

  it('burns down as drawn: 9, up to 10 when Allergen filters joins, then 9 and 8', () => {
    const rows = burndown(sprint14, inSprint)
    expect(rows.map((r) => r.remaining)).toEqual([9, 10, 9, 8, ...Array(6).fill(undefined)])
    expect(rows[0].ideal).toBe(10)
    expect(rows[9].ideal).toBe(0)
  })

  it('is trailing by 2 tasks', () => {
    expect(behindBy(burndown(sprint14, inSprint))).toBe(2)
  })

  it('This sprint reads 2 of 10, 1 added, 2 from Sprint 13, 8 a sprint', () => {
    const summary = summarize(inSprint, 14)
    expect(summary).toMatchObject({ done: 2, total: 10, carried: 2, carriedFrom: 13 })
    expect(summary.added.map((t) => t.title)).toEqual(['Allergen filters on menu'])
    expect(averagePace(sprints)).toBe(8)
  })

  it('work moved on from Sprint 14 counts as carried over in Sprint 15, not added', () => {
    const moves = Object.fromEntries(
      inSprint.filter((t) => t.status !== 'done').map((t) => [t.id, 15]),
    )
    const next = sprintTasks(tasks, 'mobile-ordering', 15, moves)
    expect(summarize(next, 15)).toMatchObject({ total: 8, carried: 8, carriedFrom: 14 })
    expect(summarize(next, 15).added).toEqual([])
  })

  it('moving a task takes it out of the sprint', () => {
    expect(sprintTasks(tasks, 'mobile-ordering', 14, { 'mob-52': 15 })).toHaveLength(9)
    expect(sprintTasks(tasks, 'mobile-ordering', 15, { 'mob-52': 15 })).toHaveLength(1)
  })

  it('the next sprint starts the Monday after', () => {
    expect(nextSprint(sprint14)).toMatchObject({
      number: 15,
      start: '2026-11-16',
      end: '2026-11-27',
    })
  })
})
