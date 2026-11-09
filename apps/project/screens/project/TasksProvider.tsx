import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { priorityFor, statusFor } from '../../components/taskMeta'
import { today } from '../../data/dates'
import { me, personFor } from '../../data/people'
import { tasks as initialTasks } from '../../data/tasks'
import type { Task, TaskEvent } from '../../data/types'
import { TasksContext, type TaskEdit, type TasksState } from './tasksState'

let nextId = 0
const newId = (prefix: string) => `${prefix}-new-${++nextId}`

/**
 * What an edit says in the Activity tab, before and after, as the file words
 * it. Dated the mock's today — this week's Thursday, which is when the file's
 * world is — so it lands under Today rather than on the real calendar.
 */
function eventsFor(task: Task, edit: TaskEdit): TaskEvent[] {
  const at = today
  const events: TaskEvent[] = []
  if (edit.status && edit.status !== task.status) {
    events.push({
      id: newId('e'),
      actor: me.id,
      text: 'You changed the status',
      at,
      change: { from: statusFor(task.status).label, to: statusFor(edit.status).label },
    })
  }
  if (edit.priority && edit.priority !== task.priority) {
    events.push({
      id: newId('e'),
      actor: me.id,
      text: 'You changed the priority',
      at,
      change: { from: priorityFor(task.priority).label, to: priorityFor(edit.priority).label },
    })
  }
  if (edit.assigneeId && edit.assigneeId !== task.assigneeId) {
    events.push({
      id: newId('e'),
      actor: me.id,
      text: `You assigned this to ${personFor(edit.assigneeId).name}`,
      at,
    })
  }
  return events.reverse()
}

/**
 * Every task, held above the router, so an edit made in one view is still
 * there in the next — a status changed in the List shows in the task panel,
 * a subtask ticked in the panel moves the List's count.
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(initialTasks)
  const change = useCallback((id: string, update: (task: Task) => Task) => {
    setTasks((current) => current.map((task) => (task.id === id ? update(task) : task)))
  }, [])

  const updateTask = useCallback(
    (id: string, edit: TaskEdit) =>
      change(id, (task) => ({
        ...task,
        ...edit,
        activity: [...eventsFor(task, edit), ...(task.activity ?? [])],
      })),
    [change],
  )
  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) =>
      change(taskId, (task) => ({
        ...task,
        subtasks: task.subtasks?.map((sub) =>
          sub.id === subtaskId ? { ...sub, done: !sub.done } : sub,
        ),
      })),
    [change],
  )
  const addComment = useCallback(
    (taskId: string, body: string) =>
      change(taskId, (task) => ({
        ...task,
        comments: [
          ...(task.comments ?? []),
          { id: newId('c'), authorId: me.id, age: 'Just now', body },
        ],
      })),
    [change],
  )

  const value = useMemo<TasksState>(
    () => ({ tasks, updateTask, toggleSubtask, addComment }),
    [tasks, updateTask, toggleSubtask, addComment],
  )
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
