import { useMemo, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, FolderOpen, ListFilter } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Heading } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { barTone } from '../../components/taskMeta'
import { addDays, day, rangeLabel, sameDay, shortDate, today } from '../../data/dates'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { addMonths, monthFromKey, monthKey, segmentsOf, weeksOf } from './calendar'
import { projectPath, taskPath } from './paths'
import { useTasks } from './tasksState'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

/** Where the first lane starts under a day's number, the lanes' step, and a week's least height. */
const FIRST_LANE = 34
const LANE_STEP = 28
const WEEK_HEIGHT = 148

/**
 * A project's Calendar (`Project - Calendar`, `40006272:9258`): a month,
 * Sunday first, with each open task as a bar across its days, cut at each
 * week's edge and stacked in lanes. The Timeline's colors; no faces, as
 * drawn. Today is a filled circle, and days already gone are subtle. The
 * month is in the URL (`?month=2026-12`), and a bar opens its task's panel.
 */
export function CalendarView({ project }: { project: Project }) {
  const shell = useShell()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const month = monthFromKey(params.get('month'), today)
  const setMonth = (next: Date) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        if (monthKey(next) === monthKey(today)) copy.delete('month')
        else copy.set('month', monthKey(next))
        return copy
      },
      { replace: true },
    )

  const { tasks } = useTasks()
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id),
    [tasks, project.id],
  )
  const weeks = useMemo(() => weeksOf(month), [month])

  if (projectTasks.length === 0) {
    return (
      <NotBuiltMessage
        icon={FolderOpen}
        title="No tasks in this mock yet"
        body={`Only Austin store opening has tasks so far; ${project.name}’s come in a later slice.`}
        link={{ href: `#${projectPath('austin', 'calendar')}`, label: 'Open Austin store opening' }}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Today Secondary, the arrows Ghost, the month, then Filter. */}
      <div className="flex flex-wrap items-center gap-1">
        <Button appearance="secondary" onClick={() => setMonth(today)}>
          Today
        </Button>
        <Button
          appearance="ghost"
          startIcon={ArrowLeft}
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
        />
        <Button
          appearance="ghost"
          startIcon={ArrowRight}
          aria-label="Next month"
          onClick={() => setMonth(addMonths(month, 1))}
        />
        <Heading level={2} size="base" weight="semibold" aria-live="polite" className="px-1">
          {monthYear.format(month)}
        </Heading>
        <Button
          appearance="ghost"
          startIcon={ListFilter}
          onClick={() => shell.notBuilt('Filtering the calendar')}
        >
          Filter
        </Button>
      </div>

      {/* Seven columns do not fit a phone, so below that the month scrolls sideways. */}
      <div
        role="region"
        aria-label={`${project.name} calendar`}
        tabIndex={0}
        className={cn(
          'overflow-x-auto rounded-container-outer border border-surface-border bg-surface-background-primary',
          focusRing,
        )}
      >
        <div className="min-w-160">
          <div aria-hidden="true" className="grid h-8 grid-cols-7 border-b border-surface-border">
            {WEEKDAYS.map((name, i) => (
              <span
                key={name}
                className={cn(
                  'flex items-center px-3 text-sm text-content-subtle',
                  i > 0 && 'border-l border-surface-border',
                )}
              >
                {name}
              </span>
            ))}
          </div>
          {weeks.map((sunday, i) => (
            <Week
              key={sunday.getTime()}
              sunday={sunday}
              month={month}
              tasks={projectTasks}
              last={i === weeks.length - 1}
              onOpen={(task) => navigate(taskPath(task, 'calendar'))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * One week: the seven days with their numbers, and the week's pieces of
 * each task over them. It grows past the file's 148 when more lanes than
 * four are needed, rather than hiding work behind a "more".
 */
function Week({
  sunday,
  month,
  tasks,
  last,
  onOpen,
}: {
  sunday: Date
  month: Date
  tasks: Task[]
  last: boolean
  onOpen: (task: Task) => void
}) {
  const segments = segmentsOf(sunday, tasks)
  const lanes = segments.reduce((most, s) => Math.max(most, s.lane + 1), 0)
  // The last bar's 24, and 6 under it, as the file's fourth lane leaves.
  const height = Math.max(WEEK_HEIGHT, FIRST_LANE + (lanes - 1) * LANE_STEP + 24 + 6)
  const days = Array.from({ length: 7 }, (_, i) => addDays(sunday, i))

  return (
    <section
      aria-label={`Week of ${shortDate.format(sunday)}`}
      className={cn('relative h-(--week-height)', !last && 'border-b border-surface-border')}
      style={{ '--week-height': `${height}px` } as CSSProperties}
    >
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-7">
        {days.map((date, i) => {
          const isToday = sameDay(date, today)
          const outside = date.getMonth() !== month.getMonth()
          return (
            <div
              key={date.getTime()}
              className={cn('px-3 pt-2', i > 0 && 'border-l border-surface-border')}
            >
              {isToday ? (
                <span className="-mx-2 -mt-0.5 flex size-6 items-center justify-center rounded-full bg-surface-background-emphasized text-sm font-semibold text-content-inverse">
                  {date.getDate()}
                </span>
              ) : (
                <span
                  className={cn(
                    'text-sm',
                    date < today ? 'text-content-subtle' : 'text-content-primary',
                  )}
                >
                  {outside ? shortDate.format(date) : date.getDate()}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <ul className="relative">
        {segments.map((segment) => {
          const dates = rangeLabel(day(segment.task.start!), day(segment.task.due))
          return (
            <li
              key={segment.task.id}
              className="absolute top-[calc(34px+var(--lane)*28px)] left-[calc(var(--from)*100%/7+4px)] w-[calc(var(--span)*100%/7-8px)]"
              style={
                {
                  '--from': segment.from,
                  '--span': segment.to - segment.from + 1,
                  '--lane': segment.lane,
                } as CSSProperties
              }
            >
              <button
                type="button"
                aria-label={`${segment.task.title}, ${dates}`}
                onClick={() => onOpen(segment.task)}
                className={cn(
                  'flex h-6 w-full items-center rounded-md px-2 text-left text-sm font-semibold',
                  barTone(segment.task),
                  focusRing,
                )}
              >
                <span className="truncate">{segment.task.title}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
