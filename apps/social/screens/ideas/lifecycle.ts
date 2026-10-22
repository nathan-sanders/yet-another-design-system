import type { Draft } from '../../data/drafts'
import type { Idea, Post } from '../../data/types'
import { postMoment } from '../calendar/model'

// The three columns to the right of the user's groups on Plan › Ideas: what
// an idea became once it was made into a post. Pure, so it is tested in node
// (`lifecycle.test.ts`) and the board only reads it.

export interface DraftCard {
  idea: Idea
  draft: Draft
}

export interface PostCard {
  idea: Idea
  post: Post
  /** When it goes, or went, out. */
  at: Date
}

export interface DerivedColumns {
  /** Drafts made from an idea, most recently saved first (the Drafts order). */
  drafting: DraftCard[]
  /** Scheduled posts made from an idea, soonest first. */
  scheduled: PostCard[]
  /** Published posts made from an idea, latest first. */
  published: PostCard[]
}

/**
 * Reads the schedule for anything carrying an `ideaId` and sorts it into
 * Drafting, Scheduled and Published. An `ideaId` that no longer resolves is
 * ignored, an archived idea is left out, and `now` decides scheduled from
 * published — passed in, so the board and the test agree on the clock.
 */
export function derivedColumns(
  ideas: Record<string, Idea>,
  drafts: Draft[],
  posts: Post[],
  { now }: { now: Date },
): DerivedColumns {
  const live = (id: string | undefined): Idea | undefined => {
    const idea = id ? ideas[id] : undefined
    return idea && !idea.archived ? idea : undefined
  }
  const drafting: DraftCard[] = []
  for (const draft of drafts) {
    const idea = live(draft.ideaId)
    if (idea) drafting.push({ idea, draft })
  }
  const scheduled: PostCard[] = []
  const published: PostCard[] = []
  for (const post of posts) {
    const idea = live(post.ideaId)
    if (!idea) continue
    const at = postMoment(post)
    ;(at <= now ? published : scheduled).push({ idea, post, at })
  }
  scheduled.sort((a, b) => a.at.getTime() - b.at.getTime())
  published.sort((a, b) => b.at.getTime() - a.at.getTime())
  return { drafting, scheduled, published }
}

/** Whether an idea has gone on to a draft or a post. */
export function isLinked(ideaId: string, drafts: Draft[], posts: Post[]): boolean {
  return drafts.some((d) => d.ideaId === ideaId) || posts.some((p) => p.ideaId === ideaId)
}
