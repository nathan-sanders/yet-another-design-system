import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  CircleCheck,
  CircleUserRound,
  Ellipsis,
  Heart,
  ListTree,
  Reply,
  Tag,
  UserPlus,
} from 'lucide-react'

import { Avatar, AvatarGroup } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import veggieVault from '../../assets/veggie-vault.png'
import { InboxComment } from '../../components/InboxComment'
import { InternalNote } from '../../components/InternalNote'
import { NetworkIcon } from '../../components/NetworkIcon'
import { PrivateChat, SystemLine } from '../../components/PrivateChat'
import { chatEntries } from '../../components/chatEntries'
import { ReplyBox, type ReplyMode } from '../../components/ReplyBox'
import { StatusBar } from '../../components/StatusBar'
import { AssigneeMenu, TicketMeta } from '../../components/TicketMeta'
import { brandPostFor, customerFor } from '../../data/inbox'
import { me, personFor } from '../../data/people'
import { profiles } from '../../data/posts'
import type { Ticket, TicketEdit } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { completedById, completeToggle, type SentItem } from './model'

/**
 * The bar over the open conversation (`Header`, `40005911:33667`): face,
 * network, "handle · subject", who else has it open, and the contact panel's
 * toggle. Shared by the conversation and the public thread, which keep it.
 */
export function ConversationHeader({
  ticket,
  onBack,
  backLabel,
}: {
  ticket: Ticket
  /** Phone only: back to the list, which is a screen of its own there. */
  onBack: () => void
  /** The list's name, said by the back button. */
  backLabel: string
}) {
  const shell = useShell()
  const customer = customerFor(ticket.customerId)
  const contactOpen = shell.panel?.type === 'contact'

  return (
    // Sticky on a phone, where the whole conversation scrolls, so the way
    // back to the list never scrolls away.
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-surface-border bg-surface-background-primary py-3 pr-3 pl-4 max-md:sticky max-md:top-0 max-md:z-10 max-md:pl-2">
      <Button
        appearance="ghost"
        startIcon={ArrowLeft}
        aria-label={backLabel}
        className="md:hidden"
        onClick={onBack}
      />
      <Avatar name={customer.handle} src={customer.avatar} alt="" size="small" />
      <NetworkIcon network={ticket.network} />
      <Heading level={2} size="base" weight="semibold" truncate className="min-w-0 flex-1">
        {customer.handle} · {ticket.subject}
      </Heading>
      {ticket.viewers?.length ? (
        // Figma's `Currently Viewing` (`40005911:33672`): the footprint of an
        // icon-only Button, 32 tall with 12 either side, the faces centered.
        <span className="flex h-8 shrink-0 items-center px-3 max-md:hidden">
          <AvatarGroup
            size="x-small"
            aria-label={`Viewing now: ${ticket.viewers.map((id) => personFor(id).name).join(', ')}`}
          >
            {ticket.viewers.map((id) => {
              const person = personFor(id)
              return <Avatar key={id} name={person.name} src={person.avatar} />
            })}
          </AvatarGroup>
        </span>
      ) : null}
      <Button
        appearance="ghost"
        startIcon={CircleUserRound}
        aria-label="Contact detail"
        aria-pressed={contactOpen}
        onClick={() =>
          shell.setPanel(contactOpen ? null : { type: 'contact', customerId: ticket.customerId })
        }
      />
    </div>
  )
}

/**
 * What was sent from here this session, under the message it answers: a reply
 * as the customer will see it, a note as the team's sticky note. A private
 * message draws its replies in the chat itself, so it passes only the notes.
 */
export function SentItems({ items, onMore }: { items: SentItem[]; onMore: () => void }) {
  return items.map((item) =>
    item.kind === 'note' ? (
      <InternalNote key={item.id} note={{ ...item, ago: 'now' }} />
    ) : (
      <InboxComment
        key={item.id}
        authorId={item.authorId}
        ago="now"
        badge={<Badge color="green">Sent</Badge>}
        // You sent it, under the brand's name. With no brand account on the
        // network it went out as you, and your name is already the author.
        sentBy={item.authorId === me.id ? undefined : me.id}
        onMore={onMore}
      >
        {item.body}
      </InboxComment>
    ),
  )
}

/**
 * The Composer block: Reply / Internal note over the reply box. A ticket that
 * is complete, or spam, has no reply to write, so Reply shows the bar that
 * says why (`StatusBar`, as `40006078:63232` draws it); an internal note can
 * still be left on it.
 */
export function Composer({
  ticket,
  onTicketChange,
  onSend,
}: {
  ticket: Ticket
  onTicketChange: (edit: TicketEdit) => void
  onSend: (body: string, mode: ReplyMode) => void
}) {
  const shell = useShell()
  const [mode, setMode] = useState<ReplyMode>('reply')
  return (
    <div className="flex shrink-0 flex-col items-start gap-2 px-4 pt-3 pb-4">
      <SegmentedControl
        aria-label="Write a"
        value={mode}
        onValueChange={(value) => setMode(value as ReplyMode)}
      >
        <SegmentedControl.Item value="reply">Reply</SegmentedControl.Item>
        <SegmentedControl.Item value="note">Internal note</SegmentedControl.Item>
      </SegmentedControl>
      {mode === 'reply' && (ticket.status === 'complete' || ticket.spam) ? (
        <StatusBar ticket={ticket} onTicketChange={onTicketChange} />
      ) : (
        <ReplyBox
          // Remounted per ticket, so a draft or a half-typed reply never follows
          // you to someone else's conversation.
          key={ticket.number}
          network={ticket.network}
          handle={customerFor(ticket.customerId).handle}
          private={ticket.private}
          drafts={ticket.drafts}
          mode={mode}
          onSend={onSend}
          onNotBuilt={shell.notBuilt}
          className="w-full"
        />
      )}
    </div>
  )
}

function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1 pl-6">{children}</div>
}

/**
 * Engage › All messages › Conversation (`40005911:33580`, right of the list):
 * the ticket's toolbar, the log, then the composer pinned to the foot. A
 * public comment's log is the post and the comment (`PublicLog`); a private
 * message's is a chat (`PrivateLog`).
 */
export function Conversation({
  ticket,
  onTicketChange,
  sent,
  onSend,
  onOpenThread,
  onBack,
  backLabel,
}: {
  ticket: Ticket
  /** A change from one of the ticket meta menus. */
  onTicketChange: (edit: TicketEdit) => void
  sent: SentItem[]
  onSend: (body: string, mode: ReplyMode) => void
  onOpenThread: () => void
  onBack: () => void
  backLabel: string
}) {
  const shell = useShell()

  return (
    // On a phone the log and the composer scroll as one, so a drafted reply
    // cannot squeeze the message out of the screen; above 768 the composer
    // is pinned to the foot, as drawn.
    <section
      aria-label="Conversation"
      className="flex min-h-0 min-w-0 flex-1 flex-col max-md:overflow-y-auto"
    >
      <ConversationHeader ticket={ticket} onBack={onBack} backLabel={backLabel} />
      <div className="flex shrink-0 items-center gap-2 py-2 pr-3 pl-4 max-md:flex-wrap">
        <TicketMeta
          ticket={ticket}
          onChange={onTicketChange}
          className="min-w-0 flex-1 max-md:basis-full"
        />
        <AssigneeMenu
          ticket={ticket}
          onChange={onTicketChange}
          trigger={<Button appearance="ghost" startIcon={UserPlus} aria-label="Assign to" />}
        />
        <Button
          appearance="ghost"
          startIcon={Tag}
          aria-label="Tag"
          onClick={() => shell.notBuilt('Tagging')}
        />
        <Button
          appearance="ghost"
          startIcon={CircleCheck}
          aria-label="Complete"
          aria-pressed={ticket.status === 'complete'}
          // Spam is not worked, so it is not completed either: Not spam first.
          disabled={Boolean(ticket.spam)}
          onClick={() => onTicketChange(completeToggle(ticket))}
        />
        <Button
          appearance="ghost"
          startIcon={Ellipsis}
          aria-label="More ticket actions"
          onClick={() => shell.notBuilt('More ticket actions')}
        />
      </div>

      <div
        role="log"
        aria-label="Messages"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 max-md:flex-none max-md:overflow-visible"
      >
        {ticket.private ? (
          <PrivateLog ticket={ticket} sent={sent} />
        ) : (
          <PublicLog ticket={ticket} sent={sent} onOpenThread={onOpenThread} />
        )}
      </div>

      <Composer ticket={ticket} onTicketChange={onTicketChange} onSend={onSend} />
    </section>
  )
}

/**
 * A private message's log: the whole exchange as a chat, a reply sent from
 * here landing as the brand's next bubble, notes as sticky notes after it.
 */
function PrivateLog({ ticket, sent }: { ticket: Ticket; sent: SentItem[] }) {
  const shell = useShell()
  const replies = sent.filter((item) => item.kind === 'reply')
  const entries = [
    ...chatEntries(ticket),
    ...replies.map((item) => ({
      kind: 'message' as const,
      id: item.id,
      authorId: item.authorId,
      body: item.body,
      ago: 'now',
      // You sent it, under the brand's name. With no brand account on the
      // network it went out as you, and your name is already the author.
      sentBy: item.authorId === me.id ? undefined : me.id,
      justSent: true,
    })),
  ]
  return (
    <>
      <PrivateChat
        ticket={ticket}
        entries={entries}
        onMore={() => shell.notBuilt('Message actions')}
      />
      <CompletedLine ticket={ticket} />
      <SentItems
        items={sent.filter((item) => item.kind === 'note')}
        onMore={() => shell.notBuilt('Message actions')}
      />
    </>
  )
}

/**
 * A public comment's log: the post it answers, the customer's comment and its
 * actions, the routing note, the replies since, and what was sent from here.
 */
function PublicLog({
  ticket,
  sent,
  onOpenThread,
}: {
  ticket: Ticket
  sent: SentItem[]
  onOpenThread: () => void
}) {
  const shell = useShell()
  const post = ticket.postId ? brandPostFor(ticket.postId) : undefined
  const postAccount = post ? profiles.find((p) => p.id === post.profileId) : undefined

  return (
    <>
      {post && postAccount ? (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={postAccount.name} src={veggieVault} alt="" size="small" />
          <Text render={<span />} size="sm" weight="semibold" className="shrink-0">
            <span className="sr-only">In reply to </span>
            {postAccount.name}
          </Text>
          {post.photo ? (
            <img src={post.photo} alt="" className="size-6 shrink-0 rounded-sm object-cover" />
          ) : null}
          <Text
            render={<span />}
            size="sm"
            color="subtle"
            truncate
            className="min-w-0 flex-1 italic"
          >
            {post.body}
          </Text>
        </div>
      ) : null}

      <InboxComment
        authorId={ticket.customerId}
        ago={ticket.ago}
        onMore={() => shell.notBuilt('Comment actions')}
      >
        {ticket.body}
      </InboxComment>

      <ActionRow>
        <Button appearance="ghost" startIcon={Reply} onClick={onOpenThread}>
          {ticket.replies ? `${ticket.replies} Replies` : 'Reply'}
        </Button>
        <Button appearance="ghost" startIcon={Heart} onClick={() => shell.notBuilt('Likes')}>
          Like
        </Button>
        {post ? (
          <Button
            appearance="ghost"
            startIcon={ListTree}
            className="ml-auto"
            onClick={onOpenThread}
          >
            Full public thread
          </Button>
        ) : null}
      </ActionRow>

      {ticket.note ? <SystemLine>{ticket.note}</SystemLine> : null}

      {ticket.history?.map((reply) => (
        <InboxComment
          key={reply.id}
          authorId={reply.authorId}
          ago={reply.ago}
          sentBy={reply.sentBy}
          onMore={() => shell.notBuilt('Comment actions')}
        >
          {reply.body}
        </InboxComment>
      ))}

      <CompletedLine ticket={ticket} />

      <SentItems items={sent} onMore={() => shell.notBuilt('Message actions')} />
    </>
  )
}

/** The log's last line on a completed ticket: who completed it. */
function CompletedLine({ ticket }: { ticket: Ticket }) {
  const by = completedById(ticket)
  return by ? <SystemLine>Marked complete by {personFor(by).name}</SystemLine> : null
}
