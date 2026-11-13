import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Text } from '../../../../src/components/Text'
import { TaskCard } from '../../components/TaskCard'
import type { Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useTasks } from '../project/tasksState'
import {
  bucketOf,
  doneThisWeek,
  openWork,
  workDueLabel,
  workPersonId,
  workTag,
  workTitle,
} from './model'
import { myWorkTaskPath } from './paths'

/**
 * My work's Board (`My work - Board`, `40006315:45894`): Today, This week,
 * Later and Done this week, each a Subtle `ContentBlock` of task cards, the
 * project's Board's columns with when in place of status. Overdue work
 * leads Today, as the frame puts the landlord call there. A card's tag is
 * its project, and its date a weekday while it is this week's.
 *
 * Cards open their task's panel. They do not drag: a column here is a span
 * of dates, and a drop would have to pick a due date the frame does not
 * show (FINDINGS 60). Each column's add button is drawn and not built.
 */
export function WorkBoard({ selectedTaskId }: { selectedTaskId?: string }) {
  const navigate = useNavigate()
  const shell = useShell()
  const { tasks } = useTasks()
  const columns = useMemo(() => {
    const work = openWork(tasks)
    const of = (...buckets: ReturnType<typeof bucketOf>[]) =>
      work.filter((task) => buckets.includes(bucketOf(task)))
    return [
      { id: 'today', label: 'Today', tasks: of('overdue', 'today') },
      { id: 'week', label: 'This week', tasks: of('week') },
      { id: 'later', label: 'Later', tasks: of('later') },
      { id: 'done', label: 'Done this week', tasks: doneThisWeek(tasks) },
    ]
  }, [tasks])

  return (
    // The board is the scroller sideways, as the project's is; past 256 a
    // column the page keeps its width and the board scrolls.
    <div className="-mx-4 flex min-h-64 flex-1 items-start overflow-x-auto px-4 pb-1">
      <div className="flex min-h-full w-full shrink-0 gap-3 self-stretch">
        {columns.map((column) => (
          <ContentBlock
            key={column.id}
            emphasis="subtle"
            headingLevel={2}
            className="h-auto min-w-64 flex-1 basis-0"
          >
            <ContentBlock.Header
              actions={
                <Button
                  appearance="ghost"
                  startIcon={Plus}
                  aria-label={`Add a task to ${column.label}`}
                  onClick={() => shell.notBuilt('Adding a task from My work')}
                />
              }
            >
              {column.label}
            </ContentBlock.Header>
            <ContentBlock.Content className="flex-1 gap-2 px-2 pb-4">
              {column.tasks.length ? (
                <ul aria-label={column.label} className="flex flex-col gap-2">
                  {column.tasks.map((task) => (
                    <li key={task.id}>
                      <WorkCard
                        task={task}
                        selected={task.id === selectedTaskId}
                        onClick={() => navigate(myWorkTaskPath(task, 'board'))}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <Text size="sm" color="subtle" className="px-2">
                  Nothing here
                </Text>
              )}
            </ContentBlock.Content>
          </ContentBlock>
        ))}
      </div>
    </div>
  )
}

/** A task card as My work words it: what you owe, the project, your face, a weekday. */
export function WorkCard({
  task,
  selected,
  onClick,
  className,
}: {
  task: Task
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <TaskCard
      task={task}
      selected={selected}
      onClick={onClick}
      className={className}
      title={workTitle(task)}
      tag={workTag(task)}
      personId={workPersonId(task)}
      due={workDueLabel(task)}
    />
  )
}
