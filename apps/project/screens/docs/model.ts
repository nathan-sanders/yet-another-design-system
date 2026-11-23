import type { DocBlock, DocVersion, ProjectDoc } from '../../data/docs'
import type { Task } from '../../data/types'
import { addDays, day, today } from '../../data/dates'
import {
  inlineLength,
  insertPlain,
  joinInline,
  parseInline,
  plainText,
  readInline,
  readRuns,
  serializeInline,
  sliceRuns,
  splitInline,
} from './richText'

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
  if (a.kind === 'code' && b.kind === 'code')
    return a.code === b.code && a.title === b.title && a.language === b.language
  if (!isText(a) || !isText(b)) return true
  const doneA = a.kind === 'todo' && Boolean(a.done)
  const doneB = b.kind === 'todo' && Boolean(b.done)
  return a.text === b.text && a.taskId === b.taskId && doneA === doneB
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
  return blocks.flatMap((b) => (isText(b) && b.taskId ? [b.taskId] : []))
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

// The editor. A doc is a list of blocks, and every line you type in is one:
// Enter breaks a line in two at the caret, Backspace at the start of one joins
// it to the line above, as a page editor does. These are the edits as plain
// functions of the blocks; the page reads the caret and puts it back.

/** A block you type in. The rest — Task list, Project status — are live cards. */
export type TextBlock = Extract<DocBlock, { text: string }>
export type TextKind = TextBlock['kind']

export function isText(block: DocBlock | undefined): block is TextBlock {
  return Boolean(block && 'text' in block)
}

let made = 0
/** A new block's id; ids only need to be unique while the mock is open. */
export const newBlockId = () => `block-new-${++made}`

/** Where the caret goes after an edit: a block, and how many characters in. */
export interface Caret {
  id: string
  offset: number
  /** The other end, when the edit leaves words selected (⌘B keeps them selected). */
  end?: number
}

/** A line's words as you read them, with no formatting: for counting, quoting and labels. */
export function readText(block: TextBlock): string {
  return plainText(readRuns(block.text))
}

/**
 * A line as the editor holds it: its dates written out and its bold, italic
 * and links kept (`richText.ts`). An edited line is saved like this. Every
 * edit below takes a line's words in this form and counts the caret in the
 * characters you see.
 */
export function readLine(block: TextBlock): string {
  return readInline(block.text)
}

/** The same line as another kind, keeping its words and its task. A to-do starts open. */
export function turnInto(block: TextBlock, kind: TextKind): TextBlock {
  const { id, text, taskId } = block
  const task = taskId ? { taskId } : {}
  if (kind === 'todo')
    return { id, kind, text, ...task, done: block.kind === 'todo' ? block.done : false }
  return { id, kind, text, ...task }
}

/** Markdown typed at the start of a plain line, and what it makes the line. */
const SHORTCUTS: [marker: string, kind: TextKind][] = [
  ['# ', 'heading'],
  ['- ', 'item'],
  ['* ', 'item'],
  ['[] ', 'todo'],
  ['[ ] ', 'todo'],
]

/**
 * "# " makes a heading, "- " or "* " a bulleted line and "[] " a to-do, as
 * Notion and Confluence take them, on a line of any kind. Only while the
 * caret is just after the marker, so a line that happens to start "- "
 * further edits stays what it is.
 */
export function markdownShortcut(
  text: string,
  caret: number,
): { kind: TextKind; marker: string } | null {
  const plain = text.replace(/\u00a0/g, ' ')
  const hit = SHORTCUTS.find(([marker]) => plain.startsWith(marker) && caret === marker.length)
  return hit ? { kind: hit[1], marker: hit[0] } : null
}

/**
 * Enter in a line. The words before the caret stay; those after it start a new
 * line below, of the same kind except that a heading is followed by a
 * paragraph. A task's Token sits at the end of a line, so it goes with the
 * words after the caret when there are any. Enter at the very start of a line
 * with words opens an empty one above it instead, and Enter in an empty
 * bulleted line or to-do ends the list: the line becomes a paragraph.
 */
export function splitBlock(
  blocks: DocBlock[],
  id: string,
  text: string,
  at: number,
  newId: string,
): { blocks: DocBlock[]; caret: Caret } {
  const index = blocks.findIndex((b) => b.id === id)
  const block = blocks[index]
  if (!isText(block)) return { blocks, caret: { id, offset: at } }
  const nextKind: TextKind = block.kind === 'heading' ? 'paragraph' : block.kind
  const blank = (): TextBlock =>
    nextKind === 'todo'
      ? { id: newId, kind: 'todo', text: '', done: false }
      : { id: newId, kind: nextKind, text: '' }

  if (text === '' && (block.kind === 'item' || block.kind === 'todo'))
    return {
      blocks: blocks.map((b) => (b.id === id ? turnInto({ ...block, text }, 'paragraph') : b)),
      caret: { id, offset: 0 },
    }

  if (at === 0 && text !== '') {
    const out = [...blocks]
    out.splice(index, 0, blank())
    return { blocks: out, caret: { id, offset: 0 } }
  }

  const [head, tail] = splitInline(text, at)
  const tailTakesTask = Boolean(block.taskId) && plainText(parseInline(tail)).trim() !== ''
  const kept: TextBlock = { ...block, text: head }
  if (tailTakesTask) delete kept.taskId
  const below: TextBlock = { ...blank(), text: tail }
  if (tailTakesTask) below.taskId = block.taskId
  const out = [...blocks]
  out.splice(index, 1, kept, below)
  return { blocks: out, caret: { id: newId, offset: 0 } }
}

/** The text block nearest `id` in a direction, skipping live cards. */
export function neighbourText(
  blocks: DocBlock[],
  id: string,
  direction: -1 | 1,
): TextBlock | undefined {
  const index = blocks.findIndex((b) => b.id === id)
  for (let i = index + direction; i >= 0 && i < blocks.length; i += direction) {
    const block = blocks[i]
    if (isText(block)) return block
  }
  return undefined
}

/**
 * Backspace at the start of a line. A heading, bulleted line or to-do first
 * becomes a paragraph, as in Notion; a paragraph joins the line above, the
 * caret where the two meet. Two lines that each end in a task's Token cannot
 * be one line, so the caret just moves up. Above a live card an empty line
 * goes and anything else stays, so a Task list is never deleted by a
 * Backspace (it has its own remove). `joined` names the line that went, and
 * the one it went into, so its comments can follow.
 */
export function joinBack(
  blocks: DocBlock[],
  id: string,
  text: string,
): { blocks: DocBlock[]; caret?: Caret; joined?: { from: string; into: string } } | null {
  const index = blocks.findIndex((b) => b.id === id)
  const block = blocks[index]
  if (!isText(block)) return null
  if (block.kind !== 'paragraph')
    return {
      blocks: blocks.map((b) => (b.id === id ? turnInto({ ...block, text }, 'paragraph') : b)),
      caret: { id, offset: 0 },
    }
  const above = blocks[index - 1]
  if (!above) return null
  if (!isText(above)) {
    if (text !== '') return null
    const up = neighbourText(blocks, id, -1) ?? neighbourText(blocks, id, 1)
    return {
      blocks: blocks.filter((b) => b.id !== id),
      caret: up ? { id: up.id, offset: readText(up).length } : undefined,
    }
  }
  const aboveText = readLine(above)
  const meet = inlineLength(aboveText)
  if (above.taskId && block.taskId) return { blocks, caret: { id: above.id, offset: meet } }
  const taskId = above.taskId ?? block.taskId
  const into: TextBlock = {
    ...above,
    text: joinInline(aboveText, text),
    ...(taskId ? { taskId } : {}),
  }
  return {
    blocks: blocks.flatMap((b) => (b.id === id ? [] : b.id === above.id ? [into] : [b])),
    caret: { id: above.id, offset: meet },
    joined: { from: id, into: above.id },
  }
}

/** Delete at the end of a line: the line below joins this one, as Backspace would from there. */
export function joinForward(
  blocks: DocBlock[],
  id: string,
  text: string,
): ReturnType<typeof joinBack> {
  const index = blocks.findIndex((b) => b.id === id)
  const below = blocks[index + 1]
  if (!isText(below)) return null
  const withText = blocks.map((b) => (b.id === id && isText(b) ? { ...b, text } : b))
  // Joining the next line to this one is the next line's Backspace, whatever its kind.
  const plain =
    below.kind === 'paragraph'
      ? withText
      : withText.map((b) => (b.id === below.id ? turnInto(below, 'paragraph') : b))
  return joinBack(plain, below.id, readLine(below))
}

/** A block one place up or down; the same blocks when it is already at that end. */
export function moveBlock(blocks: DocBlock[], id: string, by: -1 | 1): DocBlock[] {
  const index = blocks.findIndex((b) => b.id === id)
  const to = index + by
  if (index < 0 || to < 0 || to >= blocks.length) return blocks
  const out = [...blocks]
  const [block] = out.splice(index, 1)
  out.splice(to, 0, block)
  return out
}

/**
 * Pasted text with line breaks: the first line goes in at the caret, each
 * line after it is a paragraph of its own (or whatever its Markdown says),
 * and what followed the caret ends the last one.
 */
export function pasteLines(
  blocks: DocBlock[],
  id: string,
  text: string,
  at: number,
  pasted: string,
  makeId: () => string,
): { blocks: DocBlock[]; caret: Caret } {
  const index = blocks.findIndex((b) => b.id === id)
  const block = blocks[index]
  const lines = pasted.replace(/\r\n?/g, '\n').split('\n')
  const runs = parseInline(text)
  if (!isText(block) || lines.length < 2) {
    const next = serializeInline(insertPlain(runs, at, pasted))
    return {
      blocks: blocks.map((b) => (b.id === id && isText(b) ? { ...b, text: next } : b)),
      caret: { id, offset: at + pasted.length },
    }
  }
  const tail = sliceRuns(runs, at)
  const first: TextBlock = {
    ...block,
    text: serializeInline([...sliceRuns(runs, 0, at), { text: lines[0] }]),
  }
  const rest = lines.slice(1).map((line, i, all): TextBlock => {
    const marker = SHORTCUTS.find(([m]) => line.startsWith(m))
    const words = marker ? line.slice(marker[0].length) : line
    const text = serializeInline([{ text: words }, ...(i === all.length - 1 ? tail : [])])
    return turnInto({ id: makeId(), kind: 'paragraph', text }, marker?.[1] ?? 'paragraph')
  })
  const end = rest[rest.length - 1]
  const out = [...blocks]
  out.splice(index, 1, first, ...rest)
  return {
    blocks: out,
    caret: { id: end.id, offset: inlineLength(end.text) - plainText(tail).length },
  }
}
