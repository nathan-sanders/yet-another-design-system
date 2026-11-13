import { projectFor } from '../../data/projects'
import type { Task } from '../../data/types'

/**
 * A project's tabs, in the file's order (`Yet Project / Project shell`,
 * `40006263:1152`). A project that runs in sprints swaps Rules for Sprints.
 * `figma` is the frame each is drawn on; Overview, List and Board are built so far.
 */
export const PROJECT_TABS = [
  { id: 'overview', label: 'Overview', figma: '40006268-5150', built: true },
  { id: 'list', label: 'List', figma: '40006268-6554', built: true },
  { id: 'board', label: 'Board', figma: '40006268-8728', built: true },
  { id: 'timeline', label: 'Timeline', figma: '40006272-7631' },
  { id: 'calendar', label: 'Calendar', figma: '40006272-9258' },
  { id: 'docs', label: 'Docs', figma: '40006309-36927' },
  { id: 'rules', label: 'Rules', figma: '40006284-21772' },
  { id: 'sprints', label: 'Sprints', figma: '40006281-34376' },
] as const

export type ProjectTab = (typeof PROJECT_TABS)[number]['id']

/** Where a project opens: Overview, the file's first tab. */
export const DEFAULT_TAB: ProjectTab = 'overview'

export function projectPath(id: string, tab: ProjectTab = DEFAULT_TAB): string {
  return `/projects/${id}/${tab}`
}

export function tabsFor(sprints = false) {
  return PROJECT_TABS.filter((tab) => (sprints ? tab.id !== 'rules' : tab.id !== 'sprints'))
}

/** The search param a task's panel is open on: `?task=AUS-24`. */
export const TASK_PARAM = 'task'

/** A task's number with its project's key, as the panel's header and the Number column read. */
export function taskKey(task: Task): string {
  return `${projectFor(task.projectId)?.key ?? ''}-${task.number}`
}

/**
 * A task's panel, open over its project's List (`Task - Panel over List`,
 * `40006275:8516`) or whichever view it was opened from. The panel is view
 * state, so it is in the URL: a task has a link, and Back closes it.
 */
export function taskPath(task: Task, tab: ProjectTab = 'list'): string {
  return `${projectPath(task.projectId, tab)}?${TASK_PARAM}=${taskKey(task)}`
}
