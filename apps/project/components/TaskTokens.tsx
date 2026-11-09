import type { ReactElement, ReactNode } from 'react'
import { Avatar } from '../../../src/components/Avatar'
import { Icon, type StartIcon } from '../../../src/components/Icon'
import { Menu } from '../../../src/components/Menu'
import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { people, personFor } from '../data/people'
import type { Task, TaskPriority } from '../data/types'
import type { TaskEdit } from '../screens/project/tasksState'
import { PRIORITY, STATUS, priorityFor, statusFor } from './taskMeta'

/*
 * A task's editable fields as Interactive Tokens, the way every task table in
 * the file draws them: if a value can be changed it is a clickable Token, not
 * text. Status, priority and assignee open a menu of their values; the due
 * date's picker is drawn (`Task - Due date`, `40006306:34048`) and comes later.
 */

/**
 * The priority's digit in its tinted box (`Priority Icon`, `40006396:58194`):
 * 14px with a 12px bold digit inside a token, the size the table draws it.
 * Decoration: the label beside it says the priority.
 */
export function PriorityMark({ priority }: { priority: TaskPriority }) {
  const option = priorityFor(priority)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm',
        'text-sm leading-none font-bold tabular-nums',
        option.tone,
      )}
    >
      {option.level}
    </span>
  )
}

/** A word only a screen reader hears, so "High" is read as "Priority: High". */
function Spoken({ children }: { children: string }) {
  return <span className="sr-only">{children} </span>
}

/**
 * A view-only Token inside a real `<button>`, as a menu trigger. Rendering
 * the trigger onto a Token does not work — Token's `onClick` makes a hidden
 * button of its own — so Yet Social wrapped it the same way (its FINDINGS
 * 24; this app's FINDINGS 2).
 */
function TokenTrigger({
  startIcon,
  avatar,
  children,
  ...props
}: {
  startIcon?: StartIcon
  avatar?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cn('flex max-w-full cursor-pointer rounded-md', focusRing)}
      // Base UI's trigger props (handlers, ARIA, ref) arrive here via `render`.
      {...props}
    >
      <Token interactive startIcon={startIcon} avatar={avatar}>
        {children}
      </Token>
    </button>
  )
}

function PickerMenu({
  label,
  value,
  onValueChange,
  trigger,
  children,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  trigger: ReactElement
  children: ReactNode
}) {
  return (
    <Menu>
      <Menu.Trigger render={trigger} />
      <Menu.Popup aria-label={label}>
        <Menu.Group>
          <Menu.RadioGroup value={value} onValueChange={(next) => onValueChange(next as string)}>
            {children}
          </Menu.RadioGroup>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}

/** A radio row that closes the menu: a picker of one value is done once it is picked. */
function Choice({ value, start, children }: { value: string; start: ReactNode; children: string }) {
  return (
    <Menu.RadioItem value={value} closeOnClick>
      <span className="flex items-center gap-2">
        {start}
        {children}
      </span>
    </Menu.RadioItem>
  )
}

export function StatusToken({
  task,
  onChange,
}: {
  task: Task
  onChange: (edit: TaskEdit) => void
}) {
  const status = statusFor(task.status)
  return (
    <PickerMenu
      label="Status"
      value={task.status}
      onValueChange={(value) => onChange({ status: value as Task['status'] })}
      trigger={
        <TokenTrigger startIcon={status.icon}>
          <Spoken>Status:</Spoken>
          {status.label}
        </TokenTrigger>
      }
    >
      {STATUS.map((option) => (
        <Choice
          key={option.value}
          value={option.value}
          start={<Icon icon={option.icon} size="small" />}
        >
          {option.label}
        </Choice>
      ))}
    </PickerMenu>
  )
}

export function PriorityToken({
  task,
  onChange,
}: {
  task: Task
  onChange: (edit: TaskEdit) => void
}) {
  const priority = priorityFor(task.priority)
  return (
    <PickerMenu
      label="Priority"
      value={task.priority}
      onValueChange={(value) => onChange({ priority: value as TaskPriority })}
      trigger={
        <TokenTrigger startIcon={<PriorityMark priority={task.priority} />}>
          <Spoken>Priority:</Spoken>
          {priority.label}
        </TokenTrigger>
      }
    >
      {/* Highest first, as a priority menu reads; No priority last. */}
      {[...PRIORITY].reverse().map((option) => (
        <Choice
          key={option.value}
          value={option.value}
          start={<PriorityMark priority={option.value} />}
        >
          {option.label}
        </Choice>
      ))}
    </PickerMenu>
  )
}

export function AssigneeToken({
  task,
  onChange,
}: {
  task: Task
  onChange: (edit: TaskEdit) => void
}) {
  const assignee = personFor(task.assigneeId)
  return (
    <PickerMenu
      label="Assignee"
      value={task.assigneeId}
      onValueChange={(value) => onChange({ assigneeId: value })}
      trigger={
        <TokenTrigger avatar={<Token.Avatar name={assignee.name} src={assignee.avatar} alt="" />}>
          <Spoken>Assigned to</Spoken>
          {assignee.name}
        </TokenTrigger>
      }
    >
      {people.map((person) => (
        <Choice
          key={person.id}
          value={person.id}
          start={<Avatar name={person.name} src={person.avatar} alt="" size="x-small" />}
        >
          {person.name}
        </Choice>
      ))}
    </PickerMenu>
  )
}

/**
 * The due date: an Interactive Token with no icon, as the file has it. In a
 * block of its own, because the clickable Token is `inline-flex` and on a
 * text line it took a descender's worth of room, making the row 41.
 */
export function DueToken({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <span className="flex">
      <Token onClick={onClick}>
        <Spoken>Due</Spoken>
        {label}
      </Token>
    </span>
  )
}
