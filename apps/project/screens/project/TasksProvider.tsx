import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { tasks as initialTasks } from '../../data/tasks'
import { TasksContext, type TaskEdit, type TasksState } from './tasksState'

/**
 * Every task, held above the router, so an edit made in one view is still
 * there in the next — the List's status token today, the Board's columns
 * when it is built.
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(initialTasks)
  const updateTask = useCallback((id: string, edit: TaskEdit) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...edit } : task)))
  }, [])
  const value = useMemo<TasksState>(() => ({ tasks, updateTask }), [tasks, updateTask])
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
