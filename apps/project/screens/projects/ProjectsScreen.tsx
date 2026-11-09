import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { pixel, Table, type TableColumn, type TableGroup } from '../../../../src/components/Table'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { floatingYakClearance } from '../../yak/floating'
import {
  HealthBadge,
  OwnerCell,
  ProjectNameCell,
  ProjectProgress,
} from '../../components/ProjectCells'
import { day, shortDate } from '../../data/dates'
import { projects } from '../../data/projects'
import type { Project } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { projectPath } from '../project/paths'

const columns: TableColumn<Project>[] = [
  {
    key: 'name',
    header: 'Project',
    rowTarget: true,
    renderCell: (project) => (
      <ProjectNameCell project={project} href={`#${projectPath(project.id)}`} />
    ),
  },
  {
    key: 'health',
    header: 'Health',
    width: pixel(120),
    renderCell: (project) => <HealthBadge project={project} />,
  },
  {
    key: 'progress',
    header: 'Progress',
    width: pixel(190),
    // The bar takes the room the percent leaves, which a hugging cell has none of.
    layout: 'fill',
    renderCell: (project) => <ProjectProgress project={project} />,
  },
  {
    key: 'owner',
    header: 'Owner',
    width: pixel(170),
    renderCell: (project) => <OwnerCell id={project.ownerId} />,
  },
  {
    key: 'milestone',
    header: 'Next milestone',
    width: pixel(190),
    renderCell: (project) => (
      <span className="block truncate">
        {project.milestone.name} · {shortDate.format(day(project.milestone.date))}
      </span>
    ),
  },
  {
    key: 'due',
    header: 'Due',
    width: pixel(96),
    renderCell: (project) => (
      <span className="text-content-subtle">{shortDate.format(day(project.due))}</span>
    ),
  },
]

/**
 * Health decides the group, in the file's order: what needs attention first,
 * with the line Yak wrote when it flagged them. At risk and off track share
 * the first group; a group with no projects is left out by `Table`.
 */
const groups: TableGroup[] = [
  {
    key: 'attention',
    label: 'Needs attention',
    note: 'Yak flagged these from this week’s updates',
  },
  { key: 'on-track', label: 'On track' },
  { key: 'not-started', label: 'Not started' },
]

function groupOf(project: Project): string {
  return project.health === 'at-risk' || project.health === 'off-track'
    ? 'attention'
    : project.health
}

/**
 * Projects › All projects (`40006264:1069`): every project in one table,
 * grouped by health. A row opens the project.
 */
export function ProjectsScreen() {
  const shell = useShell()
  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="semibold">
            Projects
          </Heading>
        }
        end={
          <>
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              aria-label="Filter"
              onClick={() => shell.notBuilt('Filtering projects')}
            />
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        <div className="shrink-0">
          <Table
            label="Projects"
            columns={columns}
            data={projects}
            idKey="id"
            groupBy={groupOf}
            groups={groups}
          />
        </div>
      </AppShell.Content>
    </>
  )
}
