import { useState } from 'react'
import { AtSign, Check, Circle, FolderKanban, Paperclip, Smile, Users } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { ChatComposer } from '../../../../src/components/Chat'
import { Icon } from '../../../../src/components/Icon'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { PropertyRow } from '../../components/PropertyRow'
import { statusFor } from '../../components/taskMeta'
import { datedText, day, shortDate } from '../../data/dates'
import type { DocThread, ProjectDoc } from '../../data/docs'
import { personFor } from '../../data/people'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { Comment } from '../project/TaskPanel'
import { inlineTaskIds, linkedOrder, type VersionRow } from './model'

/** A section of the side column: a 14 semibold title, then its rows 8 under it. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <Heading level={2} size="base">
        {title}
      </Heading>
      {children}
    </section>
  )
}

/**
 * `_Task Name Cell`, as the side column lists linked tasks: the status glyph,
 * then the name, 24 tall. Each opens the task's panel over the doc.
 */
function TaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex h-6 min-w-0 items-center gap-2 rounded-sm text-left hover:underline',
        focusRing,
      )}
    >
      <Icon icon={statusFor(task.status).icon} className="shrink-0" />
      <span className="min-w-0 truncate">{task.title}</span>
      <span className="sr-only">, {statusFor(task.status).label}</span>
    </button>
  )
}

/**
 * The side column at rest (`Linked`, in `Docs - Austin opening plan`):
 * Linked tasks, then Details — Project and Access as `_Property Row`s with
 * view-only Tokens. The tasks the doc mentions come first; the rest of what
 * it is linked to wait behind "Show N more" (FINDINGS 96).
 */
export function DetailsSide({
  doc,
  project,
  tasks,
  onOpenTask,
}: {
  doc: ProjectDoc
  project: Project
  tasks: Task[]
  onOpenTask: (task: Task) => void
}) {
  const [all, setAll] = useState(false)
  const order = linkedOrder(doc)
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t))
  const mentioned = new Set(inlineTaskIds(doc.blocks ?? []))
  const first = order.filter((t) => mentioned.has(t.id))
  const shown = all || first.length === 0 ? order : first
  const more = order.length - shown.length
  const total = order.length || doc.linkedCount || 0

  return (
    <>
      <Section title={`Linked tasks · ${total}`}>
        {order.length === 0 ? (
          <Text color="subtle">
            {total ? 'This project’s tasks are not in the mock.' : 'No tasks linked yet.'}
          </Text>
        ) : (
          <ul className="flex flex-col gap-1">
            {shown.map((task) => (
              <li key={task.id} className="flex">
                <TaskRow task={task} onOpen={() => onOpenTask(task)} />
              </li>
            ))}
          </ul>
        )}
        {more > 0 ? (
          <Button
            appearance="ghost"
            size="small"
            className="self-start"
            onClick={() => setAll(true)}
          >
            {`Show ${more} more`}
          </Button>
        ) : null}
      </Section>
      <Section title="Details">
        <dl>
          <PropertyRow icon={FolderKanban} label="Project">
            <Token>{project.name}</Token>
          </PropertyRow>
          <PropertyRow icon={Users} label="Access">
            <Token>Project members</Token>
          </PropertyRow>
        </dl>
      </Section>
    </>
  )
}

/**
 * What Yak found to do (`Docs - Yak finds to-dos`): its mark and the count,
 * each to-do as a `_Task Name Cell` with an open circle and its owner and
 * date under it, then Create N tasks and Not now.
 */
export function TodosCard({
  todos,
  onCreate,
  onDismiss,
}: {
  todos: { title: string; assigneeId: string; due: string }[]
  onCreate: () => void
  onDismiss: () => void
}) {
  const count = todos.length
  return (
    <Card emphasis="subtle" padding={3} className="gap-2" role="group" aria-label="Yak’s to-dos">
      <div className="flex items-center gap-2">
        <YakMark className="size-4 text-content-emphasized" />
        <Text render={<span />} size="sm" weight="semibold" color="emphasized">
          {`Yak found ${count} to-do${count === 1 ? '' : 's'} in this doc`}
        </Text>
      </div>
      <ul className="flex flex-col gap-2">
        {todos.map((todo) => {
          const person = personFor(todo.assigneeId)
          return (
            <li key={todo.title} className="flex flex-col gap-0.5">
              <span className="flex h-6 items-center gap-2">
                <Icon icon={Circle} className="shrink-0" />
                {todo.title}
              </span>
              <span className="flex items-center gap-1 pl-6">
                <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
                <Text render={<span />} size="sm" color="subtle">
                  {person.name} · {shortDate.format(day(todo.due))}
                </Text>
              </span>
            </li>
          )
        })}
      </ul>
      <div className="flex gap-2">
        <Button appearance="secondary" size="small" onClick={onCreate}>
          {`Create ${count} task${count === 1 ? '' : 's'}`}
        </Button>
        <Button appearance="ghost" size="small" onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </Card>
  )
}

/** The reply box under a thread: Mention, Attach and Emoji, then Resolve and Send. */
function ThreadComposer({
  placeholder,
  autoFocus,
  onSend,
  onResolve,
}: {
  placeholder: string
  autoFocus?: boolean
  onSend: (body: string) => void
  onResolve?: () => void
}) {
  const shell = useShell()
  return (
    <ChatComposer
      aria-label={placeholder.replace('…', '')}
      placeholder={placeholder}
      rows={1}
      autoFocus={autoFocus}
      onSubmit={onSend}
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
      endActions={
        onResolve ? (
          <Button
            appearance="ghost"
            size="small"
            startIcon={Check}
            aria-label="Resolve"
            onClick={onResolve}
          />
        ) : undefined
      }
    />
  )
}

/**
 * Comments (`Docs - Comments and Yak suggestion`): "Comments · N", then a
 * thread per open conversation — the quoted words in italic, each comment as
 * `_Inbox Comment`, the reply box last. A comment just started from the
 * paragraph bar comes first, its box already focused.
 */
export function CommentsSide({
  threads,
  openId,
  draft,
  onStart,
  onCancelDraft,
  onReply,
  onResolve,
  onSelectThread,
}: {
  threads: DocThread[]
  openId?: string
  draft?: { quote: string }
  onStart: (body: string) => void
  onCancelDraft: () => void
  onReply: (threadId: string, body: string) => void
  onResolve: (thread: DocThread) => void
  onSelectThread: (threadId: string) => void
}) {
  const count = threads.reduce((sum, t) => sum + t.comments.length, 0)
  return (
    <Section title={`Comments · ${count}`}>
      {draft ? (
        <div className="flex flex-col gap-2 rounded-lg border border-surface-border p-3">
          <Text size="sm" color="subtle" italic>
            “{draft.quote}”
          </Text>
          <ThreadComposer placeholder="Comment…" autoFocus onSend={onStart} />
          <Button appearance="ghost" size="small" className="self-start" onClick={onCancelDraft}>
            Cancel
          </Button>
        </div>
      ) : null}
      {threads.length === 0 && !draft ? (
        <Text color="subtle">
          No open comments. Select a paragraph and choose Comment to start one.
        </Text>
      ) : null}
      {threads.map((thread) => (
        <div
          key={thread.id}
          onFocusCapture={() => onSelectThread(thread.id)}
          className={cn(
            'flex flex-col gap-2 rounded-lg border p-3',
            thread.id === openId ? 'border-surface-border-emphasized' : 'border-surface-border',
          )}
        >
          <Text size="sm" color="subtle" italic>
            “{thread.quote}”
          </Text>
          {thread.comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
          <ThreadComposer
            placeholder="Reply…"
            onSend={(body) => onReply(thread.id, body)}
            onResolve={() => onResolve(thread)}
          />
        </div>
      ))}
    </Section>
  )
}

/**
 * Version history (`Docs - Version history`): one 60-tall row a version, a
 * face, when, and who — "current" on the doc as it stands, "created" on the
 * first. Picking an older one compares the doc against it; the row it is on
 * takes the subtle fill.
 */
export function HistorySide({
  versions,
  comparing,
  onPick,
}: {
  versions: VersionRow[]
  comparing?: string
  onPick: (version: VersionRow) => void
}) {
  return (
    <Section title="Version history">
      <ul className="flex flex-col gap-0.5">
        {versions.map((version) => {
          const author = personFor(version.authorId)
          const note = version.current ? 'current' : version.note
          return (
            <li key={version.id} className="flex">
              <button
                type="button"
                aria-pressed={version.id === comparing}
                onClick={() => onPick(version)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-md p-2 text-left hover:bg-action-ghost-background-hover',
                  version.id === comparing && 'bg-surface-background-subtle',
                  focusRing,
                )}
              >
                <Avatar name={author.name} src={author.avatar} alt="" size="small" />
                <span className="flex min-w-0 flex-col">
                  <span>{datedText(version.label)}</span>
                  <Text render={<span />} size="sm" color="subtle">
                    {author.name}
                    {note ? ` · ${note}` : ''}
                  </Text>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
