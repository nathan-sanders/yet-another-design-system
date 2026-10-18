import { useSearchParams } from 'react-router'
import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import type { ReplyMode } from '../../components/ReplyBox'
import { replyAccountFor } from '../../data/inbox'
import { me } from '../../data/people'
import type { Ticket } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { Conversation } from './Conversation'
import { useInbox } from './inboxState'
import { MessageList } from './MessageList'
import { visibleTickets, withViewer, type InboxFilter, type SortKey } from './model'
import { PublicThread } from './PublicThread'

/**
 * Engage › All messages and Engage › My inbox — one screen, two scopes. All
 * messages is the conversation (`40005911:33580`), the public thread (`33732`)
 * and the contact panel (`33894`), with All / Unassigned in the top bar. My
 * inbox is the same screen showing only what is assigned to you; it has no
 * Figma frame of its own, and drops All / Unassigned, which would mean nothing
 * there. Everything worth linking to is in the URL —
 * `?message=1283&view=thread&filter=unassigned&sort=priority`.
 *
 * On a phone the list and the conversation are two screens: with no `message`
 * the list shows, with one the conversation does. On a desktop the first
 * message opens by itself, as the file draws it.
 */
export function InboxScreen({ scope = 'all' }: { scope?: 'all' | 'mine' }) {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  // Edits and sent replies live above the routes, shared with the other scope.
  const { tickets: allTickets, editTicket, sent, addSent } = useInbox()

  const filter: InboxFilter =
    scope === 'mine' ? 'mine' : params.get('filter') === 'unassigned' ? 'unassigned' : 'all'
  const sort: SortKey = params.get('sort') === 'priority' ? 'priority' : 'received'
  const descending = params.get('dir') !== 'asc'
  const list = visibleTickets(allTickets, filter, sort, descending)

  const chosen = allTickets.find((t) => t.number === params.get('message'))
  const opened = chosen ?? list[0]
  // Your face sits on the message you have open, in the list and the header.
  const open = opened && withViewer(opened, opened.number)
  const listed = list.map((t) => withViewer(t, opened?.number))
  const view = params.get('view') === 'thread' && open?.postId ? 'thread' : 'conversation'

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
              // Hidden on a phone beside the segmented control; My inbox has
              // none, so its title stays.
              className={scope === 'all' ? 'shrink-0 max-md:sr-only' : 'shrink-0'}
            >
              {scope === 'mine' ? 'My inbox' : 'All messages'}
            </Heading>
            {scope === 'all' ? (
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
              />
            ) : (
              <Conversation
                ticket={open}
                onTicketChange={(edit) => editTicket(open.number, edit)}
                sent={sent[open.number] ?? []}
                onSend={send}
                onOpenThread={() => update({ message: open.number, view: 'thread' })}
                onBack={backToList}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 max-md:hidden">
            <Text color="subtle">
              {scope === 'mine'
                ? 'Nothing is assigned to you right now.'
                : 'No messages here. Everything is assigned.'}
            </Text>
          </div>
        )}
      </AppShell.Content>
    </>
  )
}
