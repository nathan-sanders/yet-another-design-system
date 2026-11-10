import {
  Circle,
  CircleCheckBig,
  CircleDot,
  CircleDotDashed,
  CircleSlash,
  type LucideIcon,
} from 'lucide-react'

import { day, sameDay, shortDate, today } from '../data/dates'
import type { ProjectColor, ProjectHealth, Task, TaskPriority, TaskStatus } from '../data/types'

/**
 * A task's status, in the order the menu lists it. The glyphs are the file's
 * (`Project - List`, `40006268:6554`), and unlike Yet Social's ticket statuses
 * they all draw in the label's color: the shape carries the state.
 */
export const STATUS: { value: TaskStatus; label: string; icon: LucideIcon }[] = [
  { value: 'todo', label: 'To do', icon: Circle },
  { value: 'in-progress', label: 'In progress', icon: CircleDot },
  { value: 'in-review', label: 'In review', icon: CircleDotDashed },
  { value: 'blocked', label: 'Blocked', icon: CircleSlash },
  { value: 'done', label: 'Done', icon: CircleCheckBig },
]

/**
 * The priority scale. Each level is a digit in a tinted box, Nathan's
 * `Priority Icon` set (`40006396:58194`) — Low 1 to Critical 4 on Decorative
 * hues. No priority (0) is code-only, as in Yet Social. Written out whole so
 * Tailwind can see the classes.
 */
export const PRIORITY: { value: TaskPriority; label: string; level: number; tone: string }[] = [
  {
    value: 'none',
    label: 'No priority',
    level: 0,
    tone: 'bg-decorative-neutral-background text-decorative-neutral-foreground',
  },
  {
    value: 'low',
    label: 'Low',
    level: 1,
    tone: 'bg-decorative-green-background text-decorative-green-foreground',
  },
  {
    value: 'medium',
    label: 'Medium',
    level: 2,
    tone: 'bg-decorative-yellow-background text-decorative-yellow-foreground',
  },
  {
    value: 'high',
    label: 'High',
    level: 3,
    tone: 'bg-decorative-orange-background text-decorative-orange-foreground',
  },
  {
    value: 'critical',
    label: 'Critical',
    level: 4,
    tone: 'bg-decorative-red-background text-decorative-red-foreground',
  },
]

export function statusFor(value: TaskStatus) {
  return STATUS.find((s) => s.value === value)!
}

export function priorityFor(value: TaskPriority) {
  return PRIORITY.find((p) => p.value === value)!
}

/**
 * A project's health as All projects' Badge draws it (`40006264:1069`):
 * Amber, Red, Green, and the neutral pill for not started. The header's
 * first button says the same word.
 */
export const HEALTH: Record<
  ProjectHealth,
  { label: string; color: 'amber' | 'red' | 'green' | 'neutral' }
> = {
  'at-risk': { label: 'At risk', color: 'amber' },
  'off-track': { label: 'Off track', color: 'red' },
  'on-track': { label: 'On track', color: 'green' },
  'not-started': { label: 'Not started', color: 'neutral' },
}

/**
 * A project's dot: the Decorative background with a 1px INSIDE stroke in the
 * same hue's highlight, so an `inset-ring`. Both are named per hue, because in
 * the file the stroke does not follow the fill — all 72 dots on the page once
 * kept a green stroke after their fill was changed.
 */
export const PROJECT_DOT: Record<ProjectColor, string> = {
  orange: 'bg-decorative-orange-background inset-ring-decorative-orange-highlight',
  pink: 'bg-decorative-pink-background inset-ring-decorative-pink-highlight',
  purple: 'bg-decorative-purple-background inset-ring-decorative-purple-highlight',
  red: 'bg-decorative-red-background inset-ring-decorative-red-highlight',
  teal: 'bg-decorative-teal-background inset-ring-decorative-teal-highlight',
  blue: 'bg-decorative-blue-background inset-ring-decorative-blue-highlight',
  yellow: 'bg-decorative-yellow-background inset-ring-decorative-yellow-highlight',
  sky: 'bg-decorative-sky-background inset-ring-decorative-sky-highlight',
}

/**
 * The Board's columns (`Project - Board`, `40006268:8728`): every status but
 * Blocked. A blocked task is work that started and stopped, so it stays in
 * In progress and wears a red Blocked badge, as Health permit approval does
 * in the file.
 */
export type BoardColumn = Exclude<TaskStatus, 'blocked'>

export const BOARD_COLUMNS = STATUS.filter(
  (s): s is (typeof STATUS)[number] & { value: BoardColumn } => s.value !== 'blocked',
)

export function columnOf(status: TaskStatus): BoardColumn {
  return status === 'blocked' ? 'in-progress' : status
}

/**
 * A card's tag: the phase's first word, as the Board's cards print it —
 * Permits for Permits & build-out, Hiring for Hiring & training.
 */
export function phaseTag(phase: string): string {
  return phase.split(' ')[0]
}

/**
 * What a blocked task is waiting on: its first dependency that is not done.
 * None for a task that is not marked blocked, whatever it depends on — a
 * To do task waiting its turn is not blocked, only one that started and
 * stopped. The panel's banner and the Board's drop notice both name it.
 */
export function blockerOf(task: Task, tasks: Task[]): Task | undefined {
  if (task.status !== 'blocked') return undefined
  return tasks.find(
    (t) => t.status !== 'done' && task.dependsOn?.some((dep) => dep.taskId === t.id),
  )
}

/** Every comment on a task, replies included, as a card's `message-circle` meta counts them. */
export function commentCount(task: Task): number {
  return (task.comments ?? []).reduce((n, comment) => n + 1 + (comment.replies?.length ?? 0), 0)
}

/** Subtasks done of total, as the List's meta and the panel's Subtasks head count them. */
export function subtaskCount(task: Task): { done: number; total: number } | null {
  if (!task.subtasks?.length) return null
  return { done: task.subtasks.filter((sub) => sub.done).length, total: task.subtasks.length }
}

/** "Today" on the mock's Thursday, as the file prints Signage proof's; the short date otherwise. */
export function dueLabel(task: Task): string {
  const due = day(task.due)
  return sameDay(due, today) ? 'Today' : shortDate.format(due)
}
