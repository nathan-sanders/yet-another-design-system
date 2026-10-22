import { useSearchParams } from 'react-router'
import { Ellipsis } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar, AvatarGroup } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import {
  Table,
  pixel,
  proportional,
  type TableColumn,
  type TableSort,
} from '../../../../src/components/Table'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { ReportCell } from '../../components/ReportCell'
import { personFor } from '../../data/people'
import type { Report } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { boardPath, editedLabel } from './model'
import { ReportTypeShortcuts } from './ReportTypeShortcuts'
import { useReports } from './reportsState'
import { floatingYakClearance } from '../../components/FloatingYak'

/** The face and name of whoever made a report — `_Measure Owner Cell` (`40005882:26335`). */
function Owner({ id }: { id: string }) {
  const person = id === 'yet' ? { name: 'Yet', avatar: undefined } : personFor(id)
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={person.name} src={person.avatar} alt="" size="small" />
      <span className="truncate">{person.name}</span>
    </span>
  )
}

function SharedWith({ report }: { report: Report }) {
  if (report.sharedWith === 'all') return 'All'
  const { people, more } = report.sharedWith
  return (
    <AvatarGroup
      size="small"
      aria-label={`Shared with ${people.map((id) => personFor(id).name).join(', ')}${more ? ` and ${more} more` : ''}`}
    >
      {people.map((id) => {
        const person = personFor(id)
        return <Avatar key={id} name={person.name} src={person.avatar} />
      })}
      {more ? <AvatarGroup.Overflow count={more} /> : null}
    </AvatarGroup>
  )
}

const NONE = <span aria-label="None">—</span>

const columns: TableColumn<Report>[] = [
  {
    key: 'name',
    header: 'Report',
    width: proportional(1, 240),
    sortable: false,
    // The name link is the row's own control: a press anywhere on the row
    // follows it, and it stays the keyboard path (FINDINGS 48).
    rowTarget: true,
    renderCell: (report) => <ReportCell report={report} href={`#${boardPath(report.id)}`} />,
  },
  {
    key: 'edited',
    header: 'Last edit',
    width: pixel(170),
    renderCell: (report) =>
      report.status ? (
        <Badge color="green">{report.status === 'new' ? 'New' : 'Updated'}</Badge>
      ) : report.editedMinutes !== undefined ? (
        editedLabel(report.editedMinutes)
      ) : (
        NONE
      ),
    // A badge is news, so it sorts as the most recent; untouched built-ins last.
    sortValue: (report) => (report.status ? -1 : (report.editedMinutes ?? Number.MAX_SAFE_INTEGER)),
  },
  {
    key: 'createdBy',
    header: 'Created by',
    width: pixel(200),
    sortable: false,
    renderCell: (report) => <Owner id={report.createdBy} />,
  },
  {
    key: 'sharedWith',
    header: 'Shared with',
    width: pixel(170),
    sortable: false,
    renderCell: (report) => <SharedWith report={report} />,
  },
  {
    key: 'delivery',
    header: 'Scheduled delivery',
    width: pixel(170),
    sortable: false,
    renderCell: (report) => report.delivery ?? NONE,
  },
]

/**
 * Measure › Reports (`40005911:34877`): every board anybody has made, the
 * topic monitors, and Yet's own built-in reports, in one Spacious table,
 * under a shortcut per report type that starts a new one. The name opens the
 * report; Last edit sorts, and the sort is in the URL (`?sort=edited&dir=asc`)
 * so it has a link.
 */
export function ReportsScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const { reports } = useReports()

  const sort: TableSort | null =
    params.get('sort') === 'edited'
      ? { key: 'edited', direction: params.get('dir') === 'desc' ? 'descending' : 'ascending' }
      : null

  const onSortChange = (next: TableSort | null) => {
    const nextParams = new URLSearchParams(params)
    if (next) {
      nextParams.set('sort', next.key)
      nextParams.set('dir', next.direction === 'descending' ? 'desc' : 'asc')
    } else {
      nextParams.delete('sort')
      nextParams.delete('dir')
    }
    setParams(nextParams, { replace: true })
  }

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="semibold">
            Reports
          </Heading>
        }
        end={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      {/* 40 between the shortcuts and the table, as the frame's Content Slot has it. */}
      <AppShell.Content className={cn('gap-10', floatingYakClearance)}>
        <ReportTypeShortcuts />
        <Table
          label="Reports"
          columns={columns}
          data={reports}
          idKey="id"
          density="spacious"
          sortable
          sort={sort}
          onSortChange={onSortChange}
          textOverflow="truncate"
          hasHover
        />
      </AppShell.Content>
    </>
  )
}
