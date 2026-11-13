import { createContext, useContext } from 'react'

import type { Task, TaskStatus } from '../../data/types'

/** The fields a task's tokens can change in place. */
export type TaskEdit = Partial<Pick<Task, 'status' | 'priority' | 'assigneeId'>>

/** A card dropped on the Board: where it went, and what its status became. */
export interface TaskMove {
  /** The new status, or none when it stayed in its own column. */
  status?: TaskStatus
  /** Every task id in the Board's order, the moved one in its new place. */
  order: string[]
  /**
   * Moved past a dependency that is not done: the person who owns that
   * dependency is told, and the task's Activity says so.
   */
  headsUp?: { personId: string; blocker: string }
}

export interface TasksState {
  tasks: Task[]
  /** Task ids top to bottom, as the Board stacks them in each column. */
  order: string[]
  /** Changes a field, and writes the change into the task's Activity as yours. */
  updateTask: (id: string, edit: TaskEdit) => void
  /** Settles a card dragged on the Board: its order, its status and their Activity. */
  moveTask: (id: string, move: TaskMove) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addComment: (taskId: string, body: string) => void
  /**
   * Widens or narrows the lag a task keeps behind one of its dependencies,
   * which moves its start, and its due date with it, by the difference. Yak's proposals do it, so its Activity
   * says Yak did, with your OK.
   */
  setLag: (taskId: string, onTaskId: string, lagDays: number) => void
}

export const TasksContext = createContext<TasksState | null>(null)

export function useTasks(): TasksState {
  const state = useContext(TasksContext)
  if (!state) throw new Error('useTasks needs the TasksProvider around it')
  return state
}
