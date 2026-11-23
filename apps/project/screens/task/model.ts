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

/** A file's name without its folders, as a line comment's Code writes it: PaymentSheet.tsx. */
export function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

/** `_Reviewer Row`'s badge (`40006591:62667`): Approved green, Review requested neutral. */
export const REVIEW_BADGE: Record<ReviewState, { label: string; color: BadgeProps['color'] }> = {
  approved: { label: 'Approved', color: 'green' },
  requested: { label: 'Review requested', color: 'neutral' },
  changes: { label: 'Changes requested', color: 'red' },
}

/**
 * Split view: the diff as two columns, before and after. A run of removed
 * lines sits beside the run of added lines that replaced it, and the shorter
 * side is padded with blank rows so the context lines stay level. A hunk
 * header heads both. Each side is still a unified diff, so the library's
 * CodeBlock draws its rows (FINDINGS 136).
 */
export function splitDiff(diff: string): { before: string; after: string } {
  const before: string[] = []
  const after: string[] = []
  let removed: string[] = []
  let added: string[] = []
  const flush = () => {
    const rows = Math.max(removed.length, added.length)
    for (let i = 0; i < rows; i++) {
      before.push(removed[i] ?? ' ')
      after.push(added[i] ?? ' ')
    }
    removed = []
    added = []
  }
  for (const line of diff.split('\n')) {
    if (line.startsWith('-')) removed.push(line)
    else if (line.startsWith('+')) added.push(line)
    else {
      flush()
      before.push(line)
      after.push(line)
    }
  }
  flush()
  return { before: before.join('\n'), after: after.join('\n') }
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
