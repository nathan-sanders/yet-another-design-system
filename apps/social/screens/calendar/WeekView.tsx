import { CalendarPostCard } from '../../components/PostCards'
import type { Post } from '../../data/types'
import { HourGrid } from './HourGrid'
import { weekDays } from './model'

interface WeekViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddPost: (date: Date) => void
}

export function WeekView({ anchor, selectedPostId, onOpenPost, onAddPost }: WeekViewProps) {
  return (
    <HourGrid
      days={weekDays(anchor)}
      onAddPost={onAddPost}
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
