import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { projects as initialProjects } from '../../data/projects'
import { PlanContext, type PlanSnapshot, type PlanState } from './planState'
import { applyChanges, DRAWN_CHANGES, type StagedChange } from './roadmap/model'

/**
 * Plan's state, held above the router so the Roadmap's draft survives a
 * trip to Workload and back. It opens with the three changes the file draws
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

  const value = useMemo<PlanState>(
    () => ({ projects, staged, stage, discard, apply, snapshot, restore }),
    [projects, staged, stage, discard, apply, snapshot, restore],
  )
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
