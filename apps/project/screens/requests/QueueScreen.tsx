import { Fragment, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { ClipboardList, Ellipsis, Send } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { usePhone } from '../../../../src/lib/viewport'
import { fileIso, today } from '../../data/dates'
import { me } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { IntakeRequest, RequestRouting } from '../../data/requests'
import type { Task } from '../../data/types'
import { taskKey } from '../project/paths'
import { useTasks } from '../project/tasksState'
import { AcceptDialog, type Acceptance } from './AcceptDialog'
import { FormsMenu } from './FormsMenu'
import {
  countFor,
  descriptionFrom,
  firstName,
  nextTaskNumber,
  QUEUE_TABS,
  requestsIn,
  type QueueView,
} from './model'
import { minePath, queuePath } from './paths'
import { RequestCard } from './RequestCard'
import { RequestDetail, type DetailActions } from './RequestDetail'
import { useRequests } from './requestsState'

/** `#/requests` and `#/requests/queue` open on New. */
export function RequestsIndex() {
  return <Navigate to={queuePath('new')} replace />
}

export function QueueScreen() {
  const { view } = useParams()
  const tab = QUEUE_TABS.find((t) => t.id === view)
  if (!tab) return <RequestsIndex />
  return <QueuePage view={tab.id} />
}

/**
 * Requests (`Requests - Queue`, `40006284:19161`, and the deep dive's
 * `Waiting on requester`, `40006300:28384`): "Requests" and the Segment
 * Control — New, Waiting, Accepted, Declined, the two that wait on someone
 * carrying their count — then Forms and More. Under it the requests in a 432
 * column and the open one beside them. The segment is in the path and the
 * request in `?item=`; with none chosen the first is shown.
 *
 * Accept, Decline, Ask for info and Merge each say what they did in a toast
 * with Undo. Accepting makes a real task in its project (or adds the request
 * to one), so it is in that project's List and Board straight away.
 *
 * The queue frames draw no way to My requests, and the My requests frame
 * (`40006301:30717`) draws a "Queue · 5 / My requests" segment the queue
 * frames don't have, so the queue gets a My requests button (FINDINGS 89).
 * Below 768 the list and the request take turns.
 */
function QueuePage({ view }: { view: QueueView }) {
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const [params] = useSearchParams()
  const queue = useRequests()
  const { tasks, addTask, removeTask, mergeRequest, restoreTask } = useTasks()
  const listed = requestsIn(queue.requests, view)
  const chosen = listed.find((r) => r.id === params.get('item'))
  const phone = usePhone()
  const open = chosen ?? (phone ? undefined : listed[0])
  const [accepting, setAccepting] = useState<{ id: string; routing: RequestRouting } | null>(null)
  const acceptingRequest = queue.requests.find((r) => r.id === accepting?.id)

  const say = (title: string, description?: string) =>
    toast.add({ title, description, action: { label: 'Undo', onClick: queue.undo } })
  const backToList = () => navigate(queuePath(view), { replace: true })

  const mergeInto = (request: IntakeRequest, task: Task, reply: string) => {
    const before = task
    queue.remember(() => restoreTask(before))
    mergeRequest(task.id, { title: request.title, fromName: firstName(request.fromId) })
    queue.accept(request.id, task.id, reply, true)
    say(
      `Merged into ${task.title}`,
      `${firstName(request.fromId)} and ${firstName(task.assigneeId)} both know.`,
    )
    backToList()
  }

  const finishAccept = (request: IntakeRequest, acceptance: Acceptance) => {
    setAccepting(null)
    if (acceptance.mode === 'existing') {
      const task = tasks.find((t) => t.id === acceptance.taskId)
      if (task) mergeInto(request, task, acceptance.reply)
      return
    }
    const { routing } = acceptance
    const project = projectFor(routing.projectId)!
    const number = nextTaskNumber(tasks, project.id)
    const task: Task = {
      id: `${project.key.toLowerCase()}-${number}`,
      projectId: project.id,
      number,
      title: acceptance.taskName,
      phase: 'From requests',
      assigneeId: routing.assigneeId,
      status: 'todo',
      priority: routing.priority,
      due: fileIso(acceptance.due),
      description: descriptionFrom(request.answers),
      linked: { request: request.title },
      activity: [
        {
          id: `${request.id}-accepted`,
          actor: me.id,
          text: `You accepted ${firstName(request.fromId)}’s request as this task`,
          at: today,
        },
      ],
    }
    addTask(task)
    queue.remember(() => removeTask(task.id))
    queue.accept(request.id, task.id, acceptance.reply)
    say(
      `${taskKey(task)} added to ${project.name}`,
      `${firstName(request.fromId)} will hear back in Inbox.`,
    )
    backToList()
  }

  const actionsFor = (request: IntakeRequest): DetailActions => ({
    accept: (routing) => setAccepting({ id: request.id, routing }),
    decline: () => {
      queue.remember()
      queue.decline(request.id, `You declined it, and ${firstName(request.fromId)} was told.`)
      say('Declined', `${firstName(request.fromId)} will hear back in Inbox.`)
      backToList()
    },
    reopen: () => {
      queue.remember()
      queue.reopen(request.id)
      say('Moved back to New', request.title)
      backToList()
    },
    askForInfo: (body) => {
      queue.remember()
      queue.askForInfo(request.id, body)
      say('Moved to Waiting', `Yak will nudge ${firstName(request.fromId)} on Monday.`)
      backToList()
    },
    reply: (body) => queue.reply(request.id, body),
    nudge: () => {
      queue.nudge(request.id)
      toast.add({ title: `Nudged ${firstName(request.fromId)}` })
    },
    keepBoth: () => queue.keepBoth(request.id),
    merge: () => {
      const task = tasks.find((t) => t.id === request.duplicateOf)
      if (task) mergeInto(request, task, '')
    },
  })

  const counts = Object.fromEntries(QUEUE_TABS.map((t) => [t.id, countFor(queue.requests, t.id)]))

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Requests
            </Heading>
            <div className="-my-1 min-w-0 overflow-x-auto py-1">
              <SegmentedControl
                aria-label="Requests"
                appearance="secondary"
                value={view}
                onValueChange={(next) => navigate(queuePath(next as QueueView))}
              >
                {QUEUE_TABS.map((t) => (
                  <SegmentedControl.Item key={t.id} value={t.id}>
                    {counts[t.id] ? `${t.label} · ${counts[t.id]}` : t.label}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl>
            </div>
          </div>
        }
        end={
          <>
            <Button
              appearance="ghost"
              startIcon={Send}
              className="max-lg:hidden"
              onClick={() => navigate(minePath())}
            >
              My requests
            </Button>
            <FormsMenu className="max-md:hidden" />
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Requests options">
                <Menu.Group>
                  <Menu.Item startIcon={Send} onClick={() => navigate(minePath())}>
                    My requests
                  </Menu.Item>
                  <Menu.Item
                    startIcon={ClipboardList}
                    onClick={() => navigate('/requests/forms/creative?settings=1')}
                  >
                    Edit the Creative request form
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className="flex-row gap-0 overflow-hidden p-0">
        {listed.length === 0 ? (
          <Empty view={view} />
        ) : (
          <>
            <nav
              aria-label={`${QUEUE_TABS.find((t) => t.id === view)!.label} requests`}
              className={
                'flex w-full shrink-0 flex-col overflow-y-auto border-surface-border px-2 py-3 md:w-108 md:border-r' +
                (chosen ? ' max-md:hidden' : '')
              }
            >
              <ul className="flex flex-col gap-1">
                {listed.map((request, i) => (
                  <Fragment key={request.id}>
                    {i > 0 ? (
                      <li aria-hidden className="mx-0.5 border-t border-surface-border" />
                    ) : null}
                    <li className="flex">
                      <RequestCard
                        request={request}
                        href={`#${queuePath(view, request.id)}`}
                        selected={request.id === open?.id}
                      />
                    </li>
                  </Fragment>
                ))}
              </ul>
            </nav>
            {open ? (
              <div className={chosen ? 'flex min-w-0 flex-1' : 'flex min-w-0 flex-1 max-md:hidden'}>
                <RequestDetail
                  key={open.id}
                  request={open}
                  tasks={tasks}
                  actions={actionsFor(open)}
                  onBack={() => navigate(queuePath(view))}
                  backLabel={QUEUE_TABS.find((t) => t.id === view)!.label}
                />
              </div>
            ) : null}
          </>
        )}
      </AppShell.Content>
      <AcceptDialog
        request={acceptingRequest}
        routing={accepting?.routing}
        tasks={tasks}
        onClose={() => setAccepting(null)}
        onAccept={(acceptance) => acceptingRequest && finishAccept(acceptingRequest, acceptance)}
      />
    </>
  )
}

/** An empty segment says what would be there. Nothing in the file draws one. */
function Empty({ view }: { view: QueueView }) {
  const words: Record<QueueView, { title: string; body: string }> = {
    new: { title: 'No new requests', body: 'Requests sent through your forms land here.' },
    waiting: {
      title: 'Nothing waiting',
      body: 'Ask for info on a request and it waits here until they answer.',
    },
    accepted: {
      title: 'Nothing accepted yet',
      body: 'Requests you accept stay here, linked to their task.',
    },
    declined: {
      title: 'Nothing declined',
      body: 'Requests you decline wait here in case you change your mind.',
    },
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-primary">
        <Icon icon={ClipboardList} />
      </span>
      <div className="flex flex-col gap-2">
        <Heading level={2} size="xl" weight="semibold">
          {words[view].title}
        </Heading>
        <Text color="subtle">{words[view].body}</Text>
      </div>
    </div>
  )
}
