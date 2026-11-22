import { day } from '../../../data/dates'
import type { Portfolio } from '../../../data/portfolios'
import type { Project, ProjectHealth } from '../../../data/types'

export function projectsIn(portfolio: Portfolio, projects: Project[]): Project[] {
  return portfolio.projectIds.map((id) => projects.find((p) => p.id === id)!)
}

/**
 * The Health column's mix (`Plan - Portfolios`, `40006296:27641`): a Small
 * Stacked Bar, a segment a health in the Badge's hue, sized by how many
 * projects have it. Store expansion is one at risk, two on track and one not
 * started.
 */
const MIX: { health: ProjectHealth; label: string; color: string }[] = [
  { health: 'off-track', label: 'Off track', color: 'var(--decorative-red-background)' },
  { health: 'at-risk', label: 'At risk', color: 'var(--decorative-amber-background)' },
  { health: 'on-track', label: 'On track', color: 'var(--decorative-green-background)' },
  { health: 'not-started', label: 'Not started', color: 'var(--decorative-neutral-background)' },
]

export function healthMix(projects: Project[]) {
  return MIX.map((m) => ({
    label: m.label,
    value: projects.filter((p) => p.health === m.health).length,
    color: m.color,
  })).filter((m) => m.value > 0)
}

/** The soonest milestone among a portfolio's projects, which is what the file prints for all four. */
export function nextMilestone(projects: Project[]): Project['milestone'] {
  return projects
    .map((p) => p.milestone)
    .sort((a, b) => day(a.date).getTime() - day(b.date).getTime())[0]
}

/** Projects that have started: "3 active" for Store expansion. */
export function activeCount(projects: Project[]): number {
  return projects.filter((p) => p.health !== 'not-started').length
}

/**
 * Store expansion's third metric (`40006279:12996`): the stores opening by
 * the end of March out of the three the goal counts. Austin and Dallas both
 * are, as drawn; once Dallas moves past March it reads 1 of 3.
 */
export function storesOpenBy(projects: Project[], byIso = '2027-03-31'): string {
  const by = day(byIso)
  const opening = ['austin', 'dallas']
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => p !== undefined && day(p.due) <= by)
  return `${opening.length} of 3`
}
