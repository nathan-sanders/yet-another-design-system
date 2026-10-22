import { CalendarPostCard } from '../../components/PostCards'
import type { CalendarNote, Post } from '../../data/types'
import { HourGrid } from './HourGrid'
import { MovablePost } from './MovablePost'
import { weekDays } from './model'

interface WeekViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddPost: (date: Date, time?: string) => void
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
        <MovablePost key={post.id} post={post}>
          {(drag) => (
            <CalendarPostCard
              post={post}
              selected={post.id === selectedPostId}
              onOpen={onOpenPost}
              drag={drag}
            />
          )}
        </MovablePost>
      )}
    />
  )
}
