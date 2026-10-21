import {
  ArrowLeft,
  CircleCheck,
  Ellipsis,
  Heart,
  MessageSquare,
  Reply,
  Share,
  Smile,
  Tag,
  UserPlus,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Divider } from '../../../../src/components/Divider'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import veggieVault from '../../assets/veggie-vault.png'
import { InboxComment } from '../../components/InboxComment'
import { NetworkIcon } from '../../components/NetworkIcon'
import { ReplyBox, type ReplyMode } from '../../components/ReplyBox'
import { AssigneeMenu, TicketMeta } from '../../components/TicketMeta'
import { brandPostFor, customerFor } from '../../data/inbox'
import { profiles } from '../../data/posts'
import type { Ticket, TicketEdit } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { ConversationHeader, SentItems } from './Conversation'
import type { SentItem } from './model'

/**
 * Engage › All messages › Public Thread (`40005911:33732`): the whole public
 * conversation the ticket came from. The brand post with its numbers, then
 * every comment under it; the ticket's own comment is marked with a rule down
 * its left edge and carries its meta, its actions and the reply box inline,
 * with the replies under that.
 */
export function PublicThread({
  ticket,
  onTicketChange,
  sent,
  onSend,
  onBackToConversation,
  onBack,
}: {
  ticket: Ticket
  /** A change from one of the ticket meta menus. */
  onTicketChange: (edit: TicketEdit) => void
  sent: SentItem[]
  onSend: (body: string, mode: ReplyMode) => void
  onBackToConversation: () => void
  onBack: () => void
}) {
  const shell = useShell()
  const post = brandPostFor(ticket.postId!)
  const account = profiles.find((p) => p.id === post.profileId)!
  const more = () => shell.notBuilt('Comment actions')

  return (
    <section aria-label="Public thread" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ConversationHeader ticket={ticket} onBack={onBack} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="py-1 pr-3 pl-2">
          <Button appearance="ghost" startIcon={ArrowLeft} onClick={onBackToConversation}>
            Back to conversation
          </Button>
        </div>

        <article aria-label={`${account.name}'s post`} className="flex flex-col gap-2 px-4 pt-2 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={account.name} src={veggieVault} alt="" size="small" />
            <NetworkIcon network={account.network} />
            <Text render={<span />} weight="semibold" color="emphasized" truncate className="min-w-0 flex-1">
              {account.name}
            </Text>
            <Text render={<span />} size="sm" color="subtle" className="shrink-0">
              {post.time}
            </Text>
            <Button appearance="ghost" startIcon={Ellipsis} aria-label="Post actions" onClick={() => shell.notBuilt('Post actions')} />
          </div>
          <div className="flex items-start gap-3">
            <Text className="min-w-0 flex-1">{post.body}</Text>
            {post.photo ? (
              <img
                src={post.photo}
                alt={post.photoAlt ?? ''}
                className="size-12 shrink-0 rounded-md object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            <Token startIcon={Smile}>{post.positive}% Positive</Token>
            <Token startIcon={MessageSquare}>{post.comments} Comments</Token>
            <Token startIcon={Heart}>{post.likes} Likes</Token>
            <Token startIcon={Share}>{post.shares} Shares</Token>
          </div>
        </article>

        <Divider />

        <div role="log" aria-label="Comments" className="flex flex-col gap-4 p-4">
          {post.thread.map((comment) =>
            comment.ticket === ticket.number ? (
              <div
                key={comment.id}
                aria-current="true"
                className="flex flex-col gap-2 border-l-2 border-surface-border-emphasized pl-3"
              >
                <InboxComment authorId={comment.authorId} ago={comment.ago} onMore={more}>
                  {comment.body}
                </InboxComment>
                <TicketMeta ticket={ticket} onChange={onTicketChange} className="pl-8" />
                <div className="flex flex-wrap items-center gap-1 pl-6">
                  <Button appearance="ghost" startIcon={Reply} onClick={() => shell.notBuilt('Collapsing replies')}>
                    {comment.replies?.length ? `${comment.replies.length} Replies` : 'Reply'}
                  </Button>
                  <Button appearance="ghost" startIcon={Heart} onClick={() => shell.notBuilt('Likes')}>
                    Like
                  </Button>
                  <div className="flex-1" />
                  <AssigneeMenu
                    ticket={ticket}
                    onChange={onTicketChange}
                    trigger={
                      <Button appearance="ghost" startIcon={UserPlus}>
                        Assign
                      </Button>
                    }
                  />
                  <Button appearance="ghost" startIcon={Tag} onClick={() => shell.notBuilt('Tagging')}>
                    Tag
                  </Button>
                  <Button appearance="ghost" startIcon={CircleCheck} onClick={() => shell.notBuilt('Completing')}>
                    Complete
                  </Button>
                </div>
                <div className="pl-8">
                  <ReplyBox
                    key={ticket.number}
                    network={ticket.network}
                    handle={customerFor(ticket.customerId).handle}
                    drafts={ticket.drafts}
                    onSend={onSend}
                    onNotBuilt={shell.notBuilt}
                  />
                </div>
                <div className="flex flex-col gap-4 pl-8">
                  {comment.replies?.map((reply) => (
                    <InboxComment key={reply.id} authorId={reply.authorId} ago={reply.ago} onMore={more}>
                      {reply.body}
                    </InboxComment>
                  ))}
                  <SentItems items={sent} onMore={more} />
                </div>
              </div>
            ) : (
              <InboxComment key={comment.id} authorId={comment.authorId} ago={comment.ago} onMore={more}>
                {comment.body}
              </InboxComment>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
