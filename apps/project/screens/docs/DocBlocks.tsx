import { AtSign, Check, MessageCircle, Plus, X } from 'lucide-react'

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
import { personFor } from '../../data/people'
import type { Project, Task } from '../../data/types'
import { latestUpdates } from '../../data/updates'
import { YakMark } from '../../yak/YakMark'
import { taskKey } from '../project/paths'
import { dueSoon, type DiffRow } from './model'

/** A task as a view-only Token at the end of a line, its status glyph first, as the checklist draws it. */
export function TaskToken({ task }: { task: Task }) {
  return (
    <Token startIcon={statusFor(task.status).icon} className="shrink-0">
      {task.title}
    </Token>
  )
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
export function TaskListBlock({
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
export function StatusBlock({ project, onRemove }: { project: Project; onRemove?: () => void }) {
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
 * A to-do's box in the compare view, where nothing can be ticked: Checkbox's
 * 20px box and check, drawn still, so the line reads as it does in the doc.
 */
function TodoMark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-input-checkbox border',
        done
          ? 'border-input-selected bg-input-selected text-input-selected-foreground'
          : 'border-input-border bg-input-background',
      )}
    >
      {done ? <Icon icon={Check} size="small" /> : null}
    </span>
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
        ) : block.kind === 'todo' ? (
          <TodoMark done={Boolean(block.done)} />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Text
            render={<span />}
            color={block.kind === 'todo' && block.done ? 'subtle' : undefined}
            className={cn(block.kind === 'todo' && block.done && 'line-through')}
          >
            {words}
          </Text>
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
