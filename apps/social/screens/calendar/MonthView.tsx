import type { CSSProperties } from 'react'

import { Link } from '../../../../src/components/Link'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { CalendarNote } from '../../components/CalendarNote'
import { CalendarPostChip } from '../../components/PostCards'
import { fullDate, monthShort, sameDay, toISODate, weekdayShort } from '../../data/dates'
import type { CalendarNote as Note, Post } from '../../data/types'
import { useCalendarNotes } from './calendarNotesState'
import { isPast, layoutNotes, monthDays, pastDayPattern, postsOn, today } from './model'

interface MonthViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddNote: (date: Date) => void
  onOpenNote: (note: Note) => void
}

/** A cell shows four rows: notes and chips together, or three and a "+N more" link. */
const ROWS = 4

/** Note lanes a week shows before the rest go behind "+N more". */
const NOTE_LANES = 2

/**
 * The month (`40005911:33286`): a weekday header, then six weeks of cells, each
 * listing its posts as `_Calendar Post Chip`s. The day numbers name the month
 * where it changes ("Jul 1", "Aug 1"), as the file does.
 *
 * Each week is its own grid so notes can run across its days: a row for the day
 * numbers, a row per note lane, then the posts. The day cells — rules, hatch,
 * today's line — span all of a week's rows behind them. A note that runs past
 * Saturday is drawn again on the next week's row, squared off where it breaks.
 */
export function MonthView({
  anchor,
  selectedPostId,
  onOpenPost,
  onAddNote,
  onOpenNote,
}: MonthViewProps) {
  const days = monthDays(anchor)
  const weekdays = days.slice(0, 7)
  const weeks = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7))

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-surface-border bg-surface-background-primary">
        {weekdays.map((day) => {
          const isTodaysWeekday = day.getDay() === today.getDay()
          return (
            <div
              key={day.getDay()}
              className="flex h-10 items-center border-l border-surface-border px-3 first:border-l-0"
            >
              <Text
                render={<span />}
                size="sm"
                weight={isTodaysWeekday ? 'semibold' : 'normal'}
                color={isTodaysWeekday ? 'emphasized' : 'subtle'}
              >
                {weekdayShort.format(day)}
              </Text>
            </div>
          )
        })}
      </div>

      {weeks.map((week, w) => (
        <Week
          key={week[0]!.toISOString()}
          days={week}
          first={w === 0}
          selectedPostId={selectedPostId}
          onOpenPost={onOpenPost}
          onAddNote={onAddNote}
          onOpenNote={onOpenNote}
        />
      ))}
    </div>
  )
}

function Week({
  days,
  first,
  selectedPostId,
  onOpenPost,
  onAddNote,
  onOpenNote,
}: {
  days: Date[]
  first: boolean
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  onAddNote: (date: Date) => void
  onOpenNote: (note: Note) => void
}) {
  const { notes } = useCalendarNotes()
  const segments = layoutNotes(notes, days)
  const lanes = Math.min(
    NOTE_LANES,
    segments.reduce((most, segment) => Math.max(most, segment.lane + 1), 0),
  )
  const shownSegments = segments.filter((segment) => segment.lane < lanes)

  return (
    <div
      className={cn(
        // `isolate` keeps the cells' -z-10 inside the week, above the page.
        'isolate grid min-h-36 flex-1 grid-cols-7 grid-rows-(--week-rows)',
        !first && 'border-t border-surface-border',
      )}
      style={
        {
          '--week-rows': lanes > 0 ? `auto repeat(${lanes}, auto) 1fr` : 'auto 1fr',
        } as CSSProperties
      }
    >
      {days.map((day, i) => {
        const isToday = sameDay(day, today)
        const past = isPast(day)
        const dayPosts = postsOn(day)
        const dayNotes = segments.filter(
          (segment) => segment.column <= i && i < segment.column + segment.span,
        )
        const hiddenNotes = dayNotes.length - dayNotes.filter((s) => s.lane < lanes).length
        // The note lanes take their rows across the whole week, so the posts
        // get what is left of the cell's four.
        const budget = ROWS - lanes
        const overflows = dayPosts.length > budget || hiddenNotes > 0
        const shown = overflows ? dayPosts.slice(0, Math.max(0, budget - 1)) : dayPosts
        const hidden = dayPosts.length - shown.length + hiddenNotes
        const label = day.getDate() === 1 ? `${monthShort.format(day)} 1` : String(day.getDate())
        const column = { '--day': i + 1 } as CSSProperties

        return [
          // The cell itself, behind everything in its column. It is positioned
          // for today's rule, which would otherwise paint it — hatch and all —
          // over the date, notes and posts, so -z-10 puts it back underneath.
          // A click on its empty part starts a note — a pointer shortcut; the
          // week's + menu is the keyboard route — so it is not a button.
          <div
            key={`cell-${i}`}
            className={cn(
              'relative -z-10 col-(--day) row-span-full border-surface-border',
              i > 0 && 'border-l',
              past ? pastDayPattern : 'cursor-pointer hover:bg-surface-background-subtle',
            )}
            style={column}
            onClick={past ? undefined : () => onAddNote(day)}
          >
            {isToday ? (
              <span
                aria-hidden
                className="absolute top-0 right-0 -left-px h-0.5 bg-surface-border-emphasized"
              />
            ) : null}
          </div>,
          <Text
            key={`date-${i}`}
            render={<span />}
            size="sm"
            weight={isToday ? 'semibold' : 'normal'}
            color={isToday ? 'emphasized' : 'primary'}
            className="pointer-events-none col-(--day) row-start-1 px-2 pt-1"
            style={column}
          >
            {label}
            <span className="sr-only">
              {`, ${fullDate.format(day)}${isToday ? ', today' : ''}, ${dayPosts.length} posts`}
              {dayNotes.length > 0 ? `, ${dayNotes.length} notes` : ''}
            </span>
          </Text>,
          <div
            key={`posts-${i}`}
            className="pointer-events-none col-(--day) row-[-2] flex min-w-0 flex-col gap-1 p-1 *:pointer-events-auto"
            style={column}
          >
            {shown.map((post) => (
              <CalendarPostChip
                key={post.id}
                post={post}
                selected={post.id === selectedPostId}
                onOpen={onOpenPost}
              />
            ))}
            {hidden > 0 ? (
              <Link
                href={`#/plan/calendar?view=day&date=${toISODate(day)}`}
                size="sm"
                className="self-start px-1"
              >
                +{hidden} more
              </Link>
            ) : null}
          </div>,
        ]
      })}

      {shownSegments.map((segment) => (
        <div
          key={segment.note.id}
          className="pointer-events-none col-(--note-col) row-(--note-row) min-w-0 px-1 pt-1"
          style={
            {
              '--note-col': `${segment.column + 1} / span ${segment.span}`,
              '--note-row': segment.lane + 2,
            } as CSSProperties
          }
        >
          <CalendarNote
            note={segment.note}
            continuesBefore={segment.continuesBefore}
            continuesAfter={segment.continuesAfter}
            onOpen={onOpenNote}
            className="pointer-events-auto"
          />
        </div>
      ))}
    </div>
  )
}
