import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowRight,
  AtSign,
  Calendar,
  ChevronDown,
  Circle,
  CircleCheckBig,
  CircleUser,
  ClipboardList,
  Ellipsis,
  FileText,
  FolderKanban,
  ListFilter,
  Maximize2,
  Paperclip,
  Plus,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Smile,
  Tag,
  ThumbsUp,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { ChatComposer } from '../../../../src/components/Chat'
import { Icon } from '../../../../src/components/Icon'
import { Panel } from '../../../../src/components/Panel'
import { Tabs } from '../../../../src/components/Tabs'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { PropertyRow } from '../../components/PropertyRow'
import { AssigneeToken, DueToken, PriorityToken, StatusToken } from '../../components/TaskTokens'
import { blockerOf, statusFor, subtaskCount } from '../../components/taskMeta'
import { addDays, datedText, day, sameDay, shortDate, today } from '../../data/dates'
import { personFor } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { Task, TaskComment, TaskEvent, TaskPriority } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { taskKey, taskPath, type ProjectTab } from './paths'
import { useTasks } from './tasksState'

/*
 * A task's detail in a `Panel` beside the List (`Task - Panel over List`,
 * `40006275:8516`), in the order Nathan settled for both of its containers:
 * the title, a blocked banner, the description, the properties, Linked,
 * Subtasks and Dependencies, then Comments and Activity in tabs with the
 * composer pinned under Comments. Empty sections hide. The full view
 * (`Task - Full view`, `40006275:12027`) is the same layout in two columns
 * and is not built yet.
 */

/**
 * Priority's label icon is the signal glyph at the task's level — `signal-high`
 * for High — the file's field icon, where the token beside it carries Nathan's
 * digit (`Priority Icon`).
 */
const PRIORITY_SIGNAL: Record<TaskPriority, LucideIcon> = {
  none: SignalZero,
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  critical: Signal,
}

/** A section's title: body size, semibold, as every panel section draws it. */
function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Heading level={4} id={id}>
      {children}
    </Heading>
  )
}

function Properties({ task }: { task: Task }) {
  const shell = useShell()
  const { updateTask } = useTasks()
  const project = projectFor(task.projectId)
  const onChange = (edit: Parameters<typeof updateTask>[1]) => updateTask(task.id, edit)
  return (
    <dl aria-label="Properties" className="flex flex-col">
      {/* The label icon follows the value, as the file draws it: `circle-slash` by Blocked. */}
      <PropertyRow icon={statusFor(task.status).icon} label="Status">
        <StatusToken task={task} onChange={onChange} />
      </PropertyRow>
      <PropertyRow icon={CircleUser} label="Assignee">
        <AssigneeToken task={task} onChange={onChange} />
      </PropertyRow>
      <PropertyRow icon={Calendar} label="Due">
        <DueToken
          label={shortDate.format(day(task.due))}
          onClick={() => shell.notBuilt('The due date picker')}
        />
      </PropertyRow>
      <PropertyRow icon={PRIORITY_SIGNAL[task.priority]} label="Priority">
        <PriorityToken task={task} onChange={onChange} />
      </PropertyRow>
      <PropertyRow icon={Tag} label="Phase">
        <Token onClick={() => shell.notBuilt('Moving a task to another phase')}>{task.phase}</Token>
      </PropertyRow>
      {project ? (
        <PropertyRow icon={FolderKanban} label="Project">
          <Token onClick={() => shell.notBuilt('Moving a task to another project')}>
            {project.name}
          </Token>
        </PropertyRow>
      ) : null}
      {task.estimate ? (
        <PropertyRow icon={Timer} label="Estimate">
          <Token onClick={() => shell.notBuilt('Changing the estimate')}>{task.estimate}</Token>
        </PropertyRow>
      ) : null}
    </dl>
  )
}

/**
 * Linked: the doc and the request a task came from. Links rather than values
 * (the file keeps them View Only for that reason), so each is a Token with an
 * `href`, to Docs and Requests, which are drawn and not built.
 */
function Linked({ task }: { task: Task }) {
  const { doc, request } = task.linked ?? {}
  if (!doc && !request) return null
  return (
    <section aria-labelledby={`${task.id}-linked`} className="flex flex-col gap-1">
      <SectionHeading id={`${task.id}-linked`}>Linked</SectionHeading>
      <dl className="flex flex-col">
        {doc ? (
          <PropertyRow icon={FileText} label="Doc">
            <Token href="#/docs">{doc}</Token>
          </PropertyRow>
        ) : null}
        {request ? (
          <PropertyRow icon={ClipboardList} label="Request">
            <Token href="#/requests">{request}</Token>
          </PropertyRow>
        ) : null}
      </dl>
    </section>
  )
}

/**
 * The checklist, each line `_Task Name Cell` with its status glyph. A line is
 * a checkbox you press anywhere on, so ticking one moves the count here and
 * the List's `list-tree` meta together.
 */
function Subtasks({ task }: { task: Task }) {
  const shell = useShell()
  const { toggleSubtask } = useTasks()
  const count = subtaskCount(task)
  if (!task.subtasks || !count) return null
  return (
    <section aria-labelledby={`${task.id}-subtasks`} className="flex flex-col gap-2 pt-3">
      <div className="flex items-center gap-2">
        <SectionHeading id={`${task.id}-subtasks`}>Subtasks</SectionHeading>
        <Text render={<span />} size="sm" color="subtle" className="ml-auto">
          {count.done} of {count.total}
          <span className="sr-only"> done</span>
        </Text>
      </div>
      <ul className="flex flex-col gap-2">
        {task.subtasks.map((sub) => (
          <li key={sub.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={sub.done}
              onClick={() => toggleSubtask(task.id, sub.id)}
              className={cn(
                'flex h-6 w-full cursor-pointer items-center gap-2 rounded-sm text-left text-content-primary',
                focusRing,
              )}
            >
              <Icon icon={sub.done ? CircleCheckBig : Circle} />
              <span className="min-w-0 flex-1 truncate">{sub.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* No padding round it: the file sets this one to spacing/0, so its
          plus sits under the glyphs above. */}
      <Button
        appearance="ghost"
        size="small"
        startIcon={Plus}
        className="self-start px-0"
        onClick={() => shell.notBuilt('Adding subtasks')}
      >
        Add subtask
      </Button>
    </section>
  )
}

interface DependencyRow {
  kind: 'Blocked by' | 'Blocks'
  task: Task
  /** The date on the right: when the blocker is due, or when the blocked task can start. */
  meta: string
}

/**
 * Dependencies, both ways: what this task waits on and what waits on it. A
 * lag is the gap the file draws between them — the permit plus five days
 * is when equipment can arrive, "5d lag · Nov 23".
 */
function Dependencies({ task, tasks }: { task: Task; tasks: Task[] }) {
  const tab = useParams().tab as ProjectTab
  const rows: DependencyRow[] = [
    ...(task.dependsOn ?? []).flatMap((dep) => {
      const blocker = tasks.find((t) => t.id === dep.taskId)
      return blocker
        ? [{ kind: 'Blocked by' as const, task: blocker, meta: shortDate.format(day(blocker.due)) }]
        : []
    }),
    ...tasks.flatMap((other) => {
      const dep = other.dependsOn?.find((d) => d.taskId === task.id)
      if (!dep) return []
      const meta = dep.lagDays
        ? `${dep.lagDays}d lag · ${shortDate.format(addDays(day(task.due), dep.lagDays))}`
        : shortDate.format(day(other.due))
      return [{ kind: 'Blocks' as const, task: other, meta }]
    }),
  ]
  if (rows.length === 0) return null
  return (
    <section aria-labelledby={`${task.id}-dependencies`} className="flex flex-col gap-2 pt-3">
      <SectionHeading id={`${task.id}-dependencies`}>Dependencies</SectionHeading>
      <ul className="flex flex-col">
        {rows.map((row) => {
          const status = statusFor(row.task.status)
          return (
            <li key={`${row.kind}-${row.task.id}`} className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-content-subtle">{row.kind}</span>
              {/* Opens that task in this panel, in place. */}
              <a
                href={`#${taskPath(row.task, tab)}`}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-sm text-content-primary hover:underline',
                  focusRing,
                )}
              >
                <Icon icon={status.icon} />
                <span className="truncate">
                  {row.task.title}
                  <span className="sr-only">, {status.label}</span>
                </span>
              </a>
              <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                {row.meta}
              </Text>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** `_Inbox Comment`: a 24px face, then the name and age over the words. The inbox's too. */
export function Comment({ comment }: { comment: TaskComment }) {
  const author = personFor(comment.authorId)
  return (
    <div className="flex gap-2">
      <Avatar name={author.name} src={author.avatar} alt="" size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold text-content-emphasized">
            {author.name}
          </span>
          <Text render={<span />} size="sm" color="subtle" className="shrink-0">
            {comment.age}
          </Text>
        </div>
        <Text>{datedText(comment.body)}</Text>
      </div>
    </div>
  )
}

/**
 * Under a comment, one face in: its thumbs-up with the count, and Reply.
 * The thumbs-up is yours to press; the count goes up by one while it is.
 */
function Reactions({ comment }: { comment: TaskComment }) {
  const shell = useShell()
  const [liked, setLiked] = useState(false)
  const count = (comment.likes ?? 0) + (liked ? 1 : 0)
  return (
    <div className="flex items-center gap-1 pl-8">
      <Button
        appearance="ghost"
        size="small"
        startIcon={ThumbsUp}
        aria-pressed={liked}
        aria-label={count ? `Like, ${count}` : 'Like'}
        onClick={() => setLiked((value) => !value)}
      >
        {count ? String(count) : undefined}
      </Button>
      <Button appearance="ghost" size="small" onClick={() => shell.notBuilt('Replies')}>
        Reply
      </Button>
    </div>
  )
}

function Comments({ task }: { task: Task }) {
  const comments = task.comments ?? []
  if (comments.length === 0) {
    return (
      <Text size="sm" color="subtle" className="text-center">
        No comments yet. Start the conversation below.
      </Text>
    )
  }
  return (
    // The log is a wrapper: on the <ul> itself the role would replace the list's.
    <div role="log" aria-label="Comments">
      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex flex-col gap-3">
            <Comment comment={comment} />
            <Reactions comment={comment} />
            {comment.replies?.length ? (
              <ul
                aria-label={`Replies to ${personFor(comment.authorId).name}`}
                className="flex flex-col gap-2 pl-8"
              >
                {comment.replies.map((reply) => (
                  <li key={reply.id}>
                    <Comment comment={reply} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The Activity tab's three buckets, as `Task - Activity log` heads them. */
function bucket(at: Date): 'Today' | 'Yesterday' | 'Earlier' {
  if (sameDay(at, today)) return 'Today'
  if (sameDay(at, addDays(today, -1))) return 'Yesterday'
  return 'Earlier'
}

/** A line's leading mark, 20px: the person's face, a rule's `zap`, or Yak's scribble. */
function Actor({ actor }: { actor: TaskEvent['actor'] }) {
  if (actor === 'rule' || actor === 'yak') {
    return (
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-content-primary">
        {actor === 'rule' ? <Icon icon={Zap} size="small" /> : <YakMark className="size-4" />}
      </span>
    )
  }
  const person = personFor(actor)
  return <Avatar name={person.name} src={person.avatar} alt="" size="x-small" className="mt-0.5" />
}

/**
 * The Activity tab (`Task - Activity log`, `40006307:38076`): every change,
 * newest first, under Today, Yesterday and Earlier. A change of value reads
 * as two view-only Tokens with an arrow between. Edits made in this mock land
 * at the top as yours. The filter is drawn and not built.
 */
function Activity({ task }: { task: Task }) {
  const shell = useShell()
  const events = task.activity ?? []
  const groups = (['Today', 'Yesterday', 'Earlier'] as const)
    .map((label) => ({ label, events: events.filter((event) => bucket(event.at) === label) }))
    .filter((group) => group.events.length > 0)
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, i) => (
        <section key={group.label} aria-label={group.label} className="flex flex-col gap-3">
          <div className="flex min-h-8 items-center">
            <Text render={<h4 />} size="sm" weight="semibold" color="subtle">
              {group.label}
            </Text>
            {i === 0 ? (
              <Button
                appearance="ghost"
                startIcon={ListFilter}
                endIcon={ChevronDown}
                className="ml-auto"
                onClick={() => shell.notBuilt('Filtering activity')}
              >
                All changes
              </Button>
            ) : null}
          </div>
          <ol className="flex flex-col gap-3">
            {group.events.map((event) => (
              <li key={event.id} className="flex gap-2">
                <Actor actor={event.actor} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Text>{event.text}</Text>
                  {event.change ? (
                    <div className="flex items-center gap-1">
                      <Token>{datedText(event.change.from)}</Token>
                      <Icon icon={ArrowRight} size="small" />
                      <span className="sr-only">to</span>
                      <Token>{datedText(event.change.to)}</Token>
                    </div>
                  ) : null}
                </div>
                <Text render={<span />} size="sm" color="subtle" className="mt-0.5 shrink-0">
                  {shortDate.format(event.at)}
                </Text>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

type DetailTab = 'comments' | 'activity'

/** Comments, then Activity, behind tabs whose strip sticks to the top of the scroll. */
function DetailTabs({
  task,
  tab,
  onTabChange,
}: {
  task: Task
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
}) {
  const count = (task.comments ?? []).reduce(
    (sum, comment) => sum + 1 + (comment.replies?.length ?? 0),
    0,
  )
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as DetailTab)}
      className="px-4 pt-2"
    >
      <Tabs.List
        aria-label="Task conversation"
        className="sticky top-0 z-10 bg-surface-background-primary"
      >
        <Tabs.Tab value="comments">{count ? `Comments · ${count}` : 'Comments'}</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="comments" className="py-4">
        <Comments task={task} />
      </Tabs.Panel>
      <Tabs.Panel value="activity" className="py-4">
        <Activity task={task} />
      </Tabs.Panel>
    </Tabs>
  )
}

/** The composer under Comments: `Leave a comment. @mention to notify`. */
function CommentComposer({ task }: { task: Task }) {
  const shell = useShell()
  const { addComment } = useTasks()
  return (
    <ChatComposer
      aria-label="Leave a comment"
      placeholder="Leave a comment. @mention to notify"
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
      onSubmit={(body) => addComment(task.id, body)}
    />
  )
}

/**
 * The task panel. `taskId` is kept by the page after the URL drops it, so
 * the panel slides out with the task it was showing; another task opened
 * while it is open swaps in place.
 *
 * The Panel is always mounted, empty until a task is asked for, so it sees
 * `open` go from false to true and moves focus in. One that mounted already
 * open would count as there on load and leave focus where it was — right for
 * a link opened cold, wrong for a row just pressed.
 */
export function TaskPanel({
  taskId,
  open,
  onClose,
}: {
  taskId?: string
  open: boolean
  onClose: () => void
}) {
  const { tasks } = useTasks()
  const task = tasks.find((t) => t.id === taskId)
  return (
    <Panel
      aria-label="Task"
      open={open && task !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      {task ? <TaskDetail task={task} tasks={tasks} /> : null}
    </Panel>
  )
}

function TaskDetail({ task, tasks }: { task: Task; tasks: Task[] }) {
  const navigate = useNavigate()
  const shell = useShell()
  const [tab, setTab] = useState<DetailTab>('comments')
  // The view the panel is open over, so a dependency opens over it too.
  const view = useParams().tab as ProjectTab
  const blocker = blockerOf(task, tasks)

  return (
    <>
      <Panel.Header
        icon={FileText}
        actions={
          <>
            <Button
              appearance="ghost"
              startIcon={Maximize2}
              aria-label="Open full view"
              onClick={() => shell.notBuilt('The full task view')}
            />
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Task actions')}
            />
          </>
        }
      >
        {taskKey(task)}
      </Panel.Header>
      {/* Keyed by task, so opening another one starts it at the top. */}
      <Panel.Body key={task.id} className="p-0">
        <div className="flex flex-col gap-3 px-4 pb-4">
          <Heading level={3} size="xl" weight="bold">
            {task.title}
          </Heading>
          {blocker ? (
            <Card emphasis="subtle" className="flex-row items-center">
              <Badge color="red">Blocked</Badge>
              <Text render={<span />} size="sm" className="min-w-0 flex-1 truncate">
                Waiting on {blocker.title}
              </Text>
              <Button
                appearance="secondary"
                size="small"
                aria-label={`Open ${blocker.title}`}
                onClick={() => navigate(taskPath(blocker, view))}
              >
                Open
              </Button>
            </Card>
          ) : null}
          {task.description ? <Text>{datedText(task.description)}</Text> : null}
          <Properties task={task} />
          <Linked task={task} />
          <Subtasks task={task} />
          <Dependencies task={task} tasks={tasks} />
        </div>
        <DetailTabs task={task} tab={tab} onTabChange={setTab} />
      </Panel.Body>
      {tab === 'comments' ? (
        <Panel.Footer>
          <CommentComposer task={task} />
        </Panel.Footer>
      ) : null}
    </>
  )
}
