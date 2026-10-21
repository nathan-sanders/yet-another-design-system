import { Plus } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { CalendarPostChip } from '../../components/PostCards'
import { fullDate, sameDay, weekdayShort } from '../../data/dates'
import { useShell } from '../../shell/ShellContext'
import { isPast, pastDayPattern, postsOn, today, weekDays } from '../calendar/model'
import { useSchedule } from '../calendar/scheduleState'

/**
 * Home's "This week" (`40005972:26336`): the calendar's week header over one
 * row of month chips, so the week reads at a glance without the hours. The
 * header is the week view's (`HourGrid`), down to the past-day hatch and
 * today's 2px rule; the chips are the month view's `_Calendar Post Chip`, and
 * one opens the post in the panel, as it does on the calendar.
 *
 * The header pads 8 on the left where the calendar's pads 12, with no gap
 * before the +: a column here is 100 wide, and the file's spacing truncates a
 * two-digit date ("Mon 19") that its single-digit week never had to fit.
 *
 * It runs edge to edge inside the block, so the block's Content drops its
 * padding. Below 768 each day keeps 104px and the strip scrolls sideways, the
 * way the calendar's grid does on a phone.
 */
export function WeekStrip() {
  const shell = useShell()
  const { posts } = useSchedule()
  const days = weekDays(today)
  const openPostId = shell.panel?.type === 'post' ? shell.panel.postId : undefined

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-182 flex-col md:min-w-0">
        <div className="flex border-b border-surface-border">
          {days.map((day) => {
            const isToday = sameDay(day, today)
            const past = isPast(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative flex h-10 min-w-0 flex-1 items-center border-l border-surface-border py-2 pr-1 pl-2 first:border-l-0',
                  past && pastDayPattern,
                )}
              >
                {isToday ? (
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
                  {weekdayShort.format(day)} {day.getDate()}
                  {isToday ? <span className="sr-only"> (today)</span> : null}
                </Text>
                {past ? null : (
                  <Button
                    appearance="ghost"
                    startIcon={Plus}
                    aria-label={`Add a post on ${fullDate.format(day)}`}
                    onClick={() => shell.notBuilt('The post composer')}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-32 min-w-0 flex-1 flex-col gap-1 border-l border-surface-border p-1 first:border-l-0',
                isPast(day) && pastDayPattern,
              )}
            >
              {postsOn(posts, day).map((post) => (
                <CalendarPostChip
                  key={post.id}
                  post={post}
                  selected={post.id === openPostId}
                  thumbnail={false}
                  onOpen={(p) => shell.setPanel({ type: 'post', postId: p.id })}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
