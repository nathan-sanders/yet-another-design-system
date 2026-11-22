import { useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Calendar, ChevronDown, ChevronRight, Ellipsis, Users } from 'lucide-react'

import { AppShell } from '../../../../../src/components/AppShell'
import { Avatar } from '../../../../../src/components/Avatar'
import { Button } from '../../../../../src/components/Button'
import { Icon } from '../../../../../src/components/Icon'
import { SegmentedControl } from '../../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../../src/components/Text'
import { Toast } from '../../../../../src/components/Toast'
import { TopBar } from '../../../../../src/components/TopBar'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import { PROJECT_BAR } from '../../../components/taskMeta'
import { TimelineBar } from '../../../components/TimelineBar'
import { loadOfDay, loadOfShare } from '../../../components/load'
import { WorkloadCell } from '../../../components/WorkloadCell'
import { YakLine } from '../../../components/YakLine'
import { addDays, day, sameDay, shortDate, today, weekdayShort } from '../../../data/dates'
import { personFor } from '../../../data/people'
import { projectFor } from '../../../data/projects'
import { loads, REBALANCE_TASK, TEAMS, type PersonLoad, type TeamId } from '../../../data/workload'
import type { Task } from '../../../data/types'
import { useShell } from '../../../shell/ShellContext'
import { floatingYakClearance } from '../../../yak/floating'
import { useTasks } from '../../project/tasksState'
import {
  daysFor,
  previewSummary,
  suggestion,
  teamMembers,
  teamShares,
  teamsYakLine,
  weeklyShares,
  weekSummary,
  windowDays,
  windowWeeks,
} from './model'

type WorkloadView = 'people' | 'teams'

/**
 * Plan › Workload (`Plan - Workload`, `40006279:21820`): how booked everyone
 * is. People is this week and next a day a column, the Austin crew a row;
 * Teams (`Plan - Workload / By team`, `40006299:29363`) is eight weeks a
 * column, a team a row that opens onto its people. The view is in the URL
 * (`?view=teams`).
 *
 * Yak spots the overload and offers the move. Apply opens the preview
 * (`Plan - Workload / Rebalance preview`, `40006299:28257`) — the changed
 * cells ringed, the tasks behind Marcus's week laid out under him, the one
 * moving drawn in Maya's row — and applying it gives Signage install prep to
 * Maya, which is a real reassignment: the task's panel says so, and the
 * hours follow whoever holds it.
 */
export function WorkloadScreen() {
  const shell = useShell()
  const toast = Toast.useToast()
  const { tasks, updateTask, restoreTask } = useTasks()
  const [params, setParams] = useSearchParams()
  const view: WorkloadView = params.get('view') === 'teams' ? 'teams' : 'people'
  const [previewing, setPreviewing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const task = tasks.find((t) => t.id === REBALANCE_TASK)!
  const holder = task.assigneeId
  const offer = suggestion(holder)
  const preview = previewing && offer ? offer.to : undefined

  const days = windowDays()
  const weeks = windowWeeks()
  const range =
    view === 'people'
      ? `${shortDate.format(days[0])} – ${days[9].getMonth() === days[0].getMonth() ? days[9].getDate() : shortDate.format(days[9])}`
      : `${shortDate.format(weeks[0])} – ${shortDate.format(addDays(weeks[7], 4))}`

  const apply = () => {
    if (!offer) return
    const before = task
    updateTask(task.id, { assigneeId: offer.to })
    setPreviewing(false)
    const from = personFor(holder).name.split(' ')[0]
    const to = personFor(offer.to).name.split(' ')[0]
    toast.add({
      title: `Moved ${task.title} to ${to}`,
      description: `${from} and ${to} were notified.`,
      action: { label: 'Undo', onClick: () => restoreTask(before) },
    })
  }

  let banner: ReactNode = null
  if (view === 'teams') {
    banner = <YakLine>{teamsYakLine(holder)}</YakLine>
  } else if (preview && offer) {
    const summary = previewSummary(holder, offer.to)
    banner = (
      <section
        aria-label="Rebalance preview"
        className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg bg-surface-background-subtle py-2 pr-2 pl-4"
      >
        <Text render={<span />} weight="semibold" color="emphasized">
          {summary.title}
        </Text>
        <Text
          render={<span />}
          size="sm"
          color="subtle"
          className="min-w-0 flex-1 max-md:order-last max-md:basis-full"
        >
          {summary.detail}
        </Text>
        <Button appearance="ghost" onClick={() => setPreviewing(false)}>
          Cancel
        </Button>
        <Button appearance="primary" onClick={apply}>
          Apply and notify 2 people
        </Button>
      </section>
    )
  } else if (offer && !dismissed) {
    banner = (
      <YakLine
        actions={
          <>
            <Button appearance="secondary" size="small" onClick={() => setPreviewing(true)}>
              Apply
            </Button>
            <Button appearance="ghost" size="small" onClick={() => setDismissed(true)}>
              Not now
            </Button>
          </>
        }
      >
        {offer.text}
      </YakLine>
    )
  } else if (!offer) {
    banner = <YakLine>Nobody on the Austin crew is over their hours next week.</YakLine>
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Workload
            </Heading>
            <SegmentedControl
              aria-label="View"
              appearance="secondary"
              value={view}
              onValueChange={(next) =>
                setParams(next === 'teams' ? { view: 'teams' } : {}, { replace: true })
              }
            >
              <SegmentedControl.Item value="people">People</SegmentedControl.Item>
              <SegmentedControl.Item value="teams">Teams</SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <>
            <Button
              appearance="ghost"
              startIcon={Users}
              endIcon={ChevronDown}
              className="max-lg:hidden"
              onClick={() => shell.notBuilt('Choosing a team')}
            >
              {view === 'people' ? 'Team: Austin crew' : 'All teams'}
            </Button>
            <Button
              appearance="ghost"
              startIcon={Calendar}
              className="max-md:hidden"
              onClick={() => shell.notBuilt('Choosing the weeks')}
            >
              {range}
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Workload actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {banner}
        {view === 'people' ? (
          <PeopleGrid days={days} holder={holder} preview={preview} tasks={tasks} />
        ) : (
          <TeamsGrid weeks={weeks} holder={holder} />
        )}
      </AppShell.Content>
    </>
  )
}

/**
 * The grid's frame: Workload Grid's bordered surface, scrolling sideways
 * rather than squashing its cells when the page is narrow. A scroll region
 * a keyboard can reach, so it is focusable and named.
 */
function GridFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'shrink-0 overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary',
        focusRing,
      )}
    >
      {children}
    </div>
  )
}

/** Column heads: the label column 240 with 16 in, then the time columns, centered. */
function HeadRow({
  first,
  labels,
}: {
  first: string
  labels: { text: string; current?: boolean }[]
}) {
  return (
    <thead>
      <tr className="h-9 text-sm">
        <th scope="col" className="w-60 pl-4 text-left font-normal text-content-subtle">
          {first}
        </th>
        {labels.map((label) => (
          <th
            key={label.text}
            scope="col"
            aria-current={label.current ? 'date' : undefined}
            className={cn(
              'px-0.5 text-center font-normal',
              label.current ? 'text-content-emphasized' : 'text-content-subtle',
            )}
          >
            {label.text}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function PeopleGrid({
  days,
  holder,
  preview,
  tasks,
}: {
  days: Date[]
  holder: string
  preview?: string
  tasks: Task[]
}) {
  const labels = days.map((d) => ({
    text: `${weekdayShort.format(d)} ${d.getDate()}`,
    current: sameDay(d, today),
  }))
  return (
    <GridFrame label="Hours by person">
      <table className="w-full min-w-200 table-fixed border-collapse">
        <caption className="sr-only">Hours booked each day, this week and next</caption>
        <HeadRow first="Person" labels={labels} />
        <tbody>
          {loads.map((load) => (
            <PersonRows
              key={load.personId}
              load={load}
              days={days}
              holder={holder}
              preview={preview}
              tasks={tasks}
            />
          ))}
        </tbody>
      </table>
    </GridFrame>
  )
}

/** A person, their two weeks, and in the preview the tasks behind the move. */
function PersonRows({
  load,
  days,
  holder,
  preview,
  tasks,
}: {
  load: PersonLoad
  days: Date[]
  holder: string
  preview?: string
  tasks: Task[]
}) {
  const person = personFor(load.personId)
  const now = daysFor(load, holder)
  const shown = preview ? daysFor(load, preview) : now
  const summary = weekSummary(load, holder, preview)
  const receiving = preview === load.personId
  const giving = preview !== undefined && holder === load.personId

  return (
    <>
      <tr
        className={cn(
          'border-t border-surface-border',
          receiving && 'bg-surface-background-subtle',
        )}
      >
        <th scope="row" className="py-1.5 pl-4 text-left font-normal">
          <span className="flex items-center gap-2">
            <Avatar name={person.name} src={person.avatar} alt="" size="base" />
            <span className="flex min-w-0 flex-col">
              <Text render={<span />} weight="semibold" color="emphasized" truncate>
                {person.name}
              </Text>
              <Text render={<span />} size="sm" color={summary.over ? 'danger' : 'subtle'} truncate>
                {summary.text}
              </Text>
            </span>
          </span>
        </th>
        {shown.map((hours, i) => (
          <td key={days[i].toISOString()} className="px-0.5 py-1.5">
            <WorkloadCell
              load={loadOfDay(hours)}
              changed={preview !== undefined && hours !== now[i]}
              className="h-12"
            >
              {hours === null ? 'Off' : `${hours}h`}
            </WorkloadCell>
          </td>
        ))}
      </tr>
      {giving || receiving ? (
        <TaskStrip
          personId={load.personId}
          days={days}
          tasks={tasks}
          holder={holder}
          preview={preview!}
          label={giving ? 'Tasks this week and next' : `Moving to ${person.name.split(' ')[0]}`}
          showLabel={giving}
        />
      ) : null}
    </>
  )
}

/**
 * The preview's strip under a person (`Marcus tasks`, `40006299:28257`):
 * their tasks over the two weeks as `_Timeline Task Bar`s laid on the day
 * columns, with a dashed slot where the moving task was. Under the person
 * taking it, the task itself, with its hours.
 */
function TaskStrip({
  personId,
  days,
  tasks,
  holder,
  preview,
  label,
  showLabel,
}: {
  personId: string
  days: Date[]
  tasks: Task[]
  holder: string
  preview: string
  label: string
  /** The file labels the giving side's strip only; the receiving one is named for a screen reader. */
  showLabel: boolean
}) {
  const first = days[0]
  const last = days[days.length - 1]
  const column = (date: Date) => {
    const i = days.findIndex((d) => d >= date)
    return i === -1 ? days.length : i
  }
  const moving = tasks.find((t) => t.id === REBALANCE_TASK)!
  const mine = tasks.filter(
    (t) =>
      t.assigneeId === personId &&
      t.id !== REBALANCE_TASK &&
      t.status !== 'done' &&
      day(t.due) >= first &&
      (t.start ? day(t.start) : first) <= last,
  )
  const rows: { task: Task; dashed?: boolean; hours?: boolean }[] =
    personId === holder
      ? [...mine.map((task) => ({ task })), { task: moving, dashed: true }]
      : personId === preview
        ? [{ task: moving, hours: true }]
        : []
  const span = (task: Task) => {
    const from = column(task.start ? day(task.start) : first)
    const to = Math.min(column(addDays(day(task.due), 1)), days.length)
    return `${from + 2} / ${Math.max(to, from + 1) + 2}`
  }
  return (
    <tr className={cn(personId === preview && 'bg-surface-background-subtle')}>
      <td colSpan={days.length + 1} className="pb-1.5">
        <ul
          aria-label={label}
          className="grid grid-cols-[15rem_repeat(10,minmax(0,1fr))] gap-y-1.5"
        >
          {rows.map(({ task, dashed, hours }) => (
            <li
              key={`${task.id}-${dashed ? 'was' : 'now'}`}
              className="flex px-0.5 [grid-column:var(--span)]"
              style={{ '--span': span(task) } as CSSProperties}
            >
              {dashed ? (
                <span className="h-7 w-full rounded-md border border-dashed border-surface-border-emphasized">
                  <span className="sr-only">
                    {task.title}, moving to {personFor(preview).name}
                  </span>
                </span>
              ) : (
                <TimelineBar
                  tone={PROJECT_BAR[projectFor(task.projectId)?.color ?? 'orange']}
                  className="w-full"
                >
                  {task.title}
                  {hours && task.estimate ? ` · ${task.estimate}` : ''}
                </TimelineBar>
              )}
            </li>
          ))}
          {showLabel ? (
            <li aria-hidden className="col-start-1 row-start-1 flex items-center pl-15">
              <Text render={<span />} size="sm" color="subtle" truncate>
                {label}
              </Text>
            </li>
          ) : null}
        </ul>
      </td>
    </tr>
  )
}

/** Teams, eight weeks a column; a team opens onto its people. Ops opens, as drawn. */
function TeamsGrid({ weeks, holder }: { weeks: Date[]; holder: string }) {
  const [open, setOpen] = useState<Set<TeamId>>(() => new Set(['ops']))
  const labels = weeks.map((w) => ({
    text: shortDate.format(w),
    current: today >= w && today < addDays(w, 7),
  }))
  const cells = (shares: number[]) =>
    shares.map((share, i) => (
      <td key={weeks[i].toISOString()} className="px-0.5 py-1.5">
        <WorkloadCell load={loadOfShare(share)} className="h-12">
          {`${share}%`}
        </WorkloadCell>
      </td>
    ))
  return (
    <GridFrame label="Booked share by team">
      <table className="w-full min-w-200 table-fixed border-collapse">
        <caption className="sr-only">Share of each team’s hours booked, week by week</caption>
        <HeadRow first="Team" labels={labels} />
        {TEAMS.map((team) => {
          const members = teamMembers(team.id)
          const expanded = open.has(team.id)
          const toggle = () =>
            setOpen((current) => {
              const next = new Set(current)
              if (next.has(team.id)) next.delete(team.id)
              else next.add(team.id)
              return next
            })
          return (
            <tbody key={team.id}>
              <tr className="border-t border-surface-border">
                <th scope="row" className="py-1.5 pl-4 text-left font-normal">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={toggle}
                    className={cn('flex items-center gap-2 rounded-sm text-left', focusRing)}
                  >
                    <Icon icon={expanded ? ChevronDown : ChevronRight} />
                    <span className="flex flex-col">
                      <Text render={<span />} weight="semibold" color="emphasized">
                        {team.name}
                      </Text>
                      <Text render={<span />} size="sm" color="subtle">
                        {members.length} {members.length === 1 ? 'person' : 'people'}
                      </Text>
                    </span>
                  </button>
                </th>
                {cells(teamShares(team.id, holder))}
              </tr>
              {expanded
                ? members.map((member) => {
                    const person = personFor(member.personId)
                    return (
                      <tr key={member.personId} className="border-t border-surface-border">
                        <th scope="row" className="py-1.5 pl-10 text-left font-normal">
                          <span className="flex items-center gap-2">
                            <Avatar name={person.name} src={person.avatar} alt="" size="small" />
                            <span className="flex min-w-0 flex-col">
                              <Text render={<span />} truncate>
                                {person.name}
                              </Text>
                              <Text render={<span />} size="sm" color="subtle" truncate>
                                {member.title}
                              </Text>
                            </span>
                          </span>
                        </th>
                        {cells(weeklyShares(member, holder))}
                      </tr>
                    )
                  })
                : null}
            </tbody>
          )
        })}
      </table>
    </GridFrame>
  )
}
