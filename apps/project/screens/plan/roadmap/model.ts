import { day, shiftIso, today } from '../../../data/dates'
import { goals, TEXAS_GOAL } from '../../../data/goals'
import { personFor } from '../../../data/people'
import { projects as baseProjects } from '../../../data/projects'
import { DALLAS_RELIEF, monthlyCapacity, TEAMS, type TeamId } from '../../../data/workload'
import type { Project } from '../../../data/types'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A change drawn on the Roadmap but not applied yet (`Plan - Roadmap /
 * Unsaved changes`, `40006278:14156`): a project moved whole, a project
 * ending later, or a project changing hands. Only you see them until you
 * apply them.
 */
export type StagedChange =
  | { kind: 'move'; projectId: string; days: number }
  | { kind: 'extend'; projectId: string; days: number }
  | { kind: 'owner'; projectId: string; ownerId: string }

/**
 * The three the file draws: Dallas starts three weeks later, Loyalty ends
 * two weeks later, and Houston moves from Marcus to Dana.
 */
export const DRAWN_CHANGES: StagedChange[] = [
  { kind: 'move', projectId: 'dallas', days: 21 },
  { kind: 'extend', projectId: 'loyalty', days: 14 },
  { kind: 'owner', projectId: 'houston', ownerId: 'dana' },
]

/** What Yak's Capacity line offers to try: Dallas three weeks later. */
export const YAK_CHANGE: StagedChange = { kind: 'move', projectId: 'dallas', days: 21 }

/** A project with one change made to it. */
export function applyChange(project: Project, change: StagedChange): Project {
  if (change.projectId !== project.id) return project
  switch (change.kind) {
    case 'move':
      return {
        ...project,
        start: shiftIso(project.start, change.days),
        due: shiftIso(project.due, change.days),
      }
    case 'extend':
      return { ...project, due: shiftIso(project.due, change.days) }
    case 'owner':
      return { ...project, ownerId: change.ownerId }
  }
}

export function applyChanges(projects: Project[], changes: StagedChange[]): Project[] {
  return projects.map((project) => changes.reduce(applyChange, project))
}

/** "three weeks", "2 weeks" — words up to ten, as the banner writes them. */
const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
]
export function weeksInWords(days: number): string {
  const weeks = Math.round(Math.abs(days) / 7)
  return `${WORDS[weeks] ?? weeks} week${weeks === 1 ? '' : 's'}`
}

/** The token beside a changed bar: "+3 weeks", "Ends 2w later", "Now Dana". */
export function changeTokenLabel(change: StagedChange): string {
  const weeks = Math.round(change.kind === 'owner' ? 0 : change.days / 7)
  switch (change.kind) {
    case 'move':
      return `${weeks > 0 ? '+' : '−'}${Math.abs(weeks)} week${Math.abs(weeks) === 1 ? '' : 's'}`
    case 'extend':
      return `Ends ${Math.abs(weeks)}w ${weeks > 0 ? 'later' : 'sooner'}`
    case 'owner':
      return `Now ${personFor(change.ownerId).name.split(' ')[0]}`
  }
}

/**
 * Who hears about it: each changed project's owner once the changes land,
 * so Houston's goes to Dana, its new owner. The file's three changes tell
 * Dana and Theo.
 */
export function ownersToNotify(projects: Project[], changes: StagedChange[]): string[] {
  const after = applyChanges(projects, changes)
  const ids: string[] = []
  for (const change of changes) {
    const owner = after.find((p) => p.id === change.projectId)?.ownerId
    if (owner && !ids.includes(owner)) ids.push(owner)
  }
  return ids
}

/**
 * The banner's sentence (`Plan - Roadmap / Unsaved changes`): who sees the
 * changes, the biggest move, and how many owners hear about it.
 */
export function stagedSummary(projects: Project[], changes: StagedChange[]): string {
  const notified = ownersToNotify(projects, changes).length
  const owners = `${WORDS[notified] ?? notified} owner${notified === 1 ? '' : 's'} will be notified`
  const move = changes
    .filter((c): c is Extract<StagedChange, { kind: 'move' }> => c.kind === 'move')
    .sort((a, b) => Math.abs(b.days) - Math.abs(a.days))[0]
  const project = move ? projects.find((p) => p.id === move.projectId) : undefined
  const lead = project
    ? `${project.short ?? project.name.split(' ')[0]} moves ${weeksInWords(move!.days)}, and ${owners}.`
    : `${owners[0].toUpperCase()}${owners.slice(1)}.`
  return `Only you can see these until you apply them. ${lead}`
}

// ─── Time axis ──────────────────────────────────────────────────────────────

export type RoadmapScale = 'months' | 'quarters'

export interface Column {
  start: Date
  end: Date
  label: string
}

export interface Range {
  columns: Column[]
  start: Date
  end: Date
}

const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' })

/**
 * The columns: six months from the one holding today, or four quarters from
 * the one holding today. A column after December names its year, as the
 * file's "Jan 2027" does; one in the current year does not.
 */
export function rangeFor(scale: RoadmapScale, from: Date = today): Range {
  const columns: Column[] = []
  const step = scale === 'months' ? 1 : 3
  const count = scale === 'months' ? 6 : 4
  const firstMonth = scale === 'months' ? from.getMonth() : from.getMonth() - (from.getMonth() % 3)
  for (let i = 0; i < count; i++) {
    const start = new Date(from.getFullYear(), firstMonth + i * step, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + step, 1)
    const year = start.getFullYear() === from.getFullYear() ? '' : ` ${start.getFullYear()}`
    const label =
      scale === 'months'
        ? `${monthShort.format(start)}${year}`
        : `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`
    columns.push({ start, end, label })
  }
  return { columns, start: columns[0].start, end: columns[columns.length - 1].end }
}

/**
 * Where a date falls across the chart, 0 at its left edge and 1 at its
 * right. Columns are equal widths, as drawn, so a day's place is its
 * column plus how far through that column it is.
 */
export function xOf(range: Range, date: Date): number {
  const n = range.columns.length
  if (date <= range.start) return 0
  if (date >= range.end) return 1
  const i = range.columns.findIndex((c) => date >= c.start && date < c.end)
  const column = range.columns[i]
  const through =
    (date.getTime() - column.start.getTime()) / (column.end.getTime() - column.start.getTime())
  return (i + through) / n
}

/**
 * A bar from a project's start to the end of its due day, clipped to the
 * chart, as fractions of its width; `null` when it is entirely outside.
 */
export function barOf(
  range: Range,
  start: string,
  due: string,
): { left: number; width: number } | null {
  const from = day(start)
  const to = new Date(day(due).getTime() + DAY_MS)
  if (to <= range.start || from >= range.end) return null
  const left = xOf(range, from)
  return { left, width: xOf(range, to) - left }
}

// ─── What a change does ─────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((day(b).getTime() - day(a).getTime()) / DAY_MS)
}

/**
 * A team's booked share for each month column. The data is a month a column
 * from the file's November; Ops' January eases when Dallas starts three
 * weeks later than it was planned to (`DALLAS_RELIEF`).
 */
export function capacityRows(
  projects: Project[],
): { team: TeamId; name: string; months: number[] }[] {
  const dallas = projects.find((p) => p.id === 'dallas')
  const base = baseProjects.find((p) => p.id === 'dallas')
  const moved = dallas && base ? daysBetween(base.start, dallas.start) : 0
  return monthlyCapacity.map(({ team, months }) => ({
    team,
    name: TEAMS.find((t) => t.id === team)!.name,
    months: months.map((value, i) =>
      team === DALLAS_RELIEF.team && i === DALLAS_RELIEF.month && moved >= DALLAS_RELIEF.days
        ? DALLAS_RELIEF.to
        : value,
    ),
  }))
}

/** One line of the Apply dialog's "What this changes", with the Badge after it. */
export interface Impact {
  kind: 'goal' | 'capacity'
  text: string
  badge: { label: string; color: 'amber' | 'green' }
}

const longMonth = new Intl.DateTimeFormat('en-US', { month: 'long' })
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/**
 * What the staged changes do beyond the bars they move (`Plan - Roadmap /
 * Apply changes`, `40006297:29985`): a goal a moved project now misses, and
 * a team month that eases.
 */
export function impactsOf(projects: Project[], changes: StagedChange[]): Impact[] {
  const after = applyChanges(projects, changes)
  const impacts: Impact[] = []

  const texas = goals.find((g) => g.id === TEXAS_GOAL)!
  const stores = ['austin', 'dallas']
  const late = Math.max(
    ...stores.map((id) => {
      const p = after.find((x) => x.id === id)!
      return daysBetween(texas.due, p.due)
    }),
  )
  const lateBefore = Math.max(
    ...stores.map((id) => daysBetween(texas.due, projects.find((x) => x.id === id)!.due)),
  )
  if (late > 0 && late !== lateBefore) {
    impacts.push({
      kind: 'goal',
      text: `${texas.title} misses its ${shortDate.format(day(texas.due))} due date by ${late} days`,
      badge: { label: 'At risk', color: 'amber' },
    })
  }

  const before = capacityRows(projects)
  const eased = capacityRows(after)
  const range = rangeFor('months')
  for (const row of eased) {
    const was = before.find((r) => r.team === row.team)!
    row.months.forEach((value, i) => {
      if (value < was.months[i] && range.columns[i]) {
        impacts.push({
          kind: 'capacity',
          text: `${row.name} in ${longMonth.format(range.columns[i].start)} drops from ${was.months[i]}% to ${value}%`,
          badge: { label: 'Better', color: 'green' },
        })
      }
    })
  }
  return impacts
}

/**
 * Yak's line over the Roadmap when nothing is staged (`Plan - Roadmap /
 * Capacity`, `40006297:28703`): the worst team month, and what would fix it
 * when the fix is the Dallas move. `offer` is whether that move is still on
 * the table.
 */
export function yakCapacityLine(projects: Project[]): { text: string; offer: boolean } {
  const rows = capacityRows(projects)
  const range = rangeFor('months')
  let worst = { name: '', value: 0, month: 0 }
  for (const row of rows) {
    row.months.forEach((value, i) => {
      if (value > worst.value) worst = { name: row.name, value, month: i }
    })
  }
  const month = longMonth.format(range.columns[worst.month].start)
  if (worst.value > 110 && worst.month === DALLAS_RELIEF.month) {
    return {
      text: `${worst.name} hits ${worst.value}% in ${month}, when Austin wraps up as Dallas starts. Starting Dallas three weeks later brings it down to ${DALLAS_RELIEF.to}%.`,
      offer: true,
    }
  }
  return {
    text: `Every team stays at or under 110% through ${longMonth.format(range.columns[range.columns.length - 1].start)}. The busiest is ${worst.name} in ${month}, at ${worst.value}%.`,
    offer: false,
  }
}
