import { useMemo } from 'react'
import {
  ArrowUpDown,
  ChevronDown,
  FolderOpen,
  List,
  ListFilter,
  ListTree,
  Rows3,
} from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { pixel, Table, type TableColumn, type TableGroup } from '../../../../src/components/Table'
import { AssigneeToken, DueToken, PriorityToken, StatusToken } from '../../components/TaskTokens'
import { day, shortDate } from '../../data/dates'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { useTasks, type TaskEdit } from './tasksState'

/**
 * `_Task Name Cell` (`40006261:1498`): the task's name, and its subtasks done
 * of total behind a `list-tree` glyph when it has any. Tables with a Status
 * column hide the cell's status icon (`Show Status Icon` off), so it has none.
 */
function TaskNameCell({ task }: { task: Task }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1 truncate">{task.title}</span>
      {task.subtasks ? (
        <span className="flex shrink-0 items-center gap-1 text-sm text-content-subtle">
          <Icon icon={ListTree} size="small" />
          <span className="sr-only">Subtasks: </span>
          {task.subtasks.done}/{task.subtasks.total}
        </span>
      ) : null}
    </span>
  )
}

function columnsFor(
  project: Project,
  onChange: (task: Task, edit: TaskEdit) => void,
  notBuilt: (what: string) => void,
): TableColumn<Task>[] {
  return [
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
      renderCell: (task) => <TaskNameCell task={task} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: pixel(170),
      renderCell: (task) => <AssigneeToken task={task} onChange={(edit) => onChange(task, edit)} />,
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
        <DueToken
          label={shortDate.format(day(task.due))}
          onClick={() => notBuilt('The due date picker')}
        />
      ),
    },
  ]
}

/** One group a phase, in the order the phases first appear, with how many are done. */
function byPhase(list: Task[]): TableGroup[] {
  const phases = [...new Set(list.map((task) => task.phase))]
  return phases.map((phase) => {
    const items = list.filter((task) => task.phase === phase)
    const done = items.filter((task) => task.status === 'done').length
    return { key: phase, label: phase, note: `${done} of ${items.length} done` }
  })
}

/**
 * A project's List tab (`Project - List`, `40006268:6554`): the toolbar, then
 * every task grouped by phase. Assignee, status and priority change from
 * their tokens; the toolbar's views, filter, grouping and sort are drawn
 * (`Project - List / Filtered, unsaved view`, `40006277:12040`) and not built.
 */
export function ListView({ project }: { project: Project }) {
  const shell = useShell()
  const { tasks, updateTask } = useTasks()
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === project.id),
    [tasks, project.id],
  )
  const columns = useMemo(
    () => columnsFor(project, (task, edit) => updateTask(task.id, edit), shell.notBuilt),
    [project, updateTask, shell.notBuilt],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        <Button
          appearance="ghost"
          startIcon={List}
          endIcon={ChevronDown}
          onClick={() => shell.notBuilt('Saved views')}
        >
          All tasks
        </Button>
        <Button
          appearance="ghost"
          startIcon={ListFilter}
          onClick={() => shell.notBuilt('Filtering')}
        >
          Filter
        </Button>
        <Button appearance="ghost" startIcon={Rows3} onClick={() => shell.notBuilt('Grouping')}>
          Group: Phase
        </Button>
        <Button
          appearance="ghost"
          startIcon={ArrowUpDown}
          onClick={() => shell.notBuilt('Sorting')}
        >
          Sort
        </Button>
      </div>
      {projectTasks.length > 0 ? (
        <div className="shrink-0">
          <Table
            label={`${project.name} tasks`}
            columns={columns}
            data={projectTasks}
            idKey="id"
            groupBy={(task) => task.phase}
            groups={byPhase(projectTasks)}
          />
        </div>
      ) : (
        <NotBuiltMessage
          icon={FolderOpen}
          title="No tasks in this mock yet"
          body={`Only Austin store opening has tasks so far; ${project.name}’s come in a later slice.`}
          link={{ href: '#/projects/austin/list', label: 'Open Austin store opening' }}
        />
      )}
    </div>
  )
}
