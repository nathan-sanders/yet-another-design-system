import { createContext, useContext } from 'react'

import type { Task } from '../../data/types'

/** The fields a task's tokens can change in place. */
export type TaskEdit = Partial<Pick<Task, 'status' | 'priority' | 'assigneeId'>>

export interface TasksState {
  tasks: Task[]
  /** Changes a field, and writes the change into the task's Activity as yours. */
  updateTask: (id: string, edit: TaskEdit) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addComment: (taskId: string, body: string) => void
}

export const TasksContext = createContext<TasksState | null>(null)

export function useTasks(): TasksState {
  const state = useContext(TasksContext)
  if (!state) throw new Error('useTasks needs the TasksProvider around it')
  return state
}
