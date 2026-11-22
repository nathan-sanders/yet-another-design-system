import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Ellipsis, MessageCircle, TriangleAlert, Trash2 } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { HorizontalBar } from '../../../../src/components/HorizontalBar'
import { Icon } from '../../../../src/components/Icon'
import { LineSeries } from '../../../../src/components/LineSeries'
import { Menu } from '../../../../src/components/Menu'
import { MetricCard, MetricGrid } from '../../../../src/components/Metric'
import { Panel } from '../../../../src/components/Panel'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { OwnerCell, ProjectNameCell } from '../../components/ProjectCells'
import { statusFor } from '../../components/taskMeta'
import { YakLine } from '../../components/YakLine'
import { personFor } from '../../data/people'
import { projectFor } from '../../data/projects'
import { teams } from '../../data/reports'
import type { Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useYakChat } from '../../yak/chat'
import { projectPath, taskKey, taskPath } from '../project/paths'
import { useTasks } from '../project/tasksState'
import { ChartView } from './ChartView'
import {
  deliveryMetrics,
  deliveryRead,
  deliverySeries,
  lateBy,
  openByTeam,
  overdueNote,
  overdueTasks,
  say,
  teamOf,
  type Range,
} from './model'
import { useReports, type CustomChart } from './reportsState'

/** A chart's block: its title, a ⋯ menu, and the chart, 16 in. */
function ChartBlock({
  title,
  menu,
  children,
}: {
  title: string
  menu: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <ContentBlock headingLevel={2} className="h-auto min-w-0">
      <ContentBlock.Header
        actions={
          <Menu>
            <Menu.Trigger
              render={
                <Button appearance="ghost" startIcon={Ellipsis} aria-label={`${title} actions`} />
              }
            />
            <Menu.Popup align="end" aria-label={`${title} actions`}>
              <Menu.Group>{menu}</Menu.Group>
            </Menu.Popup>
          </Menu>
        }
      >
        {title}
      </ContentBlock.Header>
      <ContentBlock.Content>{children}</ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * Delivery (`Reports - Delivery`, `40006283:21661`): Yak's read, four
 * Metric Cards, Completed vs. overdue and Open work by team side by side,
 * then the overdue tasks at the file's 88 / fill / 220 / 170 / 96. A team's
 * bar opens its overdue work in a panel (`Reports - Drill into a chart`,
 * `40006323:56072`), `?team=ops`. Charts made in the builder follow the two.
 */
export function DeliveryReport({ range }: { range: Range }) {
  const navigate = useNavigate()
  const shell = useShell()
  const chat = useYakChat()
  const toast = Toast.useToast()
  const [params, setParams] = useSearchParams()
  const { tasks } = useTasks()
  const reports = useReports()
  const late = overdueTasks(tasks)
  const m = deliveryMetrics(range, late.length)
  const series = deliverySeries(range, late.length)
  const byTeam = openByTeam(tasks)

  const teamId = params.get('team')
  const team = teams.find((t) => t.id === teamId)
  const [shownTeamId, setShownTeamId] = useState(team?.id)
  if (team && team.id !== shownTeamId) setShownTeamId(team.id)

  const setTeam = (id?: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('team', id)
    else next.delete('team')
    setParams(next)
  }

  const ask = (prompt: string) => {
    chat.start(prompt)
    shell.openYak()
  }

  const remove = (chart: CustomChart) => {
    const before = reports.charts
    reports.removeChart(chart.id)
    toast.add({
      title: 'Chart removed',
      description: chart.title,
      action: { label: 'Undo', onClick: () => reports.restoreCharts(before) },
    })
  }

  const columns: TableColumn<Task>[] = [
    {
      key: 'number',
      header: 'Number',
      width: pixel(88),
      renderCell: (task) => <span className="text-content-subtle">{taskKey(task)}</span>,
    },
    {
      key: 'task',
      header: 'Overdue task',
      layout: 'fill',
      rowTarget: true,
      renderCell: (task) => (
        <span className="flex min-w-0 items-center gap-2">
          <Icon icon={statusFor(task.status).icon} className="shrink-0" />
          <a
            href={`#${taskPath(task)}`}
            className={cn('min-w-0 truncate rounded-sm text-content-primary', focusRing)}
          >
            {task.title}
          </a>
        </span>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      width: pixel(220),
      renderCell: (task) =>
        task.projectId ? (
          <ProjectNameCell project={projectFor(task.projectId)!} />
        ) : (
          task.team?.name
        ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: pixel(170),
      renderCell: (task) => <OwnerCell id={task.assigneeId} />,
    },
    {
      key: 'late',
      header: 'Late by',
      width: pixel(96),
      renderCell: (task) => lateBy(task),
    },
  ]

  return (
    <>
      <YakLine>{deliveryRead(tasks, range)}</YakLine>
      <MetricGrid columns={4}>
        <MetricCard
          label="Tasks completed"
          value={m.completed}
          trend={m.completedTrend}
          formatTrend={(t) => `${Math.abs(t)}%`}
        />
        <MetricCard
          label="On-time rate"
          value={`${m.onTime}%`}
          trend={m.onTimeTrend}
          formatTrend={(t) => `${Math.abs(t)}%`}
        />
        <MetricCard
          label="Overdue tasks"
          value={m.overdue}
          trend={m.overdueTrend}
          goodDirection="down"
          formatTrend={(t) => String(Math.abs(t))}
        />
        <MetricCard
          label="Avg. cycle time"
          value={`${m.cycle}d`}
          trend={m.cycleTrend}
          goodDirection="down"
          formatTrend={(t) => `${Math.abs(t)}d`}
        />
      </MetricGrid>

      <div className="grid shrink-0 grid-cols-1 gap-3 @5xl/page:grid-cols-2">
        <ChartBlock
          title="Completed vs. overdue"
          menu={
            <Menu.Item
              startIcon={MessageCircle}
              onClick={() => ask('Why is overdue work up this month?')}
            >
              Ask Yak about this chart
            </Menu.Item>
          }
        >
          <LineSeries
            label={`Tasks completed and overdue each day, last ${range} days`}
            data={series}
            xKey="date"
            xPreset="days"
            series={[
              { key: 'completed', label: 'Completed', marker: false },
              { key: 'overdue', label: 'Overdue', marker: false },
            ]}
            showPoints={false}
            height={280}
          />
        </ChartBlock>
        <ChartBlock
          title="Open work by team"
          menu={
            <Menu.Item startIcon={TriangleAlert} onClick={() => setTeam(byTeam[0].id)}>
              {`See ${byTeam[0].team}’s overdue work`}
            </Menu.Item>
          }
        >
          <HorizontalBar
            label="Open and overdue tasks by team"
            data={byTeam}
            yKey="team"
            series={[
              { key: 'open', label: 'Open' },
              { key: 'overdue', label: 'Overdue' },
            ]}
            stacked
            height={260}
            onBarClick={({ row }) => setTeam(String(row.id))}
          />
          <Text size="sm" color="subtle">
            {overdueNote(tasks)}
          </Text>
        </ChartBlock>
        {reports.charts.map((chart) => (
          <ChartBlock
            key={chart.id}
            title={chart.title}
            menu={
              <Menu.Item startIcon={Trash2} onClick={() => remove(chart)}>
                Remove from Delivery
              </Menu.Item>
            }
          >
            <ChartView config={chart.config} tasks={tasks} title={chart.title} />
          </ChartBlock>
        ))}
      </div>

      {late.length ? (
        <div className="shrink-0">
          <Table label="Overdue tasks" columns={columns} data={late} idKey="id" />
        </div>
      ) : null}

      {shell.screenPanelHost
        ? createPortal(
            <TeamPanel
              teamId={shownTeamId}
              open={Boolean(team)}
              tasks={tasks}
              onClose={() => setTeam(undefined)}
              onOpenList={(projectId) => navigate(projectPath(projectId, 'list'))}
              onAsk={ask}
            />,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}

/**
 * A team's overdue work (`Reports - Drill into a chart`): "Ops · 6 overdue"
 * with a warning glyph, a line on where it all is, a row a task — open
 * circle, name, face, how late — then Open as a list and Ask Yak. Kept
 * mounted, as the task panel is, so it takes focus when it opens.
 */
function TeamPanel({
  teamId,
  open,
  tasks,
  onClose,
  onOpenList,
  onAsk,
}: {
  teamId?: string
  open: boolean
  tasks: Task[]
  onClose: () => void
  onOpenList: (projectId: string) => void
  onAsk: (prompt: string) => void
}) {
  const team = teams.find((t) => t.id === teamId)
  const late = overdueTasks(tasks).filter((t) => team && teamOf(t.assigneeId)?.id === team.id)
  const projects = [...new Set(late.map((t) => t.projectId).filter(Boolean))] as string[]
  const where =
    late.length === 0
      ? 'Nothing of theirs is overdue.'
      : projects.length === 1
        ? `${late.length === 1 ? 'It is' : `All ${say(late.length)} are`} in ${projectFor(projects[0])!.name}.`
        : `Across ${say(projects.length)} projects.`
  return (
    <Panel
      aria-label="Overdue work"
      open={open && team !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      {team ? (
        <>
          <Panel.Header
            icon={TriangleAlert}
          >{`${team.name} · ${late.length} overdue`}</Panel.Header>
          <Panel.Body className="flex flex-col gap-3">
            <Text size="sm" color="subtle">
              {where}
            </Text>
            <ul className="flex flex-col">
              {late.map((task) => {
                const person = personFor(task.assigneeId)
                return (
                  <li key={task.id} className="flex h-10 items-center gap-2">
                    <Icon icon={statusFor(task.status).icon} className="shrink-0" />
                    <a
                      href={`#${taskPath(task)}`}
                      className={cn('min-w-0 flex-1 truncate rounded-sm', focusRing)}
                    >
                      {task.title}
                    </a>
                    <Avatar
                      name={person.name}
                      src={person.avatar}
                      alt={person.name}
                      size="x-small"
                    />
                    <Text
                      render={<span />}
                      size="sm"
                      color="subtle"
                      className="w-12 shrink-0 text-right"
                    >
                      {lateBy(task)}
                    </Text>
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-2">
              {projects.length === 1 ? (
                <Button
                  appearance="secondary"
                  startIcon={ArrowRight}
                  onClick={() => onOpenList(projects[0])}
                >
                  Open as a list
                </Button>
              ) : null}
              <Button
                appearance="ghost"
                startIcon={MessageCircle}
                onClick={() => onAsk(`What should ${team.name} do about its overdue work?`)}
              >
                Ask Yak
              </Button>
            </div>
          </Panel.Body>
        </>
      ) : null}
    </Panel>
  )
}
