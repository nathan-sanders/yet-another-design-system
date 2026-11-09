import { Plus } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { statusFor } from '../../components/taskMeta'
import { addDays, day, fullDate, sameDay, today, weekdayShort } from '../../data/dates'
import { myWeek, type WeekItem } from '../../data/tasks'
import { useShell } from '../../shell/ShellContext'

/** Yet Social's past-day hatch: a 1px rule every 8px at 135°, in the border color. */
const pastDayPattern =
  'bg-[repeating-linear-gradient(135deg,var(--surface-border)_0_1px,transparent_1px_8px)]'

/**
 * Home's "This week" (`40006266:3768`): yesterday and the six days after it,
 * each with Nathan's work as `_Calendar Post Chip`s with no thumbnail and the
 * task's status glyph where Yet Social puts the network. The header is Yet
 * Social's — the past-day hatch, today's 2px rule, an add button per day.
 *
 * It runs edge to edge inside the block. Below 768 each day keeps 104px and
 * the strip scrolls sideways.
 */
export function WeekStrip() {
  const shell = useShell()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 1))
  const isPast = (date: Date) => date < today && !sameDay(date, today)
  const itemsOn = (date: Date) => myWeek.filter((item) => sameDay(day(item.date), date))

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-182 flex-col md:min-w-0">
        <div className="flex border-b border-surface-border">
          {days.map((date) => {
            const isToday = sameDay(date, today)
            const past = isPast(date)
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  'relative flex h-10 min-w-0 flex-1 items-center border-l border-surface-border py-2 pr-1 pl-3 first:border-l-0',
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
                  {weekdayShort.format(date)} {date.getDate()}
                  {isToday ? <span className="sr-only"> (today)</span> : null}
                </Text>
                {past ? null : (
                  <Button
                    appearance="ghost"
                    startIcon={Plus}
                    aria-label={`Add a task on ${fullDate.format(date)}`}
                    onClick={() => shell.notBuilt('New task')}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex">
          {days.map((date) => (
            <div
              key={date.toISOString()}
              className={cn(
                'flex min-h-32 min-w-0 flex-1 flex-col gap-1 border-l border-surface-border p-1 first:border-l-0',
                isPast(date) && pastDayPattern,
              )}
            >
              {itemsOn(date).map((item) => (
                <WeekChip
                  key={item.id}
                  item={item}
                  onOpen={() => shell.notBuilt('The task panel')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Yet Social's `_Calendar Post Chip` box, with a status glyph and the task's short name. */
function WeekChip({ item, onOpen }: { item: WeekItem; onOpen: () => void }) {
  const status = statusFor(item.status)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${item.title}, ${status.label}`}
      className={cn(
        'flex h-6 w-full min-w-0 items-center gap-1 rounded-sm border border-surface-border bg-surface-background-primary py-px pr-px pl-1 text-left',
        'hover:bg-surface-background-subtle',
        focusRing,
      )}
    >
      <Icon icon={status.icon} size="small" />
      <Text render={<span />} size="sm" truncate className="min-w-0 flex-1">
        {item.label}
      </Text>
    </button>
  )
}
