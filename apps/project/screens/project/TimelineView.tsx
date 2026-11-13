import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  ListFilter,
  TriangleAlert,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { barTone, statusFor } from '../../components/taskMeta'
import { day, rangeLabel, shortDate, today } from '../../data/dates'
import { overviewFor } from '../../data/overview'
import { personFor } from '../../data/people'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { projectPath, taskPath } from './paths'
import { useTasks } from './tasksState'
import {
  barOf,
  dependencyPath,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  slipDays,
  TASK_COLUMN,
  timelineRange,
  timelineRows,
  xOf,
  ZOOMS,
  type Range,
  type TimelineRow,
  type Zoom,
} from './timeline'

/** Everything before today, hatched, as the calendar's `_Past Day Pattern` draws it. */
const pastDayPattern =
  'bg-[repeating-linear-gradient(135deg,var(--surface-border)_0_1px,transparent_1px_8px)]'

/** Narrower than this, a bar drops its face and puts its name beside it, as Finalize's does. */
const LABEL_INSIDE = 88

/** What the file's text-sm/semibold and text-sm average a character at, for placing labels. */
const CHAR_PX = 7

/**
 * A project's Timeline (`Project - Timeline`, `40006272:7631`): the toolbar,
 * then a chart with the tasks down the left and the weeks across. The
 * milestones run along the top, each phase is a band that folds, and each
 * open task is a bar from its start to its due date, colored by phase, with
 * the line from whatever it waits on. The past is hatched and today is a
 * line. With Baseline on, a slipped task shows where it was planned and how
 * late it is now.
 *
 * Each task's name is a button that opens its panel; the bars do the same
 * for a pointer and stay out of the tab order and the accessibility tree,
 * where the name's description already says what the bar does. Dragging to
 * reschedule (`Timeline - Reschedule ripple`, `40006293:23982`), the
 * critical path (`40006293:25366`) and the no-date tray (`40006293:26712`)
 * are drawn and not built.
 */
export function TimelineView({ project }: { project: Project }) {
  const shell = useShell()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const zoom: Zoom = (ZOOMS.find((z) => z.value === params.get('zoom'))?.value ?? 'weeks') as Zoom
  const setZoom = (next: Zoom) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        if (next === 'weeks') copy.delete('zoom')
        else copy.set('zoom', next)
        return copy
      },
      { replace: true },
    )

  const [baseline, setBaseline] = useState(true)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const toggle = (phase: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })

  const { tasks } = useTasks()
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id),
    [tasks, project.id],
  )
  const range = useMemo(() => timelineRange(project.start, zoom), [project.start, zoom])
  const rows = useMemo(() => timelineRows(projectTasks, collapsed), [projectTasks, collapsed])
  const undated = projectTasks.filter((t) => t.status !== 'done' && !t.start).length
  const height = (rows.at(-1)?.y ?? HEADER_HEIGHT) + ROW_HEIGHT

  const scroller = useRef<HTMLDivElement>(null)
  const todayX = xOf(range, today)
  const columnWidth = range.columns[0]?.width ?? 80
  // Open with today's column first, one column of what came before in view.
  const scrollToToday = () => {
    const el = scroller.current
    if (el) el.scrollLeft = Math.max(todayX - columnWidth, 0)
  }
  useLayoutEffect(scrollToToday, [todayX, columnWidth])
  const page = (direction: 1 | -1) => {
    const el = scroller.current
    if (el) el.scrollLeft += direction * Math.max((el.clientWidth - TASK_COLUMN) / 2, columnWidth)
  }

  if (projectTasks.length === 0) {
    return (
      <NotBuiltMessage
        icon={FolderOpen}
        title="No tasks in this mock yet"
        body={`Only Austin store opening has tasks so far; ${project.name}’s come in a later slice.`}
        link={{ href: `#${projectPath('austin', 'timeline')}`, label: 'Open Austin store opening' }}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* The file's toolbar: Today Secondary, the arrows and Filter Ghost, the
          zoom a Secondary segmented control, then Baseline and the tray. */}
      <div className="flex flex-wrap items-center gap-1">
        <Button appearance="secondary" onClick={scrollToToday}>
          Today
        </Button>
        <Button
          appearance="ghost"
          startIcon={ArrowLeft}
          aria-label="Earlier"
          onClick={() => page(-1)}
        />
        <Button
          appearance="ghost"
          startIcon={ArrowRight}
          aria-label="Later"
          onClick={() => page(1)}
        />
        <SegmentedControl
          aria-label="Zoom"
          appearance="secondary"
          value={zoom}
          onValueChange={(value) => setZoom(value as Zoom)}
        >
          {ZOOMS.map((z) => (
            <SegmentedControl.Item key={z.value} value={z.value}>
              {z.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        <Button
          appearance="ghost"
          startIcon={ListFilter}
          onClick={() => shell.notBuilt('Filtering the timeline')}
        >
          Filter
        </Button>
        <span className="flex-1" />
        <Button
          appearance="ghost"
          startIcon={baseline ? Check : undefined}
          aria-pressed={baseline}
          onClick={() => setBaseline(!baseline)}
        >
          Baseline: {shortDate.format(day(project.start))}
        </Button>
        {undated > 0 ? (
          <Button appearance="ghost" onClick={() => shell.notBuilt('The no-date tray')}>
            No date · {undated}
          </Button>
        ) : null}
      </div>

      <div
        ref={scroller}
        role="region"
        aria-label={`${project.name} timeline`}
        tabIndex={0}
        className={cn(
          'relative min-h-96 flex-1 overflow-auto rounded-container-outer border border-surface-border bg-surface-background-primary',
          focusRing,
        )}
        style={
          {
            '--chart-width': `${range.width}px`,
            '--chart-height': `${height}px`,
            '--past-width': `${Math.max(todayX, 0)}px`,
            '--today-x': `${todayX}px`,
          } as CSSProperties
        }
      >
        <div className="relative min-h-full w-max min-w-full pb-4">
          <Background range={range} />
          <Header range={range} />
          <Milestones project={project} range={range} />
          {rows.map((row) =>
            row.kind === 'group' ? (
              <GroupRow
                key={row.phase}
                row={row}
                open={!collapsed.has(row.phase)}
                onToggle={() => toggle(row.phase)}
              />
            ) : (
              <TaskRow
                key={row.task.id}
                task={row.task}
                range={range}
                baseline={baseline}
                onOpen={() => navigate(taskPath(row.task, 'timeline'))}
              />
            ),
          )}
          <Dependencies rows={rows} tasks={projectTasks} range={range} />
          {/* Over the bars and through the header, as the file layers it;
              under the sticky Task column when the chart scrolls. */}
          {todayX >= 0 && todayX <= range.width ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-[calc(var(--today-x)+280px)] z-[25] w-0.5 bg-content-emphasized"
            >
              <span className="absolute top-0 left-1/2 size-2 -translate-x-1/2 rounded-full bg-content-emphasized" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** The week lines and the hatch, under everything, from the Task column's edge. */
function Background({ range }: { range: Range }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-70 w-(--chart-width)"
    >
      <div className={cn('absolute inset-y-0 left-0 w-(--past-width)', pastDayPattern)} />
      {range.columns.map((column) => (
        <span
          key={column.start.getTime()}
          className="absolute inset-y-0 left-(--x) w-px bg-surface-border"
          style={{ '--x': `${column.x}px` } as CSSProperties}
        />
      ))}
    </div>
  )
}

/** "Task" over the names, then a label at the start of each column, sticky to the top. */
function Header({ range }: { range: Range }) {
  return (
    <div aria-hidden="true" className="sticky top-0 z-20 flex h-10 border-b border-surface-border">
      <div className="sticky left-0 z-30 flex w-70 shrink-0 items-center bg-surface-background-primary px-4 text-sm text-content-subtle">
        Task
      </div>
      {/* The header's own copy of the hatch and the lines, so it can be
          opaque over the rows scrolling under it. */}
      <div className="relative w-(--chart-width) shrink-0 bg-surface-background-primary">
        <div className={cn('absolute inset-y-0 left-0 w-(--past-width)', pastDayPattern)} />
        {range.columns.map((column) => (
          <span
            key={column.start.getTime()}
            className="absolute inset-y-0 left-(--x) flex w-(--w) items-center border-l border-surface-border pl-2 text-sm text-content-subtle"
            style={{ '--x': `${column.x}px`, '--w': `${column.width}px` } as CSSProperties}
          >
            <span className="truncate">{column.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * The milestones along the top, by the short names the file gives them here:
 * a diamond on the day, its name after it, or before it when the next one
 * would run into it (Soft open, beside the opening).
 */
function Milestones({ project, range }: { project: Project; range: Range }) {
  const milestones = (overviewFor(project.id)?.milestones ?? [])
    .filter((m) => m.timeline)
    .map((m) => ({ ...m, x: xOf(range, day(m.date)) + range.dayPx / 2 - 8 }))
  return (
    <div className="flex h-9">
      <div className="sticky left-0 z-10 flex w-70 shrink-0 items-center bg-surface-background-primary px-4 text-sm font-semibold text-content-primary">
        <span id="timeline-milestones">Milestones</span>
      </div>
      <ul aria-labelledby="timeline-milestones" className="relative w-(--chart-width) shrink-0">
        {milestones.map((m, i) => {
          const label = m.timeline!
          const next = milestones[i + 1]
          const before = next ? m.x + 20 + label.length * CHAR_PX > next.x - 8 : false
          return (
            <li
              key={m.name}
              className={cn(
                'absolute top-2 flex items-center gap-1',
                before
                  ? 'right-[calc(var(--chart-width)-var(--x)-16px)] flex-row-reverse'
                  : 'left-(--x)',
              )}
              style={{ '--x': `${m.x}px` } as CSSProperties}
            >
              <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                <span className="size-2.5 rotate-45 bg-content-emphasized" />
              </span>
              <span className="text-sm font-semibold whitespace-nowrap text-content-emphasized">
                {label}
                <span className="sr-only">, {shortDate.format(day(m.date))}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A phase's band, across the chart, with its fold on the left. */
function GroupRow({
  row,
  open,
  onToggle,
}: {
  row: Extract<TimelineRow, { kind: 'group' }>
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative z-[1] flex h-9 bg-surface-background-subtle">
      <div className="sticky left-0 z-10 flex w-70 shrink-0 items-center bg-surface-background-subtle px-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={cn(
            'flex h-7 items-center gap-2 rounded-button px-2 text-sm font-semibold text-content-primary hover:bg-action-ghost-background-hover',
            focusRing,
          )}
        >
          <Icon icon={open ? ChevronDown : ChevronRight} />
          {row.phase}
          <span className="sr-only">, {row.count} tasks</span>
        </button>
      </div>
      <div className="w-(--chart-width) shrink-0" />
    </div>
  )
}

/**
 * A task's row: its status glyph and name on the left, its bar in the chart.
 * The name's description says what the bar shows — dates, owner, slip — so
 * the bar itself can stay out of the accessibility tree.
 */
function TaskRow({
  task,
  range,
  baseline,
  onOpen,
}: {
  task: Task
  range: Range
  baseline: boolean
  onOpen: () => void
}) {
  const id = useId()
  const person = personFor(task.assigneeId)
  const bar = barOf(range, task.start!, task.due)
  const plan = task.baseline ? barOf(range, task.baseline.start, task.baseline.due) : null
  const slip = baseline ? slipDays(task) : 0
  const inside = bar.width >= LABEL_INSIDE
  const labelRight = bar.x + bar.width + 6 + task.title.length * CHAR_PX <= range.width
  const tone = barTone(task)
  const status = statusFor(task.status)

  return (
    <div className="flex h-9">
      <div className="sticky left-0 z-10 flex w-70 shrink-0 items-center bg-surface-background-primary pr-2 pl-2">
        <button
          type="button"
          onClick={onOpen}
          aria-describedby={id}
          className={cn(
            'flex h-7 min-w-0 flex-1 items-center gap-2 rounded-button px-2 text-left text-content-primary hover:bg-action-ghost-background-hover',
            focusRing,
          )}
        >
          <Icon icon={status.icon} aria-label={status.label} className="shrink-0" />
          <span className="truncate">{task.title}</span>
        </button>
        <span id={id} className="sr-only">
          {rangeLabel(day(task.start!), day(task.due))}, {person.name}
          {slip > 0 ? `, ${slip} days late` : ''}
        </span>
      </div>
      <div
        className="relative w-(--chart-width) shrink-0"
        style={
          {
            '--x': `${bar.x}px`,
            '--w': `${bar.width}px`,
            '--plan-x': `${plan?.x ?? 0}px`,
            '--plan-w': `${plan?.width ?? 0}px`,
            // After the bar, or after the name beside it.
            '--slip-x': `${bar.x + bar.width + (inside || !labelRight ? 18 : 18 + task.title.length * CHAR_PX)}px`,
          } as CSSProperties
        }
      >
        {baseline && plan && slip > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-8 left-(--plan-x) h-0.75 w-(--plan-w) rounded-[1px] bg-decorative-neutral-highlight"
          />
        ) : null}
        <div
          aria-hidden="true"
          onClick={onOpen}
          className={cn(
            'absolute top-0.75 left-(--x) flex h-7 w-(--w) cursor-pointer items-center gap-1.5 rounded-md pr-2 pl-1',
            tone,
          )}
        >
          {inside ? (
            <>
              <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
              <span className="truncate text-sm font-semibold">{task.title}</span>
            </>
          ) : null}
        </div>
        {/* A name that does not fit sits beside the bar, after it, or before it at the chart's end. */}
        {!inside ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-2 text-sm whitespace-nowrap text-content-subtle',
              labelRight
                ? 'left-[calc(var(--x)+var(--w)+6px)]'
                : 'right-[calc(var(--chart-width)-var(--x)+6px)]',
            )}
          >
            {task.title}
          </span>
        ) : null}
        {slip > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-2 left-(--slip-x) text-sm font-semibold whitespace-nowrap text-content-danger"
          >
            {slip}d late
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The lines from each task to what it waits on, drawn over the chart: black,
 * or red out of a blocked task, which is holding up the next one. A lag rides
 * the line as a view-only Token, as the permit's "blocks · 5d lag" does.
 */
function Dependencies({
  rows,
  tasks,
  range,
}: {
  rows: TimelineRow[]
  tasks: Task[]
  range: Range
}) {
  const id = useId()
  const rowOf = new Map(
    rows.flatMap((row) => (row.kind === 'task' ? [[row.task.id, row] as const] : [])),
  )
  const lines = rows.flatMap((row) => {
    if (row.kind !== 'task') return []
    return (row.task.dependsOn ?? []).flatMap((dep) => {
      const from = rowOf.get(dep.taskId)
      const source = tasks.find((t) => t.id === dep.taskId)
      if (!from || from.kind !== 'task' || !source?.start) return []
      const end = barOf(range, source.start, source.due)
      const start = barOf(range, row.task.start!, row.task.due)
      const path = dependencyPath(
        { x: end.x + end.width, y: from.y + ROW_HEIGHT / 2 },
        { x: start.x, y: row.y + ROW_HEIGHT / 2 },
      )
      // The lag's token sits on the line where it crosses a phase band, or halfway down.
      const [top, bottom] = [path.elbow.y1, path.elbow.y2].sort((a, b) => a - b)
      const band = rows.find((r) => r.kind === 'group' && r.y > top && r.y + ROW_HEIGHT < bottom)
      return [
        {
          key: `${dep.taskId}-${row.task.id}`,
          d: path.d,
          blocked: source.status === 'blocked',
          lag: dep.lagDays,
          tokenX: path.elbow.x - 26,
          tokenY: band ? band.y + 6 : (top + bottom) / 2 - 12,
        },
      ]
    })
  })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-70 z-[2] h-(--chart-height) w-(--chart-width)"
    >
      <svg className="absolute inset-0 size-full overflow-visible" fill="none">
        <defs>
          {(['line', 'blocked'] as const).map((kind) => (
            <marker
              key={kind}
              id={`${id}-${kind}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path
                d="M 1 1 L 7 4 L 1 7"
                strokeWidth="1.5"
                className={
                  kind === 'blocked' ? 'stroke-content-danger' : 'stroke-content-emphasized'
                }
              />
            </marker>
          ))}
        </defs>
        {lines.map((line) => (
          <path
            key={line.key}
            d={line.d}
            strokeWidth="1.5"
            markerEnd={`url(#${id}-${line.blocked ? 'blocked' : 'line'})`}
            className={line.blocked ? 'stroke-content-danger' : 'stroke-content-emphasized'}
          />
        ))}
      </svg>
      {lines
        .filter((line) => line.lag)
        .map((line) => (
          <Token
            key={line.key}
            startIcon={TriangleAlert}
            className="absolute top-(--y) left-(--x) bg-surface-background-primary"
            style={{ '--x': `${line.tokenX}px`, '--y': `${line.tokenY}px` } as CSSProperties}
          >
            blocks · {line.lag}d lag
          </Token>
        ))}
    </div>
  )
}
