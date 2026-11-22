import { addDays, day, sameDay, shiftIso, shortDate, today } from '../../data/dates'
import type { Sprint } from '../../data/sprints'
import type { Task } from '../../data/types'

/** Where a task sits after sprints were completed here: a sprint's number, or the backlog. */
export type SprintMoves = Record<string, number | null>

/** The sprint a task is in now: moved, or the one the data puts it in. */
export function sprintOf(task: Task, moves: SprintMoves): number | null {
  return task.id in moves ? moves[task.id] : (task.sprint?.number ?? null)
}

export function sprintTasks(
  tasks: Task[],
  projectId: string,
  number: number,
  moves: SprintMoves,
): Task[] {
  return tasks.filter((t) => t.projectId === projectId && sprintOf(t, moves) === number)
}

/** The sprint after one: the Monday after it ends, for two weeks. */
export function nextSprint(sprint: Sprint): Sprint {
  return {
    projectId: sprint.projectId,
    number: sprint.number + 1,
    start: shiftIso(sprint.end, 3),
    end: shiftIso(sprint.end, 14),
  }
}

/** The weekdays a sprint runs, which is what its burndown counts. */
export function workdays(sprint: Sprint): Date[] {
  const days: Date[] = []
  for (let d = day(sprint.start); d <= day(sprint.end); d = addDays(d, 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(d)
  }
  return days
}

/** Weekdays still to come after today, through the last: "6 days left". */
export function daysLeft(sprint: Sprint): number {
  return workdays(sprint).filter((d) => d > today && !sameDay(d, today)).length
}

/** "Nov 2 – 13", or "Oct 26 – Nov 6" across a month. */
export function sprintRange(sprint: Sprint): string {
  const start = day(sprint.start)
  const end = day(sprint.end)
  return start.getMonth() === end.getMonth()
    ? `${shortDate.format(start)} – ${end.getDate()}`
    : `${shortDate.format(start)} – ${shortDate.format(end)}`
}

function addedOn(task: Task, sprint: Sprint): Date {
  return day(task.sprint?.added ?? sprint.start)
}

/** When a done task finished; one marked done here without a date finished today. */
function doneOn(task: Task): Date | undefined {
  if (task.status !== 'done') return undefined
  return task.completedAt ?? today
}

export type BurndownRow = {
  day: string
  /** Open tasks at the end of the day; none for a day still to come. */
  remaining?: number
  /** Where the work would be if it burned down evenly from the scope to nothing. */
  ideal: number
}

/**
 * The burndown (`Sprint health`'s Line Series): for each weekday so far, the
 * tasks that had joined and were not done by its end; and the ideal line,
 * the whole scope on day one down to nothing on the last. Scope is every
 * task the sprint has held, so a task added after the start lifts the line
 * on the day it joined, as Allergen filters does on Nov 3.
 */
export function burndown(sprint: Sprint, tasks: Task[]): BurndownRow[] {
  const days = workdays(sprint)
  const scope = tasks.length
  return days.map((d, i) => {
    const ideal = Math.round(scope * (1 - i / (days.length - 1)) * 100) / 100
    if (d > today && !sameDay(d, today)) return { day: shortDate.format(d), ideal }
    const remaining = tasks.filter((t) => {
      if (addedOn(t, sprint) > d) return false
      const done = doneOn(t)
      return !done || (done > d && !sameDay(done, d))
    }).length
    return { day: shortDate.format(d), remaining, ideal }
  })
}

/**
 * How far behind the ideal line the sprint is today, in whole tasks: how
 * many more would have to be done to be back on it. Zero is on pace.
 */
export function behindBy(rows: BurndownRow[]): number {
  const last = rows.findLast((row) => row.remaining !== undefined)
  if (!last || last.remaining === undefined) return 0
  return Math.max(0, Math.ceil(last.remaining - last.ideal - 1e-9))
}

export interface SprintSummary {
  done: number
  total: number
  added: Task[]
  carried: number
  carriedFrom?: number
}

/**
 * Whether a task joined this sprint after it began: added mid-sprint in the
 * data, and not moved in from another sprint, which counts as carried over.
 */
export function addedAfterStart(task: Task, number: number): boolean {
  return task.sprint?.number === number && Boolean(task.sprint.added)
}

/**
 * `This sprint`: done of total, what joined after the start, and what came
 * over unfinished — from the sprint before when a sprint was completed here,
 * or as the data has it.
 */
export function summarize(tasks: Task[], number: number): SprintSummary {
  const carriedFrom = (t: Task) =>
    t.sprint?.number !== number ? number - 1 : t.sprint?.carriedFrom
  const carried = tasks.filter((t) => carriedFrom(t) !== undefined)
  return {
    done: tasks.filter((t) => t.status === 'done').length,
    total: tasks.length,
    added: tasks.filter((t) => addedAfterStart(t, number)),
    carried: carried.length,
    carriedFrom: carried[0] ? carriedFrom(carried[0]) : undefined,
  }
}

/** The average of finished sprints' done counts: "8 tasks a sprint". */
export function averagePace(finished: Sprint[]): number {
  const results = finished.flatMap((s) => (s.result ? [s.result.done] : []))
  return results.length ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : 0
}
