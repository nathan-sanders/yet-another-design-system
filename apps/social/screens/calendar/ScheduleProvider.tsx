import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { drafts as seedDrafts, type Draft } from '../../data/drafts'
import { me } from '../../data/people'
import { posts as seedPosts } from '../../data/posts'
import type { Post } from '../../data/types'
import { toCalendarDay } from './model'
import {
  ScheduleContext,
  type DraftInput,
  type PostInput,
  type ScheduleAt,
  type ScheduleRequest,
  type ScheduleState,
} from './scheduleState'

/** Holds the posts and drafts for every screen. See `scheduleState.ts`. */
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(seedPosts)
  const [drafts, setDrafts] = useState<Draft[]>(seedDrafts)
  const [scheduling, requestSchedule] = useState<ScheduleRequest | null>(null)
  // Read by the actions, so each can return an undo for what it replaced
  // without being rebuilt every time the schedule changes.
  const current = useRef({ posts, drafts })
  current.current = { posts, drafts }

  const movePost = useCallback((id: string, { date, time }: ScheduleAt) => {
    const before = current.current.posts.find((post) => post.id === id)
    if (!before) return () => {}
    const { week, day } = toCalendarDay(date)
    setPosts((all) => all.map((post) => (post.id === id ? { ...post, week, day, time } : post)))
    return () =>
      setPosts((all) =>
        all.map((post) =>
          post.id === id
            ? { ...post, week: before.week, day: before.day, time: before.time }
            : post,
        ),
      )
  }, [])

  const scheduleDraft = useCallback((draftId: string, { date, time }: ScheduleAt) => {
    const index = current.current.drafts.findIndex((draft) => draft.id === draftId)
    const draft = current.current.drafts[index]
    const postId = `p-${draftId}`
    if (!draft) return { postId, undo: () => {} }
    const post: Post = {
      id: postId,
      profileId: draft.profileId,
      ...toCalendarDay(date),
      time,
      body: draft.body,
      photo: draft.photo,
      photoAlt: draft.photoAlt,
    }
    setDrafts((all) => all.filter((each) => each.id !== draftId))
    setPosts((all) => [...all, post])
    return {
      postId,
      undo: () => {
        setPosts((all) => all.filter((each) => each.id !== postId))
        setDrafts((all) => [...all.slice(0, index), draft, ...all.slice(index)])
      },
    }
  }, [])

  // Ids for what this session makes. A ref, not state: StrictMode runs an
  // updater twice, and a counter inside one would skip a number.
  const made = useRef(0)

  const addDraft = useCallback((input: DraftInput) => {
    const id = `d-new-${++made.current}`
    const draft: Draft = { ...input, id, authorId: me.id, edited: 'just now' }
    setDrafts((all) => [draft, ...all])
    return id
  }, [])

  const updateDraft = useCallback((id: string, patch: Partial<Omit<Draft, 'id'>>) => {
    setDrafts((all) =>
      all.map((draft) => (draft.id === id ? { ...draft, ...patch, edited: 'just now' } : draft)),
    )
  }, [])

  const removeDraft = useCallback((id: string) => {
    setDrafts((all) => all.filter((draft) => draft.id !== id))
  }, [])

  const addPost = useCallback((input: PostInput, { date, time }: ScheduleAt) => {
    const postId = `p-new-${++made.current}`
    const post: Post = { ...input, id: postId, ...toCalendarDay(date), time }
    setPosts((all) => [...all, post])
    return { postId, undo: () => setPosts((all) => all.filter((each) => each.id !== postId)) }
  }, [])

  const returnToDrafts = useCallback((postIds: readonly string[]) => {
    const ids = new Set(postIds)
    const leaving = current.current.posts.filter((post) => ids.has(post.id))
    if (leaving.length === 0) return
    const back: Draft[] = leaving.map((post) => ({
      id: `d-${post.id}`,
      profileId: post.profileId,
      body: post.body,
      photo: post.photo,
      photoAlt: post.photoAlt,
      authorId: me.id,
      edited: 'just now',
      ideaId: post.ideaId,
      campaignId: post.campaignId,
      tagNames: post.tagNames,
      assigneeId: post.assigneeId,
      format: post.format,
      firstComment: post.firstComment,
    }))
    setPosts((all) => all.filter((post) => !ids.has(post.id)))
    setDrafts((all) => [...back, ...all])
  }, [])

  const updatePost = useCallback(
    (id: string, { at, ...patch }: Partial<Omit<Post, 'id'>> & { at?: ScheduleAt }) => {
      const placed = at ? { ...toCalendarDay(at.date), time: at.time } : {}
      setPosts((all) =>
        all.map((post) => (post.id === id ? { ...post, ...patch, ...placed } : post)),
      )
    },
    [],
  )

  const value = useMemo<ScheduleState>(
    () => ({
      posts,
      drafts,
      movePost,
      scheduleDraft,
      addDraft,
      updateDraft,
      removeDraft,
      addPost,
      returnToDrafts,
      updatePost,
      scheduling,
      requestSchedule,
    }),
    [
      posts,
      drafts,
      movePost,
      scheduleDraft,
      addDraft,
      updateDraft,
      removeDraft,
      addPost,
      returnToDrafts,
      updatePost,
      scheduling,
    ],
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}
