import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { priorityFor, statusFor } from '../../components/taskMeta'
import { addDays, day, shiftIso, shortDate, today } from '../../data/dates'
import { me, personFor } from '../../data/people'
import { boardOrder, tasks as initialTasks } from '../../data/tasks'
import type { Task, TaskEvent } from '../../data/types'
import { TasksContext, type TaskEdit, type TaskMove, type TasksState } from './tasksState'

/** The Board's drawn order, then every task the frame does not show, in the data's order. */
const initialOrder = [
  ...boardOrder,
  ...initialTasks.map((task) => task.id).filter((id) => !boardOrder.includes(id)),
]

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
  const [order, setOrder] = useState(initialOrder)
  const moveTask = useCallback(
    (id: string, { status, order: next, headsUp }: TaskMove) => {
      setOrder(next)
      if (!status && !headsUp) return
      change(id, (task) => {
        const events = status ? eventsFor(task, { status }) : []
        if (headsUp) {
          events.unshift({
            id: newId('e'),
            actor: me.id,
            text: `You moved this before ${headsUp.blocker} was done, and ${personFor(headsUp.personId).name} got a heads-up`,
            at: today,
          })
        }
        return {
          ...task,
          status: status ?? task.status,
          activity: [...events, ...(task.activity ?? [])],
        }
      })
    },
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

  const setLag = useCallback(
    (taskId: string, onTaskId: string, lagDays: number) =>
      setTasks((current) => {
        const before = current.find((task) => task.id === onTaskId)
        if (!before) return current
        // When it can start: the dependency's due date plus the lag.
        const startOn = (lag: number) => shortDate.format(addDays(day(before.due), lag))
        return current.map((task) => {
          if (task.id !== taskId) return task
          const dep = task.dependsOn?.find((d) => d.taskId === onTaskId)
          if (!dep) return task
          const event: TaskEvent = {
            id: newId('e'),
            actor: 'yak',
            text: 'Yak moved the start, with your OK',
            at: today,
            change: { from: startOn(dep.lagDays ?? 0), to: startOn(lagDays) },
          }
          // The whole task moves with its start, so it keeps its length.
          const delta = lagDays - (dep.lagDays ?? 0)
          return {
            ...task,
            start: task.start ? shiftIso(task.start, delta) : task.start,
            due: shiftIso(task.due, delta),
            dependsOn: task.dependsOn?.map((d) => (d.taskId === onTaskId ? { ...d, lagDays } : d)),
            activity: [event, ...(task.activity ?? [])],
          }
        })
      }),
    [],
  )

  const value = useMemo<TasksState>(
    () => ({ tasks, order, updateTask, moveTask, toggleSubtask, addComment, setLag }),
    [tasks, order, updateTask, moveTask, toggleSubtask, addComment, setLag],
  )
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
