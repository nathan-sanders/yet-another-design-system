import type { ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Button } from '../../../src/components/Button'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { authorOf } from '../data/inbox'
import { personFor } from '../data/people'

/**
 * `_Inbox Comment` (`40005827:15584`): a 24px face beside the handle, the age,
 * a `⋯`, and the comment on the 14px body size. No bubble — this is the
 * customer's words on a public post, not a chat turn, which is why it is not a
 * `ChatMessage` (see FINDINGS, slice 2).
 */
export function InboxComment({
  authorId,
  ago,
  badge,
  sentBy,
  onMore,
  children,
  className,
}: {
  authorId: string
  ago: string
  /** Beside the name: `Internal` on a team note, `Sent` on a reply from here. */
  badge?: ReactNode
  /**
   * The teammate behind a reply from the brand's account, as a Token under it:
   * the post detail's author token, so who answered is said the same way.
   */
  sentBy?: string
  onMore: () => void
  children: ReactNode
  className?: string
}) {
  const author = authorOf(authorId)
  const sender = sentBy ? personFor(sentBy) : undefined
  return (
    <article aria-label={`${author.name}, ${ago}`} className={cn('flex gap-2', className)}>
      <Avatar name={author.name} src={author.avatar} alt="" size="small" className="mt-1" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Text render={<span />} weight="semibold" color="emphasized" truncate>
              {author.name}
            </Text>
            {badge}
          </div>
          <Text render={<span />} size="sm" color="subtle" className="shrink-0">
            {ago}
          </Text>
          <Button
            appearance="ghost"
            startIcon={Ellipsis}
            aria-label={`More for ${author.name}'s comment`}
            onClick={onMore}
          />
        </div>
        <Text className="whitespace-pre-line">{children}</Text>
        {sender ? (
          // Its own row, or the column's stretch would widen the Token.
          <div className="flex pt-1">
            <Token avatar={<Token.Avatar name={sender.name} src={sender.avatar} />}>
              {sender.name}
            </Token>
          </div>
        ) : null}
      </div>
    </article>
  )
}
