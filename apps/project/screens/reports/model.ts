import { addDays, day, fileIso, today } from '../../data/dates'
import { portfolios } from '../../data/portfolios'
import { projectFor } from '../../data/projects'
import {
  completedByWeekday,
  overdueBefore,
  overdueHistory,
  portfolioForecasts,
  projectBudgets,
  rates,
  teams,
} from '../../data/reports'
import type { Task } from '../../data/types'

export type Range = 7 | 30 | 90
export const RANGES: Range[] = [7, 30, 90]

const DAY_MS = 86_400_000

/** Late, open, and not done: due before today. */
export function overdueTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status !== 'done' && day(t.due) < today)
    .sort((a, b) => day(a.due).getTime() - day(b.due).getTime())
}

/** Whole days past due: "2 days", "1 day". */
export function lateBy(task: Task): string {
  const days = Math.round((today.getTime() - day(task.due).getTime()) / DAY_MS)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function teamOf(personId: string) {
  return teams.find((t) => t.memberIds.includes(personId))
}

/** Tasks done `daysAgo` days back: the weekly pattern, the recent one for the last 30 days. */
function completedOn(daysAgo: number): number {
  const date = addDays(today, -daysAgo)
  const weekday = (date.getDay() + 6) % 7
  return (daysAgo < 30 ? completedByWeekday.recent : completedByWeekday.earlier)[weekday]
}

function overdueOn(daysAgo: number, overdueNow: number): number {
  if (daysAgo === 0) return overdueNow
  return daysAgo < overdueHistory.length ? overdueHistory[daysAgo] : overdueBefore(daysAgo)
}

/** `Completed vs. overdue`: a row a day, oldest first, ending today. */
export function deliverySeries(range: Range, overdueNow: number) {
  return Array.from({ length: range }, (_, i) => {
    const daysAgo = range - 1 - i
    return {
      date: fileIso(addDays(today, -daysAgo)),
      completed: completedOn(daysAgo),
      overdue: overdueOn(daysAgo, overdueNow),
    }
  })
}

function sumCompleted(from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i++) sum += completedOn(i)
  return sum
}

/**
 * The four Metric Cards, each against the range before it: tasks done
 * (percent change), on-time rate (points), overdue now against the range's
 * first day (tasks), and cycle time (days).
 */
export function deliveryMetrics(range: Range, overdueNow: number) {
  const completed = sumCompleted(0, range)
  const before = sumCompleted(range, range * 2)
  const r = rates[range]
  return {
    completed,
    completedTrend: Math.round(((completed - before) / before) * 100),
    onTime: r.onTime,
    onTimeTrend: r.onTime - r.onTimeWas,
    overdue: overdueNow,
    overdueTrend: overdueNow - overdueOn(range, overdueNow),
    cycle: r.cycle,
    cycleTrend: Math.round((r.cycle - r.cycleWas) * 10) / 10,
  }
}

/** `Open work by team`: the company's open work a team, the live overdue stacked after it. */
export function openByTeam(tasks: Task[]) {
  const late = overdueTasks(tasks)
  return teams.map((team) => ({
    id: team.id,
    team: team.name,
    open: team.open,
    overdue: late.filter((t) => team.memberIds.includes(t.assigneeId)).length,
  }))
}

const SAY = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
export const say = (n: number) => SAY[n] ?? String(n)

/**
 * The line under Open work by team: who holds most of the overdue work, and
 * the one project it is all in when it is.
 */
export function overdueNote(tasks: Task[]): string {
  const late = overdueTasks(tasks)
  if (late.length === 0) return 'Nothing is overdue.'
  const rows = openByTeam(tasks).sort((a, b) => b.overdue - a.overdue)
  const top = rows[0]
  const theirs = late.filter((t) => teamOf(t.assigneeId)?.id === top.id)
  const projects = new Set(theirs.map((t) => t.projectId))
  const where =
    projects.size === 1 && theirs[0].projectId
      ? `, all in ${projectFor(theirs[0].projectId)!.name}`
      : ''
  return `${top.team} holds ${say(top.overdue)} of the ${say(late.length)} overdue tasks${where}.`
}

export interface BudgetRow {
  id: string
  name: string
  /** A project under a portfolio, indented under it. */
  parentId?: string
  spent: number
  total: number
  forecast: number
}

/** `Reports - Budget`'s rows: each portfolio, then the projects the file breaks out under it. */
export function budgetRows(): BudgetRow[] {
  return portfolios.flatMap((p) => [
    {
      id: p.id,
      name: p.name,
      spent: p.budget.spent,
      total: p.budget.total,
      forecast: portfolioForecasts[p.id],
    },
    ...projectBudgets
      .filter((b) => p.projectIds.includes(b.projectId))
      .map((b) => ({ id: b.projectId, name: projectFor(b.projectId)!.name, parentId: p.id, ...b })),
  ])
}

/** The four Budget metrics: spent of total, forecast, portfolios over, and what is left. */
export function budgetTotals(rows: BudgetRow[]) {
  const top = rows.filter((r) => !r.parentId)
  const spent = top.reduce((s, r) => s + r.spent, 0)
  const total = top.reduce((s, r) => s + r.total, 0)
  const forecast = top.reduce((s, r) => s + r.forecast, 0)
  return {
    spent,
    total,
    forecast,
    over: top.filter((r) => r.forecast > r.total),
    left: total - spent,
  }
}

/** "$1.76M", "$584K", "$50K": three significant figures at most. */
export function dollars(n: number): string {
  const abs = Math.abs(n)
  const [value, unit] = abs >= 1_000_000 ? [abs / 1_000_000, 'M'] : [abs / 1_000, 'K']
  const digits = value >= 100 ? 0 : value >= 10 ? (Number.isInteger(value) ? 0 : 1) : 2
  return `$${Number(value.toFixed(digits))}${unit}`
}

/** Yak's read, from the numbers it sits over: which way overdue work went, and who holds it. */
export function deliveryRead(tasks: Task[], range: Range): string {
  const late = overdueTasks(tasks)
  const m = deliveryMetrics(range, late.length)
  const top = openByTeam(tasks).sort((a, b) => b.overdue - a.overdue)[0]
  const blocked = late.length && tasks.some((t) => t.id === 'aus-24' && t.status === 'blocked')
  const pace = m.completedTrend >= 0 ? 'Delivery is steady.' : 'Delivery slowed.'
  if (!late.length) return `${pace} Nothing is overdue.`
  const why = blocked ? ' because of one blocked permit' : ''
  const way = m.overdueTrend > 0 ? 'up' : m.overdueTrend < 0 ? 'down' : 'flat'
  return `${pace} Overdue work is ${way}${why}, and ${top.team} is carrying most of it.`
}

/** Yak's read: the portfolios forecast over budget, and the project most of it is in. */
export function budgetRead(rows: BudgetRow[]): string {
  const over = rows.filter((r) => !r.parentId && r.forecast > r.total)
  if (!over.length) return 'Every portfolio is forecast to land on or under budget.'
  const p = over[0]
  const worst = rows
    .filter((r) => r.parentId === p.id && r.forecast > r.total)
    .sort((a, b) => b.forecast - b.total - (a.forecast - a.total))[0]
  const only = over.length === 1 ? 'the only portfolio' : 'one of the portfolios'
  return `${p.name} is ${only} heading over budget: ${dollars(p.forecast)} forecast against ${dollars(p.total)}${worst ? `, mostly ${worst.name}` : ''}.`
}

// The chart builder

export type BuilderMeasure = 'count' | 'hours'
export type BuilderField = 'phase' | 'assignee' | 'status' | 'priority'
export type BuilderViz = 'line' | 'area' | 'bar' | 'donut' | 'metric' | 'table'

export interface BuilderConfig {
  projectId: string
  measure: BuilderMeasure
  groupBy: BuilderField
  splitBy: BuilderField | 'none'
  viz: BuilderViz
}

export const FIELD_LABEL: Record<BuilderField, string> = {
  phase: 'Phase',
  assignee: 'Assignee',
  status: 'Status',
  priority: 'Priority',
}

const STATUS_ORDER = ['done', 'in-progress', 'in-review', 'blocked', 'todo']
const STATUS_NAME: Record<string, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'in-review': 'In review',
  blocked: 'Blocked',
  todo: 'To do',
}
const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low', 'none']
const PRIORITY_NAME: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
}

/**
 * The color slot a status or priority keeps whichever of them a chart has,
 * so Blocked is the same color on every chart; another field's values take
 * theirs by position, as the chart would anyway.
 */
export function seriesColor(field: BuilderField | 'none', value: string): string | undefined {
  const order =
    field === 'status'
      ? STATUS_ORDER.map((s) => STATUS_NAME[s])
      : field === 'priority'
        ? PRIORITY_ORDER.map((p) => PRIORITY_NAME[p])
        : null
  const at = order?.indexOf(value) ?? -1
  return at < 0 ? undefined : `var(--data-viz-categorical-${String(at + 1).padStart(2, '0')})`
}

/** A task's value for a field, as the chart names it. */
function valueOf(task: Task, field: BuilderField, names: (id: string) => string): string {
  if (field === 'phase') return task.phase
  if (field === 'assignee') return names(task.assigneeId)
  if (field === 'status') return STATUS_NAME[task.status]
  return PRIORITY_NAME[task.priority]
}

/** A field's values in the order a chart lists them: statuses and priorities by rank, the rest as met. */
function valuesOf(tasks: Task[], field: BuilderField, names: (id: string) => string): string[] {
  if (field === 'status')
    return STATUS_ORDER.map((s) => STATUS_NAME[s]).filter((s) =>
      tasks.some((t) => STATUS_NAME[t.status] === s),
    )
  if (field === 'priority')
    return PRIORITY_ORDER.map((p) => PRIORITY_NAME[p]).filter((p) =>
      tasks.some((t) => PRIORITY_NAME[t.priority] === p),
    )
  return [...new Set(tasks.map((t) => valueOf(t, field, names)))]
}

function measureOf(task: Task, measure: BuilderMeasure): number {
  return measure === 'count' ? 1 : Number.parseFloat(task.estimate ?? '0') || 0
}

/** A phase's first word, as the frame's axis labels it: "Permits & build-out" is "Permits". */
export function shortLabel(value: string): string {
  return value.split(/[ &]/)[0]
}

/**
 * What the builder draws: a row a group value, a column a split value, each
 * the count (or hours) of the project's tasks with both. Without a split,
 * the one series is the measure itself.
 */
export function builderData(tasks: Task[], config: BuilderConfig, names: (id: string) => string) {
  const list = tasks.filter((t) => t.projectId === config.projectId)
  const groups = valuesOf(list, config.groupBy, names)
  const splits =
    config.splitBy === 'none'
      ? [config.measure === 'count' ? 'Tasks' : 'Hours']
      : valuesOf(list, config.splitBy, names)
  const rows = groups.map((group) => {
    const row: Record<string, string | number> = {
      group: config.groupBy === 'phase' ? shortLabel(group) : group,
    }
    for (const split of splits) {
      row[split] = list
        .filter(
          (t) =>
            valueOf(t, config.groupBy, names) === group &&
            (config.splitBy === 'none' || valueOf(t, config.splitBy, names) === split),
        )
        .reduce((sum, t) => sum + measureOf(t, config.measure), 0)
    }
    return row
  })
  const total = list.reduce((sum, t) => sum + measureOf(t, config.measure), 0)
  return { rows, splits, total, count: list.length }
}

/**
 * Yak's reading of a request like "Austin tasks by phase and status": the
 * project by its short name, then the group and split by their field names.
 * Whatever it can't place keeps its current value.
 */
export function readRequest(
  text: string,
  config: BuilderConfig,
  projects: { id: string; names: string[] }[],
): BuilderConfig | null {
  const q = text.toLowerCase()
  const project = projects.find((p) => p.names.some((n) => q.includes(n.toLowerCase())))
  const fields = (Object.keys(FIELD_LABEL) as BuilderField[]).filter((f) => q.includes(f))
  const byAt = q.indexOf(' by ')
  if (!project && byAt < 0) return null
  const after = byAt >= 0 ? q.slice(byAt + 4) : ''
  const named = (Object.keys(FIELD_LABEL) as BuilderField[])
    .map((f) => ({ f, at: after.indexOf(f) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.f)
  return {
    ...config,
    projectId: project?.id ?? config.projectId,
    groupBy: named[0] ?? config.groupBy,
    splitBy: named[1] ?? (named[0] && fields.length === 1 ? 'none' : config.splitBy),
    measure: q.includes('hour') ? 'hours' : q.includes('task') ? 'count' : config.measure,
  }
}

/** What a built chart is about, as its title says it: "Austin tasks by phase". */
export function chartTitle(config: BuilderConfig, projectName: string): string {
  const what = config.measure === 'count' ? 'tasks' : 'hours'
  return `${projectName} ${what} by ${FIELD_LABEL[config.groupBy].toLowerCase()}`
}
