import { describe, expect, it } from 'vitest'

import { day } from '../../data/dates'
import { tasks } from '../../data/tasks'
import { barOf, dependencyPath, slipDays, timelineRange, timelineRows, xOf } from './timeline'

const task = (id: string) => tasks.find((t) => t.id === id)!

describe('timelineRange', () => {
  it('opens Weeks on the Monday of the project’s start, 80 a week', () => {
    const range = timelineRange('2026-11-02', 'weeks')
    expect(range.start.getDay()).toBe(1)
    expect(range.columns[0].label).toBe(
      new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
        day('2026-11-02'),
      ),
    )
    expect(range.columns[1].x).toBeCloseTo(80)
    expect(range.columns.every((c) => Math.abs(c.width - 80) < 0.01)).toBe(true)
  })

  it('labels months with the year on the first and on January', () => {
    const range = timelineRange('2026-11-02', 'months')
    const labels = range.columns.map((c) => c.label)
    expect(labels[0]).toMatch(/\d{4}$/)
    expect(labels[1]).not.toMatch(/\d{4}$/)
    expect(labels.filter((l) => l.startsWith('Jan')).every((l) => /\d{4}$/.test(l))).toBe(true)
  })

  it('starts Quarters on the quarter’s first month', () => {
    const range = timelineRange('2026-11-02', 'quarters')
    expect(range.start.getMonth() % 3).toBe(0)
    expect(range.columns[0].label).toMatch(/^Q\d \d{4}$/)
  })
})

describe('bars, as the file measures them', () => {
  const range = timelineRange('2026-11-02', 'weeks')

  it('draws a task from its start to the end of its due day', () => {
    // Final electrical inspection: 103 wide from Nov 2; Hire 14 crew: 217.
    const electrical = barOf(range, '2026-11-02', '2026-11-10')
    expect(electrical.x).toBeCloseTo(0)
    expect(Math.round(electrical.width)).toBe(103)
    expect(Math.round(barOf(range, '2026-11-02', '2026-11-20').width)).toBe(217)
    // Equipment delivery starts at 239, Nov 23.
    expect(Math.round(barOf(range, '2026-11-23', '2026-12-01').x)).toBe(240)
  })

  it('puts today a third of the way into its week on the file’s Thursday', () => {
    expect(Math.round(xOf(range, day('2026-11-05')))).toBe(34)
  })
})

describe('slipDays', () => {
  it('counts the electrical inspection six days late, as the file says', () => {
    expect(slipDays(task('aus-21'))).toBe(6)
    expect(slipDays(task('aus-26'))).toBe(0)
  })
})

describe('timelineRows', () => {
  it('leaves done work out and stacks the phases with their tasks', () => {
    const rows = timelineRows(tasks, new Set())
    const names = rows.map((r) => (r.kind === 'group' ? `# ${r.phase}` : r.task.title))
    expect(names).not.toContain('Sign the lease')
    expect(names.slice(0, 5)).toEqual([
      '# Permits & build-out',
      'Final electrical inspection',
      'Health permit approval',
      'Install hood and ventilation',
      'Signage install',
    ])
    expect(rows[0].y).toBe(76)
    expect(rows[1].y).toBe(112)
  })

  it('keeps a collapsed phase’s band and drops its tasks', () => {
    const rows = timelineRows(tasks, new Set(['Permits & build-out']))
    expect(rows[0]).toMatchObject({ kind: 'group', count: 4 })
    expect(rows[1]).toMatchObject({ kind: 'group', phase: 'Hiring & training' })
  })
})

describe('dependencyPath', () => {
  it('goes out 40, down and in when there is room', () => {
    expect(dependencyPath({ x: 194, y: 130 }, { x: 300, y: 418 }).d).toBe(
      'M 194 130 H 234 V 418 H 300',
    )
  })

  it('stops 8 short of a bar that starts within 48', () => {
    expect(dependencyPath({ x: 194, y: 130 }, { x: 240, y: 418 }).d).toBe(
      'M 194 130 H 232 V 418 H 240',
    )
  })

  it('drops to the gap and comes back when the next bar starts at once', () => {
    expect(dependencyPath({ x: 103, y: 94 }, { x: 103, y: 130 }).d).toBe(
      'M 103 94 H 111 V 112 H 95 V 130 H 103',
    )
  })
})
