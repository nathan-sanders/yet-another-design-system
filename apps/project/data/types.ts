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
  /**
   * The name a task card's tag gives it in My work, where cards from every
   * project share a column: Austin, Gift Cards. The whole name when unset.
   */
  short?: string
}

export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'blocked' | 'done'
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  /**
   * The project it is in. A task can be a team's rather than a project's —
   * Sign the Q4 ops budget is Ops' — and then it has a `team` instead.
   */
  projectId?: string
  /** The team a task outside any project belongs to, as its card's tag names it: Ops. */
  team?: { name: string; key: string }
  /** The number after the project's key: 24 for AUS-24. */
  number: number
  title: string
  /**
   * A short name, where a whole title will not fit in a 154px chip: My
   * work's calendar writes Signage proof's review as "Signage proof".
   */
  short?: string
  /** The project phase it belongs to, which the List groups by. */
  phase: string
  assigneeId: string
  status: TaskStatus
  priority: TaskPriority
  due: string
  /**
   * When work starts, in the file's calendar, for the Timeline's bar. A task
   * that waits on another with a lag starts that many days after it is due.
   */
  start?: string
  /** The plan as it stood on the project's baseline day, when it has slipped since. */
  baseline?: { start: string; due: string }
  /**
   * What the task is, under its title in the panel. A date in it is written
   * `{2026-11-10}`, so `datedText` moves it with the schedule.
   */
  description?: string
  /** Hours, as the panel's Estimate token reads: "6h". */
  estimate?: string
  /** Its checklist. The List's `list-tree` meta counts them, done of total. */
  subtasks?: Subtask[]
  /**
   * The tasks this one waits on. Written once, on the waiting side; the other
   * side's "Blocks" row is found by looking the other way.
   */
  dependsOn?: { taskId: string; lagDays?: number }[]
  /** The panel's Linked section: a doc and an intake request, by name. */
  linked?: { doc?: string; request?: string }
  comments?: TaskComment[]
  /** Newest first, as the Activity tab lists them. */
  activity?: TaskEvent[]
  /**
   * Someone else's task waiting on your review, so it is in your My work
   * too, under what you owe it: Katie's Signage proof is Nathan's "Approve
   * the signage proof".
   */
  review?: { personId: string; action: string }
  /** When it was marked done, for My work's "Done this week". */
  completedAt?: Date
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

/** `_Inbox Comment`: a face, a name, an age and the words, and replies one step in. */
export interface TaskComment {
  id: string
  authorId: string
  /** "2h", as drawn; one written here reads "Just now". */
  age: string
  body: string
  likes?: number
  replies?: TaskComment[]
}

/**
 * One line of the Activity tab (`Task - Activity log`, `40006307:38076`). A
 * person's line carries their face; a rule's a `zap`, Yak's its mark. A change
 * of value shows its before and after as two tokens.
 */
export interface TaskEvent {
  id: string
  actor: string | 'rule' | 'yak'
  text: string
  at: Date
  /** A date in either is written `{2026-11-10}`, so it moves with the schedule. */
  change?: { from: string; to: string }
}

/**
 * A project's Overview tab (`Project - Overview`, `40006268:5150`): what Yak
 * makes of it, the owner's latest update, the milestones, the properties the
 * header has no room for, and the latest activity. Dates inside prose are
 * written `{2026-11-18}` so `datedText` can move them onto this week with the
 * rest of the schedule.
 */
export interface ProjectOverview {
  projectId: string
  /** Yak's summary, one paragraph a line. */
  summary: string[]
  latestUpdate: {
    authorId: string
    /** The day it was posted, in the file's calendar. */
    posted: string
    health: ProjectHealth
    body: string
    /** "Since last update": what moved, each as a view-only Token. */
    changes: { kind: 'date' | 'people' | 'progress'; text: string }[]
  }
  /** `timeline` is the short name the Timeline's milestone row gives it; without one it is not drawn there. */
  milestones: { name: string; date: string; health: ProjectHealth; timeline?: string }[]
  team: string[]
  budget: { spent: number; total: number }
  goal: string
  portfolio: string
  /** Newest first, ages as drawn ("2h"). */
  activity: { actorId: string; text: string; age: string }[]
}
