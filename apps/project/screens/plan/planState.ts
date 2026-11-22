import { createContext, useContext } from 'react'

import type { CheckIn, Goal, GoalHealth } from '../../data/goals'
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

  /** Every goal, the file's and any made with New goal. */
  goals: Goal[]
  addGoal: (goal: Goal) => void
  /** Every check-in, newest first. */
  checkIns: CheckIn[]
  /**
   * What each goal's owner said its health was at their last check-in; it
   * wins over what the goal's subgoals or project would make it.
   */
  said: Record<string, GoalHealth>
  /** Posts a check-in as you, and sets the goal's health to what it says. Returns an Undo. */
  checkIn: (goalId: string, text: string, health: GoalHealth) => () => void
  /** Projects whose owner has been nudged for an update this session. */
  nudged: string[]
  nudge: (projectId: string) => void
}

export const PlanContext = createContext<PlanState | null>(null)

export function usePlan(): PlanState {
  const state = useContext(PlanContext)
  if (!state) throw new Error('usePlan needs the PlanProvider around it')
  return state
}
