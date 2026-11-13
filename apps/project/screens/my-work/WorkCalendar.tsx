import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { pointerWithin, useDroppable, type DragMoveEvent } from '@dnd-kit/core'

import { DragAndDrop } from '../../../../src/components/DragAndDrop'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { day, fullDate, sameDay, today, weekdayLong, weekdayShort } from '../../data/dates'
import { FILE_WEEK, meetings, type TimeBlock } from '../../data/myWork'
import { projectFor } from '../../data/projects'
import type { ProjectColor, Task } from '../../data/types'
import { useTasks } from '../project/tasksState'
import { useBlocks } from './blocksState'
import {
  DAY_END,
  DAY_START,
  dropSpan,
  hourLabel,
  HOUR_HEIGHT,
  openWork,
  placeDay,
  spanLabel,
  unscheduled,
  workTitle,
  workWeek,
  type CalendarItem,
} from './model'
import { myWorkTaskPath } from './paths'
import { WorkCard } from './WorkBoard'

/** Yet Social's past-day hatch, as Home's week strip draws it. */
const pastDayPattern =
  'bg-[repeating-linear-gradient(135deg,var(--surface-border)_0_1px,transparent_1px_8px)]'

/** The hour a carried task would land in, as Yet Social's calendar marks it. */
const dropRing =
  'bg-action-ghost-background-hover outline-1 -outline-offset-1 outline-dashed outline-surface-border-emphasized'

/**
 * A block's fill: its project's Decorative hue, as `_Timeline Task Bar` is
 * painted in the frame, and the neutral one for meetings and work outside a
 * project. Written out whole so Tailwind can see the classes.
 */
const TONE: Record<ProjectColor | 'neutral', string> = {
  orange: 'bg-decorative-orange-background text-decorative-orange-foreground',
  pink: 'bg-decorative-pink-background text-decorative-pink-foreground',
  purple: 'bg-decorative-purple-background text-decorative-purple-foreground',
  red: 'bg-decorative-red-background text-decorative-red-foreground',
  teal: 'bg-decorative-teal-background text-decorative-teal-foreground',
  blue: 'bg-decorative-blue-background text-decorative-blue-foreground',
  yellow: 'bg-decorative-yellow-background text-decorative-yellow-foreground',
  sky: 'bg-decorative-sky-background text-decorative-sky-foreground',
  neutral: 'bg-decorative-neutral-background text-decorative-neutral-foreground',
}

function toneOf(task: Task | undefined): string {
  return TONE[projectFor(task?.projectId)?.color ?? 'neutral']
}

const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)

/** Where a carried task is aimed, read off the hour cell it is over. */
interface Slot {
  dayIndex: number
  hour: number
}

function slotId({ dayIndex, hour }: Slot): string {
  return `slot-${dayIndex}-${hour}`
}

let nextBlock = 0

/**
 * My work's Calendar (`My work - Calendar`, `40006315:49546`): this week,
 * Monday to Friday, 9 am to 6 pm at 72px an hour. A Due row under the days
 * holds what is due each day; the hours hold meetings in neutral and the
 * time blocked for work in its project's color. Past days are hatched, and
 * today carries the line for now.
 *
 * Beside it, Not scheduled lists this week's work with no time blocked for
 * it. A card dragged onto an hour blocks up to two hours there, and Undo in
 * the toast takes it back. The drag is pointer only, like Yet Social's
 * drafts; the keyboard's way to block time is Yak's plan for the week
 * (FINDINGS 61). A card's click opens its task.
 */
export function WorkCalendar() {
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const { tasks } = useTasks()
  const { blocks, addBlocks, removeBlocks } = useBlocks()
  const days = workWeek()
  const tray = useMemo(() => unscheduled(tasks, blocks), [tasks, blocks])
  const work = useMemo(() => openWork(tasks), [tasks])
  const [carried, setCarried] = useState<Task | null>(null)
  const [aimed, setAimed] = useState<string | null>(null)

  const open = (task: Task) => navigate(myWorkTaskPath(task, 'calendar'))

  const block = (task: Task, slot: Slot) => {
    const { start, end } = dropSpan(task, slot.hour)
    const added: TimeBlock = {
      id: `b-drop-${++nextBlock}`,
      label: task.short ?? workTitle(task),
      date: FILE_WEEK[slot.dayIndex],
      start,
      end,
      taskIds: [task.id],
    }
    addBlocks([added])
    toast.add({
      title: `Blocked ${weekdayShort.format(days[slot.dayIndex])} ${spanLabel(start, end)}`,
      description: workTitle(task),
      action: { label: 'Undo', onClick: () => removeBlocks([added.id]) },
    })
  }

  const aimAt = ({ collisions }: Pick<DragMoveEvent, 'collisions'>) =>
    setAimed(collisions?.[0] ? String(collisions[0].id) : null)
  const endDrag = () => {
    setCarried(null)
    setAimed(null)
  }

  return (
    <DragAndDrop
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => {
        const task = tasks.find((t) => t.id === active.id)
        if (task) setCarried(task)
      }}
      onDragMove={aimAt}
      onDragEnd={({ active, over }) => {
        const task = tasks.find((t) => t.id === active.id)
        const slot = over?.data.current as Slot | undefined
        if (task && slot) block(task, slot)
        endDrag()
      }}
      onDragCancel={endDrag}
    >
      <div className="flex flex-1 flex-col gap-3 @4xl/page:flex-row @4xl/page:items-start">
        <section
          aria-label={`Week of ${fullDate.format(days[0])}`}
          className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary"
        >
          <div className="grid min-w-164 grid-cols-[56px_repeat(5,minmax(0,1fr))]">
            {/* The days. */}
            <div className="h-10 border-b border-surface-border" />
            {days.map((date) => {
              const isToday = sameDay(date, today)
              return (
                <div
                  key={date.toISOString()}
                  className="flex h-10 items-center border-b border-l border-surface-border px-2"
                >
                  <Text
                    render={<span />}
                    size="sm"
                    weight={isToday ? 'semibold' : 'normal'}
                    color={isToday ? 'emphasized' : 'primary'}
                  >
                    {weekdayShort.format(date)} {date.getDate()}
                  </Text>
                </div>
              )
            })}

            {/* What is due each day. */}
            <Gutter label="Due" className="min-h-16 border-b border-surface-border" />
            {days.map((date) => {
              const due = work.filter((task) => sameDay(day(task.due), date))
              return (
                <ul
                  key={date.toISOString()}
                  aria-label={`Due ${weekdayLong.format(date)}`}
                  className={cn(
                    'flex min-h-16 min-w-0 flex-col gap-1 border-b border-l border-surface-border px-1 py-1.5',
                    isPast(date) && pastDayPattern,
                  )}
                >
                  {due.map((task) => (
                    <li key={task.id} className="flex">
                      <button
                        type="button"
                        aria-label={`${workTitle(task)}, due ${weekdayLong.format(date)}`}
                        onClick={() => open(task)}
                        className={cn(
                          'flex h-6 w-full min-w-0 items-center rounded-md px-2 text-left text-sm font-semibold',
                          toneOf(task),
                          focusRing,
                        )}
                      >
                        <span className="truncate">{task.short ?? workTitle(task)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            })}

            {/* The hours. */}
            <div className="flex flex-col">
              {HOURS.map((hour, i) => (
                <Gutter
                  key={hour}
                  label={hourLabel(hour)}
                  className={cn('h-18', i > 0 && 'border-t border-surface-border')}
                />
              ))}
            </div>
            {days.map((date, dayIndex) => (
              <DayColumn
                key={date.toISOString()}
                date={date}
                dayIndex={dayIndex}
                blocks={blocks}
                tasks={tasks}
                aimed={aimed}
                droppable={carried !== null && !isPast(date)}
                onOpen={open}
              />
            ))}
          </div>
        </section>

        <aside
          aria-labelledby="not-scheduled"
          className="flex w-full shrink-0 flex-col gap-2 @4xl/page:w-70"
        >
          <Heading id="not-scheduled" level={2} size="base" weight="semibold">
            Not scheduled · {tray.length}
          </Heading>
          <Text size="sm" color="subtle">
            {tray.length
              ? 'Drag a task onto the week to block time for it.'
              : 'Everything due this week has time blocked for it.'}
          </Text>
          {tray.length ? (
            <ul aria-labelledby="not-scheduled" className="flex flex-col gap-2">
              {tray.map((task) => (
                <li key={task.id}>
                  <DragAndDrop.Source id={task.id} label={workTitle(task)}>
                    <WorkCard task={task} onClick={() => open(task)} />
                  </DragAndDrop.Source>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
      {/* A copy under the pointer, as Yet Social carries its drafts: the card
          stays in the tray, faded, until it lands. */}
      <DragAndDrop.Overlay>
        {carried ? (
          <div aria-hidden inert className="w-70 rounded-md shadow-high">
            <WorkCard task={carried} />
          </div>
        ) : null}
      </DragAndDrop.Overlay>
    </DragAndDrop>
  )
}

function isPast(date: Date): boolean {
  return date < today && !sameDay(date, today)
}

/** The time down the left, in the file's 10px. */
function Gutter({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn('px-3 pt-1', className)}>
      <span className="text-xs text-content-subtle">{label}</span>
    </div>
  )
}

/**
 * One day's hours: an hour cell each, which a carried task can land in,
 * then the day's meetings and blocks laid over them. The day's own items
 * are a list, in time order, each saying when it is.
 */
function DayColumn({
  date,
  dayIndex,
  blocks,
  tasks,
  aimed,
  droppable,
  onOpen,
}: {
  date: Date
  dayIndex: number
  blocks: TimeBlock[]
  tasks: Task[]
  aimed: string | null
  droppable: boolean
  onOpen: (task: Task) => void
}) {
  const items: CalendarItem[] = [
    ...meetings
      .filter((m) => sameDay(day(m.date), date))
      .map((item) => ({ kind: 'meeting' as const, item })),
    ...blocks
      .filter((b) => sameDay(day(b.date), date))
      .map((item) => ({ kind: 'block' as const, item })),
  ]
  const placed = placeDay(items)
  return (
    <div className={cn('relative border-l border-surface-border', isPast(date) && pastDayPattern)}>
      {HOURS.map((hour, i) => (
        <HourCell
          key={hour}
          slot={{ dayIndex, hour }}
          first={i === 0}
          aimed={aimed === slotId({ dayIndex, hour })}
          disabled={!droppable}
          label={`${weekdayLong.format(date)}, ${hourLabel(hour)}`}
        />
      ))}
      <ol aria-label={fullDate.format(date)} className="contents">
        {placed.map(({ entry, lane, lanes }) => {
          const { item } = entry
          const task =
            entry.kind === 'block' ? tasks.find((t) => t.id === entry.item.taskIds[0]) : undefined
          const geometry = {
            '--top': `${(item.start - DAY_START) * HOUR_HEIGHT}px`,
            '--height': `${(item.end - item.start) * HOUR_HEIGHT - 4}px`,
            '--left': `calc(4px + (100% - 8px) * ${lane / lanes})`,
            '--width': `calc((100% - 8px) / ${lanes} - ${lanes > 1 ? 4 : 0}px)`,
          } as CSSProperties
          const when = spanLabel(item.start, item.end)
          const className = cn(
            'absolute top-(--top) left-(--left) flex h-(--height) w-(--width) min-w-0 items-center rounded-md px-2 text-left text-sm font-semibold',
            entry.kind === 'meeting' ? TONE.neutral : toneOf(task),
          )
          return (
            <li key={item.id} className="contents">
              {task ? (
                <button
                  type="button"
                  style={geometry}
                  onClick={() => onOpen(task)}
                  className={cn(className, focusRing)}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="sr-only">, {when}</span>
                </button>
              ) : (
                <div style={geometry} className={className}>
                  <span className="truncate">{item.label}</span>
                  <span className="sr-only">, {when}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {sameDay(date, today) ? <NowLine /> : null}
    </div>
  )
}

/** One hour of one day, and where a carried task lands. Ringed while it is aimed at. */
function HourCell({
  slot,
  first,
  aimed,
  disabled,
  label,
}: {
  slot: Slot
  first: boolean
  aimed: boolean
  disabled: boolean
  label: string
}) {
  const { setNodeRef } = useDroppable({ id: slotId(slot), data: { ...slot, label }, disabled })
  return (
    <div
      ref={setNodeRef}
      data-drop={slotId(slot)}
      className={cn('h-18', !first && 'border-t border-surface-border', aimed && dropRing)}
    />
  )
}

/**
 * Now, as a 2px rule across today in Content/Emphasized. The mock's today is
 * this week's Thursday; the time of day is the real one, and outside the
 * grid's hours there is no line.
 */
function NowLine() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const hours = now.getHours() + now.getMinutes() / 60
  if (hours < DAY_START || hours >= DAY_END) return null
  return (
    <div
      aria-hidden
      style={{ '--top': `${(hours - DAY_START) * HOUR_HEIGHT}px` } as CSSProperties}
      className="pointer-events-none absolute top-(--top) right-0 left-0 h-0.5 bg-content-emphasized"
    />
  )
}
