import { useParams } from 'react-router'

import type { Task } from '../../data/types'
import { taskKey } from '../project/paths'
import { useTasks } from '../project/tasksState'

/** The task a `:taskKey` names, MOB-52, among every task. */
export function useTaskFromKey(): Task | undefined {
  const { taskKey: key } = useParams()
  const { tasks } = useTasks()
  return tasks.find((task) => taskKey(task) === key)
}
