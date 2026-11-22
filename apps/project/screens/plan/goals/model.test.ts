import { describe, expect, it } from 'vitest'

import { datedText } from '../../../data/dates'
import { goals } from '../../../data/goals'
import { projects } from '../../../data/projects'
import { goalRows, healthOf, inScope, measuredBy, progressOf } from './model'

const goal = (id: string) => goals.find((g) => g.id === id)!

describe('goals, as the file numbers them', () => {
  it('averages subgoals: 59, 27 and 71', () => {
    expect(progressOf(goal('texas'), goals, projects)).toBe(59)
    expect(progressOf(goal('loyalty'), goals, projects)).toBe(27)
    expect(progressOf(goal('aov'), goals, projects)).toBe(71)
  })

  it('reads a subgoal’s percent from its project, or by hand', () => {
    expect(
      ['open-austin', 'dallas-lease', 'houston-site', 'relaunch-loyalty', 'app-orders'].map((id) =>
        progressOf(goal(id), goals, projects),
      ),
    ).toEqual([46, 100, 30, 12, 41])
    expect(progressOf(goal('turnover'), goals, projects)).toBe(64)
  })

  it('takes the lowest subgoal’s health, never counting done against it', () => {
    expect(healthOf(goal('texas'), goals, projects)).toBe('at-risk')
    expect(healthOf(goal('loyalty'), goals, projects)).toBe('off-track')
    expect(healthOf(goal('aov'), goals, projects)).toBe('on-track')
    expect(healthOf(goal('dallas-lease'), goals, projects)).toBe('done')
  })

  it('lets a check-in say otherwise', () => {
    expect(healthOf(goal('texas'), goals, projects, { texas: 'off-track' })).toBe('off-track')
  })

  it('names what each is measured by', () => {
    expect(measuredBy(goal('texas'), goals, projects)).toBe('Subgoals')
    expect(measuredBy(goal('open-austin'), goals, projects)).toBe('Austin store opening')
    expect(measuredBy(goal('turnover'), goals, projects)).toBe('Manual')
  })
})

describe('the table', () => {
  it('lists the eleven rows the file draws with every goal open', () => {
    const open = new Set(goals.filter((g) => !g.parentId).map((g) => g.id))
    expect(goalRows(goals, open).map((r) => r.goal.title)).toEqual([
      'Open 3 Texas stores',
      datedText('Open Austin by {2027-01-12}'),
      'Sign Dallas lease',
      'Pick a Houston site',
      'Grow loyalty to 400K members',
      'Relaunch the loyalty program',
      'Reach 30% of orders in the app',
      'Raise average order value 8%',
      'Launch Protein Plates',
      'Ship two seasonal menus',
      'Keep crew turnover under 60%',
    ])
  })

  it('folds a closed goal to its own row', () => {
    expect(goalRows(goals, new Set())).toHaveLength(4)
  })

  it('scopes Company to the four company goals, and My team to Ops’', () => {
    expect(inScope(goals, 'company').map((g) => g.id)).toEqual([
      'texas',
      'loyalty',
      'aov',
      'turnover',
    ])
    expect(inScope(goals, 'team').map((g) => g.id)).toEqual([
      'texas',
      'open-austin',
      'dallas-lease',
      'houston-site',
    ])
  })
})
