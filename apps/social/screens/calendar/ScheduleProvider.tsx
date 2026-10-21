import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { drafts as seedDrafts, type Draft } from '../../data/drafts'
import { posts as seedPosts } from '../../data/posts'
import type { Post } from '../../data/types'
import { toCalendarDay } from './model'
import {
  ScheduleContext,
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

  const value = useMemo<ScheduleState>(
    () => ({ posts, drafts, movePost, scheduleDraft, scheduling, requestSchedule }),
    [posts, drafts, movePost, scheduleDraft, scheduling],
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}
