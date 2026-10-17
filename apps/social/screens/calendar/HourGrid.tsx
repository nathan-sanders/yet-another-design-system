import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { formatHour, fullDate, sameDay, weekdayShort } from '../../data/dates'
import type { Post } from '../../data/types'
import { HOURS, isPast, pastDayPattern, postHour, postsOn, today } from './model'

const GUTTER = 'w-14 shrink-0' // 56px, the file's `Gutter`

interface HourGridProps {
  days: Date[]
  renderPost: (post: Post) => ReactNode
  onAddPost: (date: Date) => void
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
export function HourGrid({ days, renderPost, onAddPost, dayLabel = weekLabel }: HourGridProps) {
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
                // Figma's `Highlight`: a 2px rule across the top of today.
                <span
                  aria-hidden
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-surface-border-emphasized"
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
                <Button
                  appearance="ghost"
                  startIcon={Plus}
                  aria-label={`Add post on ${fullDate.format(day)}`}
                  onClick={() => onAddPost(day)}
                />
              )}
            </div>
          )
        })}
      </div>

      <Row label="Notes" days={days}>
        {() => null}
      </Row>
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
      <div className={cn(GUTTER, 'flex justify-end pt-2 pr-2')}>
        <Text render={<span />} size="sm" color="subtle" className="whitespace-nowrap">
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
