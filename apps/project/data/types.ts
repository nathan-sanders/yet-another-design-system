/** The Decorative hues a project's dot is drawn in. */
export type ProjectColor = 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'blue' | 'yellow' | 'sky'

/**
 * A project's health, as the Health column's Badge and the header's first
 * button say it. It also decides which group All projects files it under.
 */
export type ProjectHealth = 'at-risk' | 'off-track' | 'on-track' | 'not-started'

export interface Project {
  id: string
  name: string
  color: ProjectColor
  health: ProjectHealth
  /** Percent of its tasks done, as All projects prints it. */
  progress: number
  ownerId: string
  /** ISO dates in the file's calendar; `day()` moves them onto this week. */
  start: string
  due: string
  milestone: { name: string; date: string }
  /** The prefix its task numbers carry: AUS-24. */
  key: string
  /** Runs in sprints, so its last tab is Sprints rather than Rules. */
  sprints?: boolean
}

export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'blocked' | 'done'
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  projectId: string
  /** The number after the project's key: 24 for AUS-24. */
  number: number
  title: string
  /** The project phase it belongs to, which the List groups by. */
  phase: string
  assigneeId: string
  status: TaskStatus
  priority: TaskPriority
  due: string
  /** Subtasks done of total, as the task name's `list-tree` meta reads. */
  subtasks?: { done: number; total: number }
}
