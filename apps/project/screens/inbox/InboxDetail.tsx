import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Bell,
  Calendar,
  Check,
  CircleUser,
  Clock,
  FileText,
  Paperclip,
  Reply,
  Smile,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { InputGroup } from '../../../../src/components/Input'
import { Menu } from '../../../../src/components/Menu'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { HEALTH, statusFor } from '../../components/taskMeta'
import { datedText, day, shortDate } from '../../data/dates'
import { LATER_TIMES, type LaterTime } from '../../data/inbox'
import { me, personFor } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { ProjectHealth, Task, TaskComment } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { projectPath, taskKey, taskPath } from '../project/paths'
import { Comment } from '../project/TaskPanel'
import type { Message } from './inboxState'
import { senderName, timeLabel } from './model'

export interface DetailActions {
  later: (back: LaterTime) => void
  clear: () => void
  approve: () => void
  reply: (body: string, clear: boolean) => void
}

/**
 * The open message, beside the list (`Inbox - Approval`, `40006278:12738`):
 * where it is from and the three things to do with it — open its task, put
 * it off, clear it — over a title and whatever the kind needs. An approval
 * shows what to approve and the two answers; a mention or a question shows
 * the task's facts and the conversation, with a reply box pinned below
 * (`Reply in place`, `40006316:49186`); Yak's bundle lists what moved and
 * what finished (`Bundled updates`, `40006316:47749`).
 *
 * 24 in from every side, 16 between blocks, as drawn; 16 on a phone. The body scrolls; the
 * reply box stays at the foot.
 */
export function InboxDetail({
  message,
  task,
  actions,
  onBack,
  backLabel,
}: {
  message: Message
  task?: Task
  actions: DetailActions
  /** Below 768 the list and the message take turns, and this goes back. */
  onBack: () => void
  backLabel: string
}) {
  const navigate = useNavigate()
  const project = projectFor(message.projectId)
  const inInbox = message.place.where === 'inbox'
  const context =
    message.kind === 'bundle'
      ? `Bundled by Yak · ${message.time}`
      : task
        ? `${project?.name ?? task.team?.name} · ${taskKey(task)}`
        : (project?.name ?? '')
  const replyTo =
    message.kind === 'mention' || message.kind === 'question' || message.kind === 'assigned'

  return (
    <section aria-labelledby={`detail-${message.id}`} className="flex min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <Button
            appearance="ghost"
            startIcon={ArrowLeft}
            aria-label={`Back to ${backLabel}`}
            className="md:hidden"
            onClick={onBack}
          />
          {/* On a phone the actions keep the row and the context drops under them. */}
          <Text
            render={<span />}
            size="sm"
            color="subtle"
            truncate
            className="min-w-0 flex-1 max-md:order-last max-md:basis-full"
          >
            {context}
          </Text>
          {task ? (
            <Button appearance="ghost" onClick={() => navigate(taskPath(task))}>
              Open task
            </Button>
          ) : null}
          {inInbox ? (
            <>
              <LaterMenu onPick={actions.later} />
              <Button appearance="ghost" startIcon={Check} onClick={actions.clear}>
                {message.kind === 'bundle' ? 'Clear all 5' : 'Clear'}
              </Button>
            </>
          ) : null}
        </div>
        <Heading id={`detail-${message.id}`} level={2} size="xl" weight="bold">
          {message.bundle?.title ??
            (message.kind === 'approval' ? message.body : task?.title) ??
            (message.kind === 'health' && project
              ? `${project.name}: ${HEALTH[message.health!.to as ProjectHealth].label}`
              : message.body)}
        </Heading>

        {message.approval && task ? (
          <Approval message={message} task={task} onApprove={actions.approve} />
        ) : null}
        {message.bundle ? <Bundle message={message} /> : null}
        {message.health ? <HealthChange message={message} /> : null}
        {task && message.kind !== 'approval' ? <TaskFacts task={task} /> : null}

        <Conversation message={message} task={task} />

        {(message.kind === 'bundle' ||
          message.kind === 'health' ||
          message.kind === 'update' ||
          message.kind === 'comment') &&
        project ? (
          <div>
            <Button
              appearance="secondary"
              startIcon={ArrowRight}
              onClick={() => navigate(projectPath(project.id))}
            >
              Open project
            </Button>
          </div>
        ) : null}
      </div>
      {replyTo && task ? (
        <div className="shrink-0 px-4 pb-4 md:px-6 md:pb-6">
          <ReplyBox
            key={message.id}
            to={senderName(message.from)}
            canClear={inInbox}
            onSend={actions.reply}
          />
        </div>
      ) : null}
    </section>
  )
}

/**
 * Later: a Ghost button with a `bell` that opens "Bring this back" and its
 * times (`Inbox - Later and undo`, `40006316:50589`). Pick a date is drawn
 * and not built.
 */
function LaterMenu({ onPick }: { onPick: (back: LaterTime) => void }) {
  const shell = useShell()
  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button appearance="ghost" startIcon={Bell}>
            Later
          </Button>
        }
      />
      <Menu.Popup align="end" aria-label="Bring this back">
        <Menu.Group label="Bring this back">
          {LATER_TIMES.map((time) => (
            <Menu.Item
              key={time.id}
              startIcon={time.id === 'today' ? Clock : Calendar}
              onClick={() => onPick(time.id)}
            >
              {time.label}
            </Menu.Item>
          ))}
          <Menu.Item startIcon={Calendar} onClick={() => shell.notBuilt('Picking a date')}>
            Pick a date
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}

/**
 * What an approval asks: a Subtle Card with the amber "Needs your approval"
 * Badge, who asked and by when, then Request changes and Approve. Once it
 * has moved on, the card says to whom. Under it, the proof itself.
 */
function Approval({
  message,
  task,
  onApprove,
}: {
  message: Message
  task: Task
  onApprove: () => void
}) {
  const shell = useShell()
  const approval = message.approval!
  const waiting = task.review?.personId === me.id
  return (
    <>
      <Card emphasis="subtle" className="flex-row flex-wrap items-center">
        {waiting ? (
          <>
            <Badge color="amber">Needs your approval</Badge>
            <Text render={<span />} truncate className="min-w-0 flex-1">
              {approval.ask}
            </Text>
            <div className="flex gap-2">
              <Button appearance="secondary" onClick={() => shell.notBuilt('Requesting changes')}>
                Request changes
              </Button>
              <Button appearance="primary" onClick={onApprove}>
                Approve
              </Button>
            </div>
          </>
        ) : (
          <>
            <Badge color="green">Approved</Badge>
            <Text render={<span />} truncate className="min-w-0 flex-1">
              You approved it. {personFor(task.review?.personId ?? approval.nextId).name} is next.
            </Text>
          </>
        )}
      </Card>
      <div className="flex h-75 flex-col items-center justify-center gap-2 rounded-md bg-surface-background-subtle text-content-primary">
        <Icon icon={FileText} size="large" />
        <Text weight="semibold">{approval.file.name}</Text>
        <Text size="sm" color="subtle">
          {approval.file.meta}
        </Text>
      </div>
    </>
  )
}

/** A task's status, due date and owner, as View Only tokens (`Task facts`). */
function TaskFacts({ task }: { task: Task }) {
  const owner = personFor(task.assigneeId)
  return (
    <ul aria-label="Task" className="flex flex-wrap gap-1">
      <li className="flex">
        <Token startIcon={statusFor(task.status).icon}>{statusFor(task.status).label}</Token>
      </li>
      <li className="flex">
        <Token startIcon={Calendar}>Due {shortDate.format(day(task.due))}</Token>
      </li>
      <li className="flex">
        <Token startIcon={CircleUser}>{owner.name}</Token>
      </li>
    </ul>
  )
}

/** Yak's note on the bundle in a Subtle Card, then Dates moved and Completed as `_Activity Row`s. */
function Bundle({ message }: { message: Message }) {
  const bundle = message.bundle!
  return (
    <>
      <Card emphasis="subtle" className="flex-row items-start">
        <YakMark className="mt-1 size-4 text-content-emphasized" />
        <Text className="min-w-0 flex-1">{datedText(bundle.note)}</Text>
      </Card>
      <ActivityList title={`Dates moved · ${bundle.moved.length}`} rows={bundle.moved} />
      <ActivityList title={`Completed · ${bundle.completed.length}`} rows={bundle.completed} />
    </>
  )
}

function ActivityList({
  title,
  rows,
}: {
  title: string
  rows: { personId: string; text: string; age: string }[]
}) {
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{title}</SectionTitle>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const person = personFor(row.personId)
          return (
            <li key={row.text} className="flex items-start gap-2">
              <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
              <Text size="sm" className="min-w-0 flex-1">
                {datedText(row.text)}
              </Text>
              <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                {row.age}
              </Text>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Before and after, as All projects' health Badges, with an arrow between. */
function HealthChange({ message }: { message: Message }) {
  const change = message.health!
  const from = HEALTH[change.from as ProjectHealth]
  const to = HEALTH[change.to as ProjectHealth]
  return (
    <div className="flex items-center gap-2">
      <Badge color={from.color}>{from.label}</Badge>
      <Icon icon={ArrowRight} size="small" className="text-content-subtle" />
      <span className="sr-only">to</span>
      <Badge color={to.color}>{to.label}</Badge>
    </div>
  )
}

/**
 * The words: the task's comments the message quotes, then any reply written
 * here. A message with no thread on a task — an assignment, an update — is
 * one comment from its sender.
 */
function Conversation({ message, task }: { message: Message; task?: Task }) {
  const quoted = (message.commentIds ?? [])
    .map((id) => task?.comments?.find((c) => c.id === id))
    .filter((c): c is TaskComment => c !== undefined)
  const said: TaskComment[] =
    quoted.length || message.from === 'yak'
      ? quoted
      : [
          {
            id: `${message.id}-said`,
            authorId: message.from,
            age: timeLabel(message),
            body: message.health?.note ?? message.detail ?? message.body,
          },
        ]
  const thread = [...said, ...message.replies]
  if (!thread.length) return null
  const title =
    message.kind === 'approval'
      ? `Comments · ${thread.length}`
      : message.health
        ? 'Note'
        : 'Conversation'
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>{title}</SectionTitle>
      <ul className="flex flex-col gap-4">
        {thread.map((comment) => (
          <li key={comment.id}>
            <Comment comment={comment} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Heading level={3} size="base" weight="semibold">
      {children}
    </Heading>
  )
}

/**
 * Reply in place (`40006316:49186`): Yet Social's reply box shape, an
 * `InputGroup` with both slots — who you are answering on top, the field,
 * then mention, attach and emoji, and Reply beside Reply and clear. The
 * reply lands on the task's comments too. Both send buttons wait for words.
 */
function ReplyBox({
  to,
  canClear,
  onSend,
}: {
  to: string
  canClear: boolean
  onSend: (body: string, clear: boolean) => void
}) {
  const shell = useShell()
  const [text, setText] = useState('')
  const send = (clear: boolean) => {
    const body = text.trim()
    if (!body) return
    onSend(body, clear)
    setText('')
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(false)
  }
  return (
    <form onSubmit={submit} aria-label={`Reply to ${to}`}>
      {/* `ring="input"`: the box holds six buttons with rings of their own,
          so the box's ring is scoped to the caret, as Yet Social's is. */}
      <InputGroup size="large" ring="input" className="flex-col items-stretch shadow-medium">
        <InputGroup.Addon align="block-start" className="py-3">
          <Icon icon={Reply} className="text-content-primary" />
          <Text render={<span />} truncate>
            Reply to {to}
          </Text>
        </InputGroup.Addon>
        <InputGroup.Input
          aria-label="Reply"
          placeholder="Leave a comment. @mention to notify"
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />
        <InputGroup.Addon align="block-end" className="gap-4 py-3">
          {/* Mention, attach and emoji aren't built, and on a phone the two
              send buttons need the row. */}
          <div className="flex flex-1 items-center gap-2 max-md:hidden">
            <Button
              appearance="ghost"
              startIcon={AtSign}
              aria-label="Mention"
              onClick={() => shell.notBuilt('Mentions')}
            />
            <Button
              appearance="ghost"
              startIcon={Paperclip}
              aria-label="Attach"
              onClick={() => shell.notBuilt('Attachments')}
            />
            <Button
              appearance="ghost"
              startIcon={Smile}
              aria-label="Emoji"
              onClick={() => shell.notBuilt('Emoji')}
            />
          </div>
          <div className="flex items-center gap-2 max-md:ml-auto">
            <Button type="submit" appearance="ghost" disabled={!text.trim()}>
              Reply
            </Button>
            {canClear ? (
              <Button appearance="primary" disabled={!text.trim()} onClick={() => send(true)}>
                Reply and clear
              </Button>
            ) : null}
          </div>
        </InputGroup.Addon>
      </InputGroup>
    </form>
  )
}
