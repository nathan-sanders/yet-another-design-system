import type { CSSProperties } from 'react'

import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { CalendarNote } from '../../components/CalendarNote'
import { CalendarPostChip } from '../../components/PostCards'
import { fullDate, monthShort, sameDay, weekdayShort } from '../../data/dates'
import type { CalendarNote as Note, Post } from '../../data/types'
import { useCalendarNotes } from './calendarNotesState'
import { useSchedule } from './scheduleState'
import { dayId } from './drag'
import { dropRing, useDropTarget } from './dragHooks'
import { MovablePost } from './MovablePost'
import { isPast, layoutNotes, monthDays, pastDayPattern, postsOn, today } from './model'

interface MonthViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
  /** The day whose panel is open, drawn selected. */
  selectedDate?: Date
  onOpenDay: (date: Date) => void
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
  selectedDate,
  onOpenPost,
  onOpenDay,
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
          selectedDate={selectedDate}
          onOpenPost={onOpenPost}
          onOpenDay={onOpenDay}
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
  selectedDate,
  onOpenPost,
  onOpenDay,
  onOpenNote,
}: {
  days: Date[]
  first: boolean
  selectedPostId?: string
  selectedDate?: Date
  onOpenPost: (post: Post) => void
  onOpenDay: (date: Date) => void
  onOpenNote: (note: Note) => void
}) {
  const { notes } = useCalendarNotes()
  const { posts } = useSchedule()
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
        const selected = selectedDate !== undefined && sameDay(day, selectedDate)
        const dayPosts = postsOn(posts, day)
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
          // The day's own cell, behind everything in its column (`DayCell`).
          <DayCell
            key={`cell-${i}`}
            day={day}
            first={i === 0}
            isToday={isToday}
            selected={selected}
            column={column}
            onOpenDay={onOpenDay}
          />,
          <div
            key={`date-${i}`}
            className="pointer-events-none col-(--day) row-start-1 flex min-w-0 px-1 pt-1"
            style={column}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onOpenDay(day)}
              className={cn('pointer-events-auto rounded-sm px-1 text-left', focusRing)}
            >
              <Text
                render={<span />}
                size="sm"
                weight={isToday || selected ? 'semibold' : 'normal'}
                color={isToday || selected ? 'emphasized' : 'primary'}
              >
                {label}
                <span className="sr-only">
                  {`, ${fullDate.format(day)}${isToday ? ', today' : ''}, ${dayPosts.length} posts`}
                  {dayNotes.length > 0 ? `, ${dayNotes.length} notes` : ''}
                </span>
              </Text>
            </button>
          </div>,
          <div
            key={`posts-${i}`}
            className="pointer-events-none col-(--day) row-[-2] flex min-w-0 flex-col gap-1 p-1 *:pointer-events-auto"
            style={column}
          >
            {shown.map((post) => (
              <MovablePost key={post.id} post={post}>
                {(drag) => (
                  <CalendarPostChip
                    post={post}
                    selected={post.id === selectedPostId}
                    onOpen={onOpenPost}
                    drag={drag}
                  />
                )}
              </MovablePost>
            ))}
            {hidden > 0 ? (
              // Figma's `+2 more` (`40005959:68801`) is plain text-sm in
              // Content/Subtle, flush with the chips, not a link. It opens the
              // day's panel, where every note and post is listed.
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                aria-label={`${hidden} more on ${fullDate.format(day)}`}
                className={cn('self-start rounded-sm', focusRing)}
              >
                <Text render={<span />} size="sm" color="subtle">
                  +{hidden} more
                </Text>
              </button>
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

/**
 * The cell itself, behind everything in its column. It is positioned for
 * today's rule, which would otherwise paint it — hatch and all — over the
 * date, notes and posts, so -z-10 puts it back underneath. A click on its
 * empty part opens the day's panel — a pointer shortcut; the date is the
 * button that does it from the keyboard. Past days open too: what went out is
 * worth reading.
 *
 * It is also the day's drop target: a post carried here keeps its time, and a
 * draft goes at 9 (`placeFor`). Behind the chips, but a drop is aimed by the
 * pointer's position against the cell's rect, not by what is painted on top.
 */
function DayCell({
  day,
  first,
  isToday,
  selected,
  column,
  onOpenDay,
}: {
  day: Date
  first: boolean
  isToday: boolean
  selected: boolean
  column: CSSProperties
  onOpenDay: (date: Date) => void
}) {
  const { ref, aimed } = useDropTarget(dayId(day), { kind: 'day', date: day }, fullDate.format(day))
  return (
    <div
      ref={ref}
      data-drop={dayId(day)}
      className={cn(
        'relative -z-10 col-(--day) row-span-full cursor-pointer border-surface-border',
        !first && 'border-l',
        isPast(day) && pastDayPattern,
        selected ? 'bg-surface-background-subtle' : 'hover:bg-surface-background-subtle',
        aimed && dropRing,
      )}
      style={column}
      onClick={() => onOpenDay(day)}
    >
      {isToday ? (
        <span
          aria-hidden
          className="absolute top-0 right-0 -left-px h-0.5 bg-surface-border-emphasized"
        />
      ) : null}
    </div>
  )
}
