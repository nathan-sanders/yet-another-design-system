import { CalendarPostCard } from '../../components/PostCards'
import type { CalendarNote, Post } from '../../data/types'
import { HourGrid } from './HourGrid'
import { weekDays } from './model'

interface WeekViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddPost: (date: Date) => void
  onAddNote: (date: Date) => void
  onOpenNote: (note: CalendarNote) => void
}

export function WeekView({
  anchor,
  selectedPostId,
  onOpenPost,
  onAddPost,
  onAddNote,
  onOpenNote,
}: WeekViewProps) {
  return (
    <HourGrid
      days={weekDays(anchor)}
      onAddPost={onAddPost}
      onAddNote={onAddNote}
      onOpenNote={onOpenNote}
      renderPost={(post) => (
        <CalendarPostCard
          key={post.id}
          post={post}
          selected={post.id === selectedPostId}
          onOpen={onOpenPost}
        />
      )}
    />
  )
}
