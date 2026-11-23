import type { BadgeProps } from '../../../../src/components/Badge'
import type { DiffFile, ReviewState, Task } from '../../data/types'

/** "3 files · +13 −1", counted from the diffs rather than written down. */
export function diffStat(files: DiffFile[]): { files: number; added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const file of files) {
    for (const line of file.diff.split('\n')) {
      if (line.startsWith('+') && !line.startsWith('+++ ')) added++
      else if (line.startsWith('-') && !line.startsWith('--- ')) removed++
    }
  }
  return { files: files.length, added, removed }
}

export function statLine(files: DiffFile[]): string {
  const stat = diffStat(files)
  return `${stat.files} ${stat.files === 1 ? 'file' : 'files'} · +${stat.added} −${stat.removed}`
}

/** `_Reviewer Row`'s badge (`40006591:62667`): Approved green, Review requested neutral. */
export const REVIEW_BADGE: Record<ReviewState, { label: string; color: BadgeProps['color'] }> = {
  approved: { label: 'Approved', color: 'green' },
  requested: { label: 'Review requested', color: 'neutral' },
  changes: { label: 'Changes requested', color: 'red' },
}

/**
 * Where a task sits among its project's, for the top bar's "5 of 12" and its
 * up and down arrows: the project's tasks in the List's order, which is the
 * data's.
 */
export function neighbours(task: Task, tasks: Task[]) {
  const list = tasks.filter((t) =>
    task.projectId
      ? t.projectId === task.projectId
      : !t.projectId && t.team?.key === task.team?.key,
  )
  const index = list.findIndex((t) => t.id === task.id)
  return {
    position: index + 1,
    total: list.length,
    previous: index > 0 ? list[index - 1] : undefined,
    next: index < list.length - 1 ? list[index + 1] : undefined,
  }
}
