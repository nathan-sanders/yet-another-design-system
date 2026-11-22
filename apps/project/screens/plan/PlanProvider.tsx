import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  checkIns as initialCheckIns,
  goals as initialGoals,
  type CheckIn,
  type Goal,
  type GoalHealth,
} from '../../data/goals'
import { me } from '../../data/people'
import { projects as initialProjects } from '../../data/projects'
import { today } from '../../data/dates'
import { PlanContext, type PlanSnapshot, type PlanState } from './planState'
import { applyChanges, DRAWN_CHANGES, type StagedChange } from './roadmap/model'

/**
 * A date as the file writes its own, so a check-in posted now sits in the
 * same list as the drawn ones. `day()` would move it by the app's shift, so
 * a fresh one carries `fresh` and is read as today.
 */
function isoOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Plan's state, held above the router so the Roadmap's draft survives a
 * trip to Workload and back, and a goal's check-in is still there when you
 * come back to it. It opens with the three changes the file draws
 * staged (`Plan - Roadmap / Unsaved changes`), as if you had left them there.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState(initialProjects)
  const [staged, setStaged] = useState<StagedChange[]>(DRAWN_CHANGES)

  // Read through a ref so `apply` and `snapshot` keep one identity.
  const current = useRef({ projects, staged })
  current.current = { projects, staged }

  const stage = useCallback((change: StagedChange) => {
    setStaged((list) => [
      ...list.filter((c) => !(c.projectId === change.projectId && c.kind === change.kind)),
      change,
    ])
  }, [])
  const discard = useCallback(() => setStaged([]), [])
  const apply = useCallback(() => {
    setProjects(applyChanges(current.current.projects, current.current.staged))
    setStaged([])
  }, [])
  const snapshot = useCallback((): PlanSnapshot => ({ ...current.current }), [])
  const restore = useCallback((snap: PlanSnapshot) => {
    setProjects(snap.projects)
    setStaged(snap.staged)
  }, [])

  const [goals, setGoals] = useState(initialGoals)
  const addGoal = useCallback((goal: Goal) => setGoals((list) => [...list, goal]), [])
  const [checkIns, setCheckIns] = useState(initialCheckIns)
  const [said, setSaid] = useState<Record<string, GoalHealth>>({})
  const checkIn = useCallback((goalId: string, text: string, health: GoalHealth) => {
    const entry: CheckIn = {
      id: `ci-new-${Date.now()}`,
      goalId,
      authorId: me.id,
      // The mock's today, written back the way the file writes its dates.
      posted: isoOf(today),
      text,
      health,
      fresh: true,
    }
    let before: GoalHealth | undefined
    setSaid((current) => {
      before = current[goalId]
      return { ...current, [goalId]: health }
    })
    setCheckIns((list) => [entry, ...list])
    return () => {
      setCheckIns((list) => list.filter((c) => c.id !== entry.id))
      setSaid((current) => {
        const next = { ...current }
        if (before) next[goalId] = before
        else delete next[goalId]
        return next
      })
    }
  }, [])
  const [nudged, setNudged] = useState<string[]>([])
  const nudge = useCallback(
    (projectId: string) =>
      setNudged((list) => (list.includes(projectId) ? list : [...list, projectId])),
    [],
  )

  const value = useMemo<PlanState>(
    () => ({
      projects,
      staged,
      stage,
      discard,
      apply,
      snapshot,
      restore,
      goals,
      addGoal,
      checkIns,
      said,
      checkIn,
      nudged,
      nudge,
    }),
    [
      projects,
      staged,
      stage,
      discard,
      apply,
      snapshot,
      restore,
      goals,
      addGoal,
      checkIns,
      said,
      checkIn,
      nudged,
      nudge,
    ],
  )
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
