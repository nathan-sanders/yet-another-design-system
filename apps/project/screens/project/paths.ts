import { projectFor } from '../../data/projects'
import type { Task } from '../../data/types'

/**
 * A project's tabs, in the file's order (`Yet Project / Project shell`,
 * `40006263:1152`). A project that runs in sprints swaps Rules for Sprints.
 * `figma` is the frame each is drawn on; only List is built so far.
 */
export const PROJECT_TABS = [
  { id: 'overview', label: 'Overview', figma: '40006268-5150' },
  { id: 'list', label: 'List', figma: '40006268-6554', built: true },
  { id: 'board', label: 'Board', figma: '40006268-8728' },
  { id: 'timeline', label: 'Timeline', figma: '40006272-7631' },
  { id: 'calendar', label: 'Calendar', figma: '40006272-9258' },
  { id: 'docs', label: 'Docs', figma: '40006309-36927' },
  { id: 'rules', label: 'Rules', figma: '40006284-21772' },
  { id: 'sprints', label: 'Sprints', figma: '40006281-34376' },
] as const

export type ProjectTab = (typeof PROJECT_TABS)[number]['id']

/**
 * Where a project opens. List for now, because it is the tab that is built;
 * Overview is the file's first tab and becomes the default once it is.
 */
export const DEFAULT_TAB: ProjectTab = 'list'

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
 * `40006275:8516`). The panel is view state, so it is in the URL: a task has
 * a link, and Back closes it.
 */
export function taskPath(task: Task): string {
  return `${projectPath(task.projectId, 'list')}?${TASK_PARAM}=${taskKey(task)}`
}
