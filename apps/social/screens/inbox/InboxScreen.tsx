import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import type { ReplyMode } from '../../components/ReplyBox'
import { replyAccountFor, tickets } from '../../data/inbox'
import { me } from '../../data/people'
import type { Ticket, TicketEdit } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { Conversation } from './Conversation'
import { MessageList } from './MessageList'
import { visibleTickets, type InboxFilter, type SentItem, type SortKey } from './model'
import { PublicThread } from './PublicThread'

/**
 * Engage › All messages: the conversation (`40005911:33580`), the public
 * thread (`33732`) and the contact panel (`33894`). Everything worth linking
 * to is in the URL — `?message=1283&view=thread&filter=unassigned&sort=priority`.
 *
 * On a phone the list and the conversation are two screens: with no `message`
 * the list shows, with one the conversation does. On a desktop the first
 * message opens by itself, as the file draws it.
 */
export function InboxScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  // Replies and notes sent here, per ticket, for the session.
  const [sent, setSent] = useState<Record<string, SentItem[]>>({})
  // Status, assignee, priority and sentiment changed from the detail view's
  // menus, per ticket, for the session. Applied before filtering, so a ticket
  // you unassign joins Unassigned and the list's card shows the new values.
  const [edits, setEdits] = useState<Record<string, TicketEdit>>({})
  const allTickets = tickets.map((t) => (edits[t.number] ? { ...t, ...edits[t.number] } : t))
  const editTicket = (number: string, edit: TicketEdit) =>
    setEdits((all) => ({ ...all, [number]: { ...all[number], ...edit } }))

  const filter: InboxFilter = params.get('filter') === 'unassigned' ? 'unassigned' : 'all'
  const sort: SortKey = params.get('sort') === 'priority' ? 'priority' : 'received'
  const descending = params.get('dir') !== 'asc'
  const list = visibleTickets(allTickets, filter, sort, descending)

  const chosen = allTickets.find((t) => t.number === params.get('message'))
  const open = chosen ?? list[0]
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
    setSent((all) => ({
      ...all,
      [open.number]: [
        ...(all[open.number] ?? []),
        { id: `sent-${Date.now()}`, kind: mode, authorId, body },
      ],
    }))
  }

  // With a panel open the page is 800 wide: the list folds to faces and Filter
  // to an icon (`40005911:33894`).
  const compact = shell.panel !== null
  const backToList = () => update({ message: null, view: null })

  return (
    <>
      <TopBar
        start={
          // One child: TopBar's start slot stretches each child (FINDINGS 6).
          <div className="flex items-center gap-2">
            <Heading level={1} size="base" weight="semibold" className="shrink-0 max-md:sr-only">
              All messages
            </Heading>
            <SegmentedControl
              aria-label="Show"
              value={filter}
              onValueChange={(value) => update({ filter: value === 'all' ? null : String(value) })}
            >
              <SegmentedControl.Item value="all">All</SegmentedControl.Item>
              <SegmentedControl.Item value="unassigned">Unassigned</SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            {/* Icon-only beside a panel, as drawn, and on a phone, where the
                segmented control needs the room. */}
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              aria-label="Filter"
              className={compact ? undefined : 'md:hidden'}
              onClick={() => shell.notBuilt('Filtering')}
            />
            {compact ? null : (
              <Button
                appearance="ghost"
                startIcon={ListFilter}
                className="max-md:hidden"
                onClick={() => shell.notBuilt('Filtering')}
              >
                Filter
              </Button>
            )}
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
          tickets={list}
          openNumber={open?.number}
          collapsed={compact}
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
            <Text color="subtle">No messages here. Everything is assigned.</Text>
          </div>
        )}
      </AppShell.Content>
    </>
  )
}
