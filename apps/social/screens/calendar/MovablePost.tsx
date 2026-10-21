import type { ReactNode } from 'react'

import { formatTime } from '../../data/dates'
import { profileFor } from '../../data/posts'
import type { Post } from '../../data/types'
import { postDragId } from './drag'
import { useCardDrag, type CardDrag } from './dragHooks'
import { canMove } from './model'

/**
 * A post on the calendar, handed its drag: lifted by a pointer while it is
 * still scheduled, and a plain card once it has gone out.
 */
export function MovablePost({
  post,
  children,
}: {
  post: Post
  children: (drag: CardDrag) => ReactNode
}) {
  const label = `${profileFor(post).name}, ${formatTime(post.time)}`
  return children(useCardDrag(postDragId(post), { source: 'post', post, label }, canMove(post)))
}
