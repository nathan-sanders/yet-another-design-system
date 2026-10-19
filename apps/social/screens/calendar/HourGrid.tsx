import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Plus, SquarePen, StickyNote } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { formatHour, fullDate, sameDay, weekdayShort } from '../../data/dates'
import { CalendarNote } from '../../components/CalendarNote'
import type { CalendarNote as Note, Post } from '../../data/types'
import { useCalendarNotes } from './calendarNotesState'
import { HOURS, isPast, layoutNotes, pastDayPattern, postHour, postsOn, today } from './model'

const GUTTER = 'w-14 shrink-0' // 56px, the file's `Gutter`

interface HourGridProps {
  days: Date[]
  renderPost: (post: Post) => ReactNode
  onAddPost: (date: Date) => void
  onAddNote: (date: Date) => void
  onOpenNote: (note: Note) => void
  /** The day header's label: `Mon 7` in the week, the full date in a day. */
  dayLabel?: (date: Date) => string
}

/**
 * Below 768 each day keeps 112px and the grid scrolls sideways inside the
 * page — seven columns cannot share a phone's width, and Figma has no phone
 * calendar to say otherwise. A one-day grid fills the width either way.
 *
 * The week by hour (`40005911:32756`), and a day as the same grid with one
 * column. A sticky header of days, then a row per hour — Notes first — with a
 * dashed rule between rows and a solid one between days.
 *
 * Rows grow to fit their posts rather than sitting at a fixed hour height: the
 * file's 9 am row is 180 tall and its 8 am row 56, because that is what the
 * cards in it need. So it is a stack of flex rows, not an absolutely positioned
 * timeline, and the now line is placed inside the current hour's row.
 */
export function HourGrid({
  days,
  renderPost,
  onAddPost,
  onAddNote,
  onOpenNote,
  dayLabel = weekLabel,
}: HourGridProps) {
  const byDay = days.map((day) => postsOn(day))
  const todayIndex = days.findIndex((day) => sameDay(day, today))
  const now = useNow()

  return (
    <div className="flex min-w-0 flex-col">
      <div className="sticky top-0 z-10 flex border-b border-surface-border bg-surface-background-primary">
        <div className={GUTTER} />
        {days.map((day) => {
          const isToday = sameDay(day, today)
          const past = isPast(day)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'relative flex h-10 min-w-28 flex-1 items-center gap-1 border-l md:min-w-0 border-surface-border py-2 pr-1 pl-3',
                past && pastDayPattern,
              )}
            >
              {isToday ? (
                // Figma's `Highlight` (`40005911:32818`): a 2px rule in Surface/Border
                // Emphasized across the full top edge of today's column, square ends.
                <span
                  aria-hidden
                  className="absolute top-0 right-0 -left-px h-0.5 bg-surface-border-emphasized"
                />
              ) : null}
              <Text
                render={<span />}
                size="sm"
                weight={isToday ? 'semibold' : 'normal'}
                color={isToday ? 'emphasized' : past ? 'subtle' : 'primary'}
                truncate
                className="min-w-0 flex-1"
              >
                {dayLabel(day)}
                {isToday ? <span className="sr-only"> (today)</span> : null}
              </Text>
              {past ? null : (
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
                    <Menu.Item startIcon={SquarePen} onClick={() => onAddPost(day)}>
                      Add post
                    </Menu.Item>
                    <Menu.Item startIcon={StickyNote} onClick={() => onAddNote(day)}>
                      Add note
                    </Menu.Item>
                  </Menu.Popup>
                </Menu>
              )}
            </div>
          )
        })}
      </div>

      <NotesRow days={days} onAddNote={onAddNote} onOpenNote={onOpenNote} />
      {HOURS.map((hour) => (
        <Row
          key={hour}
          label={formatHour(hour)}
          days={days}
          now={
            todayIndex >= 0 && now.getHours() === hour
              ? { minute: now.getMinutes(), column: todayIndex }
              : undefined
          }
        >
          {(dayIndex) => byDay[dayIndex]!.filter((post) => postHour(post) === hour).map(renderPost)}
        </Row>
      ))}
    </div>
  )
}

function Row({
  label,
  days,
  now,
  children,
}: {
  label: string
  days: Date[]
  now?: { minute: number; column: number }
  children: (dayIndex: number) => ReactNode
}) {
  return (
    <div className="relative flex min-h-14 border-b border-dashed border-surface-border last:border-b-0">
      {/* The label sticks under the 40px day header while its row scrolls by,
          and the row's own bottom pushes it out — the row is its containing
          block. `items-start` keeps the span its own height; stretched, it
          would have nowhere to stick. */}
      <div className={cn(GUTTER, 'flex items-start justify-end pr-2')}>
        <Text
          render={<span />}
          size="sm"
          color="subtle"
          className="sticky top-12 mt-2 whitespace-nowrap"
        >
          {label}
        </Text>
      </div>
      {days.map((day, i) => (
        <div
          key={day.toISOString()}
          className={cn(
            'flex min-w-28 flex-1 flex-col gap-1 border-l border-surface-border p-1 md:min-w-0',
            isPast(day) && pastDayPattern,
          )}
        >
          {children(i)}
        </div>
      ))}
      {now ? <NowLine minute={now.minute} column={now.column} columns={days.length} /> : null}
    </div>
  )
}

/**
 * The Notes row: the hour rows' frame — gutter label, a column per day with its
 * rule and past-day hatch — but a grid rather than a flex row, so a note can
 * span columns. Notes stack in lanes (`layoutNotes`), one 24px bar and a 4px
 * gap each, and the row grows to fit them; with none it keeps the hour rows'
 * 56px.
 *
 * A click on a day's empty part starts a note there. It is a pointer shortcut
 * only — the day header's + menu is the keyboard route to the same thing — so
 * the cells are not buttons and add no tab stops to the grid.
 */
function NotesRow({
  days,
  onAddNote,
  onOpenNote,
}: {
  days: Date[]
  onAddNote: (date: Date) => void
  onOpenNote: (note: Note) => void
}) {
  const { notes } = useCalendarNotes()
  const segments = layoutNotes(notes, days)
  const lanes = segments.reduce((most, segment) => Math.max(most, segment.lane + 1), 0)

  return (
    <div className="relative flex min-h-14 border-b border-dashed border-surface-border">
      <div className={cn(GUTTER, 'flex items-start justify-end pr-2')}>
        <Text
          render={<span />}
          size="sm"
          color="subtle"
          className="sticky top-12 mt-2 whitespace-nowrap"
        >
          Notes
        </Text>
      </div>
      <div
        className={cn(
          'grid flex-1 grid-rows-(--note-rows)',
          // The hour rows' columns: 112px each on a phone, sharing the width above.
          'grid-cols-[repeat(var(--days),minmax(--spacing(28),1fr))] md:grid-cols-[repeat(var(--days),minmax(0,1fr))]',
        )}
        style={
          {
            '--days': days.length,
            '--note-rows': lanes > 0 ? `repeat(${lanes}, auto) minmax(4px, 1fr)` : '1fr',
          } as CSSProperties
        }
      >
        {days.map((day, i) => {
          const past = isPast(day)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'col-(--day) row-span-full border-l border-surface-border',
                past ? pastDayPattern : 'cursor-pointer hover:bg-surface-background-subtle',
              )}
              style={{ '--day': i + 1 } as CSSProperties}
              onClick={past ? undefined : () => onAddNote(day)}
            />
          )
        })}
        {segments.map((segment) => (
          <div
            key={segment.note.id}
            className="pointer-events-none col-(--note-col) row-(--note-row) min-w-0 px-1 pt-1"
            style={
              {
                '--note-col': `${segment.column + 1} / span ${segment.span}`,
                '--note-row': segment.lane + 1,
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
    </div>
  )
}

/**
 * Figma's `Now` (2px, `Surface/Border Emphasized`, gutter to edge) and `Now
 * Dot` (8px, at the start of today's column), placed by the minute within the
 * current hour's row.
 */
function NowLine({ minute, column, columns }: { minute: number; column: number; columns: number }) {
  return (
    <div
      aria-hidden
      // The runtime numbers go in custom properties that utilities read back,
      // the library's rule for a value only known at render.
      className="pointer-events-none absolute top-(--now-top) right-0 left-14 z-[1] h-0.5 bg-surface-border-emphasized"
      style={
        {
          '--now-top': `${(minute / 60) * 100}%`,
          '--now-left': `${(column / columns) * 100}%`,
        } as CSSProperties
      }
    >
      <span className="absolute -top-0.75 left-(--now-left) size-2 -translate-x-1/2 rounded-full bg-surface-border-emphasized" />
    </div>
  )
}

function weekLabel(date: Date): string {
  return `${weekdayShort.format(date)} ${date.getDate()}`
}

/** The current time, refreshed each minute so the now line creeps down. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}
