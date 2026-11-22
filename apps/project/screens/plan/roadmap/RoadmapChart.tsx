import { useId, type CSSProperties } from 'react'
import { ArrowRight, CircleUser } from 'lucide-react'

import { Heading } from '../../../../../src/components/Text'
import { Token } from '../../../../../src/components/Token'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import { loadOfShare } from '../../../components/load'
import { WorkloadCell } from '../../../components/WorkloadCell'
import { PROJECT_BAR } from '../../../components/taskMeta'
import { TimelineBar } from '../../../components/TimelineBar'
import { day, rangeLabel, today } from '../../../data/dates'
import { personFor } from '../../../data/people'
import type { Project } from '../../../data/types'
import { projectPath } from '../../project/paths'
import { applyChange, barOf, changeTokenLabel, xOf, type Range, type StagedChange } from './model'

export interface Lane {
  id: string
  label: string
  projects: Project[]
}

/**
 * The Roadmap's chart (`Plan - Roadmap`, `40006278:14156`): a 200px label
 * column, then equal columns of time under a 40px header, and a lane a
 * portfolio with a 28px bar a project, 8 apart. A 2px line marks today, its
 * 8px cap sitting on the header's rule. Bars are the projects' links.
 *
 * A staged change draws on the bar it changes: a moved bar at its new place
 * with a 3px line where it was and its token before it, a longer bar with
 * its token after, a change of owner with the new face and its token after.
 * With `capacity` rows the chart ends in the Capacity block
 * (`Plan - Roadmap / Capacity`, `40006297:28703`), and a month any team is
 * over in is shaded down the whole chart.
 */
export function RoadmapChart({
  range,
  lanes,
  staged = [],
  capacity,
  laneHeader = 'Portfolio',
  className,
}: {
  range: Range
  lanes: Lane[]
  staged?: StagedChange[]
  capacity?: { name: string; months: number[] }[]
  laneHeader?: string
  className?: string
}) {
  const now = xOf(range, today)
  const showToday = today >= range.start && today < range.end
  const overColumns = new Set(
    (capacity ?? []).flatMap((row) =>
      row.months.flatMap((value, i) => (loadOfShare(value) === 'over' ? [i] : [])),
    ),
  )

  // A region a keyboard can scroll: below about 800 the months keep their
  // width and the chart scrolls sideways rather than squashing every bar.
  return (
    <div
      role="region"
      aria-label="Roadmap"
      tabIndex={0}
      className={cn(
        'shrink-0 overflow-x-auto overflow-y-hidden rounded-lg border border-surface-border bg-surface-background-primary',
        focusRing,
        className,
      )}
    >
      <div
        className="relative isolate min-w-200"
        style={{ '--now': `${now * 100}%` } as CSSProperties}
      >
        {/* The columns and their rules, under everything. */}
        <div aria-hidden className="absolute inset-y-0 right-0 left-50 -z-10 flex">
          {range.columns.map((column, i) => (
            <div
              key={column.label}
              className={cn(
                'flex-1 border-l border-surface-border',
                overColumns.has(i) && 'bg-surface-background-subtle',
              )}
            />
          ))}
        </div>

        <div
          aria-hidden
          className="flex h-10 border-b border-surface-border text-sm text-content-subtle"
        >
          <span className="flex w-50 shrink-0 items-center px-4">{laneHeader}</span>
          {range.columns.map((column) => (
            <span key={column.label} className="flex flex-1 items-center truncate px-2">
              {column.label}
            </span>
          ))}
        </div>

        {lanes.map((lane) => (
          <LaneRow key={lane.id} lane={lane} range={range} staged={staged} />
        ))}

        {capacity ? <Capacity rows={capacity} range={range} /> : null}

        {showToday ? (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-50">
            <span className="absolute inset-y-0 left-(--now) w-0.5 -translate-x-1/2 bg-content-emphasized" />
            <span className="absolute top-9 left-(--now) size-2 -translate-x-1/2 rounded-full bg-content-emphasized" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function LaneRow({ lane, range, staged }: { lane: Lane; range: Range; staged: StagedChange[] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex border-b border-surface-border">
      <div className="w-50 shrink-0 px-4 pt-2.5">
        <Heading id={id} level={2} size="base" weight="semibold">
          {lane.label}
        </Heading>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2 pt-2 pb-4">
        {lane.projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            range={range}
            changes={staged.filter((c) => c.projectId === project.id)}
          />
        ))}
      </ul>
    </section>
  )
}

/** A project's bar, with what its staged changes draw around it. */
function ProjectRow({
  project,
  range,
  changes,
}: {
  project: Project
  range: Range
  changes: StagedChange[]
}) {
  const shown = changes.reduce(applyChange, project)
  const bar = barOf(range, shown.start, shown.due)
  const move = changes.find((c) => c.kind === 'move')
  const was = move ? barOf(range, project.start, project.due) : null
  const after = changes.filter((c) => c.kind !== 'move')
  const owner = personFor(shown.ownerId)
  const label = [
    project.name,
    rangeLabel(day(shown.start), day(shown.due)),
    owner.name,
    ...changes.map((c) => `unsaved: ${changeTokenLabel(c)}`),
  ].join(', ')

  return (
    <li
      className="relative h-7"
      style={
        {
          '--l': `${(bar?.left ?? 0) * 100}%`,
          '--w': `${(bar?.width ?? 0) * 100}%`,
          '--was-l': `${(was?.left ?? 0) * 100}%`,
          '--was-w': `${(was?.width ?? 0) * 100}%`,
        } as CSSProperties
      }
    >
      {bar ? (
        <a
          href={`#${projectPath(project.id)}`}
          aria-label={label}
          className={cn('absolute inset-y-0 left-(--l) flex w-(--w) rounded-md', focusRing)}
        >
          <TimelineBar
            personId={shown.ownerId}
            tone={PROJECT_BAR[project.color]}
            className="w-full"
          >
            {project.name}
          </TimelineBar>
        </a>
      ) : (
        // Outside the chart's months: the name stays, so the lane still lists it.
        <span className="flex h-7 items-center px-2 text-sm text-content-subtle">
          {project.name} · {rangeLabel(day(shown.start), day(shown.due))}
        </span>
      )}

      {was ? (
        <span
          aria-hidden
          className="absolute top-7.5 left-(--was-l) h-0.75 w-(--was-w) rounded-[1px] bg-decorative-neutral-highlight"
        />
      ) : null}
      {move && bar ? (
        <span aria-hidden className="absolute top-0.5 right-[calc(100%-var(--l)+6px)]">
          <Token>{changeTokenLabel(move)}</Token>
        </span>
      ) : null}
      {after.length > 0 && bar ? (
        <span
          aria-hidden
          className="absolute top-0.5 left-[calc(var(--l)+var(--w)+8px)] flex gap-1 whitespace-nowrap"
        >
          {after.map((change) => (
            <Token key={change.kind} startIcon={change.kind === 'owner' ? CircleUser : ArrowRight}>
              {changeTokenLabel(change)}
            </Token>
          ))}
        </span>
      ) : null}
    </li>
  )
}

/**
 * The Capacity block: each team's booked share a column, as `_Workload Cell`s
 * 4 in from the column's rules. A table, because it is one: a team a row, a
 * month a column. The months are named once, in the chart's header, so here
 * they are headers for a screen reader only.
 */
function Capacity({ rows, range }: { rows: { name: string; months: number[] }[]; range: Range }) {
  const caption = useId()
  return (
    <table aria-labelledby={caption} className="w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-50" />
        {range.columns.map((c) => (
          <col key={c.label} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th
            scope="col"
            className="px-4 pt-2.5 pb-1.5 text-left font-semibold text-content-emphasized"
          >
            <span id={caption}>Capacity</span>
          </th>
          <td
            colSpan={range.columns.length}
            className="px-2 pt-2.5 pb-1.5 text-sm text-content-subtle"
          >
            Share of each team’s hours booked
          </td>
        </tr>
        <tr className="sr-only">
          <th scope="col">Team</th>
          {range.columns.map((c) => (
            <th key={c.label} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <th scope="row" className="px-4 py-0.75 text-left font-normal text-content-primary">
              {row.name}
            </th>
            {row.months.map((value, i) => (
              <td key={range.columns[i]?.label ?? i} className="px-1 py-0.75">
                <WorkloadCell load={loadOfShare(value)} className="h-7">
                  {`${value}%`}
                </WorkloadCell>
              </td>
            ))}
          </tr>
        ))}
        <tr aria-hidden>
          <td colSpan={range.columns.length + 1} className="h-3" />
        </tr>
      </tbody>
    </table>
  )
}
