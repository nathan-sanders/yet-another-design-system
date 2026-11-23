import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  ArrowDown,
  ArrowUp,
  CircleDot,
  Copy,
  Ellipsis,
  Flag,
  Heading2,
  List,
  ListChecks,
  ListTodo,
  MessageCircle,
  MessageSquare,
  Pencil,
  Pilcrow,
  Plus,
  AtSign,
  Trash2,
  Unlink,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Checkbox } from '../../../../src/components/Checkbox'
import { DragAndDrop, DragHandle, reorder, Sortable } from '../../../../src/components/DragAndDrop'
import { Heading, Text } from '../../../../src/components/Text'
import { Icon } from '../../../../src/components/Icon'
import { Input } from '../../../../src/components/Input'
import { Link } from '../../../../src/components/Link'
import { Menu } from '../../../../src/components/Menu'
import { popup } from '../../../../src/components/Menu/styles'
import { cn } from '../../../../src/lib/cn'
import { statusFor } from '../../components/taskMeta'
import type { DocBlock } from '../../data/docs'
import type { Person } from '../../data/people'
import type { Project, Task } from '../../data/types'
import { taskKey } from '../project/paths'
import { caretLine, caretRange, caretRect, placeCaret } from './caret'
import { SelectionToolbar, StatusBlock, TaskListBlock, TaskToken } from './DocBlocks'
import {
  domIsCanonical,
  hasMark,
  inlineShortcut,
  isInternal,
  linkAround,
  normalizeHref,
  parseInline,
  plainText,
  runsFromDom,
  runsToNodes,
  serializeInline,
  setLink,
  sliceRuns,
  toggleMark,
  type Mark,
  type Run,
} from './richText'
import {
  isText,
  joinBack,
  joinForward,
  markdownShortcut,
  moveBlock,
  neighbourText,
  newBlockId,
  pasteLines,
  readLine,
  readText,
  splitBlock,
  turnInto,
  type Caret,
  type TextBlock,
  type TextKind,
} from './model'

/** The line kinds, as the slash menu and Turn into name them. */
const KINDS: { kind: TextKind; label: string; description: string; icon: LucideIcon }[] = [
  { kind: 'paragraph', label: 'Text', description: 'A plain line', icon: Pilcrow },
  { kind: 'heading', label: 'Heading', description: 'A section title · #', icon: Heading2 },
  { kind: 'item', label: 'Bulleted list', description: 'A simple list · -', icon: List },
  { kind: 'todo', label: 'To-do list', description: 'Lines to tick off · []', icon: ListChecks },
]

type Command =
  { run: 'turn'; kind: TextKind } | { run: 'linked-task' | 'task-list' | 'status' | 'yak-draft' }

interface Option {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  group: string
  action: Command | { run: 'link'; task: Task }
}

/** "Add to this doc", from `Docs - Slash menu` (`40006309:39451`), after the line kinds. */
const COMMANDS: Option[] = [
  ...KINDS.map((k): Option => ({
    id: k.kind,
    label: k.label,
    description: k.description,
    icon: k.icon,
    group: 'Turn into',
    action: { run: 'turn', kind: k.kind },
  })),
  {
    id: 'linked-task',
    label: 'Linked task',
    description: 'Stays in sync with the project',
    icon: CircleDot,
    group: 'Add to this doc',
    action: { run: 'linked-task' },
  },
  {
    id: 'task-list',
    label: 'Task list',
    description: 'Show a filtered list of tasks',
    icon: ListTodo,
    group: 'Add to this doc',
    action: { run: 'task-list' },
  },
  {
    id: 'status',
    label: 'Project status',
    description: 'Latest health and update',
    icon: Flag,
    group: 'Add to this doc',
    action: { run: 'status' },
  },
  {
    id: 'yak-draft',
    label: 'Ask Yak to draft',
    description: 'Write from what’s on this project',
    icon: MessageCircle,
    group: 'Add to this doc',
    action: { run: 'yak-draft' },
  },
]

/** A command matches when a word of its name starts with what follows the slash (FINDINGS 100). */
function matches(option: Option, query: string): boolean {
  const q = query.trim().toLowerCase()
  return (
    q === '' ||
    option.label
      .toLowerCase()
      .split(' ')
      .some((w) => w.startsWith(q))
  )
}

/**
 * The slash menu, open on one line. `start` is where the slash is (or, once
 * Linked task is picked, where the search begins), `query` what is typed
 * after it, and `top`/`left` where the caret was, from the line's own box.
 */
interface SlashMenu {
  blockId: string
  mode: 'commands' | 'link'
  start: number
  query: string
  active: number
  top: number
  left: number
}

/** A selection of words in one line, which puts Create task, Ask Yak and Comment under it. */
interface Selected {
  blockId: string
  words: string
  start: number
  end: number
  top: number
  left: number
}

/** A link being written or changed, over the words it is for (⌘K). */
interface Linking {
  blockId: string
  start: number
  end: number
  href: string
  top: number
  left: number
}

/** The caret in a link: its address, and ways to change or remove it, under the line. */
type LinkAt = Linking

/** Whether a saved line has no words in it. */
const blank = (md: string) => plainText(parseInline(md)).trim() === ''

/** A line's formatted words with the characters between two counts taken out. */
const cut = (runs: Run[], start: number, end: number) =>
  serializeInline([...sliceRuns(runs, 0, start), ...sliceRuns(runs, end)])

/** A line redrawn from its runs, with the caret put back where it was. */
function redraw(el: HTMLElement, runs: Run[], caret: number) {
  el.replaceChildren(...runsToNodes(runs))
  placeCaret(el, caret)
}

/** Where a box goes under the caret or the selection, inside the block it belongs to. */
function under(el: HTMLElement, width: number) {
  const box = el.closest('[data-block]')!.getBoundingClientRect()
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null
  const rect = range && !range.collapsed ? range.getBoundingClientRect() : caretRect(el)
  return {
    top: Math.round(rect.bottom - box.top + 4),
    left: Math.round(Math.max(0, Math.min(rect.left - box.left, box.width - width))),
  }
}

/** What a block is called by its grip and its menu: "Move Opening checklist". */
function blockLabel(block: DocBlock): string {
  if (block.kind === 'tasks') return 'Task list'
  if (block.kind === 'status') return 'Project status'
  const words = readText(block).trim()
  const name = KINDS.find((k) => k.kind === block.kind)!.label
  if (!words) return `Empty ${name.toLowerCase()} line`
  return words.length > 40 ? `${words.slice(0, 38).trimEnd()}…` : words
}

export interface DocEditorProps {
  blocks: DocBlock[]
  project: Project
  tasks: Task[]
  /** Tasks Linked task can offer: the project's, not yet linked. */
  linkable: Task[]
  /** Any change to the blocks; the doc saves as you type, with no Save or Publish. */
  edit: (update: (blocks: DocBlock[]) => DocBlock[]) => void
  onLinkTask: (taskId: string) => void
  /** A line joined into the one above it; its comments follow. */
  onJoined: (from: string, into: string) => void
  /** A block taken out by its menu or a live card's cross, with an Undo. */
  onRemove: (blockId: string) => void
  onYakDraft: (afterId: string) => void
  onCreateTask: (blockId: string, words: string) => void
  onAskYak: (blockId: string) => void
  onComment: (blockId: string, words?: string) => void
  /** Blocks Yak or a comment is pointing at, filled. */
  highlighted: Set<string>
  /** Open comment counts, by block. */
  threads: Map<string, { id: string; count: number }>
  onOpenThread: (threadId: string) => void
  /** Someone else in the doc, on a line, as the top bar's avatars say. */
  presence?: { blockId: string; person: Person }
  /** What goes under a block: Yak's suggestion for it. */
  after: (block: DocBlock) => ReactNode
  /** Set to a function that puts the caret in the first line, for the title's Enter. */
  startRef: RefObject<(() => void) | null>
}

/**
 * The doc as a page editor, in the way of Notion and Confluence's live docs:
 * every line is typed in place and saved as it is typed, and the lines are
 * blocks. Enter breaks a line at the caret, Backspace at the start of one
 * joins it to the line above, the arrows walk from line to line, and Markdown
 * at the start of a line ("# ", "- ", "[] ") changes its kind. A slash on any
 * line opens the slash menu there — the line kinds, then the file's Linked
 * task, Task list, Project status and Ask Yak to draft. Each block has a grip
 * to drag it by and a menu to turn it into another kind, move, duplicate or
 * delete it; ⌘⇧↑ and ⌘⇧↓ move it from the keyboard. Selecting words puts
 * Create task, Ask Yak and Comment under them.
 *
 * Each line is `contenteditable="plaintext-only"`. React renders no children
 * into it: what you type is saved as you type it, so the saved words and the
 * element's words agree and nothing is written back; an edit that changes a
 * line from outside (a break, a join, a restore) writes the new words in,
 * and the editor then puts the caret where the edit says.
 */
export function DocEditor(props: DocEditorProps) {
  const { blocks, edit } = props
  const elements = useRef(new Map<string, HTMLElement>())
  const pending = useRef<Caret | null>(null)
  const [menu, setMenu] = useState<SlashMenu | null>(null)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [linking, setLinking] = useState<Linking | null>(null)
  const [linkAt, setLinkAt] = useState<LinkAt | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const linkBarRef = useRef<HTMLDivElement>(null)
  // Where a typed **closing** left off, so the next words are plain again.
  const closedAt = useRef<{ id: string; at: number; mark: Mark } | null>(null)
  const menuId = useId()

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) elements.current.set(id, el)
    else elements.current.delete(id)
  }, [])

  // After every edit, the caret goes where the edit said, once its line exists.
  useLayoutEffect(() => {
    const want = pending.current
    if (!want) return
    const el = elements.current.get(want.id)
    if (!el) return
    pending.current = null
    placeCaret(el, want.offset, want.end)
  })

  const apply = (next: DocBlock[], caret?: Caret) => {
    pending.current = caret ?? null
    if (next !== blocks) edit(() => next)
    else if (caret) {
      const el = elements.current.get(caret.id)
      if (el) placeCaret(el, caret.offset, caret.end)
      pending.current = null
    }
  }

  const focusBlock = (id: string, offset: number | 'end') => {
    const el = elements.current.get(id)
    if (el) placeCaret(el, offset)
  }

  /** The first line, or a new one when the doc starts with a card or has nothing. */
  props.startRef.current = () => {
    const first = blocks[0]
    if (isText(first)) return focusBlock(first.id, 0)
    const id = newBlockId()
    apply([{ id, kind: 'paragraph', text: '' }, ...blocks], { id, offset: 0 })
  }

  /** A click in the space under the doc writes on: in its last line if that is empty, or a new one. */
  const writeAtEnd = () => {
    const last = blocks[blocks.length - 1]
    if (last?.kind === 'paragraph' && readText(last) === '') return focusBlock(last.id, 0)
    const id = newBlockId()
    apply([...blocks, { id, kind: 'paragraph', text: '' }], { id, offset: 0 })
  }

  // Words selected inside one line put the selection bar under them; the
  // caret in a link puts the link bar under it.
  useEffect(() => {
    const onChange = () => {
      const active = document.activeElement
      if (toolbarRef.current?.contains(active) || linkBarRef.current?.contains(active)) return
      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      const lineOf = (node: Node) =>
        (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>(
          '[data-editable]',
        )
      const line = range ? lineOf(range.startContainer) : null
      const at = line ? caretRange(line) : null
      if (!range || !line || !at || line !== lineOf(range.endContainer)) {
        setSelected(null)
        setLinkAt(null)
        return
      }
      const id = line.dataset.editable!
      if (range.collapsed) {
        setSelected(null)
        const link = linkAround(runsFromDom(line), at.start)
        if (!link || active !== line) return setLinkAt(null)
        const next = { blockId: id, ...link, ...under(line, 320) }
        setLinkAt((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next))
        return
      }
      setLinkAt(null)
      const words = selection!.toString().trim()
      if (!words) return setSelected(null)
      const next: Selected = { blockId: id, words, ...at, ...under(line, 400) }
      setSelected((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next))
    }
    document.addEventListener('selectionchange', onChange)
    return () => document.removeEventListener('selectionchange', onChange)
  }, [])

  // ---- Bold, italic and links

  /** ⌘B or ⌘I on the selected words, which stay selected. */
  const format = (id: string, mark: Mark, range: { start: number; end: number }) => {
    const el = elements.current.get(id)
    if (!el || range.start === range.end) return
    const next = serializeInline(toggleMark(runsFromDom(el), range.start, range.end, mark))
    apply(
      setLine(id, (b) => ({ ...b, text: next })),
      { id, offset: range.start, end: range.end },
    )
  }

  /**
   * ⌘K: the link editor over the selected words, or over the whole link the
   * caret is in. With neither, there is nothing to link.
   */
  const openLinkEditor = (id: string, given?: { start: number; end: number }) => {
    const el = elements.current.get(id)
    const range = given ?? (el ? caretRange(el) : null)
    if (!el || !range) return
    const runs = runsFromDom(el)
    const around = linkAround(runs, range.start)
    const span =
      range.start === range.end ? (around ? { start: around.start, end: around.end } : null) : range
    if (!span) return
    const href = hasMark(runs, span.start, span.end, 'href') ? (around?.href ?? '') : ''
    setSelected(null)
    setLinkAt(null)
    setLinking({ blockId: id, ...span, href, ...under(el, 360) })
  }

  /** A link put on (or, with no address, taken off) a stretch of a line. */
  const linkWords = (id: string, start: number, end: number, href?: string) => {
    const el = elements.current.get(id)
    if (!el) return
    const next = serializeInline(setLink(runsFromDom(el), start, end, href))
    setLinking(null)
    setLinkAt(null)
    apply(
      setLine(id, (b) => ({ ...b, text: next })),
      { id, offset: end },
    )
  }

  const closeLinkEditor = () => {
    const open = linking
    setLinking(null)
    const el = open ? elements.current.get(open.blockId) : undefined
    if (el && open) placeCaret(el, open.start, open.end)
  }

  // ---- The slash menu

  const options: Option[] = !menu
    ? []
    : menu.mode === 'commands'
      ? COMMANDS.filter((o) => matches(o, menu.query))
      : props.linkable
          .filter((t) => t.title.toLowerCase().includes(menu.query.trim().toLowerCase()))
          .slice(0, 6)
          .map((task) => ({
            id: task.id,
            label: task.title,
            description: taskKey(task),
            icon: statusFor(task.status).icon,
            group: 'Link a task',
            action: { run: 'link' as const, task },
          }))

  const menuAt = (el: HTMLElement, blockId: string, start: number, mode: SlashMenu['mode']) => {
    const box = el.closest('[data-block]')!.getBoundingClientRect()
    const rect = caretRect(el)
    return {
      blockId,
      mode,
      start,
      query: '',
      active: 0,
      top: Math.round(rect.bottom - box.top + 4),
      left: Math.round(Math.max(0, Math.min(rect.left - box.left, box.width - 300))),
    }
  }

  /** A line's words with the slash and what was typed after it taken out, formatting kept. */
  const withoutSlash = (el: HTMLElement, open: SlashMenu) => {
    const caret = caretRange(el)?.start ?? (el.textContent ?? '').length
    return cut(runsFromDom(el), open.start, Math.max(caret, open.start))
  }

  const setLine = (id: string, update: (block: TextBlock) => TextBlock) =>
    blocks.map((b) => (b.id === id && isText(b) ? update(b) : b))

  const pick = (option: Option) => {
    if (!menu) return
    const el = elements.current.get(menu.blockId)
    const block = blocks.find((b) => b.id === menu.blockId)
    if (!el || !isText(block)) return setMenu(null)
    const rest = withoutSlash(el, menu)
    const at = { id: block.id, offset: menu.start }
    const action = option.action
    setMenu(null)

    if (action.run === 'turn')
      return apply(
        setLine(block.id, (b) => turnInto({ ...b, text: rest }, action.kind)),
        at,
      )

    if (action.run === 'linked-task') {
      apply(
        setLine(block.id, (b) => ({ ...b, text: rest })),
        at,
      )
      // The line becomes a search of the project's tasks, from where the slash was.
      setMenu({ ...menu, mode: 'link', query: '', active: 0 })
      return
    }

    if (action.run === 'yak-draft') {
      apply(
        setLine(block.id, (b) => ({ ...b, text: rest })),
        at,
      )
      props.onYakDraft(block.id)
      return
    }

    if (action.run === 'link') {
      const task = action.task
      props.onLinkTask(task.id)
      if (block.taskId) {
        // A line ends in one Token; a second task gets a line of its own below.
        const id = newBlockId()
        const out = setLine(block.id, (b) => ({ ...b, text: rest }))
        out.splice(out.indexOf(out.find((b) => b.id === block.id)!) + 1, 0, {
          id,
          kind: 'item',
          text: '',
          taskId: task.id,
        })
        return apply(out, at)
      }
      return apply(
        setLine(block.id, (b) =>
          blank(rest) && b.kind === 'paragraph'
            ? { id: b.id, kind: 'item', text: '', taskId: task.id }
            : { ...b, text: rest, taskId: task.id },
        ),
        at,
      )
    }

    // Task list and Project status: a live card, in place of an empty line or
    // under one with words, and a line after it to go on writing in.
    const card: DocBlock = {
      id: newBlockId(),
      kind: action.run === 'task-list' ? 'tasks' : 'status',
    }
    const index = blocks.indexOf(block)
    const out = [...blocks]
    if (blank(rest)) out.splice(index, 1, card)
    else out.splice(index, 1, { ...block, text: rest }, card)
    const cardAt = out.indexOf(card)
    let next = out[cardAt + 1]
    if (!(next?.kind === 'paragraph' && readText(next) === '')) {
      next = { id: newBlockId(), kind: 'paragraph', text: '' }
      out.splice(cardAt + 1, 0, next)
    }
    apply(out, { id: next.id, offset: 0 })
  }

  // ---- Typing

  const onInput = (block: TextBlock) => (event: FormEvent<HTMLElement>) => {
    const el = event.currentTarget
    const text = el.textContent ?? ''
    // An emptied line can keep a stray <br>, which stops `:empty` showing its placeholder.
    if (text === '' && el.childNodes.length) el.replaceChildren()
    const caret = caretRange(el)?.start ?? text.length
    const typed = (event.nativeEvent as InputEvent).data
    let runs = runsFromDom(el)

    // On any line, as in Notion: "[] " in a bulleted line makes it a to-do.
    const shortcut = menu ? null : markdownShortcut(text, caret)
    if (shortcut && shortcut.kind !== block.kind) {
      const words = serializeInline(sliceRuns(runs, shortcut.marker.length))
      return apply(
        setLine(block.id, (b) => turnInto({ ...b, text: words }, shortcut.kind)),
        { id: block.id, offset: 0 },
      )
    }

    // Typing just after a link writes plain words, as Notion does: the browser
    // would otherwise carry the link on over them.
    const was = typed ? linkAround(parseInline(readLine(block)), caret - typed.length) : null
    const closed = typed === '*' && !menu ? inlineShortcut(runs, caret) : null
    const after = closedAt.current
    closedAt.current = null
    if (closed) {
      // **words** and *words*, closed: the stars go and the words take the mark.
      runs = closed.runs
      redraw(el, runs, closed.caret)
      closedAt.current = { id: block.id, at: closed.caret, mark: closed.mark }
    } else if (
      typed &&
      after?.id === block.id &&
      after.at === caret - typed.length &&
      hasMark(runs, after.at, caret, after.mark)
    ) {
      // The caret sits at the end of the words just marked, and the browser
      // would carry the mark on; what is typed next is plain, as in Notion.
      runs = toggleMark(runs, after.at, caret, after.mark)
      redraw(el, runs, caret)
    } else if (
      typed &&
      was &&
      was.end === caret - typed.length &&
      hasMark(runs, caret - typed.length, caret, 'href')
    ) {
      runs = setLink(runs, caret - typed.length, caret)
      redraw(el, runs, caret)
    } else if (!domIsCanonical(el, runs)) {
      // Whatever else the browser left — a styled <span> after a deletion
      // across marks, an <u> — is drawn again from what it means.
      redraw(el, runs, caret)
    }

    const md = serializeInline(runs)
    edit((all) => all.map((b) => (b.id === block.id && isText(b) ? { ...b, text: md } : b)))

    if (!menu || menu.blockId !== block.id) {
      if (typed === '/' && (caret === 1 || /\s/.test(text[caret - 2] ?? ' ')))
        setMenu(menuAt(el, block.id, caret - 1, 'commands'))
      return
    }
    const from = menu.mode === 'commands' ? menu.start + 1 : menu.start
    if (caret < from || (menu.mode === 'commands' && text[menu.start] !== '/')) return setMenu(null)
    const query = text.slice(from, caret)
    if (menu.mode === 'commands' && !COMMANDS.some((o) => matches(o, query))) return setMenu(null)
    setMenu({ ...menu, query, active: 0 })
  }

  /**
   * A paste is always taken as plain words, so nothing styled comes in from
   * another page. An address pasted over selected words links them; lines
   * become blocks.
   */
  const onPaste = (block: TextBlock) => (event: ClipboardEvent<HTMLElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text/plain')
    const el = event.currentTarget
    const text = el.textContent ?? ''
    const range = caretRange(el) ?? { start: text.length, end: text.length }
    const runs = runsFromDom(el)
    const address = /^(https?:\/\/|mailto:)\S+$/i.test(pasted.trim()) ? pasted.trim() : null
    if (address && range.start !== range.end)
      return linkWords(block.id, range.start, range.end, address)
    const without = cut(runs, range.start, range.end)
    const result = pasteLines(blocks, block.id, without, range.start, pasted, newBlockId)
    apply(result.blocks, result.caret)
  }

  const move = (id: string, by: -1 | 1) => {
    const next = moveBlock(blocks, id, by)
    const el = elements.current.get(id)
    const offset = el ? (caretRange(el)?.start ?? 0) : 0
    apply(next, isText(blocks.find((b) => b.id === id)) ? { id, offset } : undefined)
  }

  const onKeyDown = (block: TextBlock) => (event: KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing) return
    const el = event.currentTarget
    const text = el.textContent ?? ''
    const range = caretRange(el) ?? { start: text.length, end: text.length }
    const collapsed = range.start === range.end

    const mod = (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
    const letter = event.key.toLowerCase()
    if (mod && (letter === 'b' || letter === 'i')) {
      event.preventDefault()
      return format(block.id, letter === 'b' ? 'bold' : 'italic', range)
    }
    if (mod && letter === 'k') {
      event.preventDefault()
      return openLinkEditor(block.id, range)
    }
    // No underline here: the browser's own would come and go on the next keystroke.
    if (mod && letter === 'u') return event.preventDefault()

    if (menu?.blockId === block.id) {
      const n = options.length
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (n)
          setMenu({ ...menu, active: (menu.active + (event.key === 'ArrowDown' ? 1 : -1) + n) % n })
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        if (options[menu.active]) pick(options[menu.active])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenu(null)
        return
      }
    }

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && /^Arrow(Up|Down)$/.test(event.key)) {
      event.preventDefault()
      return move(block.id, event.key === 'ArrowUp' ? -1 : 1)
    }

    switch (event.key) {
      case 'Enter': {
        event.preventDefault()
        if (event.shiftKey) return
        const words = cut(runsFromDom(el), range.start, range.end)
        const result = splitBlock(blocks, block.id, words, range.start, newBlockId())
        return apply(result.blocks, result.caret)
      }
      case 'Backspace': {
        if (!collapsed || range.start !== 0) return
        const result = joinBack(blocks, block.id, serializeInline(runsFromDom(el)))
        if (!result) return
        event.preventDefault()
        if (result.joined) props.onJoined(result.joined.from, result.joined.into)
        return apply(result.blocks, result.caret)
      }
      case 'Delete': {
        if (!collapsed || range.start !== text.length) return
        const result = joinForward(blocks, block.id, serializeInline(runsFromDom(el)))
        if (!result) return
        event.preventDefault()
        if (result.joined) props.onJoined(result.joined.from, result.joined.into)
        return apply(result.blocks, { id: block.id, offset: text.length })
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        if (event.shiftKey || event.altKey || event.metaKey) return
        const leaving =
          event.key === 'ArrowUp' ? caretLine(el).first : collapsed && range.start === 0
        const up = leaving ? neighbourText(blocks, block.id, -1) : undefined
        if (!up) return
        event.preventDefault()
        return focusBlock(up.id, 'end')
      }
      case 'ArrowDown':
      case 'ArrowRight': {
        if (event.shiftKey || event.altKey || event.metaKey) return
        const leaving =
          event.key === 'ArrowDown' ? caretLine(el).last : collapsed && range.start === text.length
        const down = leaving ? neighbourText(blocks, block.id, 1) : undefined
        if (!down) return
        event.preventDefault()
        return focusBlock(down.id, 0)
      }
      case 'Escape':
        el.blur()
    }
  }

  // ---- The block menu

  const duplicate = (block: DocBlock) => {
    const copy = { ...block, id: newBlockId() }
    const out = [...blocks]
    out.splice(blocks.indexOf(block) + 1, 0, copy)
    apply(out, isText(copy) ? { id: copy.id, offset: readText(copy).length } : undefined)
  }

  const insertBelow = (block: DocBlock) => {
    const id = newBlockId()
    const out = [...blocks]
    out.splice(blocks.indexOf(block) + 1, 0, { id, kind: 'paragraph', text: '' })
    apply(out, { id, offset: 0 })
  }

  const onDragEnd = ({
    active,
    over,
  }: {
    active: { id: unknown }
    over: { id: unknown } | null
  }) => {
    if (!over || active.id === over.id) return
    const from = blocks.findIndex((b) => b.id === active.id)
    const to = blocks.findIndex((b) => b.id === over.id)
    apply(reorder(blocks, from, to))
  }

  /** The selection bar's Bold, Italic and Link, pressed when every selected word has it. */
  const formatState = (sel: Selected) => {
    const el = elements.current.get(sel.blockId)
    const runs = el ? runsFromDom(el) : []
    const range = { start: sel.start, end: sel.end }
    return {
      bold: hasMark(runs, sel.start, sel.end, 'bold'),
      italic: hasMark(runs, sel.start, sel.end, 'italic'),
      link: hasMark(runs, sel.start, sel.end, 'href'),
      onBold: () => format(sel.blockId, 'bold', range),
      onItalic: () => format(sel.blockId, 'italic', range),
      onLink: () => openLinkEditor(sel.blockId, range),
    }
  }

  const lone = blocks.length === 1 && isText(blocks[0]) && readText(blocks[0]) === ''

  return (
    <>
      <DragAndDrop onDragEnd={onDragEnd}>
        <Sortable
          id="doc-blocks"
          label="This doc"
          items={blocks.map((b) => b.id)}
          className="flex flex-col gap-3"
        >
          {blocks.map((block, i) => {
            const label = blockLabel(block)
            const thread = props.threads.get(block.id)
            const here = props.presence?.blockId === block.id ? props.presence.person : undefined
            const filled = props.highlighted.has(block.id)
            return (
              <Sortable.Item
                key={block.id}
                id={block.id}
                label={label}
                className="flex flex-col gap-3"
              >
                <div data-block={block.id} className="group/block relative">
                  {/* The gutter, in the 56 the article keeps to the left of the words. */}
                  <div
                    className={cn(
                      'absolute top-0 -left-14 flex w-13 justify-end gap-0.5 opacity-0 transition-opacity duration-fast ease-standard max-md:hidden',
                      'group-hover/block:opacity-100 group-focus-within/block:opacity-100 has-[[aria-expanded=true]]:opacity-100 has-[[aria-pressed=true]]:opacity-100',
                    )}
                  >
                    <Menu>
                      <Menu.Trigger
                        render={
                          <Button
                            appearance="ghost"
                            size="small"
                            startIcon={Ellipsis}
                            aria-label={`Options for ${label}`}
                          />
                        }
                      />
                      <Menu.Popup
                        align="start"
                        aria-label={`Options for ${label}`}
                        // React carries a press in the portalled menu up to the
                        // block, whose press starts a drag; it stops here.
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        {isText(block) ? (
                          <Menu.Group>
                            <Menu.Submenu
                              label="Turn into"
                              startIcon={KINDS.find((k) => k.kind === block.kind)!.icon}
                            >
                              <Menu.Group>
                                <Menu.RadioGroup
                                  value={block.kind}
                                  onValueChange={(kind: TextKind) =>
                                    apply(
                                      setLine(block.id, (b) =>
                                        turnInto({ ...b, text: readLine(b) }, kind),
                                      ),
                                      { id: block.id, offset: readText(block).length },
                                    )
                                  }
                                >
                                  {KINDS.map((k) => (
                                    <Menu.RadioItem key={k.kind} value={k.kind}>
                                      {k.label}
                                    </Menu.RadioItem>
                                  ))}
                                </Menu.RadioGroup>
                              </Menu.Group>
                            </Menu.Submenu>
                            <Menu.Item
                              startIcon={Plus}
                              onClick={() => props.onCreateTask(block.id, readText(block))}
                            >
                              Create task
                            </Menu.Item>
                            <Menu.Item
                              startIcon={MessageCircle}
                              onClick={() => props.onAskYak(block.id)}
                            >
                              Ask Yak
                            </Menu.Item>
                            <Menu.Item startIcon={AtSign} onClick={() => props.onComment(block.id)}>
                              Comment
                            </Menu.Item>
                          </Menu.Group>
                        ) : null}
                        <Menu.Group>
                          <Menu.Item startIcon={Plus} onClick={() => insertBelow(block)}>
                            Add a line below
                          </Menu.Item>
                          <Menu.Item startIcon={Copy} onClick={() => duplicate(block)}>
                            Duplicate
                          </Menu.Item>
                          <Menu.Item
                            startIcon={ArrowUp}
                            disabled={i === 0}
                            onClick={() => move(block.id, -1)}
                          >
                            Move up
                          </Menu.Item>
                          <Menu.Item
                            startIcon={ArrowDown}
                            disabled={i === blocks.length - 1}
                            onClick={() => move(block.id, 1)}
                          >
                            Move down
                          </Menu.Item>
                        </Menu.Group>
                        <Menu.Group>
                          <Menu.Item
                            startIcon={Trash2}
                            destructive
                            onClick={() => props.onRemove(block.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Group>
                      </Menu.Popup>
                    </Menu>
                    <DragHandle size="small" />
                  </div>

                  {here ? (
                    // Someone else's caret on this line: a bar in their color and their face.
                    <span
                      aria-hidden
                      className="absolute -top-0.5 -bottom-0.5 -left-1.5 w-0.5 rounded-full bg-decorative-indigo-foreground"
                    />
                  ) : null}

                  <div
                    data-drag-ignore
                    className={cn(filled && '-m-1 rounded-sm bg-surface-background-subtle p-1')}
                  >
                    {isText(block) ? (
                      <LineContent
                        block={block}
                        tasks={props.tasks}
                        register={register}
                        placeholder={
                          lone ? 'Start writing, or type / for blocks and tasks' : undefined
                        }
                        menuOpen={menu?.blockId === block.id}
                        menuId={menuId}
                        activeId={
                          menu?.blockId === block.id && options[menu.active]
                            ? `${menuId}-${menu.active}`
                            : undefined
                        }
                        onInput={onInput(block)}
                        onKeyDown={onKeyDown(block)}
                        onPaste={onPaste(block)}
                        onBlur={() => setMenu((m) => (m?.blockId === block.id ? null : m))}
                        onToggle={(done) =>
                          apply(setLine(block.id, (b) => (b.kind === 'todo' ? { ...b, done } : b)))
                        }
                      />
                    ) : block.kind === 'tasks' ? (
                      <TaskListBlock
                        project={props.project}
                        tasks={props.tasks}
                        onRemove={() => props.onRemove(block.id)}
                      />
                    ) : (
                      <StatusBlock
                        project={props.project}
                        onRemove={() => props.onRemove(block.id)}
                      />
                    )}
                  </div>

                  {here ? (
                    <Avatar
                      name={here.name}
                      src={here.avatar}
                      alt=""
                      size="x-small"
                      className="absolute top-0 right-0 max-md:hidden"
                      title={`${here.name} is editing here`}
                    />
                  ) : null}

                  {thread ? (
                    // In the 32 between the doc and the side column, like a margin note.
                    <Button
                      appearance="ghost"
                      size="small"
                      startIcon={MessageSquare}
                      aria-label={`${thread.count} ${thread.count === 1 ? 'comment' : 'comments'} on this`}
                      onClick={() => props.onOpenThread(thread.id)}
                      data-drag-ignore
                      className="absolute top-0 -right-8 max-lg:hidden"
                    >
                      {String(thread.count)}
                    </Button>
                  ) : null}

                  {menu?.blockId === block.id ? (
                    <SlashList
                      id={menuId}
                      menu={menu}
                      options={options}
                      onHover={(active) => setMenu({ ...menu, active })}
                      onPick={pick}
                    />
                  ) : null}

                  {selected?.blockId === block.id && !menu && !linking ? (
                    <div
                      ref={toolbarRef}
                      data-drag-ignore
                      className="absolute z-20"
                      style={{ top: selected.top, left: selected.left }}
                    >
                      <SelectionToolbar
                        format={formatState(selected)}
                        onCreateTask={() => props.onCreateTask(block.id, selected.words)}
                        onAskYak={() => props.onAskYak(block.id)}
                        onComment={() => props.onComment(block.id, selected.words)}
                      />
                    </div>
                  ) : null}

                  {linking?.blockId === block.id ? (
                    <LinkEditor
                      linking={linking}
                      onApply={(href) => linkWords(block.id, linking.start, linking.end, href)}
                      onRemove={() => linkWords(block.id, linking.start, linking.end)}
                      onCancel={closeLinkEditor}
                    />
                  ) : null}

                  {linkAt?.blockId === block.id && !linking && !menu ? (
                    <div
                      ref={linkBarRef}
                      data-drag-ignore
                      role="group"
                      aria-label="Link"
                      className={cn(
                        popup(),
                        'absolute z-20 max-w-80 flex-row items-center gap-1 py-1 pr-1 pl-3',
                      )}
                      style={{ top: linkAt.top, left: linkAt.left }}
                    >
                      <Link
                        href={linkAt.href}
                        external={!isInternal(linkAt.href)}
                        className="inline-block min-w-0 truncate text-sm"
                      >
                        {linkAt.href.replace(/^(https?:\/\/|mailto:)/, '')}
                      </Link>
                      <Button
                        appearance="ghost"
                        size="small"
                        startIcon={Pencil}
                        className="shrink-0"
                        onClick={() =>
                          openLinkEditor(block.id, { start: linkAt.start, end: linkAt.end })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        appearance="ghost"
                        size="small"
                        startIcon={Unlink}
                        aria-label="Remove link"
                        className="shrink-0"
                        onClick={() => linkWords(block.id, linkAt.start, linkAt.end)}
                      />
                    </div>
                  ) : null}
                </div>
                {props.after(block)}
              </Sortable.Item>
            )
          })}
        </Sortable>
      </DragAndDrop>
      {/* The page under the last line: a click there writes on, as a page editor's does. */}
      <div aria-hidden className="min-h-24 flex-1 cursor-text" onClick={writeAtEnd} />
    </>
  )
}

/** Draws a line's formatted words into it, unless what it holds already says the same. */
function sync(el: HTMLElement, md: string) {
  if (serializeInline(runsFromDom(el)) !== md) el.replaceChildren(...runsToNodes(parseInline(md)))
}

/**
 * ⌘K's box, under the words it links: the address, Link to set it, and
 * Remove when there is one already. Enter sets it, Escape puts the words back
 * selected. A bare domain gets https; anything else that is not an address
 * says so rather than making a link that goes nowhere.
 */
function LinkEditor({
  linking,
  onApply,
  onRemove,
  onCancel,
}: {
  linking: Linking
  onApply: (href: string) => void
  onRemove: () => void
  onCancel: () => void
}) {
  const [address, setAddress] = useState(linking.href)
  const [wrong, setWrong] = useState(false)
  const messageId = useId()
  return (
    <form
      data-drag-ignore
      aria-label={linking.href ? 'Edit link' : 'Add a link'}
      className={cn(popup(), 'absolute z-30 w-90 gap-1 p-2')}
      style={{ top: linking.top, left: linking.left }}
      onSubmit={(event) => {
        event.preventDefault()
        const href = normalizeHref(address)
        if (href) onApply(href)
        else setWrong(true)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        onCancel()
      }}
    >
      <div className="flex items-center gap-2">
        <Input
          aria-label="Link address"
          placeholder="Paste or type a link"
          value={address}
          onValueChange={(next) => {
            setAddress(next)
            setWrong(false)
          }}
          autoFocus
          invalid={wrong}
          aria-describedby={wrong ? messageId : undefined}
          className="min-w-0 flex-1"
        />
        <Button type="submit" appearance="primary">
          Link
        </Button>
        {linking.href ? (
          <Button
            type="button"
            appearance="ghost"
            startIcon={Unlink}
            aria-label="Remove link"
            onClick={onRemove}
          />
        ) : null}
      </div>
      {wrong ? (
        <Text id={messageId} size="sm" className="text-content-danger" role="alert">
          That isn’t a web address. Try one like example.com.
        </Text>
      ) : null}
    </form>
  )
}

/** The placeholder a line shows while it is empty and has the caret. */
const PLACEHOLDER: Record<TextKind, string> = {
  paragraph: 'Type / for blocks and tasks',
  heading: 'Heading',
  item: 'List',
  todo: 'To-do',
}

/**
 * One line's words, in the element its kind is: an h2, a p, or a span after
 * a bullet or a checkbox. Its words are written in from the saved text only
 * when they differ from what is already there, which is never while you type.
 */
function LineContent({
  block,
  tasks,
  register,
  placeholder,
  menuOpen,
  menuId,
  activeId,
  onInput,
  onKeyDown,
  onPaste,
  onBlur,
  onToggle,
}: {
  block: TextBlock
  tasks: Task[]
  register: (id: string, el: HTMLElement | null) => void
  /** Shown whether or not it has the caret: the one empty line of a new doc. */
  placeholder?: string
  menuOpen: boolean
  menuId: string
  activeId?: string
  onInput: (event: FormEvent<HTMLElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onPaste: (event: ClipboardEvent<HTMLElement>) => void
  onBlur: () => void
  onToggle: (done: boolean) => void
}) {
  // The line as the editor holds it, formatted (`readLine`), and its plain words.
  const value = readLine(block)
  const words = readText(block)
  const element = useRef<HTMLElement | null>(null)
  const latest = useRef(value)
  latest.current = value
  const ref = useCallback(
    (el: HTMLElement | null) => {
      element.current = el
      register(block.id, el)
      if (el) sync(el, latest.current)
    },
    [block.id, register],
  )
  useLayoutEffect(() => {
    const el = element.current
    if (el) sync(el, value)
  }, [value])

  const task = block.taskId ? tasks.find((t) => t.id === block.taskId) : undefined
  const done = block.kind === 'todo' && Boolean(block.done)
  const line = {
    ref: ref as never,
    // Not plaintext-only: the line holds <strong>, <em> and <a>. What the
    // browser puts in is read back as runs on every keystroke, and a paste
    // always arrives as plain words (`onPaste`).
    contentEditable: 'true' as const,
    suppressContentEditableWarning: true,
    spellCheck: true,
    'data-editable': block.id,
    'data-placeholder': placeholder ?? PLACEHOLDER[block.kind],
    // While the slash menu is open on it, the line is the menu's combobox.
    ...(menuOpen
      ? {
          role: 'combobox',
          'aria-label': 'Add to this doc',
          'aria-expanded': true,
          'aria-controls': menuId,
          'aria-autocomplete': 'list' as const,
          'aria-activedescendant': activeId,
        }
      : {}),
    onInput,
    onKeyDown,
    onPaste,
    onBlur,
    // ⌘-click (Ctrl-click) opens a link; a plain click puts the caret in it.
    onClick: (event: MouseEvent<HTMLElement>) => {
      const a = (event.target as Element).closest('a')
      if (!a || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      const href = a.getAttribute('href') ?? ''
      if (isInternal(href)) window.location.hash = href.slice(1)
      else window.open(href, '_blank', 'noopener,noreferrer')
    },
    className: cn(
      'min-h-[1lh] min-w-0 whitespace-pre-wrap outline-none',
      'empty:before:pointer-events-none empty:before:text-content-subtle',
      placeholder || block.kind !== 'paragraph'
        ? 'empty:before:content-[attr(data-placeholder)]'
        : 'focus:empty:before:content-[attr(data-placeholder)]',
    ),
  }

  if (block.kind === 'heading')
    return (
      <div className="flex flex-wrap items-baseline gap-2">
        <Heading level={2} size="lg" {...line} className={cn(line.className, 'flex-1')} />
        {task ? <TaskToken task={task} /> : null}
      </div>
    )

  if (block.kind === 'paragraph')
    return (
      <div className="flex flex-wrap items-baseline gap-2">
        <Text render={<p />} {...line} className={cn(line.className, 'flex-1')} />
        {task ? <TaskToken task={task} /> : null}
      </div>
    )

  return (
    <div className="flex items-start gap-2">
      {block.kind === 'item' ? (
        <span aria-hidden className="text-content-subtle">
          •
        </span>
      ) : (
        <Checkbox
          checked={done}
          onCheckedChange={onToggle}
          aria-label={words ? `Done: ${words}` : 'Done'}
          className="mt-0.5"
        />
      )}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Text
          render={<span />}
          color={done ? 'subtle' : undefined}
          {...line}
          className={cn(line.className, 'flex-1', done && 'line-through')}
        />
        {task ? <TaskToken task={task} /> : null}
      </span>
    </div>
  )
}

/**
 * The slash menu's list, under the caret: Menu's popup and rows, drawn here
 * rather than as a `Menu`, because the caret has to stay in the line while
 * the arrows walk the list, and a Menu takes the focus (FINDINGS 120). The
 * line is its combobox and points at the active row.
 */
function SlashList({
  id,
  menu,
  options,
  onHover,
  onPick,
}: {
  id: string
  menu: SlashMenu
  options: Option[]
  onHover: (index: number) => void
  onPick: (option: Option) => void
}) {
  const groups = [...new Set(options.map((o) => o.group))]
  return (
    <div
      data-drag-ignore
      className={cn(popup(), 'absolute z-30 w-75')}
      style={{ top: menu.top, left: menu.left }}
      // A press here must not take the caret out of the line.
      onMouseDown={(event) => event.preventDefault()}
    >
      <div
        id={id}
        role="listbox"
        aria-label={menu.mode === 'link' ? 'Link a task' : 'Add to this doc'}
      >
        {options.length === 0 ? (
          <Text color="subtle" className="px-5 py-3">
            {menu.query ? 'No tasks match' : 'Every task here is linked already'}
          </Text>
        ) : (
          groups.map((group) => (
            <div key={group} role="group" aria-label={group} className="flex flex-col">
              <Text render={<span />} size="sm" color="subtle" className="px-5 pt-3" aria-hidden>
                {group}
              </Text>
              <div className="flex flex-col p-2">
                {options.map((option, index) =>
                  option.group === group ? (
                    <div
                      key={option.id}
                      id={`${id}-${index}`}
                      role="option"
                      aria-selected={index === menu.active}
                      onMouseMove={() => index !== menu.active && onHover(index)}
                      onClick={() => onPick(option)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-input px-3 py-1 text-base text-content-primary select-none',
                        index === menu.active && 'bg-surface-background-subtle',
                      )}
                    >
                      <Icon icon={option.icon} className="shrink-0" />
                      <span className="flex min-w-px flex-1 flex-col items-start">
                        <Text render={<span />} color="inherit">
                          {option.label}
                        </Text>
                        {option.description ? (
                          <Text render={<span />} size="sm" color="subtle">
                            {option.description}
                          </Text>
                        ) : null}
                      </span>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
