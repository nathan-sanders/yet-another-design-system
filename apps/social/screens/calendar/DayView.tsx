import { CalendarAgendaCard } from '../../components/PostCards'
import { fullDate } from '../../data/dates'
import type { CalendarNote, Post } from '../../data/types'
import { HourGrid } from './HourGrid'
import { MovablePost } from './MovablePost'

interface DayViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddPost: (date: Date, time?: string) => void
  onAddNote: (date: Date) => void
  onOpenNote: (note: CalendarNote) => void
}

/**
 * One day. Figma has the agenda card for it (`_Calendar Agenda Content`,
 * "a post in the Post Calendar day agenda") but no day screen, so this is the
 * week's grid with one column and the wider card, centered in the column at 736px at most.
 */
export function DayView({
  anchor,
  selectedPostId,
  onOpenPost,
  onAddPost,
  onAddNote,
  onOpenNote,
}: DayViewProps) {
  return (
    <HourGrid
      days={[anchor]}
      dayLabel={(date) => fullDate.format(date)}
      onAddPost={onAddPost}
      onAddNote={onAddNote}
      onOpenNote={onOpenNote}
      renderPost={(post) => (
        <div key={post.id} className="mx-auto w-full max-w-184">
          <MovablePost post={post}>
            {(drag) => (
              <CalendarAgendaCard
                post={post}
                selected={post.id === selectedPostId}
                onOpen={onOpenPost}
                drag={drag}
              />
            )}
          </MovablePost>
        </div>
      )}
    />
  )
}
