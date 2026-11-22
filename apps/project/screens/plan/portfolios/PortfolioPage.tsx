import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowRight,
  Bell,
  Calendar,
  ChartLine,
  Check,
  Ellipsis,
  FolderOpen,
  SquarePen,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { AppShell } from '../../../../../src/components/AppShell'
import { Avatar } from '../../../../../src/components/Avatar'
import { Badge } from '../../../../../src/components/Badge'
import { Button } from '../../../../../src/components/Button'
import { MetricCard, MetricGrid } from '../../../../../src/components/Metric'
import { Panel } from '../../../../../src/components/Panel'
import { SegmentedControl } from '../../../../../src/components/SegmentedControl'
import { pixel, Table, type TableColumn } from '../../../../../src/components/Table'
import { Heading, Text } from '../../../../../src/components/Text'
import { Toast } from '../../../../../src/components/Toast'
import { Token } from '../../../../../src/components/Token'
import { TopBar } from '../../../../../src/components/TopBar'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import {
  HealthBadge,
  ProjectDot,
  ProjectNameCell,
  ProjectProgress,
} from '../../../components/ProjectCells'
import { HEALTH } from '../../../components/taskMeta'
import { YakLine } from '../../../components/YakLine'
import { datedText, day, recentDay, shortDate } from '../../../data/dates'
import { personFor } from '../../../data/people'
import { money, portfolioFor, type Portfolio } from '../../../data/portfolios'
import type { Project } from '../../../data/types'
import {
  earlierUpdates,
  latestUpdates,
  quietProjects,
  updatesYakLine,
  type StatusUpdate,
} from '../../../data/updates'
import { useShell } from '../../../shell/ShellContext'
import { floatingYakClearance } from '../../../yak/floating'
import { NotBuilt } from '../../NotBuilt'
import { NotBuiltMessage } from '../../NotBuiltMessage'
import { projectPath } from '../../project/paths'
import { usePlan } from '../planState'
import { RoadmapChart } from '../roadmap/RoadmapChart'
import { rangeFor } from '../roadmap/model'
import { activeCount, projectsIn, storesOpenBy } from './model'
import { PORTFOLIO_TABS, portfolioPath, STATUS_PARAM, type PortfolioTab } from './paths'

/** The goal's cut-off month as the moved calendar reads it: "Mar" in the file. */
const STORES_BY_MONTH = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(day('2027-03-31'))

/** "Since last update"'s glyphs, as the file draws each kind of change. */
const CHANGE_ICON: Record<StatusUpdate['changes'][number]['kind'], LucideIcon> = {
  date: Calendar,
  people: Users,
  progress: ChartLine,
  done: Check,
}

/** `#/plan/portfolios/:id` opens on Projects. */
export function PortfolioIndex() {
  const { portfolioId } = useParams()
  return <Navigate to={portfolioPath(portfolioId ?? '')} replace />
}

/**
 * A portfolio (`Plan - Portfolio / Store expansion + Status`,
 * `40006279:12996`): its title and the Projects, Timeline and Updates
 * Segment Control, the tab in the path. Projects is three Metric Cards over
 * its projects; a row opens that project's Latest status in a Panel
 * (`?project=austin`). Timeline is the Roadmap's chart for these projects
 * alone, code-first. Updates (`… / Updates`, `40006296:29615`) is the feed
 * of status updates, with a Nudge for the project that has gone quiet.
 */
export function PortfolioPage() {
  const { portfolioId, tab } = useParams()
  const portfolio = portfolioFor(portfolioId)
  const current = PORTFOLIO_TABS.find((t) => t.id === tab)
  if (!portfolio) return <NotBuilt />
  if (!current) return <Navigate to={portfolioPath(portfolio.id)} replace />
  return <PortfolioView portfolio={portfolio} tab={current.id} />
}

function PortfolioView({ portfolio, tab }: { portfolio: Portfolio; tab: PortfolioTab }) {
  const navigate = useNavigate()
  const shell = useShell()
  const plan = usePlan()
  const projects = projectsIn(portfolio, plan.projects)
  const [params, setParams] = useSearchParams()
  const requested = params.get(STATUS_PARAM)
  const open = projects.find((p) => p.id === requested)

  const setOpen = (id: string | null) =>
    setParams(
      (now) => {
        const copy = new URLSearchParams(now)
        if (id) copy.set(STATUS_PARAM, id)
        else copy.delete(STATUS_PARAM)
        return copy
      },
      { replace: true },
    )

  // RulesView's arrangement: the panel keeps its project while it slides
  // closed, and opening one closes Yak.
  const [shownId, setShownId] = useState(open?.id)
  if (open && open.id !== shownId) setShownId(open.id)
  const shown = projects.find((p) => p.id === shownId)
  const { yakOpen, closeYak } = shell
  const lastId = useRef(open?.id)
  useEffect(() => {
    if (open && open.id !== lastId.current && yakOpen) closeYak()
    lastId.current = open?.id
  }, [open, yakOpen, closeYak])

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              {portfolio.name}
            </Heading>
            <SegmentedControl
              aria-label="View"
              appearance="secondary"
              value={tab}
              onValueChange={(next) =>
                navigate({
                  pathname: portfolioPath(portfolio.id, next as PortfolioTab),
                  search: params.toString(),
                })
              }
            >
              {PORTFOLIO_TABS.map((t) => (
                <SegmentedControl.Item key={t.id} value={t.id}>
                  {t.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        }
        end={
          <>
            {tab === 'updates' ? (
              <Button
                appearance="ghost"
                startIcon={Bell}
                className="max-md:hidden"
                onClick={() => shell.notBuilt('The weekly digest')}
              >
                Weekly digest
              </Button>
            ) : null}
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
        {tab === 'projects' ? (
          <ProjectsTab
            portfolio={portfolio}
            projects={projects}
            openId={open?.id}
            onOpen={(id) => setOpen(id)}
          />
        ) : tab === 'timeline' ? (
          <RoadmapChart
            range={rangeFor('months')}
            lanes={[{ id: portfolio.id, label: portfolio.name, projects }]}
            staged={plan.staged}
            laneHeader="Portfolio"
          />
        ) : (
          <UpdatesTab portfolio={portfolio} projects={projects} />
        )}
      </AppShell.Content>
      {shell.screenPanelHost
        ? createPortal(
            <StatusPanel
              project={shown}
              open={Boolean(open) && tab === 'projects'}
              onClose={() => setOpen(null)}
            />,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}

/** Three Metric Cards over the portfolio's projects, at the Balanced density. */
function ProjectsTab({
  portfolio,
  projects,
  openId,
  onOpen,
}: {
  portfolio: Portfolio
  projects: Project[]
  openId?: string
  onOpen: (id: string) => void
}) {
  const columns: TableColumn<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      rowTarget: true,
      renderCell: (project) => (
        <button
          type="button"
          aria-expanded={project.id === openId}
          onClick={() => onOpen(project.id)}
          className={cn('flex min-w-0 items-center gap-2 rounded-xs text-left', focusRing)}
        >
          <ProjectDot project={project} />
          <span className="truncate">{project.name}</span>
        </button>
      ),
    },
    {
      key: 'health',
      header: 'Health',
      width: pixel(110),
      renderCell: (project) => <HealthBadge project={project} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      width: pixel(160),
      layout: 'fill',
      renderCell: (project) => <ProjectProgress project={project} />,
    },
    {
      key: 'due',
      header: 'Due',
      width: pixel(80),
      renderCell: (project) => (
        <span className="text-content-subtle">{shortDate.format(day(project.due))}</span>
      ),
    },
  ]
  const onTrack = projects.filter((p) => p.health === 'on-track').length
  return (
    <>
      <MetricGrid columns={3}>
        <MetricCard label="Projects" value={`${activeCount(projects)} active`} />
        <MetricCard
          label="Budget"
          value={`${money.format(portfolio.budget.spent)} of ${money.format(portfolio.budget.total)}`}
        />
        {portfolio.id === 'store-expansion' ? (
          <MetricCard label={`Stores open by ${STORES_BY_MONTH}`} value={storesOpenBy(projects)} />
        ) : (
          <MetricCard label="On track" value={`${onTrack} of ${projects.length}`} />
        )}
      </MetricGrid>
      <div className="shrink-0">
        <Table
          label={`${portfolio.name} projects`}
          columns={columns}
          data={projects}
          idKey="id"
          selectedKeys={openId ? [openId] : []}
        />
      </div>
    </>
  )
}

/** A face, a name, a day and the health it was posted with. */
function Byline({ update, size }: { update: StatusUpdate; size: 'small' | 'x-small' }) {
  const author = personFor(update.authorId)
  const health = HEALTH[update.health]
  const small = size === 'x-small'
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Avatar name={author.name} src={author.avatar} alt="" size={size} />
      <Text render={<span />} size={small ? 'sm' : undefined} weight="semibold" color="emphasized">
        {author.name}
      </Text>
      <Text
        render={<time dateTime={update.posted} />}
        size="sm"
        color="subtle"
        title={shortDate.format(day(update.posted))}
      >
        {recentDay(day(update.posted))}
      </Text>
      {small ? null : <Badge color={health.color}>{health.label}</Badge>}
    </span>
  )
}

function Changes({ update, labelId }: { update: StatusUpdate; labelId?: string }) {
  return (
    <ul
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : 'Since last update'}
      className="flex flex-wrap gap-1"
    >
      {update.changes.map((change) => (
        <li key={change.text} className="flex">
          <Token startIcon={CHANGE_ICON[change.kind]}>{datedText(change.text)}</Token>
        </li>
      ))}
    </ul>
  )
}

/**
 * Latest status (`Latest status Panel`, `40006279:12996`): the project's
 * name, its last update with what moved since the one before, its earlier
 * updates as Activity rows, and Open project.
 */
function StatusPanel({
  project,
  open,
  onClose,
}: {
  project?: Project
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const update = latestUpdates.find((u) => u.projectId === project?.id)
  const earlier = earlierUpdates.filter((u) => u.projectId === project?.id)
  return (
    <Panel
      aria-label="Latest status"
      open={open && project !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      {project ? (
        <>
          <Panel.Header icon={SquarePen}>Latest status</Panel.Header>
          <Panel.Body className="flex flex-col gap-4">
            <Heading level={2} size="lg" weight="semibold">
              {project.name}
            </Heading>
            {update ? (
              <>
                <Byline update={update} size="small" />
                <Text>{datedText(update.body)}</Text>
                <div className="flex flex-col gap-2">
                  <Text size="sm" color="subtle" id="since-last-status">
                    Since last update
                  </Text>
                  <Changes update={update} labelId="since-last-status" />
                </div>
              </>
            ) : (
              <Text color="subtle">
                {project.health === 'not-started'
                  ? 'It hasn’t started, so there’s no update yet.'
                  : `${personFor(project.ownerId).name} hasn’t posted an update in two weeks.`}
              </Text>
            )}
            {earlier.length > 0 ? (
              <section aria-labelledby="earlier-updates" className="flex flex-col gap-2">
                <Heading id="earlier-updates" level={3} size="base" weight="semibold">
                  Earlier updates
                </Heading>
                <ol className="flex flex-col">
                  {earlier.map((entry) => {
                    const author = personFor(entry.authorId)
                    return (
                      <li key={entry.posted} className="flex items-center gap-2 py-1.5">
                        <Avatar name={author.name} src={author.avatar} alt="" size="x-small" />
                        <Text size="sm" className="min-w-0 flex-1">
                          {entry.text}
                        </Text>
                        <Text render={<span />} size="sm" color="subtle">
                          {recentDay(day(entry.posted))}
                        </Text>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ) : null}
            <Button
              appearance="secondary"
              startIcon={ArrowRight}
              className="self-start"
              onClick={() => navigate(projectPath(project.id))}
            >
              Open project
            </Button>
          </Panel.Body>
        </>
      ) : null}
    </Panel>
  )
}

/**
 * The Updates feed: Yak's line, each project's latest update as a bordered
 * card, then any project gone quiet with a Nudge for its owner. A 760
 * column, centered, as drawn.
 */
function UpdatesTab({ portfolio, projects }: { portfolio: Portfolio; projects: Project[] }) {
  const toast = Toast.useToast()
  const { nudged, nudge } = usePlan()
  const updates = latestUpdates.filter((u) => projects.some((p) => p.id === u.projectId))
  const quiet = quietProjects.filter((q) => projects.some((p) => p.id === q.projectId))
  if (updates.length === 0 && quiet.length === 0) {
    return (
      <NotBuiltMessage
        icon={FolderOpen}
        title="No updates in this mock yet"
        body={`Only Store expansion’s projects have posted updates so far; ${portfolio.name}’s come in a later slice.`}
        link={{
          href: `#${portfolioPath('store-expansion', 'updates')}`,
          label: 'Open Store expansion',
        }}
      />
    )
  }
  return (
    <div className="mx-auto flex w-full max-w-190 shrink-0 flex-col gap-3">
      {updatesYakLine[portfolio.id] ? <YakLine>{updatesYakLine[portfolio.id]}</YakLine> : null}
      {updates.map((update) => {
        const project = projects.find((p) => p.id === update.projectId)!
        const health = HEALTH[update.health]
        return (
          <article
            key={update.projectId}
            aria-label={project.name}
            className="flex flex-col gap-2 rounded-lg border border-surface-border px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <ProjectNameCell project={project} href={`#${projectPath(project.id)}`} />
              </span>
              <Badge color={health.color}>{health.label}</Badge>
            </div>
            <Byline update={update} size="x-small" />
            <Text>{datedText(update.body)}</Text>
            <Changes update={update} />
          </article>
        )
      })}
      {quiet.map((q) => {
        const project = projects.find((p) => p.id === q.projectId)!
        const owner = personFor(project.ownerId).name.split(' ')[0]
        const done = nudged.includes(project.id)
        return (
          <div
            key={q.projectId}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-border px-4 py-3"
          >
            <ProjectNameCell project={project} href={`#${projectPath(project.id)}`} />
            <Text render={<span />} size="sm" color="subtle" className="min-w-0 flex-1">
              No update in {q.quietFor}
            </Text>
            {done ? (
              <Text render={<span />} size="sm" color="subtle">
                Nudged {owner}
              </Text>
            ) : (
              <Button
                appearance="secondary"
                size="small"
                onClick={() => {
                  nudge(project.id)
                  toast.add({
                    title: `Nudged ${owner}`,
                    description: `${owner} will get a reminder to post an update on ${project.name}.`,
                  })
                }}
              >
                Nudge {owner}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
