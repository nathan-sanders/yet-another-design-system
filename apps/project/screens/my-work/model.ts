import { addDays, day, sameDay, shortDate, today, weekdayShort } from '../../data/dates'
import type { Meeting, TimeBlock } from '../../data/myWork'
import { me } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { Task } from '../../data/types'
import { mondayOf } from '../project/timeline'

/**
 * Where a piece of open work falls, as My work's List groups it and its
 * Board's columns hold it (`40006266:4756`, `40006315:45894`). The Board has
 * no Overdue column: overdue work leads Today, because today is when it gets
 * done.
 */
export type Bucket = 'overdue' | 'today' | 'week' | 'later'

export const BUCKETS: { key: Bucket; label: string }[] = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'later', label: 'Later' },
]

/** Monday to Sunday of the week holding `now`. */
export function weekOf(now: Date = today): { monday: Date; sunday: Date } {
  const monday = mondayOf(now)
  return { monday, sunday: addDays(monday, 6) }
}

/**
 * Whether a task is the person's work: theirs to do, or someone else's
 * waiting on their review. A review stops being theirs once it is done.
 */
export function isMine(task: Task, personId: string = me.id): boolean {
  if (task.assigneeId === personId) return true
  return task.review?.personId === personId && task.status !== 'done'
}

/** What the person owes the task, as My work names it: the review's action, or the title. */
export function workTitle(task: Task, personId: string = me.id): string {
  return task.assigneeId !== personId && task.review?.personId === personId
    ? task.review.action
    : task.title
}

/** Whose face the card wears in My work: the person's own, since it is their work either way. */
export function workPersonId(task: Task, personId: string = me.id): string {
  return isMine(task, personId) ? personId : task.assigneeId
}

export function bucketOf(task: Task, now: Date = today): Bucket {
  const due = day(task.due)
  if (sameDay(due, now)) return 'today'
  if (due < now) return 'overdue'
  return due <= weekOf(now).sunday ? 'week' : 'later'
}

/** Open work, in due order, the earliest first. */
export function openWork(tasks: Task[], personId: string = me.id): Task[] {
  return tasks
    .filter((task) => isMine(task, personId) && task.status !== 'done')
    .sort((a, b) => day(a.due).getTime() - day(b.due).getTime())
}

/** The person's own tasks finished between Monday and Sunday of this week. */
export function doneThisWeek(tasks: Task[], now: Date = today, personId: string = me.id): Task[] {
  const { monday, sunday } = weekOf(now)
  return tasks.filter(
    (task) =>
      task.assigneeId === personId &&
      task.status === 'done' &&
      task.completedAt !== undefined &&
      task.completedAt >= monday &&
      task.completedAt <= addDays(sunday, 1),
  )
}

/**
 * The due date as My work prints it: "Today"; a weekday for the rest of this
 * week, or for work done earlier in it ("Fri", "Wed"); the date for anything
 * overdue or later ("Nov 3", "Dec 2").
 */
export function workDueLabel(task: Task, now: Date = today): string {
  const due = day(task.due)
  if (sameDay(due, now)) return 'Today'
  const { monday, sunday } = weekOf(now)
  const overdue = task.status !== 'done' && due < now
  if (!overdue && due >= monday && due <= sunday) return weekdayShort.format(due)
  return shortDate.format(due)
}

/** A card's tag: the project's short name, or the team's for work outside a project. */
export function workTag(task: Task): string {
  const project = projectFor(task.projectId)
  return project?.short ?? project?.name ?? task.team?.name ?? ''
}

/** Hours of work, from each task's estimate ("6h"). */
export function hoursOf(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + (Number.parseFloat(task.estimate ?? '') || 0), 0)
}

// The calendar (`My work - Calendar`, `40006315:49546`).

/** The grid's first and last hour, and an hour's height: 9 am to 6 pm at 72px. */
export const DAY_START = 9
export const DAY_END = 18
export const HOUR_HEIGHT = 72

/** Monday to Friday of this week. */
export function workWeek(now: Date = today): Date[] {
  const { monday } = weekOf(now)
  return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
}

/** Open work due this week or before that has no time blocked for it, as the tray lists it. */
export function unscheduled(tasks: Task[], blocks: TimeBlock[], now: Date = today): Task[] {
  const blocked = new Set(blocks.flatMap((block) => block.taskIds))
  return openWork(tasks).filter((task) => bucketOf(task, now) !== 'later' && !blocked.has(task.id))
}

/** One thing on a day's grid: a meeting, or time blocked for work. */
export type CalendarItem = { kind: 'meeting'; item: Meeting } | { kind: 'block'; item: TimeBlock }

export interface Placed {
  entry: CalendarItem
  /** Which of `lanes` side-by-side columns it takes, when it overlaps another. */
  lane: number
  lanes: number
}

/**
 * Lays out one day's meetings and blocks: each takes the first lane free at
 * its start, and everything in a run of overlaps splits the day's width by
 * the lanes that run needed. Nothing overlaps in the file's week; a task
 * dropped onto a busy hour sits beside what is there instead of over it.
 */
export function placeDay(entries: CalendarItem[]): Placed[] {
  const sorted = [...entries].sort((a, b) => a.item.start - b.item.start || b.item.end - a.item.end)
  const placed: Placed[] = []
  let run: Placed[] = []
  let runEnd = -Infinity
  const lanesEnd: number[] = []
  const close = () => {
    const lanes = Math.max(1, ...run.map((p) => p.lane + 1))
    for (const p of run) p.lanes = lanes
    run = []
    lanesEnd.length = 0
  }
  for (const entry of sorted) {
    if (entry.item.start >= runEnd) close()
    let lane = lanesEnd.findIndex((end) => end <= entry.item.start)
    if (lane === -1) lane = lanesEnd.length
    lanesEnd[lane] = entry.item.end
    const p = { entry, lane, lanes: 1 }
    run.push(p)
    placed.push(p)
    runEnd = Math.max(runEnd, entry.item.end)
  }
  close()
  return placed
}

/** "9 am", "12 pm", "2 pm", as the file's gutter writes them. */
export function hourLabel(hour: number): string {
  const h = Math.floor(hour)
  const suffix = h < 12 ? 'am' : 'pm'
  const twelve = h % 12 === 0 ? 12 : h % 12
  const minutes = Math.round((hour - h) * 60)
  return minutes ? `${twelve}:${String(minutes).padStart(2, '0')} ${suffix}` : `${twelve} ${suffix}`
}

/** "10 am – 12 pm". */
export function spanLabel(start: number, end: number): string {
  return `${hourLabel(start)} – ${hourLabel(end)}`
}

/**
 * Where a task dropped on an hour lands: from that hour, as long as its
 * estimate but at most two hours, and never past the grid's last hour.
 */
export function dropSpan(task: Task, hour: number): { start: number; end: number } {
  const length = Math.min(Number.parseFloat(task.estimate ?? '') || 1, 2)
  return { start: hour, end: Math.min(hour + length, DAY_END) }
}
