import { TASK_PARAM, taskKey } from '../project/paths'
import type { Task } from '../../data/types'

/**
 * My work's views, as the Top Bar's Segment Control lists them (`My work -
 * List`, `40006266:4756`). The view is in the path, so each has a link.
 */
export const MY_WORK_VIEWS = [
  { id: 'list', label: 'List', figma: '40006266-4756' },
  { id: 'board', label: 'Board', figma: '40006315-45894' },
  { id: 'calendar', label: 'Calendar', figma: '40006315-49546' },
] as const

export type MyWorkView = (typeof MY_WORK_VIEWS)[number]['id']

export function myWorkPath(view: MyWorkView = 'list'): string {
  return `/my-work/${view}`
}

/** A task's panel, open over My work: `#/my-work/board?task=PRO-21`. */
export function myWorkTaskPath(task: Task, view: MyWorkView): string {
  return `${myWorkPath(view)}?${TASK_PARAM}=${taskKey(task)}`
}
