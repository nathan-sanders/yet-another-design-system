import type { Goal, GoalHealth } from '../../../data/goals'
import type { Project, ProjectHealth } from '../../../data/types'

/**
 * How bad a health is, for "health follows the lowest one" (`Plan - Goals
 * / New goal`, `40006298:29382`): off track is the lowest, then at risk.
 * Done never pulls a parent down, and not started counts as on track.
 */
const RANK: Record<GoalHealth, number> = {
  'off-track': 0,
  'at-risk': 1,
  'on-track': 2,
  'not-started': 2,
  done: 3,
}

export function childrenOf(goal: Goal, goals: Goal[]): Goal[] {
  return goals.filter((g) => g.parentId === goal.id)
}

/**
 * A goal's percent: written by hand, its project's, or the rounded average
 * of its subgoals — Open 3 Texas stores is (46 + 100 + 30) / 3, 59.
 */
export function progressOf(goal: Goal, goals: Goal[], projects: Project[]): number {
  if (goal.manual) return goal.manual.progress
  if (goal.projectIds?.length) {
    const linked = goal.projectIds
      .map((id) => projects.find((p) => p.id === id))
      .filter((p): p is Project => p !== undefined)
    return Math.round(linked.reduce((sum, p) => sum + p.progress, 0) / linked.length)
  }
  if (goal.projectId) return projects.find((p) => p.id === goal.projectId)?.progress ?? 0
  const children = childrenOf(goal, goals)
  if (children.length === 0) return 0
  return Math.round(
    children.reduce((sum, child) => sum + progressOf(child, goals, projects), 0) / children.length,
  )
}

function worst(healths: GoalHealth[]): GoalHealth {
  if (healths.length === 0) return 'on-track'
  return healths.reduce((low, h) => (RANK[h] < RANK[low] ? h : low))
}

/**
 * A goal's health: what its owner said at their last check-in, when they
 * have said; otherwise its own (by hand, or its project's), or the lowest of
 * its subgoals'.
 */
export function healthOf(
  goal: Goal,
  goals: Goal[],
  projects: Project[],
  said: Record<string, GoalHealth> = {},
): GoalHealth {
  if (said[goal.id]) return said[goal.id]
  if (goal.manual) return goal.manual.health
  if (goal.projectIds?.length) {
    return worst(
      goal.projectIds.map(
        (id): ProjectHealth => projects.find((p) => p.id === id)?.health ?? 'not-started',
      ),
    )
  }
  if (goal.projectId) return projects.find((p) => p.id === goal.projectId)?.health ?? 'on-track'
  return worst(childrenOf(goal, goals).map((child) => healthOf(child, goals, projects, said)))
}

/** What a goal is measured by, as its panel's token reads. */
export function measuredBy(goal: Goal, goals: Goal[], projects: Project[]): string {
  if (goal.manual) return 'Manual'
  if (goal.projectIds?.length) return goal.projectIds.length === 1 ? 'A project' : 'Projects'
  if (goal.projectId) return projects.find((p) => p.id === goal.projectId)?.name ?? 'A project'
  return childrenOf(goal, goals).length > 0 ? 'Subgoals' : 'Manual'
}

/** The table's rows: each company goal, then its subgoals when it is open. */
export function goalRows(
  goals: Goal[],
  open: ReadonlySet<string>,
): { id: string; goal: Goal; depth: 0 | 1; hasChildren: boolean }[] {
  return goals
    .filter((g) => !g.parentId)
    .flatMap((goal) => {
      const children = childrenOf(goal, goals)
      const parent = { id: goal.id, goal, depth: 0 as const, hasChildren: children.length > 0 }
      return open.has(goal.id)
        ? [
            parent,
            ...children.map((child) => ({
              id: child.id,
              goal: child,
              depth: 1 as const,
              hasChildren: false,
            })),
          ]
        : [parent]
    })
}

/**
 * Goals › My team: the goals Nathan's own team owns — Ops, Dana's and
 * Marcus's — with the company goals they ladder into. Company is the
 * company goals alone, without their subgoals.
 */
export type GoalScope = 'all' | 'company' | 'team'
const OPS = ['dana', 'marcus']

export function inScope(goals: Goal[], scope: GoalScope): Goal[] {
  if (scope === 'company') return goals.filter((g) => !g.parentId)
  if (scope === 'team') {
    const ids = new Set(goals.filter((g) => OPS.includes(g.ownerId)).map((g) => g.parentId ?? g.id))
    return goals.filter(
      (g) => ids.has(g.parentId ?? g.id) && (OPS.includes(g.ownerId) || !g.parentId),
    )
  }
  return goals
}
