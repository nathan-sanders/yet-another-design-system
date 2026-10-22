import type { Draft } from '../../data/drafts'
import type { Post } from '../../data/types'

/** Whether an idea has gone on to a draft or a post. */
export function isLinked(ideaId: string, drafts: Draft[], posts: Post[]): boolean {
  return drafts.some((d) => d.ideaId === ideaId) || posts.some((p) => p.ideaId === ideaId)
}
