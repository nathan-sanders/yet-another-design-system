import { Fragment, useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Check, Ellipsis, Inbox } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { usePhone } from '../../../../src/lib/viewport'
import { LATER_TIMES, type LaterTime } from '../../data/inbox'
import { me, personFor } from '../../data/people'
import { useTasks } from '../project/tasksState'
import { InboxDetail, type DetailActions } from './InboxDetail'
import { useInbox, type Message } from './inboxState'
import { InboxSettings } from './InboxSettings'
import { MessageCard } from './MessageCard'
import {
  caughtUpLine,
  countFor,
  dayGroup,
  INBOX_TABS,
  inboxPath,
  messagesIn,
  type InboxView,
} from './model'

/** `#/inbox` opens on Primary. */
export function InboxIndex() {
  return <Navigate to="/inbox/primary" replace />
}

const TAB_TITLES: Record<InboxView, string> = {
  primary: 'Primary',
  other: 'Other',
  later: 'Later',
  cleared: 'Cleared',
}

export function InboxScreen() {
  const { view } = useParams()
  const tab = INBOX_TABS.find((t) => t.id === view)
  if (!tab) return <InboxIndex />
  return <InboxPage view={tab.id} />
}

/**
 * Inbox (`Inbox - Approval`, `40006278:12738`): "Inbox" and the Segment
 * Control — Primary, Other, Later, Cleared, each with its count — then Clear
 * all and More in the Top Bar. Under it, the messages in a 432 column,
 * grouped Today, Yesterday and Earlier, and the open one beside them. The
 * segment is in the path and the message in `?item=`; with none chosen, the
 * first is shown without being marked read.
 *
 * Clear, Later, Clear all and Approve each say what they did in a toast with
 * Undo, and ⌘Z undoes the last one, as `Inbox - Later and undo` draws. An
 * empty Primary is the file's "You're all caught up". Below 768 the list and
 * the message take turns.
 */
function InboxPage({ view }: { view: InboxView }) {
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const [params, setParams] = useSearchParams()
  const inbox = useInbox()
  const { tasks, approveReview, restoreTask, addComment } = useTasks()
  const listed = useMemo(() => messagesIn(inbox.messages, view), [inbox.messages, view])
  const chosenId = params.get('item')
  const chosen = listed.find((m) => m.id === chosenId)
  // With none chosen the first is shown beside the list; on a phone, where
  // the two take turns, the list shows alone (Yet Social's inbox does the same).
  const phone = usePhone()
  const open = chosen ?? (phone ? undefined : listed[0])
  const taskOf = (m?: Message) => tasks.find((t) => t.id === m?.taskId)
  const settingsOpen = params.get('settings') === '1'

  // ⌘Z (Ctrl+Z elsewhere) undoes the last inbox change, never a field's typing.
  const { undo, canUndo } = inbox
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.key.toLowerCase() !== 'z')
        return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      if (!canUndo) return
      event.preventDefault()
      undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, canUndo])

  const say = (title: string, description?: string) =>
    toast.add({ title, description, action: { label: 'Undo', onClick: inbox.undo } })

  const actionsFor = (message: Message): DetailActions => ({
    later: (back: LaterTime) => {
      inbox.remember()
      inbox.later([message.id], back)
      say('Moved to Later', `Back ${LATER_TIMES.find((t) => t.id === back)!.back}.`)
      navigate(inboxPath(view), { replace: true })
    },
    clear: () => {
      inbox.remember()
      inbox.clear([message.id])
      say('Cleared', message.summary)
      navigate(inboxPath(view), { replace: true })
    },
    approve: () => {
      const task = taskOf(message)
      if (!task || !message.approval) return
      const next = personFor(message.approval.nextId).name.split(' ')[0]
      inbox.remember(() => restoreTask(task))
      approveReview(task.id, message.approval.nextId)
      inbox.clear([message.id])
      say(`${task.short ?? task.title} approved. ${next} is next.`)
      navigate(inboxPath(view), { replace: true })
    },
    reply: (body: string, clear: boolean) => {
      const task = taskOf(message)
      if (!task) return
      addComment(task.id, body)
      inbox.addReply(message.id, {
        id: `${message.id}-reply-${message.replies.length + 1}`,
        authorId: me.id,
        age: 'Just now',
        body,
      })
      if (clear) {
        inbox.remember()
        inbox.clear([message.id])
        say('Replied and cleared', `${personFor(message.from).name} will see it on the task.`)
        navigate(inboxPath(view), { replace: true })
      }
    },
  })

  const clearAll = () => {
    const ids = listed.map((m) => m.id)
    inbox.remember()
    inbox.clear(ids)
    say(`Cleared ${ids.length}`, 'They’re in Cleared if you need them.')
    navigate(inboxPath(view), { replace: true })
  }

  const counts = Object.fromEntries(INBOX_TABS.map((t) => [t.id, countFor(inbox.messages, t.id)]))
  const later = messagesIn(inbox.messages, 'later')
  const groups = [...new Set(listed.map((m) => dayGroup(m)))]

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Inbox
            </Heading>
            <div className="-my-1 min-w-0 overflow-x-auto py-1">
              <SegmentedControl
                aria-label="Messages"
                appearance="secondary"
                value={view}
                onValueChange={(next) => navigate(inboxPath(next as InboxView))}
              >
                {INBOX_TABS.map((t) => (
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
            {listed.length && (view === 'primary' || view === 'other') ? (
              <Button
                appearance="ghost"
                startIcon={Check}
                className="max-md:hidden"
                onClick={clearAll}
              >
                Clear all
              </Button>
            ) : null}
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Inbox options">
                <Menu.Group>
                  <Menu.Item
                    disabled={!listed.some((m) => m.unread)}
                    onClick={() => inbox.markRead(listed.map((m) => m.id))}
                  >
                    Mark all as read
                  </Menu.Item>
                  <Menu.Item
                    onClick={() =>
                      setParams((p) => {
                        p.set('settings', '1')
                        return p
                      })
                    }
                  >
                    Inbox settings
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className="flex-row gap-0 overflow-hidden p-0">
        {listed.length === 0 ? (
          <Empty view={view} laterLine={caughtUpLine(later)} />
        ) : (
          <>
            <nav
              aria-label={`${TAB_TITLES[view]} messages`}
              className={
                'flex w-full shrink-0 flex-col gap-1 overflow-y-auto border-surface-border px-2 py-3 md:w-108 md:border-r' +
                (chosen ? ' max-md:hidden' : '')
              }
            >
              {groups.map((group) => {
                const inGroup = listed.filter((m) => dayGroup(m) === group)
                return (
                  <section key={group} aria-label={group} className="flex flex-col">
                    <Text
                      render={<h2 />}
                      size="sm"
                      weight="semibold"
                      color="subtle"
                      className="px-2 pt-2 pb-1"
                    >
                      {group}
                    </Text>
                    <ul className="flex flex-col">
                      {inGroup.map((message, i) => (
                        <Fragment key={message.id}>
                          {/* The file's Divider between messages, inset under a selected card. */}
                          {i > 0 ? (
                            <li aria-hidden className="mx-0.5 border-t border-surface-border" />
                          ) : null}
                          <li className="flex py-0.5">
                            <MessageCard
                              message={message}
                              task={taskOf(message)}
                              href={`#${inboxPath(view, message.id)}`}
                              selected={message.id === open?.id}
                            />
                          </li>
                        </Fragment>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </nav>
            {open ? (
              <div className={chosen ? 'flex min-w-0 flex-1' : 'flex min-w-0 flex-1 max-md:hidden'}>
                <InboxDetail
                  key={open.id}
                  message={open}
                  task={taskOf(open)}
                  actions={actionsFor(open)}
                  onBack={() => navigate(inboxPath(view))}
                  backLabel={TAB_TITLES[view]}
                />
              </div>
            ) : null}
          </>
        )}
      </AppShell.Content>
      <InboxSettings
        open={settingsOpen}
        onClose={() =>
          setParams((p) => {
            p.delete('settings')
            return p
          })
        }
      />
    </>
  )
}

/**
 * An empty segment. Primary's is `Inbox - All caught up` (`40006316:52229`):
 * the inbox glyph in a 48 subtle tile, the heading, what comes back from
 * Later and when, then See Later (Secondary) and See cleared (Ghost). The
 * others say only that they are empty.
 */
function Empty({ view, laterLine }: { view: InboxView; laterLine: string }) {
  const navigate = useNavigate()
  const words: Record<InboxView, { title: string; body: string }> = {
    primary: { title: 'You’re all caught up', body: laterLine },
    other: {
      title: 'Nothing else',
      body: 'Updates you follow land here when they don’t need you.',
    },
    later: {
      title: 'Nothing put off',
      body: 'Use Later on a message to bring it back when you’re ready.',
    },
    cleared: { title: 'Nothing cleared yet', body: 'Messages you clear wait here for 30 days.' },
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-primary">
        <Icon icon={Inbox} />
      </span>
      <div className="flex flex-col gap-2">
        <Heading level={2} size="xl" weight="semibold">
          {words[view].title}
        </Heading>
        <Text color="subtle">{words[view].body}</Text>
      </div>
      {view === 'primary' ? (
        <div className="flex gap-2">
          <Button appearance="secondary" onClick={() => navigate(inboxPath('later'))}>
            See Later
          </Button>
          <Button appearance="ghost" onClick={() => navigate(inboxPath('cleared'))}>
            See cleared
          </Button>
        </div>
      ) : null}
    </div>
  )
}
