import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Check, ChevronDown, Play, Plus, Repeat2, Timer } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Dialog } from '../../../../src/components/Dialog'
import { LineSeries } from '../../../../src/components/LineSeries'
import { Menu } from '../../../../src/components/Menu'
import { Radio } from '../../../../src/components/Radio'
import { pixel, Table, type TableColumn, type TableGroup } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { PropertyRow } from '../../components/PropertyRow'
import { AssigneeToken, StatusToken } from '../../components/TaskTokens'
import { day, shortDate, today } from '../../data/dates'
import { sprints as savedSprints, type Sprint } from '../../data/sprints'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useYakChat } from '../../yak/chat'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { TaskNameCell } from './ListView'
import { projectPath, taskPath } from './paths'
import {
  addedAfterStart,
  averagePace,
  behindBy,
  burndown,
  daysLeft,
  nextSprint,
  sprintRange,
  sprintTasks,
  summarize,
} from './sprint'
import { useSprints } from './sprintsState'
import { useTasks, type TaskEdit } from './tasksState'

type Group = 'active' | 'todo' | 'done'

/** The table's three groups, as drawn: In review and Blocked go under In progress. */
function groupOf(task: Task): Group {
  if (task.status === 'done') return 'done'
  if (task.status === 'todo') return 'todo'
  return 'active'
}

const GROUPS: TableGroup[] = [
  { key: 'active', label: 'In progress' },
  { key: 'todo', label: 'To do' },
  { key: 'done', label: 'Done' },
]

/** The table's order: by group, then by number. */
function inOrder(tasks: Task[]): Task[] {
  const rank: Record<Group, number> = { active: 0, todo: 1, done: 2 }
  return [...tasks].sort((a, b) => rank[groupOf(a)] - rank[groupOf(b)])
}

/**
 * The sprints a project has: the saved ones, then one more after each that
 * was completed here, so completing Sprint 14 makes Sprint 15.
 */
function sprintsFor(projectId: string, completed: number[]): Sprint[] {
  const list = savedSprints.filter((s) => s.projectId === projectId)
  for (const number of completed) {
    const done = list.find((s) => s.number === number)
    if (done && !list.some((s) => s.number === number + 1)) list.push(nextSprint(done))
  }
  return list
}

/**
 * A sprint project's Sprints tab (`Project - Sprint`, `40006281:34376`): the
 * sprint's menu, its dates and days left, Standup and Complete sprint over a
 * Table of its tasks grouped In progress / To do / Done at the file's 88 /
 * fill / 160 / 128; and beside it, 360 wide, Sprint health — the verdict and
 * the burndown — and This sprint. Another sprint is `?sprint=13`.
 */
export function SprintsView({
  project,
  selectedTaskId,
}: {
  project: Project
  selectedTaskId?: string
}) {
  const navigate = useNavigate()
  const shell = useShell()
  const chat = useYakChat()
  const toast = Toast.useToast()
  const [params] = useSearchParams()
  const { tasks, updateTask } = useTasks()
  const sprintsState = useSprints()
  const completed = sprintsState.completed[project.id] ?? []
  const all = sprintsFor(project.id, completed)
  const current = all.find((s) => !s.result && !completed.includes(s.number))
  const requested = Number(params.get('sprint'))
  const sprint = all.find((s) => s.number === requested) ?? current ?? all.at(-1)
  // What the dialog was opened on, kept while it fades out after completing.
  const [completing, setCompleting] = useState<{ sprint: Sprint; done: number; open: number }>()
  const [closing, setClosing] = useState(false)

  const inSprint = useMemo(
    () => (sprint ? sprintTasks(tasks, project.id, sprint.number, sprintsState.moves) : []),
    [tasks, project.id, sprint, sprintsState.moves],
  )

  if (!sprint) {
    return (
      <NotBuiltMessage
        icon={Repeat2}
        title="No sprints yet"
        body={`${project.name} has no sprints in the mock.`}
      />
    )
  }

  const isCurrent = sprint.number === current?.number
  const finished = Boolean(sprint.result) || completed.includes(sprint.number)
  const started = day(sprint.start) <= today
  const notStarted = !finished && !started
  const open = inSprint.filter((t) => t.status !== 'done')
  const left = daysLeft(sprint)

  const onChange = (task: Task, edit: TaskEdit) => updateTask(task.id, edit)
  const columns: TableColumn<Task>[] = [
    {
      key: 'number',
      header: 'Number',
      width: pixel(88),
      renderCell: (task) => (
        <span className="text-content-subtle">
          {project.key}-{task.number}
        </span>
      ),
    },
    {
      key: 'task',
      header: 'Task',
      layout: 'fill',
      rowTarget: true,
      renderCell: (task) => <TaskNameCell task={task} href={`#${taskPath(task, 'sprints')}`} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: pixel(160),
      renderCell: (task) => <AssigneeToken task={task} onChange={(edit) => onChange(task, edit)} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(128),
      renderCell: (task) => <StatusToken task={task} onChange={(edit) => onChange(task, edit)} />,
    },
  ]

  const status = finished
    ? sprint.result
      ? `${sprintRange(sprint)} · finished`
      : `${sprintRange(sprint)} · completed`
    : notStarted
      ? `${sprintRange(sprint)} · starts ${shortDate.format(day(sprint.start))}`
      : `${sprintRange(sprint)} · ${left} ${left === 1 ? 'day' : 'days'} left`

  const complete = (to: number | null) => {
    const snapshot = { completed: sprintsState.completed, moves: sprintsState.moves }
    sprintsState.completeSprint(
      project.id,
      sprint.number,
      open.map((t) => t.id),
      to,
    )
    setClosing(true)
    navigate(projectPath(project.id, 'sprints'))
    toast.add({
      title: `Sprint ${sprint.number} completed`,
      description:
        to === null
          ? `${open.length} open tasks went to the backlog.`
          : `${open.length} open tasks moved to Sprint ${to}.`,
      action: { label: 'Undo', onClick: () => sprintsState.restore(snapshot) },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Menu>
          <Menu.Trigger
            render={
              <Button appearance="ghost" startIcon={Repeat2} endIcon={ChevronDown}>
                {`Sprint ${sprint.number}`}
              </Button>
            }
          />
          <Menu.Popup aria-label="Sprints">
            <Menu.Group>
              <Menu.RadioGroup
                value={String(sprint.number)}
                onValueChange={(value) =>
                  navigate(
                    Number(value) === current?.number
                      ? projectPath(project.id, 'sprints')
                      : `${projectPath(project.id, 'sprints')}?sprint=${value}`,
                  )
                }
              >
                {[...all].reverse().map((s) => (
                  <Menu.RadioItem key={s.number} value={String(s.number)}>
                    {`Sprint ${s.number}${s.number === current?.number ? ' · current' : ''}`}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
          </Menu.Popup>
        </Menu>
        <Text render={<span />} color="subtle">
          {status}
        </Text>
        <span className="flex-1" />
        {isCurrent && !notStarted ? (
          <>
            <Button
              appearance="ghost"
              startIcon={Play}
              onClick={() => {
                chat.start(`Write today’s standup for Sprint ${sprint.number}`)
                shell.openYak()
              }}
            >
              Standup
            </Button>
            <Button
              appearance="secondary"
              onClick={() => {
                setClosing(false)
                setCompleting({ sprint, done: inSprint.length - open.length, open: open.length })
              }}
            >
              Complete sprint
            </Button>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 @5xl/page:flex-row @5xl/page:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {inSprint.length > 0 ? (
            <div className="shrink-0">
              <Table
                label={`Sprint ${sprint.number} tasks`}
                columns={columns}
                data={inOrder(inSprint)}
                idKey="id"
                groupBy={groupOf}
                groups={GROUPS}
                selectedKeys={selectedTaskId ? [selectedTaskId] : []}
              />
            </div>
          ) : (
            <Text color="subtle" className="py-12 text-center">
              {sprint.result
                ? `Sprint ${sprint.number} finished with ${sprint.result.done} of ${sprint.result.total} done. Its tasks are not in the mock.`
                : `Nothing is in Sprint ${sprint.number} yet.`}
            </Text>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 @5xl/page:w-90">
          <SprintHealth
            sprint={sprint}
            tasks={inSprint}
            finished={finished}
            notStarted={notStarted}
          />
          <ThisSprint
            number={sprint.number}
            tasks={inSprint}
            finishedSprints={all.filter((s) => s.result)}
            result={sprint.result}
          />
        </div>
      </div>

      {completing ? (
        <CompleteSprintDialog
          key={completing.sprint.number}
          open={!closing}
          sprint={completing.sprint}
          done={completing.done}
          openCount={completing.open}
          onClose={() => setClosing(true)}
          onComplete={complete}
        />
      ) : null}
    </div>
  )
}

/**
 * `Block / Sprint health`: the verdict in 18 semibold, a line under it, and
 * the burndown — Remaining against Ideal — across the sprint's weekdays.
 */
function SprintHealth({
  sprint,
  tasks,
  finished,
  notStarted,
}: {
  sprint: Sprint
  tasks: Task[]
  finished: boolean
  notStarted: boolean
}) {
  const rows = burndown(sprint, tasks)
  const behind = behindBy(rows)
  const added = tasks.filter((t) => addedAfterStart(t, sprint.number))
  // What Yak's line weighs: the burndown without the work added after the start.
  const without = added.length
    ? behindBy(
        burndown(
          sprint,
          tasks.filter((t) => !addedAfterStart(t, sprint.number)),
        ),
      )
    : behind

  let verdict: string
  let line: string
  if (sprint.result) {
    verdict = `Finished ${sprint.result.done} of ${sprint.result.total}`
    line = 'This sprint ended before the mock begins.'
  } else if (notStarted) {
    verdict = 'Not started'
    line = `Sprint ${sprint.number} starts ${shortDate.format(day(sprint.start))} with ${tasks.length} tasks.`
  } else if (finished) {
    const done = tasks.filter((t) => t.status === 'done').length
    verdict = `Completed with ${done} done`
    line = 'Its open work moved on when it was completed.'
  } else {
    verdict = behind === 0 ? 'On pace' : `Trailing by ${behind} ${behind === 1 ? 'task' : 'tasks'}`
    const change = added.length
      ? `Scope changed ${added.length === 1 ? 'once' : `${added.length} times`}, when ${added
          .map((t) => t.title)
          .join(' and ')} came in on ${shortDate.format(day(added[0].sprint!.added!))}. `
      : 'Scope hasn’t changed since the start. '
    const drop = !added.length
      ? ''
      : without === 0
        ? `Dropping ${added.length === 1 ? 'it' : 'them'} would put you back on pace.`
        : `Dropping ${added.length === 1 ? 'it' : 'them'} would leave you ${without} behind.`
    line = behind === 0 && !added.length ? 'The work is burning down as planned.' : change + drop
  }

  return (
    <ContentBlock headingLevel={2} className="h-auto">
      <ContentBlock.Header>Sprint health</ContentBlock.Header>
      <ContentBlock.Content className="gap-4">
        <div className="flex flex-col gap-1">
          <Heading level={3} size="lg">
            {verdict}
          </Heading>
          <Text size="sm" color="subtle">
            {line}
          </Text>
        </div>
        {!sprint.result && !notStarted ? (
          <LineSeries
            label={`Sprint ${sprint.number} burndown: tasks remaining against the ideal`}
            data={rows}
            xKey="day"
            xPreset="categories"
            interpolation="linear"
            // The frame draws the lines bare.
            showPoints={false}
            series={[
              { key: 'remaining', label: 'Remaining' },
              { key: 'ideal', label: 'Ideal', dashed: true, marker: false },
            ]}
            height={260}
          />
        ) : null}
      </ContentBlock.Content>
    </ContentBlock>
  )
}

/** `Block / This sprint`: four `_Property Row`s. */
function ThisSprint({
  number,
  tasks,
  finishedSprints,
  result,
}: {
  number: number
  tasks: Task[]
  finishedSprints: Sprint[]
  result?: Sprint['result']
}) {
  const summary = summarize(tasks, number)
  const done = result?.done ?? summary.done
  const total = result?.total ?? summary.total
  return (
    <ContentBlock headingLevel={2} className="h-auto">
      <ContentBlock.Header>This sprint</ContentBlock.Header>
      <ContentBlock.Content className="gap-0">
        <dl>
          <PropertyRow icon={Check} label="Completed">
            {`${done} of ${total}`}
          </PropertyRow>
          <PropertyRow icon={Plus} label="Added">
            {summary.added.length ? `${summary.added.length} after start` : 'None after start'}
          </PropertyRow>
          <PropertyRow icon={Repeat2} label="Carried over">
            {summary.carried ? `${summary.carried} from Sprint ${summary.carriedFrom}` : 'None'}
          </PropertyRow>
          <PropertyRow icon={Timer} label="Average pace">
            {`${averagePace(finishedSprints)} tasks a sprint`}
          </PropertyRow>
        </dl>
      </ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * Complete sprint. The file draws the button and not what follows, so this
 * asks the one question completing a sprint has: where the open work goes —
 * the next sprint, or the backlog.
 */
function CompleteSprintDialog({
  open,
  sprint,
  done,
  openCount,
  onClose,
  onComplete,
}: {
  open: boolean
  sprint: Sprint
  done: number
  openCount: number
  onClose: () => void
  onComplete: (to: number | null) => void
}) {
  const [to, setTo] = useState('next')
  const next = nextSprint(sprint)
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose()
      }}
    >
      <Dialog.Popup>
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>{`Complete Sprint ${sprint.number}`}</Dialog.Title>
          <Dialog.Close />
        </div>
        <Dialog.Body className="flex flex-col gap-4">
          <Text>
            {`${done} done and ${openCount} still open.`}
            {openCount ? ' Where should the open work go?' : ''}
          </Text>
          {openCount ? (
            <Radio.Group
              aria-label="Move open tasks to"
              value={to}
              onValueChange={(v) => setTo(String(v))}
            >
              <Radio
                value="next"
                label={`Sprint ${next.number}`}
                description={`Starts ${shortDate.format(day(next.start))}`}
              />
              <Radio value="backlog" label="Backlog" description="Plan them into a sprint later" />
            </Radio.Group>
          ) : null}
        </Dialog.Body>
        <div className="flex justify-end gap-2 pt-4">
          <Button appearance="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={() => onComplete(to === 'next' ? next.number : null)}
          >
            Complete sprint
          </Button>
        </div>
      </Dialog.Popup>
    </Dialog>
  )
}
