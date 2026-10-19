import { useState, type FormEvent, type MouseEvent } from 'react'
import { Ellipsis, Heart, Inbox, MessageCircle, Repeat2, SendHorizontal } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { InputGroup } from '../../../src/components/Input'
import { Menu } from '../../../src/components/Menu'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { customerFor } from '../data/inbox'
import { mentionAge } from '../data/mentions'
import type { Mention, MentionReply } from '../data/types'
import { formatCount } from '../screens/reports/model'
import { InboxComment } from './InboxComment'
import { NetworkIcon } from './NetworkIcon'
import { SentimentGlyph } from './TicketMeta'

/**
 * A one-line reply field with Send at its end, under a mention in the list
 * and at the foot of its detail. Enter sends; a blank reply does nothing.
 */
export function MentionReplyForm({
  handle,
  onSend,
  autoFocus,
  className,
}: {
  handle: string
  onSend: (body: string) => void
  autoFocus?: boolean
  className?: string
}) {
  const [text, setText] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const body = text.trim()
    if (!body) return
    onSend(body)
    setText('')
  }
  return (
    <form onSubmit={submit} aria-label={`Reply to @${handle}`} className={className}>
      {/* `ring="input"`: Send has a ring of its own, so the box's is scoped to the caret. */}
      <InputGroup ring="input">
        <InputGroup.Input
          aria-label={`Reply to @${handle}`}
          placeholder={`Reply to @${handle}`}
          value={text}
          onValueChange={setText}
          autoFocus={autoFocus}
        />
        <InputGroup.Addon align="inline-end">
          <Button
            type="submit"
            appearance="ghost"
            size="small"
            startIcon={SendHorizontal}
            aria-label="Send reply"
          />
        </InputGroup.Addon>
      </InputGroup>
    </form>
  )
}

/** The brand's own replies sent from here, drawn as the inbox draws a comment. */
export function SentReplies({ replies, onMore }: { replies: MentionReply[]; onMore: () => void }) {
  if (!replies.length) return null
  return (
    <ul className="flex flex-col gap-3">
      {replies.map((reply) => (
        <li key={reply.id}>
          <InboxComment authorId={reply.authorId} ago={mentionAge(reply.hoursAgo)} onMore={onMore}>
            {reply.body}
          </InboxComment>
        </li>
      ))}
    </ul>
  )
}

/**
 * One mention in the list behind a Measure number: who posted it, where and
 * when, Yak's read of it, the post, and what you can do from here — like it,
 * answer it, or open it in Engage. Code-first; no Figma symbol draws it.
 *
 * Not a `ClickableCard`, which is one `<button>` and could not hold the
 * actions. The author and the post are the button that opens the detail; a
 * pointer anywhere else on the card that is not a control opens it too, the
 * way a report widget opens its detail.
 */
export function MentionCard({
  mention,
  liked,
  sent,
  selected,
  inEngage,
  onToggleLike,
  onReply,
  onOpen,
  onOpenInEngage,
  onNotBuilt,
}: {
  mention: Mention
  liked: boolean
  /** Replies sent from here, after the thread. */
  sent: MentionReply[]
  /** Its detail is open. */
  selected: boolean
  /** It is a ticket already; the menu says View rather than Open. */
  inEngage: boolean
  onToggleLike: () => void
  onReply: (body: string) => void
  onOpen: () => void
  onOpenInEngage: () => void
  onNotBuilt: (what: string) => void
}) {
  const [replying, setReplying] = useState(false)
  const author = customerFor(mention.authorId)
  const age = mentionAge(mention.hoursAgo)
  const likes = mention.likes + (liked ? 1 : 0)
  const comments = mention.thread.length + sent.length

  const openFromCard = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.closest('a, button, input, form, [role="menu"]')) return
    onOpen()
  }

  return (
    <Card
      role="article"
      aria-label={`@${author.handle}, ${age} ago`}
      onClick={openFromCard}
      className={cn(
        'cursor-pointer gap-2',
        selected && 'border-surface-border-emphasized bg-surface-background-subtle',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-current={selected ? 'true' : undefined}
        aria-label={`Open @${author.handle}'s post: ${mention.body}`}
        className={cn('flex flex-col gap-2 rounded-xs text-left', focusRing)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={author.name ?? author.handle} src={author.avatar} alt="" size="small" />
          <NetworkIcon network={mention.network} />
          <Text
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {author.handle}
          </Text>
          <Text render={<span />} size="sm" color="subtle" className="shrink-0">
            {age}
          </Text>
        </span>
        <span className="flex min-w-0 items-start gap-2">
          <Text render={<span />} truncate={3} className="min-w-0 flex-1">
            {mention.body}
          </Text>
          {mention.photo ? (
            <img src={mention.photo} alt="" className="size-12 shrink-0 rounded-md object-cover" />
          ) : null}
        </span>
      </button>

      <div className="flex items-center gap-1">
        <Button
          appearance="ghost"
          startIcon={Heart}
          aria-pressed={liked}
          aria-label={`${liked ? 'Unlike' : 'Like'}, ${likes} likes`}
          onClick={onToggleLike}
          className={
            liked ? '[&_svg]:fill-current [&_svg]:text-decorative-red-highlight' : undefined
          }
        >
          {formatCount(likes)}
        </Button>
        <Button
          appearance="ghost"
          startIcon={MessageCircle}
          aria-expanded={replying}
          aria-label={`Reply, ${comments} replies`}
          onClick={() => setReplying((open) => !open)}
        >
          {formatCount(comments)}
        </Button>
        <Button
          appearance="ghost"
          startIcon={Repeat2}
          aria-label={`Share, ${mention.shares} shares`}
          onClick={() => onNotBuilt('Sharing a mention')}
        >
          {formatCount(mention.shares)}
        </Button>
        <span className="ml-auto flex items-center gap-1">
          <SentimentGlyph sentiment={mention.sentiment} />
          <Menu>
            <Menu.Trigger
              render={
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label={`More for @${author.handle}'s post`}
                />
              }
            />
            <Menu.Popup aria-label="Mention actions">
              <Menu.Group>
                <Menu.Item startIcon={Inbox} onClick={onOpenInEngage}>
                  {inEngage ? 'View in Engage' : 'Open in Engage'}
                </Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu>
        </span>
      </div>

      {replying ? (
        <MentionReplyForm
          handle={author.handle}
          autoFocus
          onSend={(body) => {
            onReply(body)
            setReplying(false)
          }}
        />
      ) : null}
      <SentReplies replies={sent} onMore={() => onNotBuilt('Reply actions')} />
    </Card>
  )
}
