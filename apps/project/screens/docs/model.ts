import type { DocBlock, DocVersion, ProjectDoc } from '../../data/docs'
import type { Task } from '../../data/types'
import { addDays, day, today } from '../../data/dates'

/** All docs' segments: every doc, yours, and those shared with you by name. */
export type DocsShow = 'all' | 'mine' | 'shared'

/**
 * What a segment lists. Files stay on their project's Docs tab: the rail's
 * list is docs only, as `Docs - All docs` draws it. Mine is what you own or
 * have edited, so editing a doc here puts it in Mine.
 */
export function docsShown(docs: ProjectDoc[], show: DocsShow, meId: string): ProjectDoc[] {
  const list = docs.filter((doc) => doc.kind === 'doc')
  if (show === 'mine')
    return list.filter((doc) => doc.ownerId === meId || doc.editorIds?.includes(meId))
  if (show === 'shared') return list.filter((doc) => doc.sharedWith?.includes(meId))
  return list
}

/** The Linked tasks column: the real tasks, or the file's count where the project has none in the mock. */
export function linkedCount(doc: ProjectDoc): number {
  return doc.taskIds.length || doc.linkedCount || 0
}

/** One line of a doc's Version history, with whether it is the doc as it stands. */
export interface VersionRow extends DocVersion {
  current: boolean
}

/**
 * A doc's history, newest first. The file's top entry is current until you
 * change something here; then "Just now", yours, goes above it holding the
 * doc as it stands.
 */
export function versionRows(doc: ProjectDoc, meId: string): VersionRow[] {
  const saved = doc.versions ?? []
  if (!doc.edited) return saved.map((v, i) => ({ ...v, current: i === 0 }))
  return [
    {
      id: 'now',
      label: 'Just now',
      name: 'now',
      authorId: meId,
      blocks: doc.blocks ?? [],
      current: true,
    },
    ...saved.map((v) => ({ ...v, current: false })),
  ]
}

/** A line of the compare view: a block as it stands, marked new, or one from the old version that is gone. */
export type DiffRow =
  { kind: 'block'; block: DocBlock; added?: boolean } | { kind: 'removed'; block: DocBlock }

function sameBlock(a: DocBlock, b: DocBlock): boolean {
  if (a.kind !== b.kind) return false
  if (!('text' in a) || !('text' in b)) return true
  const taskA = 'taskId' in a ? a.taskId : undefined
  const taskB = 'taskId' in b ? b.taskId : undefined
  return a.text === b.text && taskA === taskB
}

/**
 * The doc as it stands against an older version (`Docs - Version history`,
 * `40006310:40709`). A block the old one lacks is Added; a block it had that
 * is gone is Removed, shown where it used to sit; a block whose words changed
 * is one change, its old words Removed above the new ones. That is how the
 * file counts "Comparing with yesterday · 2 changes": the crew line went from
 * twelve to fourteen, and the soft open is new.
 */
export function compareBlocks(
  current: DocBlock[],
  old: DocBlock[],
): { rows: DiffRow[]; changes: number } {
  const oldById = new Map(old.map((b) => [b.id, b]))
  const currentIds = new Set(current.map((b) => b.id))
  // A removed block sits before the next block, in the old order, that is still there.
  const removedBefore = new Map<string, DocBlock[]>()
  const removedAtEnd: DocBlock[] = []
  old.forEach((block, i) => {
    if (currentIds.has(block.id)) return
    const next = old.slice(i + 1).find((b) => currentIds.has(b.id))
    if (!next) removedAtEnd.push(block)
    else removedBefore.set(next.id, [...(removedBefore.get(next.id) ?? []), block])
  })

  const rows: DiffRow[] = []
  let changes = removedAtEnd.length
  for (const block of current) {
    for (const gone of removedBefore.get(block.id) ?? []) {
      rows.push({ kind: 'removed', block: gone })
      changes++
    }
    const was = oldById.get(block.id)
    if (!was) {
      rows.push({ kind: 'block', block, added: true })
      changes++
    } else if (!sameBlock(block, was)) {
      rows.push({ kind: 'removed', block: was })
      rows.push({ kind: 'block', block })
      changes++
    } else rows.push({ kind: 'block', block })
  }
  for (const gone of removedAtEnd) rows.push({ kind: 'removed', block: gone })
  return { rows, changes }
}

/** The tasks a block links, in the order the doc mentions them. */
export function inlineTaskIds(blocks: DocBlock[]): string[] {
  return blocks.flatMap((b) => ('taskId' in b && b.taskId ? [b.taskId] : []))
}

/**
 * The side column's list: the tasks the doc mentions first, in its order,
 * then the rest it is linked to. The mentioned ones are what `Docs - Austin
 * opening plan` lists; the rest are the All docs count (FINDINGS 96).
 */
export function linkedOrder(doc: ProjectDoc): string[] {
  const inline = inlineTaskIds(doc.blocks ?? []).filter((id) => doc.taskIds.includes(id))
  return [...new Set([...inline, ...doc.taskIds])]
}

/**
 * The slash menu's Task list: the project's tasks still open and due within
 * two weeks of today, late ones included, soonest first.
 */
export function dueSoon(tasks: Task[], projectId: string): Task[] {
  const end = addDays(today, 14)
  return tasks
    .filter((t) => t.projectId === projectId && t.status !== 'done' && day(t.due) <= end)
    .sort((a, b) => day(a.due).getTime() - day(b.due).getTime())
}

/** The words a slash command is filtered by: "/task" asks for "task". */
export function slashQuery(text: string): string | null {
  return text.startsWith('/') ? text.slice(1).trim().toLowerCase() : null
}
