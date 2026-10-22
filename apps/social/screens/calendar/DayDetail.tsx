import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { CalendarDays, Plus, SquarePen, StickyNote } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { Panel } from '../../../../src/components/Panel'
import { Heading, Text } from '../../../../src/components/Text'
import { CalendarNote } from '../../components/CalendarNote'
import { CalendarAgendaCard } from '../../components/PostCards'
import { fromISODate, fullDate, toISODate } from '../../data/dates'
import type { CalendarNote as Note } from '../../data/types'
import { composePath } from '../compose/paths'
import { useCalendarNotes } from './calendarNotesState'
import { isPast, layoutNotes, postHour, postsOn } from './model'
import { NoteDialog, type NoteDialogRequest } from './NoteDialog'
import { useSchedule } from './scheduleState'
import { PostDetailPanel } from './PostDetail'

const headerDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

/**
 * A day from the month view, in a `Panel`: its notes, then its posts by time.
 * Code-first — Figma has no day panel. The header's + is the week view's day
 * menu (Add post, Add note), and like it, a day that has gone by has none.
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
  const { notes } = useCalendarNotes()
  const { posts } = useSchedule()
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
  const dayNotes = layoutNotes(notes, [day]).map((segment) => segment.note)
  const dayPosts = [...postsOn(posts, day)].sort(
    (a, b) => postHour(a) - postHour(b) || a.time.localeCompare(b.time),
  )
  const openNote = (note: Note) => setNoteRequest({ mode: 'edit', note })

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
                  <Menu.Item
                    startIcon={SquarePen}
                    onClick={() =>
                      navigate(
                        composePath({
                          date: day,
                          from: `/plan/calendar?view=month&date=${toISODate(day)}`,
                        }),
                      )
                    }
                  >
                    Add post
                  </Menu.Item>
                  <Menu.Item
                    startIcon={StickyNote}
                    onClick={() => setNoteRequest({ mode: 'new', date: day })}
                  >
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
      <Panel.Body className="flex flex-col gap-6">
        <DaySection title="Notes" count={dayNotes.length} empty="No notes on this day.">
          {dayNotes.map((note) => (
            <CalendarNote key={note.id} note={note} onOpen={openNote} />
          ))}
        </DaySection>
        <DaySection
          title="Posts"
          count={dayPosts.length}
          empty={past ? 'Nothing went out this day.' : 'Nothing scheduled yet.'}
        >
          {dayPosts.map((post) => (
            <CalendarAgendaCard
              key={post.id}
              post={post}
              selected={post.id === postId}
              onOpen={(post) => setPostId(post.id === postId ? undefined : post.id)}
            />
          ))}
        </DaySection>

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

function DaySection({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <Heading level={3} size="sm" weight="semibold" color="subtle">
        {title} <span className="font-normal">· {count}</span>
      </Heading>
      {count > 0 ?
        children
      : <Text size="sm" color="subtle">
          {empty}
        </Text>
      }
    </section>
  )
}
