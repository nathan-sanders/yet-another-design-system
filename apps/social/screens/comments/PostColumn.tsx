import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '../../../../src/components/Button'
import { toISODate } from '../../data/dates'
import type { Post } from '../../data/types'
import { postDate } from '../calendar/model'
import { NoteComposer, PostBody, PostByline, PostDetailTabs } from '../calendar/PostDetail'
import { currentTab, usePostThread, type DetailTab } from '../calendar/postDetailState'

/**
 * Engage › Comments by post, right of the list: the calendar's post detail as
 * a column instead of a panel. The byline is the header bar, where the inbox
 * puts the customer; below it the copy, its numbers and the four tabs; on
 * Notes the composer is pinned to the foot, as the panel's footer is.
 *
 * On a phone the whole column scrolls as one, as the conversation does, so the
 * composer cannot squeeze the post off the screen.
 */
export function PostColumn({
  post,
  tab,
  onTabChange,
  onBack,
}: {
  post: Post
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { thread, add } = usePostThread(post)

  return (
    <section
      aria-label="Post detail"
      className="flex min-h-0 min-w-0 flex-1 flex-col max-md:overflow-y-auto"
    >
      <div className="flex h-14 shrink-0 items-center border-b border-surface-border bg-surface-background-primary py-3 pr-3 pl-4 max-md:sticky max-md:top-0 max-md:z-10 max-md:pl-2">
        <PostByline
          post={post}
          heading
          start={
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Comments by post"
              className="md:hidden"
              onClick={onBack}
            />
          }
          end={
            // The calendar opens on the post's day with its panel open — the
            // shell carries `state.panel` across the route change.
            <Button
              appearance="ghost"
              startIcon={CalendarDays}
              aria-label="Open in calendar"
              onClick={() =>
                navigate(`/plan/calendar?view=day&date=${toISODate(postDate(post))}`, {
                  state: { panel: { type: 'post', postId: post.id } },
                })
              }
            />
          }
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 max-md:flex-none max-md:overflow-visible">
        <PostBody post={post} />
        <PostDetailTabs post={post} thread={thread} tab={tab} onTabChange={onTabChange} />
      </div>
      {currentTab(post, tab) === 'notes' ? (
        <div className="shrink-0 px-4 pt-3 pb-4">
          <NoteComposer onSubmit={add} />
        </div>
      ) : null}
    </section>
  )
}
