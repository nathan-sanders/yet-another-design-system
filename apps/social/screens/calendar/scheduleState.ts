import { createContext, useContext } from 'react'

import type { Draft } from '../../data/drafts'
import type { Post } from '../../data/types'

/** Where a post goes out: a day and a 24-hour `HH:MM`. */
export interface ScheduleAt {
  date: Date
  time: string
}

/** The exact moment of a `ScheduleAt`. */
export function momentOf({ date, time }: ScheduleAt): Date {
  const [h, m] = time.split(':').map(Number)
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  at.setHours(h!, m!)
  return at
}

/**
 * What the Schedule dialog is open for: moving a post, putting a draft on the
 * calendar, or — `pick` — only choosing a day and time and handing it back,
 * which is how the composer's date button borrows the dialog without
 * committing anything.
 */
export type ScheduleRequest =
  | { source: 'post'; post: Post }
  | { source: 'draft'; draft: Draft }
  | { source: 'pick'; title: string; initial: ScheduleAt; onPick: (at: ScheduleAt) => void }

/** A draft as the composer saves it: the provider fills in the id, who and when. */
export type DraftInput = Omit<Draft, 'id' | 'authorId' | 'edited'>
/** A post as the composer schedules it: the provider places it from a `ScheduleAt`. */
export type PostInput = Omit<Post, 'id' | 'week' | 'day' | 'time'>

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
  /** Saves a new draft to the top of Drafts and returns its id. */
  addDraft: (input: DraftInput) => string
  updateDraft: (id: string, patch: Partial<Omit<Draft, 'id'>>) => void
  removeDraft: (id: string) => void
  /**
   * Puts a brand-new post on the calendar. Not `addDraft` then `scheduleDraft`:
   * the actions read the drafts through a ref that only refreshes on render,
   * so a draft added this tick is not there to schedule yet.
   */
  addPost: (input: PostInput, at: ScheduleAt) => { postId: string; undo: () => void }
  /** Edits a scheduled post in place; `at` moves it as well. */
  updatePost: (id: string, patch: Partial<Omit<Post, 'id'>> & { at?: ScheduleAt }) => void
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
