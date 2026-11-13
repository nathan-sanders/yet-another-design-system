import { describe, expect, it } from 'vitest'

import { day, shortDate, today } from '../../data/dates'
import { meetings, timeBlocks } from '../../data/myWork'
import { tasks } from '../../data/tasks'
import { taskKey } from '../project/paths'
import {
  bucketOf,
  doneThisWeek,
  dropSpan,
  hoursOf,
  openWork,
  placeDay,
  unscheduled,
  workDueLabel,
  workTitle,
  workWeek,
} from './model'

const keysIn = (bucket: ReturnType<typeof bucketOf>) =>
  openWork(tasks)
    .filter((task) => bucketOf(task) === bucket)
    .map(taskKey)

describe('My work, against the List frame (40006266:4756)', () => {
  it('lands on a Thursday, as every frame does', () => {
    expect(today.getDay()).toBe(4)
  })

  it('files the ten open tasks under the frame’s four groups', () => {
    expect(keysIn('overdue')).toEqual(['AUS-12'])
    expect(keysIn('today').sort()).toEqual(['AUS-29', 'AUS-31', 'PRO-18'])
    expect(keysIn('week').sort()).toEqual(['AUS-34', 'HIR-07', 'LOY-14', 'PRO-21'])
    expect(keysIn('later')).toEqual(['GFT-09', 'AUS-36'])
  })

  it('makes This week’s note 14h, as drawn', () => {
    expect(hoursOf(openWork(tasks).filter((t) => bucketOf(t) === 'week'))).toBe(14)
  })

  it('names Katie’s Signage proof by the review Nathan owes it', () => {
    const proof = tasks.find((task) => task.id === 'aus-31')!
    expect(workTitle(proof)).toBe('Approve the signage proof')
    expect(proof.title).toBe('Signage proof')
  })

  it('prints due dates the way the frame does, moved onto this week', () => {
    const label = (id: string) => workDueLabel(tasks.find((task) => task.id === id)!)
    expect(label('aus-12')).toBe(shortDate.format(day('2026-11-03')))
    expect(label('aus-31')).toBe('Today')
    expect(label('pro-21')).toBe('Fri')
    expect(label('aus-34')).toBe('Sun')
    expect(label('aus-36')).toBe(shortDate.format(day('2026-12-02')))
    expect(label('ops-3')).toBe('Wed')
  })
})

describe('the Board’s Done this week (40006315:45894)', () => {
  it('holds the two tasks drawn there', () => {
    expect(doneThisWeek(tasks).map((task) => task.title)).toEqual([
      'Sign the Q4 ops budget',
      'Review crew pay bands',
    ])
  })
})

describe('the Calendar (40006315:49546)', () => {
  it('draws Monday to Friday of this week', () => {
    const days = workWeek()
    expect(days).toHaveLength(5)
    expect(days[0].getDay()).toBe(1)
    expect(days[3]).toEqual(today)
  })

  it('leaves the frame’s two in Not scheduled', () => {
    expect(unscheduled(tasks, timeBlocks).map(taskKey).sort()).toEqual(['AUS-34', 'HIR-07'])
  })

  it('keeps the file’s week free of overlaps, one lane a day', () => {
    for (const date of workWeek()) {
      const items = [
        ...meetings
          .filter((m) => day(m.date).getTime() === date.getTime())
          .map((item) => ({ kind: 'meeting' as const, item })),
        ...timeBlocks
          .filter((b) => day(b.date).getTime() === date.getTime())
          .map((item) => ({ kind: 'block' as const, item })),
      ]
      expect(placeDay(items).every((p) => p.lanes === 1)).toBe(true)
    }
  })

  it('puts a block dropped on a busy hour beside what is there', () => {
    const block = (id: string, start: number, end: number) => ({
      kind: 'block' as const,
      item: { id, label: id, date: '2026-11-06', start, end, taskIds: [] },
    })
    const placed = placeDay([block('a', 10, 11), block('b', 10, 12), block('c', 13, 14)])
    const of = (id: string) => placed.find((p) => p.entry.item.id === id)!
    expect([of('a').lanes, of('b').lanes]).toEqual([2, 2])
    expect(of('a').lane).not.toBe(of('b').lane)
    expect(of('c')).toMatchObject({ lane: 0, lanes: 1 })
  })

  it('gives a dropped task its estimate, up to two hours, inside the day', () => {
    const task = (estimate?: string) => ({ ...tasks[0], estimate })
    expect(dropSpan(task('1h'), 10)).toEqual({ start: 10, end: 11 })
    expect(dropSpan(task('6h'), 10)).toEqual({ start: 10, end: 12 })
    expect(dropSpan(task(undefined), 10)).toEqual({ start: 10, end: 11 })
    expect(dropSpan(task('4h'), 17)).toEqual({ start: 17, end: 18 })
  })
})
