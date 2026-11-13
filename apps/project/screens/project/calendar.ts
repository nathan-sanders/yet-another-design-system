import { addDays, day } from '../../data/dates'
import type { Task } from '../../data/types'
import { daysBetween } from './timeline'

/*
 * The arithmetic under a project's Calendar (`Project - Calendar`,
 * `40006272:9258`): the weeks a month view draws, Sunday first, and each
 * task's piece of each week, stacked in lanes.
 */

/** "2026-11", the month in the URL. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthFromKey(key: string | null, fallback: Date): Date {
  const match = key?.match(/^(\d{4})-(\d{2})$/)
  if (!match) return new Date(fallback.getFullYear(), fallback.getMonth(), 1)
  return new Date(Number(match[1]), Number(match[2]) - 1, 1)
}

export function addMonths(month: Date, count: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + count, 1)
}

/** The Sundays of the weeks that hold any day of the month, as the file's five rows do for November. */
export function weeksOf(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const weeks: Date[] = []
  for (let sunday = addDays(first, -first.getDay()); sunday <= last; sunday = addDays(sunday, 7)) {
    weeks.push(sunday)
  }
  return weeks
}

export interface Segment {
  task: Task
  /** The first and last day it covers in this week, 0 for Sunday. */
  from: number
  to: number
  lane: number
}

/**
 * Each task's piece of one week, in lanes: earliest start first, each in the
 * first lane free across its days. Work done is not on the Calendar, as it is
 * not on the Timeline.
 */
export function segmentsOf(week: Date, tasks: Task[]): Segment[] {
  const end = addDays(week, 6)
  const pieces = tasks
    .filter((task) => task.start && task.status !== 'done')
    .map((task) => ({ task, start: day(task.start!), due: day(task.due) }))
    .filter(({ start, due }) => start <= end && due >= week)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const lanes: boolean[][] = []
  return pieces.map(({ task, start, due }) => {
    const from = Math.max(daysBetween(week, start), 0)
    const to = Math.min(daysBetween(week, due), 6)
    let lane = lanes.findIndex((taken) => taken.slice(from, to + 1).every((t) => !t))
    if (lane === -1) lane = lanes.push(Array(7).fill(false)) - 1
    for (let i = from; i <= to; i++) lanes[lane][i] = true
    return { task, from, to, lane }
  })
}
