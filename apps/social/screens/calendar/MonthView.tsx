import { Link } from '../../../../src/components/Link'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { CalendarPostChip } from '../../components/PostCards'
import { fullDate, monthShort, sameDay, toISODate, weekdayShort } from '../../data/dates'
import type { Post } from '../../data/types'
import { isPast, monthDays, pastDayPattern, postsOn, today } from './model'

interface MonthViewProps {
  anchor: Date
  selectedPostId?: string
  onOpenPost: (post: Post) => void
}

/** A cell shows four rows: four chips, or three and a "+N more" link. */
const ROWS = 4

/**
 * The month (`40005911:33286`): a weekday header, then six weeks of cells, each
 * listing its posts as `_Calendar Post Chip`s. The day numbers name the month
 * where it changes ("Jul 1", "Aug 1"), as the file does.
 */
export function MonthView({ anchor, selectedPostId, onOpenPost }: MonthViewProps) {
  const days = monthDays(anchor)
  const weekdays = days.slice(0, 7)

  return (
    <div className="grid min-h-full grid-cols-7 grid-rows-[auto_repeat(6,minmax(--spacing(36),1fr))]">
      {weekdays.map((day) => {
        const isTodaysWeekday = day.getDay() === today.getDay()
        return (
          <div
            key={day.getDay()}
            className="sticky top-0 z-10 flex h-10 items-center border-b border-l border-surface-border bg-surface-background-primary px-3 first:border-l-0"
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

      {days.map((day, i) => {
        const dayPosts = postsOn(day)
        const isToday = sameDay(day, today)
        const shown = dayPosts.length > ROWS ? dayPosts.slice(0, ROWS - 1) : dayPosts
        const hidden = dayPosts.length - shown.length
        const label = day.getDate() === 1 ? `${monthShort.format(day)} 1` : String(day.getDate())

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'relative flex min-w-0 flex-col gap-1 border-surface-border p-1',
              i % 7 !== 0 && 'border-l',
              i >= 7 && 'border-t',
              isPast(day) && pastDayPattern,
            )}
          >
            {isToday ? (
              <span
                aria-hidden
                className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-surface-border-emphasized"
              />
            ) : null}
            <Text
              render={<span />}
              size="sm"
              weight={isToday ? 'semibold' : 'normal'}
              color={isToday ? 'emphasized' : 'primary'}
              className="px-1"
            >
              {label}
              <span className="sr-only">
                {`, ${fullDate.format(day)}${isToday ? ', today' : ''}, ${dayPosts.length} posts`}
              </span>
            </Text>
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
          </div>
        )
      })}
    </div>
  )
}
