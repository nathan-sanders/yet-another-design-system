import { createContext, useContext } from 'react'

import type { SprintMoves } from './sprint'

export interface SprintsState {
  /** Sprints finished here, by project: `{ 'mobile-ordering': [14] }`. */
  completed: Record<string, number[]>
  /** Tasks moved to another sprint, or to the backlog, when a sprint was completed. */
  moves: SprintMoves
  /**
   * Finishes a sprint: its open tasks go to the next one, or to the backlog
   * when `to` is null.
   */
  completeSprint: (projectId: string, number: number, openIds: string[], to: number | null) => void
  /** Puts the sprints back as they were: an Undo. */
  restore: (snapshot: { completed: Record<string, number[]>; moves: SprintMoves }) => void
}

export const SprintsContext = createContext<SprintsState | null>(null)

export function useSprints(): SprintsState {
  const state = useContext(SprintsContext)
  if (!state) throw new Error('useSprints needs the SprintsProvider around it')
  return state
}
