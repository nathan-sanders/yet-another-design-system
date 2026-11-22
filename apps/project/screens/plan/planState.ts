import { createContext, useContext } from 'react'

import type { Project } from '../../data/types'
import type { StagedChange } from './roadmap/model'

/** Everything Plan can change, as it stood: what an Undo puts back. */
export interface PlanSnapshot {
  projects: Project[]
  staged: StagedChange[]
}

export interface PlanState {
  /**
   * Every project with the Roadmap's applied changes in it — Dallas's new
   * dates once you apply them. Plan's screens and All projects read these.
   */
  projects: Project[]
  /** The Roadmap's unsaved changes: only you see them until they are applied. */
  staged: StagedChange[]
  /** Adds a change to the unsaved set, replacing one of the same kind on the same project. */
  stage: (change: StagedChange) => void
  /** Drops every unsaved change. */
  discard: () => void
  /** Makes the unsaved changes real. */
  apply: () => void
  /** Everything as it is now, for an Undo to put back. */
  snapshot: () => PlanSnapshot
  restore: (snapshot: PlanSnapshot) => void
}

export const PlanContext = createContext<PlanState | null>(null)

export function usePlan(): PlanState {
  const state = useContext(PlanContext)
  if (!state) throw new Error('usePlan needs the PlanProvider around it')
  return state
}
