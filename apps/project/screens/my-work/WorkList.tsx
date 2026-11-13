import { useMemo } from 'react'
import { CircleCheckBig } from 'lucide-react'

import { pixel, Table, type TableColumn, type TableGroup } from '../../../../src/components/Table'
import { ProjectNameCell } from '../../components/ProjectCells'
import { DueToken, PriorityToken, StatusToken } from '../../components/TaskTokens'
import { FREE_HOURS } from '../../data/myWork'
import { projectFor } from '../../data/projects'
import type { Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { TaskNameCell } from '../project/ListView'
import { projectPath, taskKey } from '../project/paths'
import { useTasks, type TaskEdit } from '../project/tasksState'
import { BUCKETS, bucketOf, hoursOf, openWork, workDueLabel, workTitle } from './model'
import { myWorkTaskPath } from './paths'

function columnsFor(
  onChange: (task: Task, edit: TaskEdit) => void,
  notBuilt: (what: string) => void,
): TableColumn<Task>[] {
  return [
    {
      key: 'number',
      header: 'Number',
      width: pixel(88),
      renderCell: (task) => <span className="text-content-subtle">{taskKey(task)}</span>,
    },
    {
      key: 'task',
      header: 'Task',
      layout: 'fill',
      rowTarget: true,
      renderCell: (task) => (
        <TaskNameCell
          task={task}
          title={workTitle(task)}
          href={`#${myWorkTaskPath(task, 'list')}`}
        />
      ),
    },
    {
      key: 'project',
      header: 'Project',
      width: pixel(210),
      renderCell: (task) => {
        const project = projectFor(task.projectId)
        return project ? (
          <ProjectNameCell project={project} href={`#${projectPath(project.id)}`} />
        ) : (
          <span className="truncate">{task.team?.name}</span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(130),
      renderCell: (task) => <StatusToken task={task} onChange={(edit) => onChange(task, edit)} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: pixel(110),
      renderCell: (task) => <PriorityToken task={task} onChange={(edit) => onChange(task, edit)} />,
    },
    {
      key: 'due',
      header: 'Due',
      width: pixel(96),
      renderCell: (task) => (
        <DueToken label={workDueLabel(task)} onClick={() => notBuilt('The due date picker')} />
      ),
    },
  ]
}

/**
 * My work's List (`My work - List`, `40006266:4756`): every open task that
 * is yours — to do, or to review — across projects, grouped by when it is
 * due: Overdue, Today, This week, Later. A group with nothing in it is left
 * out. This week's note weighs its estimates against the hours free.
 *
 * Status and priority change from their tokens, and a task marked done
 * leaves the list for the Board's Done this week.
 */
export function WorkList({
  selectedTaskId,
  panelOpen = false,
}: {
  selectedTaskId?: string
  /**
   * A task's panel or Yak's takes 384 of the page, so Priority goes, as the
   * file's `My work - Yak plans the week` (`40006316:44219`) draws it.
   */
  panelOpen?: boolean
}) {
  const shell = useShell()
  const { tasks, updateTask } = useTasks()
  const work = useMemo(() => openWork(tasks), [tasks])
  const groups = useMemo<TableGroup[]>(
    () =>
      BUCKETS.flatMap(({ key, label }) => {
        const items = work.filter((task) => bucketOf(task) === key)
        if (!items.length) return []
        const note =
          key === 'week' ? `${hoursOf(items)}h of work against ${FREE_HOURS}h free` : undefined
        return [{ key, label, note }]
      }),
    [work],
  )
  const columns = useMemo(() => {
    const all = columnsFor((task, edit) => updateTask(task.id, edit), shell.notBuilt)
    return panelOpen ? all.filter((column) => column.key !== 'priority') : all
  }, [updateTask, shell.notBuilt, panelOpen])

  if (!work.length) {
    return (
      <NotBuiltMessage
        icon={CircleCheckBig}
        title="Nothing on your plate"
        body="Everything assigned to you is done. New work shows up here as it lands."
      />
    )
  }
  return (
    <div className="shrink-0">
      <Table
        label="My work"
        columns={columns}
        data={work}
        idKey="id"
        groupBy={(task) => bucketOf(task)}
        groups={groups}
        selectedKeys={selectedTaskId ? [selectedTaskId] : []}
      />
    </div>
  )
}
