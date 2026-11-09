import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { floatingYakClearance } from '../../yak/floating'
import { GroupedTable, type GroupedColumn, type TableGroup } from '../../components/GroupedTable'
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

const columns: GroupedColumn<Project>[] = [
  {
    key: 'name',
    header: 'Project',
    rowTarget: true,
    render: (project) => <ProjectNameCell project={project} href={`#${projectPath(project.id)}`} />,
  },
  {
    key: 'health',
    header: 'Health',
    width: 120,
    render: (project) => <HealthBadge project={project} />,
  },
  {
    key: 'progress',
    header: 'Progress',
    width: 190,
    // The bar takes the room the percent leaves, which a hugging cell has none of.
    spread: true,
    render: (project) => <ProjectProgress project={project} />,
  },
  {
    key: 'owner',
    header: 'Owner',
    width: 170,
    render: (project) => <OwnerCell id={project.ownerId} />,
  },
  {
    key: 'milestone',
    header: 'Next milestone',
    width: 190,
    render: (project) => (
      <span className="block truncate">
        {project.milestone.name} · {shortDate.format(day(project.milestone.date))}
      </span>
    ),
  },
  {
    key: 'due',
    header: 'Due',
    width: 96,
    render: (project) => (
      <span className="text-content-subtle">{shortDate.format(day(project.due))}</span>
    ),
  },
]

/**
 * Health decides the group, in the file's order: what needs attention first,
 * with the line Yak wrote when it flagged them.
 */
function groupsOf(list: Project[]): TableGroup<Project>[] {
  const groups: TableGroup<Project>[] = [
    {
      id: 'attention',
      label: 'Needs attention',
      note: 'Yak flagged these from this week’s updates',
      items: list.filter((p) => p.health === 'at-risk' || p.health === 'off-track'),
    },
    { id: 'on-track', label: 'On track', items: list.filter((p) => p.health === 'on-track') },
    {
      id: 'not-started',
      label: 'Not started',
      items: list.filter((p) => p.health === 'not-started'),
    },
  ]
  return groups.filter((group) => group.items.length > 0)
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
        <GroupedTable
          label="Projects"
          columns={columns}
          groups={groupsOf(projects)}
          clickableRows
        />
      </AppShell.Content>
    </>
  )
}
