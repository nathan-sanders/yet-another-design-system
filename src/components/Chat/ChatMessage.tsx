import { useContext, type ComponentPropsWithRef, type ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'
import { ChatMessageContext } from './context'
import {
  bubble,
  DELIVERY_ICON,
  DELIVERY_LABEL,
  message,
  metadata as metadataStyle,
  reactionPill,
  reactions as reactionsStyle,
  status as statusStyle,
  type ChatBubbleAppearance,
  type ChatBubbleSize,
  type ChatDeliveryStatus,
  type ChatDirection,
  type ChatMessageLayout,
} from './styles'

/**
 * ChatMessage — one turn of a conversation: who it is from, what they said,
 * and when.
 *
 * Mirrors the Figma **Chat Message** section (`40004252:16314`): `Message`
 * (`Direction` Sent | Received), `Bubble`, `Bubble Group`, `Message Metadata`,
 * `_Message Status` and `Message Reactions`. `Agent Reply` is a composition of
 * these with `ThoughtProcess` above, not a component of its own — see the
 * `InContext` story.
 *
 *     <div role="log" aria-label="Conversation">
 *       <ChatMessage direction="sent" avatar={<Avatar size="small" name="Nathan" />}
 *         metadata={<ChatMessage.Metadata status="read" timestamp="12:30 PM" />}>
 *         <ChatMessage.Bubble>Can you review the token validation?</ChatMessage.Bubble>
 *       </ChatMessage>
 *       <ChatMessage
 *         metadata={<ChatMessage.Metadata timestamp="12:31 PM" actions={…} />}>
 *         <ChatMessage.Bubble appearance="ghost">Looks solid — ship it.</ChatMessage.Bubble>
 *       </ChatMessage>
 *     </div>
 *
 * **`direction` is set once and travels by context.** A sent message flips its
 * row, right-aligns its column, and every `Bubble` inside puts its tail on the
 * right and every `Metadata` row aligns right — without being told. A bubble
 * can still say `direction` itself, for the one that is not inside a message.
 *
 * **The log is the caller's element.** A message does not know whether it is
 * in a list, so it is an `<article>` — HTML's own example is a user-submitted
 * comment — and the container round the messages is `role="log"`, which
 * carries `aria-live="polite"` and announces each message once as it lands.
 * Not a `<ul>`: an orphan `<li>` fails axe, and nothing here can promise the
 * parent. `sender` is read out ahead of the text for the same reason —
 * visible-to-a-reader text, not an `aria-label`, because a live region reads
 * what is inserted, and a label on an `<article>` would be silent.
 *
 * **A message hugs three quarters of the column unless told to fill it.**
 * Astryx's cap, so a turn reads as coming from one side. A long assistant
 * reply is the exception — Figma's `Agent Reply` draws it at the column's
 * full width, and `layout="fill"` is that.
 *
 * **Bubbles stack at `gap-1`**, which is Figma's `Bubble Group`; consecutive
 * bubbles from one sender go in one message. The metadata row sits under the
 * last of them at the same gap, and the avatar sits beside the last bubble,
 * not beside the timestamp — that offset is derived from `metadata` being
 * there at all.
 *
 * **A chat log sits on `surface-background-primary`.** The default bubble is
 * `surface-background-subtle`, which is the canvas color in both themes; on
 * the canvas it vanishes.
 */
export interface ChatMessageProps
  extends Omit<ComponentPropsWithRef<'article'>, 'children' | 'className'> {
  /** Which side the message is on. Sent is the person using the app; received is everyone else. */
  direction?: ChatDirection
  /** The bubbles. `ChatMessage.Bubble`, one per paragraph of the turn. */
  children: ReactNode
  /** Who sent it, for a screen reader. Read out before the text; not drawn. */
  sender?: ReactNode
  /** The picture beside the bubbles — an `Avatar size="small"`, or a mark. */
  avatar?: ReactNode
  /** The row under the bubbles: a `ChatMessage.Metadata`. */
  metadata?: ReactNode
  /**
   * How wide the message may go. `hug` caps it at three quarters of the
   * column, so it reads as a bubble from one side; `fill` gives a long-form
   * reply the whole column — Figma's `Agent Reply`.
   */
  layout?: ChatMessageLayout
  /** Extra classes for the outermost element. */
  className?: string
}

export function ChatMessage({
  direction = 'received',
  children,
  sender,
  avatar,
  metadata,
  layout = 'hug',
  className,
  ...props
}: ChatMessageProps) {
  const styles = message({ direction, layout, hasMetadata: Boolean(metadata) })
  return (
    <ChatMessageContext.Provider value={direction}>
      <article className={cn(styles.root(), className)} {...props}>
        {avatar && <div className={styles.avatar()}>{avatar}</div>}
        <div className={styles.column()}>
          {sender && <span className="sr-only">{sender}: </span>}
          {children}
          {metadata}
        </div>
      </article>
    </ChatMessageContext.Provider>
  )
}

ChatMessage.displayName = 'ChatMessage'

export interface ChatMessageBubbleProps
  extends Omit<ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * Figma's `Appearance`. `default` is the quiet fill, `emphasized` the inverse
   * one, and `ghost` keeps the padding and drops the fill — for a long
   * assistant reply that should read as page text.
   */
  appearance?: ChatBubbleAppearance
  /** Figma's `Size`: 14/24 type at default, 12/20 at small. */
  size?: ChatBubbleSize
  /** Overrides the direction inherited from the message — for a bubble on its own. */
  direction?: ChatDirection
  /** The reactions overlay: a `ChatMessage.Reactions`, pinned to the top corner. */
  reactions?: ReactNode
  className?: string
}

function ChatMessageBubble({
  appearance = 'default',
  size = 'default',
  direction: directionProp,
  reactions,
  className,
  children,
  ...props
}: ChatMessageBubbleProps) {
  const inherited = useContext(ChatMessageContext)
  const direction = directionProp ?? inherited
  return (
    <div className={cn(bubble({ appearance, size, direction }), className)} {...props}>
      {children}
      {reactions}
    </div>
  )
}

ChatMessageBubble.displayName = 'ChatMessage.Bubble'

/** One reaction on a bubble. */
export interface ChatReaction {
  /** The emoji. A screen reader names it itself — "thumbs up". */
  emoji: string
  /** How many people reacted with it, when more than one. */
  count?: number
}

export interface ChatMessageReactionsProps
  extends Omit<ComponentPropsWithRef<'ul'>, 'children' | 'className'> {
  /** The reactions, in the order they show. */
  items: ChatReaction[]
  /** Overrides the direction inherited from the message. */
  direction?: ChatDirection
  className?: string
}

/**
 * Display-only, as Figma draws it: the pills say what was said back, and
 * nothing here toggles one. A picker is a different component the file does
 * not have.
 */
function ChatMessageReactions({
  items,
  direction: directionProp,
  className,
  ...props
}: ChatMessageReactionsProps) {
  const inherited = useContext(ChatMessageContext)
  const direction = directionProp ?? inherited
  return (
    // `role="list"` restated: Safari drops list semantics from a `list-style:
    // none` list, and the name is what tells a reader these are reactions
    // rather than more of the message.
    <ul
      role="list"
      aria-label="Reactions"
      className={cn(reactionsStyle({ direction }), className)}
      {...props}
    >
      {items.map(({ emoji, count }, index) => (
        <li key={`${emoji}-${index}`} className={reactionPill()}>
          <span>{emoji}</span>
          {count !== undefined && count > 1 && <span>{count}</span>}
        </li>
      ))}
    </ul>
  )
}

ChatMessageReactions.displayName = 'ChatMessage.Reactions'

export interface ChatMessageStatusProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'className'> {
  /** Figma's `Status`: Delivered | Read | Failed. */
  status: ChatDeliveryStatus
  /** Overrides the word — for a translation, or "Seen" over "Read". */
  children?: ReactNode
  className?: string
}

/**
 * Whether a sent message arrived. The word carries it; the glyph is hidden
 * from readers, and the danger color on Failed is a second signal, not the
 * only one.
 */
function ChatMessageStatus({ status, children, className, ...props }: ChatMessageStatusProps) {
  return (
    <span className={cn(statusStyle({ status }), className)} {...props}>
      <Icon icon={DELIVERY_ICON[status]} size="small" />
      {children ?? DELIVERY_LABEL[status]}
    </span>
  )
}

ChatMessageStatus.displayName = 'ChatMessage.Status'

export interface ChatMessageMetadataProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'className'> {
  /**
   * Delivery status, for a sent message. Shown in place of `actions` — Figma's
   * two directions each draw one of the two, and a message that has both is
   * not a shape the file has.
   */
  status?: ChatDeliveryStatus
  /**
   * A row of things to do with the message, for a received one — copy,
   * regenerate, rate. Ghost `Button size="small"`s with icons and `aria-label`s,
   * which is what Figma draws; a `Tooltip` round each is welcome, and they
   * share one delay.
   */
  actions?: ReactNode
  /** The time, as it should read: "12:30 PM". */
  timestamp?: ReactNode
  /** The same time by the clock, for `<time dateTime>` — an ISO string. */
  dateTime?: string
  /** Overrides the direction inherited from the message. */
  direction?: ChatDirection
  className?: string
}

function ChatMessageMetadata({
  status,
  actions,
  timestamp,
  dateTime,
  direction: directionProp,
  className,
  ...props
}: ChatMessageMetadataProps) {
  const inherited = useContext(ChatMessageContext)
  const direction = directionProp ?? inherited
  return (
    <div className={cn(metadataStyle({ direction }), className)} {...props}>
      {status ? (
        <ChatMessageStatus status={status} />
      ) : (
        actions && (
          <Tooltip.Provider>
            {/* Figma's `Actions Items`: the buttons sit flush, gap 0. */}
            <div className="flex items-center">{actions}</div>
          </Tooltip.Provider>
        )
      )}
      {timestamp !== undefined &&
        (dateTime ? <time dateTime={dateTime}>{timestamp}</time> : <span>{timestamp}</span>)}
    </div>
  )
}

ChatMessageMetadata.displayName = 'ChatMessage.Metadata'

ChatMessage.Bubble = ChatMessageBubble
ChatMessage.Reactions = ChatMessageReactions
ChatMessage.Status = ChatMessageStatus
ChatMessage.Metadata = ChatMessageMetadata
