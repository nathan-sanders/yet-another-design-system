import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CalendarDays, Plus, SquarePen, StickyNote } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { Panel } from '../../../../src/components/Panel'
import { CalendarAgendaCard } from '../../components/PostCards'
import { fromISODate, fullDate, toISODate } from '../../data/dates'
import type { CalendarNote as Note } from '../../data/types'
import { composePath } from '../compose/paths'
import { HourGrid } from './HourGrid'
import { isPast } from './model'
import { NoteDialog, type NoteDialogRequest } from './NoteDialog'
import { PostDetailPanel } from './PostDetail'

const headerDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

/**
 * A day from the month view, in a `Panel`, laid out as the day view is: the
 * `HourGrid` with one column, a Notes row and then a row per hour. Code-first —
 * Figma has no day panel. The grid's own day header is off; the panel's header
 * says the date, and its + is the same day menu (Add post, Add note), which a
 * day gone by does not get.
 *
 * As in the day view, a click on the empty part of the Notes row starts a note,
 * and one on an empty hour starts a post at that hour. Both are pointer
 * shortcuts; the + menu is the keyboard route. Posts here are not draggable —
 * the panel is the shell's, outside the calendar's drag context.
 *
 * A post opens *stacked* on the day (a `Panel` nested in the body), so closing
 * it lands back on the day rather than on the bare calendar.
 */
export function DayDetailPanel({
  date,
  open,
  onClose,
}: {
  /** ISO date, kept after closing so the panel slides out with its day. */
  date?: string
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [noteRequest, setNoteRequest] = useState<NoteDialogRequest | null>(null)
  const [postId, setPostId] = useState<string>()
  const [lastPostId, setLastPostId] = useState<string>()
  if (postId && postId !== lastPostId) setLastPostId(postId)
  // A different day starts with no post stacked on it.
  const [shownDate, setShownDate] = useState(date)
  if (date !== shownDate) {
    setShownDate(date)
    setPostId(undefined)
  }

  const day = fromISODate(date ?? null)
  if (!day) return null

  const past = isPast(day)
  const openNote = (note: Note) => setNoteRequest({ mode: 'edit', note })
  const addNote = (date: Date) => setNoteRequest({ mode: 'new', date })
  // Back to this day's panel on the month afterwards.
  const addPost = (date: Date, time?: string) =>
    navigate(
      composePath({
        date,
        time,
        from: `/plan/calendar?view=month&date=${toISODate(day)}`,
      }),
    )

  return (
    <Panel
      aria-label={`Day detail, ${fullDate.format(day)}`}
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      resizable
    >
      <Panel.Header
        icon={CalendarDays}
        actions={
          past ? null : (
            <Menu>
              <Menu.Trigger
                render={
                  <Button
                    appearance="ghost"
                    startIcon={Plus}
                    aria-label={`Add to ${fullDate.format(day)}`}
                  />
                }
              />
              <Menu.Popup aria-label={`Add to ${fullDate.format(day)}`}>
                {/* The 8px round the rows is the Group's, not the Popup's. */}
                <Menu.Group>
                  <Menu.Item startIcon={SquarePen} onClick={() => addPost(day)}>
                    Add post
                  </Menu.Item>
                  <Menu.Item startIcon={StickyNote} onClick={() => addNote(day)}>
                    Add note
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          )
        }
      >
        {headerDate.format(day)}
      </Panel.Header>
      {/* Edge to edge, as the day view runs in the page: the grid's own rules
          and gutter frame it. */}
      <Panel.Body className="p-0">
        <HourGrid
          days={[day]}
          header={false}
          onAddPost={addPost}
          onAddNote={addNote}
          onOpenNote={openNote}
          renderPost={(post) => (
            <CalendarAgendaCard
              key={post.id}
              post={post}
              selected={post.id === postId}
              onOpen={(post) => setPostId(post.id === postId ? undefined : post.id)}
            />
          )}
        />

        <PostDetailPanel
          open={postId !== undefined}
          postId={lastPostId}
          onClose={() => setPostId(undefined)}
        />
      </Panel.Body>
      <NoteDialog request={noteRequest} onClose={() => setNoteRequest(null)} />
    </Panel>
  )
}
