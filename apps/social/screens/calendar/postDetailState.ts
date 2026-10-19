import { me } from '../../data/people'
import type { Post } from '../../data/types'
import { isPublished } from './model'
import { usePostNotes } from './postNotesState'

// The post detail's state, shared by the calendar's panel and Engage ›
// Comments by post; the pieces themselves are in `PostDetail.tsx`.

export type DetailTab = 'comments' | 'notes' | 'activity' | 'measure'

export const DETAIL_TABS: DetailTab[] = ['comments', 'notes', 'activity', 'measure']

/**
 * The tab to show: the one picked, unless the post has not gone out — a
 * scheduled post has only Notes and Activity.
 */
export function currentTab(post: Post, tab: DetailTab): DetailTab {
  return isPublished(post) || tab === 'activity' ? tab : 'notes'
}

/** The post's notes: the seeded thread, then any left this session. */
export function usePostThread(post: Post | undefined) {
  const { added, addNote } = usePostNotes()
  const thread = post ? [...(post.thread ?? []), ...(added[post.id] ?? [])] : []
  const add = (body: string) => {
    if (!post) return
    addNote(post.id, { id: `local-${Date.now()}`, authorId: me.id, body, ago: 'now' })
  }
  return { thread, add }
}
