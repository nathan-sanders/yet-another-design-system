import { CalendarAgendaCard } from '../../components/PostCards'
import { fullDate } from '../../data/dates'
import type { Post } from '../../data/types'
import { HourGrid } from './HourGrid'

interface DayViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddPost: (date: Date) => void
}

/**
 * One day. Figma has the agenda card for it (`_Calendar Agenda Content`,
 * "a post in the Post Calendar day agenda") but no day screen, so this is the
 * week's grid with one column and the wider card, capped at a readable width.
 */
export function DayView({ anchor, selectedPostId, onOpenPost, onAddPost }: DayViewProps) {
  return (
    <HourGrid
      days={[anchor]}
      dayLabel={(date) => fullDate.format(date)}
      onAddPost={onAddPost}
      renderPost={(post) => (
        <div key={post.id} className="w-full max-w-xl">
          <CalendarAgendaCard
            post={post}
            selected={post.id === selectedPostId}
            onOpen={onOpenPost}
          />
        </div>
      )}
    />
  )
}
