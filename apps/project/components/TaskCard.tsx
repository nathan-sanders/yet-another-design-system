import { useId } from 'react'
import { Calendar, ListTree, MessageCircle } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { ClickableCard } from '../../../src/components/Card'
import { Icon } from '../../../src/components/Icon'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { personFor } from '../data/people'
import type { Task } from '../data/types'
import { PriorityMark } from './TaskTokens'
import { commentCount, dueLabel, phaseTag, priorityFor, subtaskCount } from './taskMeta'

/**
 * `_Task Card Content` (`40006261:1512`) in a `Clickable Card`, as the Board
 * stacks them: the phase's tag, a Blocked badge when the task is blocked and
 * the priority mark on the right; the title; then the assignee's face, the
 * due date, and the subtask and comment counts on the right when there are
 * any. The counts are the task's own, so a card agrees with the panel it
 * opens rather than with the numbers drawn on the frame.
 *
 * The card is a `<button>`, so everything in it is a span. Its name is the
 * title alone; the rest is its description, with the words a screen reader
 * needs ("Priority: High", "Due Nov 18") that the eye gets from the glyphs.
 */
export function TaskCard({
  task,
  selected = false,
  onClick,
  className,
  title = task.title,
  tag = phaseTag(task.phase),
  personId = task.assigneeId,
  due = dueLabel(task),
}: {
  task: Task
  /** The task whose panel is open. */
  selected?: boolean
  onClick?: () => void
  className?: string
  /**
   * My work's cards hold work from every project, so they say it their own
   * way: what you owe the task, the project for a tag, your face, and the
   * due date as a weekday. A project's Board leaves all four to the task.
   */
  title?: string
  tag?: string
  personId?: string
  due?: string
}) {
  const id = useId()
  const assignee = personFor(personId)
  const subtasks = subtaskCount(task)
  const comments = commentCount(task)
  const priority = priorityFor(task.priority)

  return (
    <ClickableCard
      selected={selected}
      onClick={onClick}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-top ${id}-meta`}
      className={cn('w-full', className)}
    >
      <span className="flex w-full min-w-0 flex-col gap-2 text-left">
        <span id={`${id}-top`} className="flex h-6 items-center gap-1">
          <Token>{tag}</Token>
          {task.status === 'blocked' && (
            <>
              <span className="sr-only">, </span>
              <Badge color="red">Blocked</Badge>
            </>
          )}
          {task.priority !== 'none' && (
            <span className="ml-auto flex">
              <span className="sr-only">, Priority: {priority.label}</span>
              <PriorityMark priority={task.priority} size="base" />
            </span>
          )}
        </span>
        <Text id={`${id}-title`} render={<span />} weight="semibold" color="emphasized">
          {title}
        </Text>
        <span id={`${id}-meta`} className="flex h-5 items-center gap-2 text-sm text-content-subtle">
          <Avatar name={assignee.name} src={assignee.avatar} alt="" size="x-small" />
          <span className="sr-only">{assignee.name}, </span>
          <span className="flex items-center gap-1">
            <Icon icon={Calendar} size="small" />
            <span className="sr-only">Due </span>
            {due}
          </span>
          {(subtasks || comments > 0) && (
            <span className="ml-auto flex items-center gap-2">
              {subtasks && (
                <span className="flex items-center gap-1">
                  <Icon icon={ListTree} size="small" />
                  <span className="sr-only">, Subtasks: </span>
                  {subtasks.done}/{subtasks.total}
                </span>
              )}
              {comments > 0 && (
                <span className="flex items-center gap-1">
                  <Icon icon={MessageCircle} size="small" />
                  <span className="sr-only">, Comments: </span>
                  {comments}
                </span>
              )}
            </span>
          )}
        </span>
      </span>
    </ClickableCard>
  )
}
