import { useState, type FormEvent } from 'react'
import {
  AtSign,
  CircleDot,
  Flag,
  ListTodo,
  MessageCircle,
  MessageSquare,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Autocomplete, type AutocompleteItemData } from '../../../../src/components/Autocomplete'
import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { HealthBadge } from '../../components/ProjectCells'
import { dueLabel, statusFor } from '../../components/taskMeta'
import { addDays, datedText, day, shortDate, today } from '../../data/dates'
import type { DocBlock } from '../../data/docs'
import { personFor } from '../../data/people'
import type { Project, Task } from '../../data/types'
import { latestUpdates } from '../../data/updates'
import { YakMark } from '../../yak/YakMark'
import { taskKey } from '../project/paths'
import { dueSoon, slashQuery, type DiffRow } from './model'
import { useEditable } from './useEditable'

/** A task as a view-only Token at the end of a line, its status glyph first, as the checklist draws it. */
function TaskToken({ task }: { task: Task }) {
  return (
    <Token startIcon={statusFor(task.status).icon} className="shrink-0">
      {task.title}
    </Token>
  )
}

/** The selected block's fill, 4px round the words as drawn, set out so they do not move under it. */
const selectedFill = '-m-1 rounded-sm bg-surface-background-subtle p-1'

export interface BlockHandlers {
  selectedId?: string
  /** Blocks Yak is pointing at, filled like a selection. */
  highlighted: Set<string>
  onSelect: (blockId: string) => void
  onText: (blockId: string, text: string) => void
  onRemove: (blockId: string) => void
  /** Enter at the end of a line puts the caret on the line below the doc. */
  onEnter: () => void
  /** Open comment counts, by block. */
  threads: Map<string, { id: string; count: number }>
  onOpenThread: (threadId: string) => void
}

/** One block of a doc, editable. */
export function DocBlockView({
  block,
  project,
  tasks,
  handlers,
}: {
  block: DocBlock
  project: Project
  tasks: Task[]
  handlers: BlockHandlers
}) {
  const selected = handlers.selectedId === block.id || handlers.highlighted.has(block.id)
  const thread = handlers.threads.get(block.id)
  return (
    <div className="relative" data-block={block.id}>
      <BlockContent
        block={block}
        project={project}
        tasks={tasks}
        handlers={handlers}
        selected={selected}
      />
      {thread ? (
        // In the 32 between the doc and the side column, like a margin note.
        <Button
          appearance="ghost"
          size="small"
          startIcon={MessageSquare}
          aria-label={`${thread.count} ${thread.count === 1 ? 'comment' : 'comments'} on this`}
          onClick={() => handlers.onOpenThread(thread.id)}
          className="absolute top-0 -right-8 max-lg:hidden"
        >
          {String(thread.count)}
        </Button>
      ) : null}
    </div>
  )
}

function BlockContent({
  block,
  project,
  tasks,
  handlers,
  selected,
}: {
  block: DocBlock
  project: Project
  tasks: Task[]
  handlers: BlockHandlers
  selected: boolean
}) {
  const text = 'text' in block ? block.text : ''
  const edit = useEditable(
    datedText(text),
    (next) => handlers.onText(block.id, next),
    handlers.onEnter,
  )
  const focus = { onFocus: () => handlers.onSelect(block.id) }
  const task = 'taskId' in block ? tasks.find((t) => t.id === block.taskId) : undefined

  switch (block.kind) {
    case 'heading':
      return (
        <Heading
          level={2}
          size="lg"
          {...edit}
          {...focus}
          className={cn('outline-none', selected && selectedFill)}
        />
      )
    case 'paragraph':
      return (
        <div className={cn('flex flex-wrap items-baseline gap-2', selected && selectedFill)}>
          <Text
            render={<p />}
            {...edit}
            {...focus}
            className="min-w-0 flex-1 outline-none empty:before:text-content-subtle empty:before:content-['Write_something…']"
          />
          {task ? <TaskToken task={task} /> : null}
        </div>
      )
    case 'item':
      return (
        <div className={cn('flex items-start gap-2', selected && selectedFill)}>
          <span aria-hidden className="text-content-subtle">
            •
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <Text
              render={<span />}
              {...edit}
              {...focus}
              className={cn('min-w-0 outline-none', !text && !task && 'flex-1')}
            />
            {task ? <TaskToken task={task} /> : null}
          </span>
        </div>
      )
    case 'tasks':
      return (
        <TaskListBlock
          project={project}
          tasks={tasks}
          onRemove={() => handlers.onRemove(block.id)}
        />
      )
    case 'status':
      return <StatusBlock project={project} onRemove={() => handlers.onRemove(block.id)} />
  }
}

/** The head of a live block: its name and a way to take it out of the doc. */
function LiveBlockHead({ title, onRemove }: { title: string; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Text render={<span />} size="sm" color="subtle" className="flex-1">
        {title}
      </Text>
      {onRemove ? (
        <Button
          appearance="ghost"
          size="small"
          startIcon={X}
          aria-label={`Remove “${title}” from the doc`}
          onClick={onRemove}
        />
      ) : null}
    </div>
  )
}

/**
 * The slash menu's Task list, kept live: the project's open tasks due in the
 * next two weeks, late ones included, each with its status, due date and owner. Not drawn in the
 * file; it uses the side column's task rows.
 */
function TaskListBlock({
  project,
  tasks,
  onRemove,
}: {
  project: Project
  tasks: Task[]
  onRemove?: () => void
}) {
  const due = dueSoon(tasks, project.id)
  return (
    <Card padding={3} className="gap-2">
      <LiveBlockHead
        title={`Open, due by ${shortDate.format(addDays(today, 14))}`}
        onRemove={onRemove}
      />
      {due.length === 0 ? (
        <Text color="subtle">Nothing open is due by then.</Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {due.map((task) => {
            const owner = personFor(task.assigneeId)
            return (
              <li key={task.id} className="flex h-6 items-center gap-2">
                <Icon icon={statusFor(task.status).icon} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                  {taskKey(task)} · {dueLabel(task)}
                </Text>
                <Avatar name={owner.name} src={owner.avatar} alt={owner.name} size="x-small" />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/** The slash menu's Project status, kept live: its health and latest update, as a portfolio shows it. */
function StatusBlock({ project, onRemove }: { project: Project; onRemove?: () => void }) {
  const update = latestUpdates.find((u) => u.projectId === project.id)
  const author = update ? personFor(update.authorId) : undefined
  return (
    <Card padding={3} className="gap-2">
      <LiveBlockHead title="Project status" onRemove={onRemove} />
      <div className="flex items-center gap-2">
        <HealthBadge project={project} />
        {update && author ? (
          <Text render={<span />} size="sm" color="subtle">
            {author.name} · {shortDate.format(day(update.posted))}
          </Text>
        ) : null}
      </div>
      <Text>{update ? datedText(update.body) : `${project.name} has no update posted yet.`}</Text>
    </Card>
  )
}

/**
 * The selected paragraph's bar (`Selection toolbar`): Create task, Ask Yak
 * and Comment, small ghost Buttons in a 4px-padded box under it. They take
 * no focus on a press, so a selection of words inside the paragraph is still
 * there when Comment reads it.
 */
export function SelectionToolbar({
  onCreateTask,
  onAskYak,
  onComment,
}: {
  onCreateTask: () => void
  onAskYak: () => void
  onComment: () => void
}) {
  const keep = { onMouseDown: (event: React.MouseEvent) => event.preventDefault() }
  return (
    <div
      role="toolbar"
      aria-label="Paragraph"
      className="flex gap-1 self-start rounded-md border border-surface-border bg-surface-background-primary p-1 shadow-low"
    >
      <Button appearance="ghost" size="small" startIcon={Plus} onClick={onCreateTask} {...keep}>
        Create task
      </Button>
      <Button
        appearance="ghost"
        size="small"
        startIcon={MessageCircle}
        onClick={onAskYak}
        {...keep}
      >
        Ask Yak
      </Button>
      <Button appearance="ghost" size="small" startIcon={AtSign} onClick={onComment} {...keep}>
        Comment
      </Button>
    </div>
  )
}

/**
 * Yak's suggestion under a paragraph (`Card`, Subtle, in `Docs - Comments and
 * Yak suggestion`): its mark and "Yak suggests", the words, then Accept
 * (Secondary) and Dismiss (Ghost), both small.
 */
export function YakSuggestion({
  title = 'Yak suggests',
  text,
  onAccept,
  onDismiss,
}: {
  title?: string
  text: string
  onAccept: () => void
  onDismiss: () => void
}) {
  return (
    <Card emphasis="subtle" padding={3} className="gap-2" role="group" aria-label={title}>
      <div className="flex items-center gap-2">
        <YakMark className="size-4 text-content-emphasized" />
        <Text render={<span />} size="sm" color="subtle">
          {title}
        </Text>
      </div>
      <Text>{datedText(text)}</Text>
      <div className="flex gap-2">
        <Button appearance="secondary" size="small" onClick={onAccept}>
          Accept
        </Button>
        <Button appearance="ghost" size="small" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  )
}

/**
 * A line of the compare view (`Change / Added`, `Change / Removed`): a 3px
 * bar in the change's Decorative hue where the bullet would be, the words,
 * and a Badge at the end. A removed line's words are subtle. A block that did
 * not change reads as it does in the doc.
 */
export function DiffLine({
  row,
  project,
  tasks,
}: {
  row: DiffRow
  project: Project
  tasks: Task[]
}) {
  const block = row.block
  const added = row.kind === 'block' && row.added
  const removed = row.kind === 'removed'
  const task = 'taskId' in block ? tasks.find((t) => t.id === block.taskId) : undefined
  const words =
    block.kind === 'tasks'
      ? 'Task list'
      : block.kind === 'status'
        ? 'Project status'
        : datedText(block.text)

  if (!added && !removed) {
    if (block.kind === 'tasks') return <TaskListBlock project={project} tasks={tasks} />
    if (block.kind === 'status') return <StatusBlock project={project} />
    if (block.kind === 'heading')
      return (
        <Heading level={2} size="lg">
          {words}
        </Heading>
      )
    return (
      <div className="flex items-start gap-2">
        {block.kind === 'item' ? (
          <span aria-hidden className="text-content-subtle">
            •
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Text render={<span />}>{words}</Text>
          {task ? <TaskToken task={task} /> : null}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden
        className={cn(
          'w-0.75 shrink-0 self-stretch',
          removed ? 'bg-decorative-red-background' : 'bg-decorative-green-background',
        )}
      />
      <Text
        render={removed ? <del /> : <ins />}
        color={removed ? 'subtle' : 'primary'}
        weight={block.kind === 'heading' ? 'semibold' : undefined}
        className="min-w-0 flex-1 no-underline"
      >
        {words}
      </Text>
      <Badge color={removed ? 'red' : 'green'} className="mt-0.5 shrink-0">
        {removed ? 'Removed' : 'Added'}
      </Badge>
    </div>
  )
}

interface Command extends AutocompleteItemData {
  icon: LucideIcon
  /** What the command does once picked. */
  run: 'linked-task' | 'task-list' | 'status' | 'yak-draft'
}

/** The slash menu (`Docs - Slash menu`, `40006309:39451`), "Add to this doc". */
const COMMANDS: Command[] = [
  {
    value: 'linked-task',
    label: 'Linked task',
    description: 'Stays in sync with the project',
    icon: CircleDot,
    run: 'linked-task',
  },
  {
    value: 'task-list',
    label: 'Task list',
    description: 'Show a filtered list of tasks',
    icon: ListTodo,
    run: 'task-list',
  },
  {
    value: 'status',
    label: 'Project status',
    description: 'Latest health and update',
    icon: Flag,
    run: 'status',
  },
  {
    value: 'yak-draft',
    label: 'Ask Yak to draft',
    description: 'Write from what’s on this project',
    icon: MessageCircle,
    run: 'yak-draft',
  },
]

/** A command matches when a word of its name starts with what follows the slash. */
function matches(command: Command, query: string): boolean {
  return (
    query === '' ||
    command.label
      .toLowerCase()
      .split(' ')
      .some((w) => w.startsWith(query))
  )
}

/**
 * The line under the doc where new writing goes. Typing and Enter adds a
 * paragraph; a slash opens "Add to this doc" — Linked task, Task list, Project
 * status, Ask Yak to draft. Linked task turns the line into a search of the
 * project's tasks not yet linked.
 *
 * It is the library's `Autocomplete`, which keeps the caret in the line while
 * the arrows walk the list. Its field box is turned off here so the line
 * reads as the doc's own text, and its width follows what is typed so the
 * menu is the file's 300 wide (FINDINGS 98).
 */
export function SlashLine({
  linkable,
  inputRef,
  onFocus,
  onParagraph,
  onCommand,
  onLink,
}: {
  /** Tasks Linked task can offer. */
  linkable: Task[]
  inputRef: React.RefObject<HTMLInputElement | null>
  /** The caret arriving here leaves whichever paragraph was selected. */
  onFocus: () => void
  onParagraph: (text: string) => void
  onCommand: (run: Exclude<Command['run'], 'linked-task'>) => void
  onLink: (task: Task) => void
}) {
  const [text, setText] = useState('')
  const [picking, setPicking] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const query = slashQuery(text)
  const commands = query === null ? [] : COMMANDS.filter((c) => matches(c, query))
  const found = picking
    ? linkable.filter((t) => t.title.toLowerCase().includes(text.trim().toLowerCase())).slice(0, 6)
    : []
  const items: AutocompleteItemData[] = picking
    ? found.map((t) => ({ value: t.id, label: t.title, description: taskKey(t) }))
    : commands
  const open = !dismissed && items.length > 0 && (picking || query !== null)

  const reset = () => {
    setText('')
    setPicking(false)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const words = text.trim()
    if (!words || picking || query !== null) return
    onParagraph(words)
    setText('')
  }

  return (
    <form
      onSubmit={submit}
      onFocus={onFocus}
      aria-label="Add to this doc"
      className={cn(text.length < 30 && 'w-75')}
    >
      <Autocomplete
        aria-label={picking ? 'Find a task to link' : 'Add to this doc'}
        placeholder={picking ? 'Find a task to link…' : 'Type, or / to add a task, list or status'}
        startIcon={null}
        items={[{ value: picking ? 'Link a task' : 'Add to this doc', items }]}
        filter={null}
        value={text}
        open={open}
        onOpenChange={(next) => {
          if (!next) setDismissed(true)
        }}
        inputRef={inputRef}
        // A pick arrives as the row's label, not its `value`, whatever the
        // library's type says (FINDINGS 99), so a row is found by either.
        onValueChange={(next, details) => {
          setDismissed(false)
          if (details.reason !== 'item-press') return setText(next)
          if (picking) {
            const task = linkable.find((t) => t.id === next || t.title === next)
            if (task) onLink(task)
            return reset()
          }
          const command = COMMANDS.find((c) => c.value === next || c.label === next)
          if (command?.run === 'linked-task') {
            setPicking(true)
            setText('')
            return
          }
          if (command) onCommand(command.run as Exclude<Command['run'], 'linked-task'>)
          reset()
        }}
        // The Autocomplete's field, turned off: no box, no fill, no ring, the
        // text flush with the paragraphs above (FINDINGS 98).
        className="min-h-6 border-transparent bg-transparent hover:bg-transparent has-focus-visible:border-transparent has-focus-visible:bg-transparent has-focus-visible:ring-0 has-focus-visible:ring-offset-0 [&_input]:px-0"
      >
        {(item) => {
          const command = COMMANDS.find((c) => c.value === item.value)
          const task = picking ? linkable.find((t) => t.id === item.value) : undefined
          return (
            <Autocomplete.Item
              key={item.value}
              value={item}
              startIcon={command?.icon ?? (task ? statusFor(task.status).icon : undefined)}
              description={item.description}
            >
              {item.label}
            </Autocomplete.Item>
          )
        }}
      </Autocomplete>
      {picking ? (
        <Button
          appearance="ghost"
          size="small"
          className="mt-1"
          onClick={() => {
            reset()
            inputRef.current?.focus()
          }}
        >
          Cancel
        </Button>
      ) : null}
    </form>
  )
}
