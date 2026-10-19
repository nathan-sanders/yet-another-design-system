import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import type { Containers } from '../../../../src/components/DragAndDrop'
import { initialBoard, initialGroups, initialIdeas } from '../../data/ideas'
import type { Idea } from '../../data/types'
import { IdeasContext, UNASSIGNED, type IdeasState } from './ideasState'

/** Holds Plan › Ideas for the session. See `ideasState.ts`. */
export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [groups, setGroups] = useState(initialGroups)
  const [board, setBoardState] = useState(initialBoard)
  // Ids are minted here, not from Date.now(), so StrictMode's double render
  // of an updater cannot mint two.
  const next = useRef(0)

  const setBoard = useCallback(
    (update: (current: Containers<string>) => Containers<string>) => setBoardState(update),
    [],
  )

  const addIdea = useCallback((groupId: string) => {
    const id = `idea-new-${++next.current}`
    const idea: Idea = { id, title: 'Untitled idea', body: 'Write down the idea before it goes.' }
    setIdeas((all) => ({ ...all, [id]: idea }))
    setBoardState((current) => ({ ...current, [groupId]: [...(current[groupId] ?? []), id] }))
    return id
  }, [])

  const addGroup = useCallback(() => {
    const id = `group-new-${++next.current}`
    setGroups((all) => [...all, { id, name: 'Untitled group' }])
    setBoardState((current) => ({ ...current, [id]: [] }))
    return id
  }, [])

  const clearGroup = useCallback(
    (groupId: string) => setBoardState((current) => ({ ...current, [groupId]: [] })),
    [],
  )

  const removeGroup = useCallback((groupId: string) => {
    if (groupId === UNASSIGNED) return
    setGroups((all) => all.filter((g) => g.id !== groupId))
    setBoardState((current) => {
      const { [groupId]: orphans = [], ...rest } = current
      return { ...rest, [UNASSIGNED]: [...(rest[UNASSIGNED] ?? []), ...orphans] }
    })
  }, [])

  const value = useMemo<IdeasState>(
    () => ({ ideas, groups, board, setBoard, addIdea, addGroup, clearGroup, removeGroup }),
    [ideas, groups, board, setBoard, addIdea, addGroup, clearGroup, removeGroup],
  )

  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>
}
