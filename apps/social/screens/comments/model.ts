import { statsFor } from '../../data/performance'
import { posts } from '../../data/posts'
import type { Post } from '../../data/types'
import { isPublished, postMoment } from '../calendar/model'

export type PostSort = 'published' | 'comments' | 'unread'

/** Veggie Vault's connected profiles — Feel Good's posts belong to its own workspace. */
const isVeggieVault = (post: Post) => post.profileId.startsWith('vv-')

/**
 * The list as the toolbar asks for it: every post Veggie Vault has published,
 * newest first by default, or by how many comments it has or how many nobody
 * has opened. Ties keep the newest first.
 *
 * "Most unread" ranks by the fixture counts, not what you have read this
 * session: opening a post clears its count, and re-ranking on that would send
 * the post you just opened to the bottom of the list from under you.
 */
export function publishedPosts(sort: PostSort, descending: boolean): Post[] {
  const byNewest = posts
    .filter((post) => isVeggieVault(post) && isPublished(post))
    .sort((a, b) => postMoment(b).getTime() - postMoment(a).getTime())
  const ranked =
    sort === 'published'
      ? byNewest
      : byNewest
          .map((post, index) => ({ post, index }))
          .sort((a, b) => statsFor(b.post)[sort] - statsFor(a.post)[sort] || a.index - b.index)
          .map((r) => r.post)
  return descending ? ranked : [...ranked].reverse()
}

/** How long ago a post went out, in the inbox's short form: `45m`, `3h`, `6d`. */
export function ageOf(post: Post, now = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - postMoment(post).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}
