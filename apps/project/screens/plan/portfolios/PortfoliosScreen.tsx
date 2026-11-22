import { Ellipsis, Folders, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../../src/components/AppShell'
import { Button } from '../../../../../src/components/Button'
import { Icon } from '../../../../../src/components/Icon'
import { StackedBar } from '../../../../../src/components/StackedBar'
import { pixel, Table, type TableColumn } from '../../../../../src/components/Table'
import { Heading } from '../../../../../src/components/Text'
import { TopBar } from '../../../../../src/components/TopBar'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import { OwnerCell } from '../../../components/ProjectCells'
import { YakLine } from '../../../components/YakLine'
import { day, shortDate } from '../../../data/dates'
import { money, portfolios, type Portfolio } from '../../../data/portfolios'
import { useShell } from '../../../shell/ShellContext'
import { floatingYakClearance } from '../../../yak/floating'
import { usePlan } from '../planState'
import { healthMix, nextMilestone, projectsIn } from './model'
import { portfolioPath } from './paths'

/**
 * Plan › Portfolios (`Plan - Portfolios`, `40006296:27641`): the four
 * portfolios at the Spacious density, each with its project count, the mix
 * of its projects' health as a Small Stacked Bar, its budget, owner and next
 * milestone. A row opens the portfolio. Yak's line is the file's.
 */
export function PortfoliosScreen() {
  const shell = useShell()
  const { projects } = usePlan()

  const columns: TableColumn<Portfolio>[] = [
    {
      key: 'name',
      header: 'Portfolio',
      rowTarget: true,
      renderCell: (portfolio) => (
        <span className="flex min-w-0 items-center gap-2">
          <Icon icon={Folders} />
          <a
            href={`#${portfolioPath(portfolio.id)}`}
            className={cn(
              'truncate rounded-xs font-semibold text-content-emphasized hover:underline',
              focusRing,
            )}
          >
            {portfolio.name}
          </a>
        </span>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      width: pixel(96),
      renderCell: (portfolio) => (
        <span className="text-content-subtle">{portfolio.projectIds.length}</span>
      ),
    },
    {
      key: 'health',
      header: 'Health',
      width: pixel(190),
      layout: 'fill',
      renderCell: (portfolio) => (
        <StackedBar
          size="small"
          label={`${portfolio.name} health`}
          formatValue={(n) => `${n} project${n === 1 ? '' : 's'}`}
          segments={healthMix(projectsIn(portfolio, projects))}
        />
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      width: pixel(160),
      renderCell: (portfolio) =>
        `${money.format(portfolio.budget.spent)} of ${money.format(portfolio.budget.total)}`,
    },
    {
      key: 'owner',
      header: 'Owner',
      width: pixel(170),
      renderCell: (portfolio) => <OwnerCell id={portfolio.ownerId} />,
    },
    {
      key: 'milestone',
      header: 'Next milestone',
      width: pixel(216),
      renderCell: (portfolio) => {
        const next = nextMilestone(projectsIn(portfolio, projects))
        return (
          <span className="block truncate">
            {next.name} · {shortDate.format(day(next.date))}
          </span>
        )
      },
    },
  ]

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="bold">
            Portfolios
          </Heading>
        }
        end={
          <>
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              onClick={() => shell.notBuilt('Filtering portfolios')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Portfolio actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        <YakLine>
          Twelve projects, and two need attention: Austin’s permit and Loyalty’s pricing. Digital is
          the only portfolio over its pace on budget.
        </YakLine>
        <div className="shrink-0">
          <Table
            label="Portfolios"
            density="spacious"
            columns={columns}
            data={portfolios}
            idKey="id"
          />
        </div>
      </AppShell.Content>
    </>
  )
}
