import { describe, expect, it } from 'vitest'

import { tasks } from '../../data/tasks'
import {
  budgetRows,
  budgetTotals,
  builderData,
  deliveryMetrics,
  deliverySeries,
  dollars,
  lateBy,
  openByTeam,
  overdueNote,
  overdueTasks,
  readRequest,
  type BuilderConfig,
} from './model'

const names = (id: string) => id

describe('Delivery', () => {
  it('counts the frame’s seven overdue tasks off the live tasks, six of them Ops', () => {
    const late = overdueTasks(tasks)
    expect(late).toHaveLength(7)
    expect(late[0].title).toBe('Confirm Austin opening date with landlord')
    expect(lateBy(late[0])).toBe('2 days')
    expect(lateBy(late[1])).toBe('1 day')
    const ops = openByTeam(tasks).find((r) => r.id === 'ops')!
    expect(ops).toMatchObject({ open: 38, overdue: 6 })
    expect(overdueNote(tasks)).toBe(
      'Ops holds six of the seven overdue tasks, all in Austin store opening.',
    )
  })

  it('the last 30 days read as drawn: 184 done, up 12%; 87% on time, up 3; 7 overdue, up 2', () => {
    expect(deliveryMetrics(30, 7)).toEqual({
      completed: 184,
      completedTrend: 12,
      onTime: 87,
      onTimeTrend: 3,
      overdue: 7,
      overdueTrend: 2,
      cycle: 4.2,
      cycleTrend: -0.6,
    })
  })

  it('draws a day a row, ending on today’s live overdue count', () => {
    const rows = deliverySeries(30, 7)
    expect(rows).toHaveLength(30)
    expect(rows.at(-1)!.overdue).toBe(7)
    expect(rows.reduce((s, r) => s + r.completed, 0)).toBe(184)
  })
})

describe('Budget', () => {
  it('adds up as the frame says: $1.76M of $2.34M, $2.35M forecast, one over, $584K left', () => {
    const totals = budgetTotals(budgetRows())
    expect(dollars(totals.spent)).toBe('$1.76M')
    expect(dollars(totals.total)).toBe('$2.34M')
    expect(dollars(totals.forecast)).toBe('$2.35M')
    expect(totals.over.map((r) => r.name)).toEqual(['Digital'])
    expect(dollars(totals.left)).toBe('$584K')
  })

  it('formats the table’s amounts', () => {
    expect(dollars(1_200_000)).toBe('$1.2M')
    expect(dollars(1_550_000)).toBe('$1.55M')
    expect(dollars(312_000)).toBe('$312K')
    expect(dollars(-50_000)).toBe('$50K')
  })

  it('breaks out the projects the file draws, each under its portfolio', () => {
    expect(budgetRows().map((r) => r.name)).toEqual([
      'Store expansion',
      'Austin store opening',
      'Menu',
      'Digital',
      'Mobile ordering app',
      'Loyalty relaunch',
      'Brand & people',
    ])
  })
})

describe('Chart builder', () => {
  const config: BuilderConfig = {
    projectId: 'austin',
    measure: 'count',
    groupBy: 'phase',
    splitBy: 'status',
    viz: 'bar',
  }

  it('counts Austin’s tasks by phase and status', () => {
    const { rows, splits, total, count } = builderData(tasks, config, names)
    expect(rows.map((r) => r.group)).toEqual(['Permits', 'Hiring', 'Supply', 'Marketing'])
    expect(splits[0]).toBe('Done')
    expect(total).toBe(count)
    const sum = rows.reduce((s, r) => s + splits.reduce((t, k) => t + Number(r[k] ?? 0), 0), 0)
    expect(sum).toBe(count)
  })

  it('reads a request', () => {
    const projects = [
      { id: 'austin', names: ['Austin'] },
      { id: 'mobile-ordering', names: ['Mobile ordering', 'Mobile'] },
    ]
    expect(readRequest('Mobile tasks by assignee and status', config, projects)).toMatchObject({
      projectId: 'mobile-ordering',
      groupBy: 'assignee',
      splitBy: 'status',
    })
    expect(readRequest('Austin hours by priority', config, projects)).toMatchObject({
      groupBy: 'priority',
      splitBy: 'none',
      measure: 'hours',
    })
    expect(readRequest('make me a sandwich', config, projects)).toBeNull()
  })
})
