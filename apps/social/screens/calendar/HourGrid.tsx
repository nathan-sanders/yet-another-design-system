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
import { useSchedule } from './scheduleState'
import { slotId, slotTime } from './drag'
import { dropRing, useDropTarget } from './dragHooks'
import { HOURS, isPast, layoutNotes, pastDayPattern, postHour, postsOn, today } from './model'

const GUTTER = 'w-14 shrink-0' // 56px, the file's `Gutter`

/**
 * Where an hour's label sticks while its row scrolls by: 8px under the 40px
 * day header, or 8px under the top of the scroll region when there is none.
 */
const LABEL_STICK = { header: 'top-12', bare: 'top-2' } as const

interface HourGridProps {
  days: Date[]
  renderPost: (post: Post) => ReactNode
  /** A new post on `date`, at `time` (`HH:MM`) when it came from an hour. */
  onAddPost: (date: Date, time?: string) => void
  onAddNote: (date: Date) => void
  onOpenNote: (note: Note) => void
  /** The day header's label: `Mon 7` in the week, the full date in a day. */
  dayLabel?: (date: Date) => string
  /**
   * The sticky row of days with their + menus. Off in the month view's day
   * panel, whose own header already says the date and carries the same menu.
   */
  header?: boolean
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
  header = true,
}: HourGridProps) {
  const { posts } = useSchedule()
  const byDay = days.map((day) => postsOn(posts, day))
  const todayIndex = days.findIndex((day) => sameDay(day, today))
  const now = useNow()
  const stick = LABEL_STICK[header ? 'header' : 'bare']

  return (
    <div className="flex min-w-0 flex-col">
      {header ? (
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
                      {/* The 8px round the rows is the Group's, not the Popup's. */}
                      <Menu.Group>
                        <Menu.Item startIcon={SquarePen} onClick={() => onAddPost(day)}>
                          Add post
                        </Menu.Item>
                        <Menu.Item startIcon={StickyNote} onClick={() => onAddNote(day)}>
                          Add note
                        </Menu.Item>
                      </Menu.Group>
                    </Menu.Popup>
                  </Menu>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      <NotesRow days={days} stick={stick} onAddNote={onAddNote} onOpenNote={onOpenNote} />
      {HOURS.map((hour) => (
        <Row
          key={hour}
          hour={hour}
          label={formatHour(hour)}
          stick={stick}
          days={days}
          clock={now}
          onAddPost={onAddPost}
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
  hour,
  label,
  stick,
  days,
  clock,
  onAddPost,
  now,
  children,
}: {
  hour: number
  label: string
  stick: string
  days: Date[]
  clock: Date
  onAddPost: (date: Date, time: string) => void
  now?: { minute: number; column: number }
  children: (dayIndex: number) => ReactNode
}) {
  return (
    <div className="relative flex min-h-14 border-b border-dashed border-surface-border last:border-b-0">
      {/* The label sticks under the day header (`stick`) while its row scrolls by,
          and the row's own bottom pushes it out — the row is its containing
          block. `items-start` keeps the span its own height; stretched, it
          would have nowhere to stick. */}
      <div className={cn(GUTTER, 'flex items-start justify-end pr-2')}>
        <Text
          render={<span />}
          size="sm"
          color="subtle"
          className={cn('sticky mt-2 whitespace-nowrap', stick)}
        >
          {label}
        </Text>
      </div>
      {days.map((day, i) => (
        <HourCell
          key={day.toISOString()}
          day={day}
          hour={hour}
          time={slotTime(day, hour, clock)}
          onAddPost={onAddPost}
        >
          {children(i)}
        </HourCell>
      ))}
      {now ? <NowLine minute={now.minute} column={now.column} columns={days.length} /> : null}
    </div>
  )
}

/**
 * One day's hour: where its posts stack, and where a post or a draft carried
 * over it would land. Rings only when a release here would really schedule —
 * see `AimContext`.
 *
 * A click on its empty part starts a post there, at `time` — the hour, or the
 * next quarter in the one under way. As on the Notes row it is a pointer
 * shortcut only: the day header's + menu is the keyboard route, and the
 * composer's time picker takes it from there. The hover tint holds off while
 * the pointer is over a card, which opens the post instead.
 */
function HourCell({
  day,
  hour,
  time,
  onAddPost,
  children,
}: {
  day: Date
  hour: number
  /** Null once the hour has gone: no new post here. */
  time: string | null
  onAddPost: (date: Date, time: string) => void
  children: ReactNode
}) {
  const id = slotId(day, hour)
  const { ref, aimed } = useDropTarget(
    id,
    { kind: 'slot', date: day, hour },
    `${fullDate.format(day)}, ${formatHour(hour)}`,
  )
  return (
    <div
      ref={ref}
      data-drop={id}
      className={cn(
        'flex min-w-28 flex-1 flex-col gap-1 border-l border-surface-border p-1 md:min-w-0',
        isPast(day) && pastDayPattern,
        time && 'cursor-pointer hover:not-has-hover:bg-surface-background-subtle',
        aimed && dropRing,
      )}
      onClick={
        time
          ? (event) => {
              if (event.target === event.currentTarget) onAddPost(day, time)
            }
          : undefined
      }
    >
      {children}
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
  stick,
  onAddNote,
  onOpenNote,
}: {
  days: Date[]
  stick: string
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
          className={cn('sticky mt-2 whitespace-nowrap', stick)}
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
