import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  AtSign,
  Calendar,
  CircleCheck,
  CircleUser,
  FolderKanban,
  Paperclip,
  Smile,
  Tag,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { ChatComposer } from '../../../../src/components/Chat'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { PropertyRow } from '../../components/PropertyRow'
import { statusFor } from '../../components/taskMeta'
import { Choice, PickerMenu, PriorityMark, Spoken } from '../../components/TaskTokens'
import { YakLine } from '../../components/YakLine'
import { datedText, day, shortDate } from '../../data/dates'
import { people, personFor } from '../../data/people'
import { projectFor, projects } from '../../data/projects'
import type { IntakeRequest, RequestRouting } from '../../data/requests'
import type { Task, TaskPriority } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { PRIORITY, priorityFor } from '../../components/taskMeta'
import { Comment } from '../project/TaskPanel'
import { taskPath } from '../project/paths'
import { firstName, headLine } from './model'

export interface DetailActions {
  /** Opens the Accept dialog on the routing as it stands in Accept into. */
  accept: (routing: RequestRouting) => void
  decline: () => void
  askForInfo: (body: string) => void
  reply: (body: string) => void
  nudge: () => void
  keepBoth: () => void
  /** Possible duplicate's Merge: folds the request into the task it repeats. */
  merge: () => void
  reopen: () => void
}

/**
 * The open request, beside the queue (`Requests - Queue`, `40006284:19161`):
 * a 20px face and who sent it, when, through which form, with Decline, Ask
 * for info and Accept; the title in xl bold; Yak's line; then its answers
 * beside Accept into, Yak's routing as Interactive Tokens you can change
 * before accepting.
 *
 * The deep dive's two other shapes are here too: a request waiting on the
 * person who sent it (`Waiting on requester`, `40006300:28384`) shows the
 * wait, the first answer and the conversation, with a reply box pinned at
 * the bottom; and one Yak thinks repeats an open task (`Possible duplicate`,
 * `40006300:29523`) shows the two side by side with Keep both and Merge.
 * Accepted and declined requests are code-first: what became of them, then
 * the answers.
 */
export function RequestDetail({
  request,
  tasks,
  actions,
  onBack,
  backLabel,
}: {
  request: IntakeRequest
  tasks: Task[]
  actions: DetailActions
  onBack: () => void
  backLabel: string
}) {
  const [routing, setRouting] = useState(request.routing)
  const [asking, setAsking] = useState(false)
  const from = personFor(request.fromId)
  const first = firstName(request.fromId)
  const duplicate = tasks.find((t) => t.id === request.duplicateOf)
  const open = request.state === 'new' || request.state === 'waiting'
  const composer = request.state === 'waiting' || (request.state === 'new' && asking)

  return (
    <div className="@container/request flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
      <Button
        appearance="ghost"
        startIcon={ArrowLeft}
        className="self-start md:hidden"
        onClick={onBack}
      >
        {backLabel}
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex min-w-0 flex-1 basis-60 items-center gap-2">
          <Avatar name={from.name} src={from.avatar} alt="" size="x-small" />
          <Text render={<span />} size="sm" color="subtle" className="min-w-0">
            {headLine(request)}
          </Text>
        </span>
        {open ? (
          <span className="flex items-center gap-2">
            <Button appearance="ghost" onClick={actions.decline}>
              Decline
            </Button>
            {request.state === 'new' ? (
              <Button
                appearance="secondary"
                aria-pressed={asking}
                onClick={() => setAsking((value) => !value)}
              >
                Ask for info
              </Button>
            ) : null}
            <Button appearance="primary" onClick={() => actions.accept(routing)}>
              Accept
            </Button>
          </span>
        ) : request.state === 'declined' ? (
          <Button appearance="secondary" onClick={actions.reopen}>
            Reopen
          </Button>
        ) : null}
      </div>

      <Heading level={2} size="xl" weight="bold">
        {request.title}
      </Heading>

      {request.state === 'waiting' && request.waiting ? (
        <Card emphasis="subtle" className="shrink-0 flex-row flex-wrap items-center gap-2">
          <Badge color="amber">Waiting on {first}</Badge>
          <Text className="min-w-0 flex-1 basis-48">
            {request.waiting.nudged
              ? `Nudged ${first} just now. Yak will nudge again on ${request.waiting.nudge}.`
              : `Paused until ${first} answers. Yak will nudge ${first} on ${request.waiting.nudge}.`}
          </Text>
          {!request.waiting.nudged ? (
            <Button appearance="secondary" size="small" onClick={actions.nudge}>
              Nudge now
            </Button>
          ) : null}
        </Card>
      ) : request.state === 'accepted' && request.accepted ? (
        <Outcome request={request} tasks={tasks} />
      ) : request.state === 'declined' && request.declined ? (
        <Card emphasis="subtle" className="shrink-0 flex-row flex-wrap items-center gap-2">
          <Badge>Declined</Badge>
          <Text className="min-w-0 flex-1 basis-48">
            {`${shortDate.format(day(request.declined.on))}. ${request.declined.note}`}
          </Text>
        </Card>
      ) : request.yak && open ? (
        <YakLine>{datedText(request.yak)}</YakLine>
      ) : null}

      {request.state === 'waiting' ? (
        <Answer
          question={request.answers[0].question}
          answer={request.answers[0].answer}
          gap="gap-1"
        />
      ) : duplicate && request.state === 'new' ? (
        <Duplicate request={request} task={duplicate} actions={actions} />
      ) : (
        <div className="flex flex-col gap-6 @2xl/request:flex-row">
          <section
            aria-labelledby={`${request.id}-answers`}
            className="flex min-w-0 flex-1 flex-col gap-3"
          >
            <Heading id={`${request.id}-answers`} level={3} size="base" weight="semibold">
              Request
            </Heading>
            {request.answers.map((a) => (
              <Answer key={a.question} question={a.question} answer={a.answer} />
            ))}
          </section>
          {open ? <AcceptInto routing={routing} onChange={setRouting} /> : null}
        </div>
      )}

      {request.conversation.length > 0 || composer ? (
        <section aria-labelledby={`${request.id}-conversation`} className="flex flex-col gap-4">
          <Heading id={`${request.id}-conversation`} level={3} size="base" weight="semibold">
            Conversation
          </Heading>
          {request.conversation.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </section>
      ) : null}

      {composer ? (
        <div className="mt-auto pt-4">
          <Reply
            to={first}
            asking={request.state === 'new'}
            onSend={(body) => {
              if (request.state === 'new') {
                setAsking(false)
                actions.askForInfo(body)
              } else actions.reply(body)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

/** One answer: the question in sm subtle over the answer in body text, touching. */
function Answer({
  question,
  answer,
  gap = 'gap-0',
}: {
  question: string
  answer: string
  gap?: string
}) {
  return (
    <div className={`flex flex-col ${gap}`}>
      <Text size="sm" color="subtle">
        {question}
      </Text>
      <Text>{datedText(answer)}</Text>
    </div>
  )
}

/**
 * Accept into: the `_Property Row`s Yak filled in, each an Interactive Token
 * (Edit Token), so the routing can be changed before Accept opens the dialog
 * on it. Due's picker is the dialog's: the token says so rather than opening
 * a second one.
 */
function AcceptInto({
  routing,
  onChange,
}: {
  routing: RequestRouting
  onChange: (routing: RequestRouting) => void
}) {
  const shell = useShell()
  const project = projectFor(routing.projectId)!
  const assignee = personFor(routing.assigneeId)
  const priority = priorityFor(routing.priority)
  return (
    <section
      aria-labelledby="accept-into"
      className="flex w-full shrink-0 flex-col gap-1 @2xl/request:w-80"
    >
      <Heading id="accept-into" level={3} size="base" weight="semibold">
        Accept into
      </Heading>
      <dl className="flex flex-col">
        <PropertyRow icon={FolderKanban} label="Project">
          <PickerMenu
            label="Project"
            value={routing.projectId}
            onValueChange={(projectId) => onChange({ ...routing, projectId })}
            token={
              <>
                <Spoken>Project:</Spoken>
                {project.name}
              </>
            }
          >
            {projects.map((p) => (
              <Choice key={p.id} value={p.id} start={null}>
                {p.name}
              </Choice>
            ))}
          </PickerMenu>
        </PropertyRow>
        <PropertyRow icon={CircleUser} label="Assignee">
          <PickerMenu
            label="Assignee"
            value={routing.assigneeId}
            onValueChange={(assigneeId) => onChange({ ...routing, assigneeId })}
            avatar={<Token.Avatar name={assignee.name} src={assignee.avatar} alt="" />}
            token={
              <>
                <Spoken>Assigned to</Spoken>
                {assignee.name}
              </>
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
        </PropertyRow>
        <PropertyRow icon={Calendar} label="Due">
          <span className="flex">
            <Token
              onClick={() =>
                shell.notBuilt('Picking the date here; Accept’s dialog has the picker')
              }
            >
              <Spoken>Due</Spoken>
              {shortDate.format(day(routing.due))}
            </Token>
          </span>
        </PropertyRow>
        <PropertyRow icon={Tag} label="Priority">
          <PickerMenu
            label="Priority"
            value={routing.priority}
            onValueChange={(value) => onChange({ ...routing, priority: value as TaskPriority })}
            startIcon={<PriorityMark priority={routing.priority} />}
            token={
              <>
                <Spoken>Priority:</Spoken>
                {priority.label}
              </>
            }
          >
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
        </PropertyRow>
      </dl>
    </section>
  )
}

const DAY_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

/**
 * Possible duplicate: this request beside the open task it repeats, two
 * bordered cards (12 / 16 padding) of an eyebrow, a title, the words and
 * View Only tokens, then how their dates differ, Keep both and Merge.
 */
function Duplicate({
  request,
  task,
  actions,
}: {
  request: IntakeRequest
  task: Task
  actions: DetailActions
}) {
  const owner = personFor(task.assigneeId)
  const project = projectFor(task.projectId)
  const status = statusFor(task.status)
  const days = Math.round(
    (day(task.due).getTime() - day(request.routing.due).getTime()) / 86_400_000,
  )
  const gap = DAY_WORDS[Math.abs(days)] ?? String(Math.abs(days))
  const ownerName = firstName(task.assigneeId)
  const theirs = firstName(request.fromId)
  return (
    <>
      <div className="grid grid-cols-1 gap-3 @2xl/request:grid-cols-2">
        <CompareCard eyebrow="This request" title={request.title} body={request.answers[0].answer}>
          <Token startIcon={Calendar}>Due {shortDate.format(day(request.routing.due))}</Token>
        </CompareCard>
        <CompareCard
          eyebrow={`Open task · ${project?.name ?? task.team?.name ?? ''}`}
          title={task.title}
          body={task.description ?? ''}
          href={`#${taskPath(task)}`}
        >
          <Token startIcon={status.icon}>{status.label}</Token>
          <Token startIcon={CircleUser}>{owner.name}</Token>
          <Token startIcon={Calendar}>Due {shortDate.format(day(task.due))}</Token>
        </CompareCard>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Text size="sm" color="subtle" className="min-w-0 flex-1 basis-60">
          {days === 0
            ? `${ownerName}’s task is due the same day as ${theirs}’s.`
            : `${ownerName}’s task is due ${gap} ${Math.abs(days) === 1 ? 'day' : 'days'} ${days > 0 ? 'after' : 'before'} ${theirs}’s date.`}
        </Text>
        <Button appearance="ghost" onClick={actions.keepBoth}>
          Keep both
        </Button>
        <Button appearance="secondary" onClick={actions.merge}>
          Merge into {ownerName}’s task
        </Button>
      </div>
    </>
  )
}

function CompareCard({
  eyebrow,
  title,
  body,
  href,
  children,
}: {
  eyebrow: string
  title: string
  body: string
  href?: string
  children: ReactNode
}) {
  return (
    <Card className="gap-2 px-4">
      <Text size="sm" color="subtle">
        {eyebrow}
      </Text>
      {href ? (
        <a href={href} className="font-semibold text-content-emphasized hover:underline">
          {title}
        </a>
      ) : (
        <Text weight="semibold" color="emphasized">
          {title}
        </Text>
      )}
      <Text>{datedText(body)}</Text>
      <div className="flex flex-wrap gap-1">{children}</div>
    </Card>
  )
}

/** What an accepted request became: the task, as a link Token, and where it lives. */
function Outcome({ request, tasks }: { request: IntakeRequest; tasks: Task[] }) {
  const accepted = request.accepted!
  const task = tasks.find((t) => t.id === accepted.taskId)
  const project = projectFor(task?.projectId)
  return (
    <Card emphasis="subtle" className="shrink-0 flex-row flex-wrap items-center gap-2">
      <Badge color="green">{accepted.merged ? 'Merged' : 'Accepted'}</Badge>
      <Text render={<span />}>
        {shortDate.format(day(accepted.on))}, {accepted.merged ? 'into' : 'as'}
      </Text>
      {task ? (
        <Token href={`#${taskPath(task)}`} startIcon={statusFor(task.status).icon}>
          {task.title}
        </Token>
      ) : (
        <Token startIcon={CircleCheck}>a task that’s since been removed</Token>
      )}
      {project ? <Text render={<span />}>in {project.name}</Text> : null}
    </Card>
  )
}

/**
 * The reply box at the bottom of a waiting request (`Reply Box`, an Input
 * Group, Large): "Reply to Maya…", mention, attach and emoji, and send. On a
 * new request, Ask for info opens the same box to ask the first question;
 * sending it moves the request to Waiting.
 */
function Reply({
  to,
  asking,
  onSend,
}: {
  to: string
  asking: boolean
  onSend: (body: string) => void
}) {
  const shell = useShell()
  return (
    <ChatComposer
      aria-label={asking ? `Ask ${to}` : `Reply to ${to}`}
      placeholder={asking ? `Ask ${to} what you need to know…` : `Reply to ${to}…`}
      autoFocus={asking}
      actions={
        <>
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
        </>
      }
      onSubmit={onSend}
    />
  )
}
