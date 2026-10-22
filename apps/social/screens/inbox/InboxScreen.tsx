import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { usePhone } from '../../../../src/lib/viewport'
import type { ReplyMode } from '../../components/ReplyBox'
import { replyAccountFor } from '../../data/inbox'
import { me } from '../../data/people'
import type { Ticket } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { Conversation } from './Conversation'
import { useInbox } from './inboxState'
import { MessageList } from './MessageList'
import { scopeFilter, visibleTickets, withViewer, type InboxScope, type SortKey } from './model'
import { PublicThread } from './PublicThread'

/** The top bar's title, and the phone's way back to the list. */
const SCOPE_TITLES: Record<InboxScope, string> = {
  all: 'All messages',
  mine: 'My inbox',
  assigned: 'All assignments',
  spam: 'Spam',
  complete: 'Complete',
}

const EMPTY: Record<InboxScope, string> = {
  all: 'No messages here. Everything is assigned.',
  mine: 'Nothing open is assigned to you right now.',
  assigned: 'Nothing open is assigned to anyone right now.',
  spam: 'No spam. Anything the system flags lands here.',
  complete: 'Nothing has been completed yet.',
}

/**
 * Engage › All messages and Engage › My inbox — one screen, five scopes. All
 * messages is the conversation (`40005911:33580`), the public thread (`33732`)
 * and the contact panel (`33894`), with All / Unassigned in the top bar. My
 * inbox is the same screen showing only what is assigned to you; it has no
 * Figma frame of its own, and swaps All / Unassigned, which would mean nothing
 * there, for Open / Complete. Everything worth linking to is in the URL —
 * `?message=1283&view=thread&filter=unassigned&sort=priority`, `?status=complete`.
 *
 * All assignments, Spam and Complete are the same screen again, filtered, and
 * none has a frame of its own. All assignments is every open ticket somebody
 * owns, Complete is everything completed, whoever did it, and Spam is what the
 * system flagged, which no other scope shows. A completed or flagged ticket
 * swaps its reply box for a bar that says so (`StatusBar`, `40006078:63232`).
 *
 * On a phone the list and the conversation are two screens: with no `message`
 * the list shows, with one the conversation does. On a desktop the first
 * message opens by itself, as the file draws it.
 */
export function InboxScreen({ scope = 'all' }: { scope?: InboxScope }) {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  // Edits and sent replies live above the routes, shared with the other scope.
  const { tickets: allTickets, editTicket, sent, addSent, markTicketSeen } = useInbox()
  const phone = usePhone()

  // My inbox splits by status: Open, or Complete. All messages shows both,
  // split by owner instead. The other scopes are a filter already.
  const { filter, status } = scopeFilter(scope, {
    unassigned: params.get('filter') === 'unassigned',
    complete: params.get('status') === 'complete',
  })
  const sort: SortKey = params.get('sort') === 'priority' ? 'priority' : 'received'
  const descending = params.get('dir') !== 'asc'
  const list = visibleTickets(allTickets, filter, sort, descending, status)

  const chosen = allTickets.find((t) => t.number === params.get('message'))
  // On a desktop the first message opens by itself, as the file draws it. A
  // phone shows the list alone until you pick one, so nothing there is open,
  // selected or carrying your face yet. `usePhone` is the library's popup-only
  // hook (`src/lib/viewport.ts`), and its reason does not reach here: this app
  // renders in the browser only, so the first render already has the answer.
  const opened = chosen ?? (phone ? undefined : list[0])
  // Your face sits on the message you have open, in the list and the header.
  const open = opened && withViewer(opened, opened.number)
  const listed = list.map((t) => withViewer(t, opened?.number))
  const view = params.get('view') === 'thread' && open?.postId ? 'thread' : 'conversation'

  // Whatever is open has been seen, the one that opens by itself included, so
  // its new dot goes out here and in the other scope.
  const openNumber = open?.number
  useEffect(() => {
    if (openNumber) markTicketSeen(openNumber)
  }, [openNumber, markTicketSeen])

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next)
  }

  const openTicket = (ticket: Ticket) => {
    update({ message: ticket.number, view: null })
    // The contact panel follows the open message, as post detail follows the post.
    if (shell.panel?.type === 'contact') {
      shell.setPanel({ type: 'contact', customerId: ticket.customerId })
    }
  }

  const send = (body: string, mode: ReplyMode) => {
    if (!open) return
    const authorId = mode === 'note' ? me.id : (replyAccountFor(open)?.id ?? me.id)
    addSent(open.number, { id: `sent-${Date.now()}`, kind: mode, authorId, body })
  }

  const backToList = () => update({ message: null, view: null })

  return (
    <>
      <TopBar
        start={
          // One child: TopBar's start slot stretches each child (FINDINGS 6).
          <div className="flex items-center gap-2">
            <Heading
              level={1}
              size="base"
              weight="semibold"
              // Hidden on a phone beside the segmented control. A scope with
              // no control has only its title to say where you are.
              className={
                scope === 'all' || scope === 'mine' ? 'shrink-0 max-md:sr-only' : 'shrink-0'
              }
            >
              {SCOPE_TITLES[scope]}
            </Heading>
            {scope === 'mine' ? (
              <SegmentedControl
                aria-label="Show"
                value={status}
                // A new pile opens its own first message, not the one you had.
                onValueChange={(value) =>
                  update({
                    status: value === 'open' ? null : String(value),
                    message: null,
                    view: null,
                  })
                }
              >
                <SegmentedControl.Item value="open">Open</SegmentedControl.Item>
                <SegmentedControl.Item value="complete">Complete</SegmentedControl.Item>
              </SegmentedControl>
            ) : scope === 'all' ? (
              <SegmentedControl
                aria-label="Show"
                value={filter}
                onValueChange={(value) =>
                  update({ filter: value === 'all' ? null : String(value) })
                }
              >
                <SegmentedControl.Item value="all">All</SegmentedControl.Item>
                <SegmentedControl.Item value="unassigned">Unassigned</SegmentedControl.Item>
              </SegmentedControl>
            ) : null}
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            {/* Icon-only when the page is narrow, as the file draws it beside a
                panel (`40005911:33894`), and on a phone. The same width the
                list folds at. */}
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              aria-label="Filter"
              className="@min-[860px]/page:hidden"
              onClick={() => shell.notBuilt('Filtering')}
            />
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              className="hidden @min-[860px]/page:inline-flex"
              onClick={() => shell.notBuilt('Filtering')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      {/* Two columns that each scroll, edge to edge in the page as drawn; the
          shell's content padding is for blocks, and these have their own rules. */}
      <AppShell.Content className="flex-row gap-0 overflow-hidden p-0">
        <MessageList
          tickets={listed}
          openNumber={open?.number}
          sort={sort}
          descending={descending}
          onSortChange={(next) => update({ sort: next === 'received' ? null : next })}
          onDirectionChange={(next) => update({ dir: next ? null : 'asc' })}
          onOpen={openTicket}
          className={chosen ? 'max-md:hidden' : undefined}
        />
        {open ? (
          <div className={chosen ? 'flex min-w-0 flex-1' : 'flex min-w-0 flex-1 max-md:hidden'}>
            {view === 'thread' ? (
              <PublicThread
                ticket={open}
                onTicketChange={(edit) => editTicket(open.number, edit)}
                sent={sent[open.number] ?? []}
                onSend={send}
                onBackToConversation={() => update({ view: null })}
                onBack={backToList}
                backLabel={SCOPE_TITLES[scope]}
              />
            ) : (
              <Conversation
                ticket={open}
                onTicketChange={(edit) => editTicket(open.number, edit)}
                sent={sent[open.number] ?? []}
                onSend={send}
                onOpenThread={() => update({ message: open.number, view: 'thread' })}
                onBack={backToList}
                backLabel={SCOPE_TITLES[scope]}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 max-md:hidden">
            <Text color="subtle">
              {scope === 'mine' && status === 'complete'
                ? 'Nothing you have completed yet.'
                : EMPTY[scope]}
            </Text>
          </div>
        )}
      </AppShell.Content>
    </>
  )
}
