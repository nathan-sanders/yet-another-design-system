import { useCallback, useMemo, useState, type ReactNode } from 'react'

import type { SprintMoves } from './sprint'
import { SprintsContext, type SprintsState } from './sprintsState'

/**
 * Which sprints are finished and where their open work went, held above the
 * router with the tasks, so completing Sprint 14 on the Sprints tab holds
 * when you come back to it.
 */
export function SprintsProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<Record<string, number[]>>({})
  const [moves, setMoves] = useState<SprintMoves>({})

  const completeSprint = useCallback<SprintsState['completeSprint']>(
    (projectId, number, openIds, to) => {
      setCompleted((all) => ({ ...all, [projectId]: [...(all[projectId] ?? []), number] }))
      setMoves((all) => ({ ...all, ...Object.fromEntries(openIds.map((id) => [id, to])) }))
    },
    [],
  )

  const restore = useCallback<SprintsState['restore']>((snapshot) => {
    setCompleted(snapshot.completed)
    setMoves(snapshot.moves)
  }, [])

  const value = useMemo(
    () => ({ completed, moves, completeSprint, restore }),
    [completed, moves, completeSprint, restore],
  )
  return <SprintsContext.Provider value={value}>{children}</SprintsContext.Provider>
}
