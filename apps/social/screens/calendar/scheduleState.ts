import { createContext, useContext } from 'react'

import type { Draft } from '../../data/drafts'
import type { Post } from '../../data/types'

/** What the Schedule dialog is open for: moving a post, or putting a draft on the calendar. */
export type ScheduleRequest = { source: 'post'; post: Post } | { source: 'draft'; draft: Draft }

/** Where a post goes out: a day and a 24-hour `HH:MM`. */
export interface ScheduleAt {
  date: Date
  time: string
}

/**
 * The schedule for the session: every post, and the drafts still waiting. Held
 * above the routes (`ScheduleProvider` in `main.tsx`), like the calendar's
 * notes, so a post moved on the week is still moved on Home.
 *
 * Only a scheduled post moves. A published one has gone out, so the screens
 * that only ever show published posts — Discover, Comments by post — read the
 * fixture in `data/posts.ts` and lose nothing by it.
 */
export interface ScheduleState {
  posts: Post[]
  drafts: Draft[]
  /** Moves a post and returns the move's undo. */
  movePost: (id: string, at: ScheduleAt) => () => void
  /**
   * Takes a draft off the Drafts panel and puts it on the calendar as a post.
   * Returns the new post's id and the undo, which puts the draft back where it was.
   */
  scheduleDraft: (draftId: string, at: ScheduleAt) => { postId: string; undo: () => void }
  /**
   * The Schedule dialog's request — the keyboard's way to do what a drag does.
   * Held here so the post detail (a shell panel) and the Drafts panel can both
   * open the one dialog the shell renders.
   */
  scheduling: ScheduleRequest | null
  requestSchedule: (request: ScheduleRequest | null) => void
}

export const ScheduleContext = createContext<ScheduleState | null>(null)

export function useSchedule(): ScheduleState {
  const schedule = useContext(ScheduleContext)
  if (!schedule) throw new Error('useSchedule needs the ScheduleProvider around it')
  return schedule
}
