import { Eye, Heart, MessageSquare, Tag } from 'lucide-react'

import { ClickableCard } from '../../../src/components/Card'
import { formatCompactNumber } from '../../../src/components/Chart'
import { Token } from '../../../src/components/Token'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { formatTime } from '../data/dates'
import { statsFor } from '../data/performance'
import { profileFor } from '../data/posts'
import type { Post } from '../data/types'
import { isPublished } from '../screens/calendar/model'
import type { CardDrag } from '../screens/calendar/dragHooks'
import { NetworkIcon } from './NetworkIcon'

// The three ways the calendar draws a post. Figma keeps them as `_` local
// symbols on the Components frame (`40005911:32755`) because each is slot
// content for a library component — a `Clickable Card` or a bare row — rather
// than a component in its own right. Same here: app components, not library ones.

interface PostCardProps {
  post: Post
  selected?: boolean
  onOpen: (post: Post) => void
  /**
   * The calendar's drag, for a post that can still be moved: the card lifts
   * on a pointer drag and fades while its copy is carried. Without it, a card
   * that only opens.
   */
  drag?: CardDrag
}

/** A draggable card's look: grab cursor, and faded while the copy under the pointer is carried. */
function dragClasses(drag: CardDrag | undefined) {
  return cn(drag?.onPointerDown && 'cursor-grab', drag?.dragging && 'opacity-50')
}

/** Network, account, time — the header every variant shares. */
function PostHeader({ post, size }: { post: Post; size: 'sm' | 'base' }) {
  const profile = profileFor(post)
  return (
    <div className={cn('flex min-w-0 items-center', size === 'sm' ? 'gap-1' : 'gap-2')}>
      <NetworkIcon network={profile.network} />
      <Text
        render={<span />}
        size={size}
        weight="semibold"
        color="emphasized"
        truncate
        className="min-w-0 flex-1"
      >
        {profile.name}
      </Text>
      <Text render={<span />} size="sm" color="subtle" className="shrink-0">
        {formatTime(post.time)}
      </Text>
    </div>
  )
}

/**
 * The pills under a post. A scheduled post shows its tag count; once it has
 * gone out, what it earned — impressions, likes and comments, compact so three
 * fit across a week cell.
 */
function PostMeta({ post }: { post: Post }) {
  const stats = isPublished(post) ? statsFor(post) : undefined
  if (!post.tags && !stats) return null
  return (
    <div className="flex flex-wrap gap-1">
      {stats ? (
        <>
          <Token startIcon={Eye} aria-label={`${stats.impressions} impressions`}>
            {formatCompactNumber(stats.impressions)}
          </Token>
          <Token startIcon={Heart} aria-label={`${stats.likes} likes`}>
            {formatCompactNumber(stats.likes)}
          </Token>
          <Token startIcon={MessageSquare} aria-label={`${stats.comments} comments`}>
            {formatCompactNumber(stats.comments)}
          </Token>
        </>
      ) : null}
      {post.tags ? (
        <Token startIcon={Tag} aria-label={`${post.tags} tags`}>
          {post.tags}
        </Token>
      ) : null}
    </div>
  )
}

function Thumbnail({ post, size }: { post: Post; size: 'size-5' | 'size-10' | 'size-12' }) {
  if (!post.photo) return null
  return (
    <img
      src={post.photo}
      alt={post.photoAlt ?? ''}
      // An image is natively draggable, and the browser's own drag would take
      // the pointer from the card's (DragAndDrop's "link cards" trap).
      draggable={false}
      className={cn('shrink-0 object-cover', size === 'size-5' ? 'rounded-sm' : 'rounded-md', size)}
    />
  )
}

/**
 * `_Calendar Post Content` (`40005805:13368`) in a `Clickable Card`: one post in
 * a week cell. 12px of padding, 8 between rows, the copy clamped to two lines.
 */
export function CalendarPostCard({ post, selected, onOpen, drag }: PostCardProps) {
  return (
    <ClickableCard
      ref={drag?.ref}
      onPointerDown={drag?.onPointerDown}
      selected={selected}
      onClick={() => onOpen(post)}
      className={cn('w-full', dragClasses(drag))}
      aria-label={`${profileFor(post).name}, ${formatTime(post.time)}: ${post.body}`}
    >
      <CalendarPostCardFace post={post} />
    </ClickableCard>
  )
}

/** The week card's contents, shared with the copy carried under the pointer. */
export function CalendarPostCardFace({ post }: { post: Post }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 text-left">
      <PostHeader post={post} size="sm" />
      <Text size="sm" truncate={2}>
        {post.body}
      </Text>
      <Thumbnail post={post} size="size-12" />
      <PostMeta post={post} />
    </div>
  )
}

/**
 * `_Calendar Agenda Content` (`40005805:52756`): the day view's wider row, the
 * copy beside its thumbnail, on the 14px body size.
 */
export function CalendarAgendaCard({ post, selected, onOpen, drag }: PostCardProps) {
  return (
    <ClickableCard
      ref={drag?.ref}
      onPointerDown={drag?.onPointerDown}
      selected={selected}
      onClick={() => onOpen(post)}
      className={cn('w-full', dragClasses(drag))}
      aria-label={`${profileFor(post).name}, ${formatTime(post.time)}: ${post.body}`}
    >
      <CalendarAgendaFace post={post} />
    </ClickableCard>
  )
}

/** The agenda card's contents, shared with the copy carried under the pointer. */
export function CalendarAgendaFace({ post }: { post: Post }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 text-left">
      <PostHeader post={post} size="base" />
      <div className="flex items-start gap-3">
        <Text truncate={2} className="min-w-0 flex-1">
          {post.body}
        </Text>
        <Thumbnail post={post} size="size-10" />
      </div>
      <PostMeta post={post} />
    </div>
  )
}

/**
 * `_Calendar Post Chip` (`40005805:52749`): one post in a month cell. Network,
 * the first words, a 20px thumbnail — a 24px row on `rounded-sm`.
 *
 * Not a `ClickableCard`: the card's 12px padding and `rounded-md` are the
 * whole difference Figma draws, and `padding={0}` would still bring the card's
 * radius. So it is a button with the card's surface, border and hover tokens.
 *
 * `thumbnail={false}` is the symbol's `Show Thumbnail` off, as Home's week
 * strip draws it, where a column is too narrow to give 20px to the photo.
 */
export function CalendarPostChip({
  post,
  selected,
  onOpen,
  drag,
  thumbnail = true,
}: PostCardProps & { thumbnail?: boolean }) {
  const profile = profileFor(post)
  return (
    <button
      ref={drag?.ref}
      onPointerDown={drag?.onPointerDown}
      type="button"
      onClick={() => onOpen(post)}
      aria-label={`${profile.name}, ${formatTime(post.time)}: ${post.body}`}
      aria-pressed={selected}
      className={cn(
        chip,
        'hover:bg-surface-background-subtle',
        focusRing,
        // ClickableCard's `selected`, copied: subtle fill plus the emphasized border.
        selected && 'border-surface-border-emphasized bg-surface-background-subtle',
        dragClasses(drag),
      )}
    >
      <ChipContent post={post} thumbnail={thumbnail} />
    </button>
  )
}

const chip =
  'flex h-6 w-full min-w-0 items-center gap-1 rounded-sm border py-px pr-px pl-1 text-left border-surface-border bg-surface-background-primary'

function ChipContent({ post, thumbnail }: { post: Post; thumbnail: boolean }) {
  return (
    <>
      <NetworkIcon network={profileFor(post).network} size="small" />
      <Text render={<span />} size="sm" truncate className="min-w-0 flex-1">
        {post.body}
      </Text>
      {thumbnail ? <Thumbnail post={post} size="size-5" /> : null}
    </>
  )
}

/** The chip as the copy carried under the pointer: its box and contents, and nothing to press. */
export function CalendarPostChipFace({ post }: { post: Post }) {
  return (
    <div className={cn(chip, 'cursor-grabbing shadow-medium')}>
      <ChipContent post={post} thumbnail />
    </div>
  )
}
