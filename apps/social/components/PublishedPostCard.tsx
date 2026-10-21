import { MessageCircle, MessageSquare } from 'lucide-react'

import { ClickableCard } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { statsFor } from '../data/performance'
import { profileFor } from '../data/posts'
import type { Post } from '../data/types'
import { ageOf } from '../screens/comments/model'
import { useUnreadComments } from '../screens/inbox/inboxState'
import { NewDot } from './InboxMessageCard'
import { NetworkIcon } from './NetworkIcon'

interface PublishedPostCardProps {
  post: Post
  selected?: boolean
  onOpen: (post: Post) => void
}

function label(post: Post, unreadCount: number) {
  const stats = statsFor(post)
  const unread = unreadCount ? `, ${unreadCount} unread` : ''
  return `${profileFor(post).name}, ${ageOf(post)} ago: ${post.body} — ${stats.comments} comments${unread}`
}

/**
 * One post in Engage › Comments by post. No Figma frame: it is the inbox's
 * message card (`_Inbox Message Content`, `40005827:15534`) with the post in the
 * customer's place — network, account and age; the copy beside its thumbnail,
 * as the calendar's agenda row draws it; then how many comments it has and how
 * many you have not read. `ghost` in the list, `selected` the open post.
 *
 * Unread comments also light the inbox card's `New` dot, in the same gutter at
 * the same place, and opening the post reads them (`useUnreadComments`).
 */
export function PublishedPostCard({ post, selected, onOpen }: PublishedPostCardProps) {
  const profile = profileFor(post)
  const stats = statsFor(post)
  const unread = useUnreadComments(post)
  return (
    <ClickableCard
      emphasis="ghost"
      selected={selected}
      onClick={() => onOpen(post)}
      className="relative w-full pl-6"
      aria-label={label(post, unread)}
    >
      {unread ? <NewDot className="top-5 left-2" /> : null}
      <div className="flex w-full min-w-0 flex-col gap-2 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <NetworkIcon network={profile.network} />
          <Text
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {profile.name}
          </Text>
          <Text render={<span />} size="sm" color="subtle" className="shrink-0">
            {ageOf(post)}
          </Text>
        </div>
        <div className="flex min-w-0 items-start gap-2">
          <Text truncate={2} className="min-w-0 flex-1">
            {post.body}
          </Text>
          {post.photo ? (
            <img src={post.photo} alt="" className="size-10 shrink-0 rounded-md object-cover" />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <Token startIcon={MessageSquare}>{stats.comments} Comments</Token>
          {unread ? <Token startIcon={MessageCircle}>{unread} Unread</Token> : null}
        </div>
      </div>
    </ClickableCard>
  )
}

/**
 * The folded list's row: the post's photo, or its network where it has none,
 * over its age. `InboxMessageAvatar`'s button, with the post in the face's
 * place — the same ghost-card tokens and `aria-current` for the open post, and
 * its `New` dot.
 */
export function PublishedPostThumb({ post, selected, onOpen }: PublishedPostCardProps) {
  const profile = profileFor(post)
  const unread = useUnreadComments(post)
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      aria-label={label(post, unread)}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'relative flex w-full flex-col items-center gap-1 rounded-md border p-2',
        'border-surface-background-primary bg-surface-background-primary',
        'hover:border-surface-background-subtle hover:bg-surface-background-subtle',
        focusRing,
        selected &&
          'border-surface-border-emphasized bg-surface-background-subtle hover:border-surface-border-emphasized',
      )}
    >
      {unread ? <NewDot className="top-1 left-1" /> : null}
      {post.photo ? (
        <img src={post.photo} alt="" className="size-9 rounded-md object-cover" />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-md bg-surface-background-subtle">
          <NetworkIcon network={profile.network} />
        </span>
      )}
      <Text render={<span />} size="sm" color="subtle">
        {ageOf(post)}
      </Text>
    </button>
  )
}
