import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import type { Containers } from '../../../../src/components/DragAndDrop'
import { initialBoard, initialGroups, initialIdeas, initialIdeaNotes } from '../../data/ideas'
import { me } from '../../data/people'
import type { Idea, PostComment } from '../../data/types'
import { IdeasContext, UNASSIGNED, type IdeasState } from './ideasState'

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** Takes an id out of every group, and remembers where it was. */
function without(board: Containers<string>, id: string) {
  let where: { group: string; index: number } | undefined
  const next: Containers<string> = {}
  for (const [group, ids] of Object.entries(board)) {
    const index = ids.indexOf(id)
    if (index >= 0) where = { group, index }
    next[group] = index >= 0 ? ids.filter((each) => each !== id) : ids
  }
  return { next, where }
}

/** Holds Plan › Ideas for the session. See `ideasState.ts`. */
export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [groups, setGroups] = useState(initialGroups)
  const [board, setBoardState] = useState(initialBoard)
  const [notes, setNotes] = useState<Record<string, PostComment[]>>(initialIdeaNotes)
  // Ids are minted here, not from Date.now(), so StrictMode's double render
  // of an updater cannot mint two.
  const next = useRef(0)
  // Read by the actions that return an undo, so each can remember the board
  // it changed without being rebuilt when it changes.
  const current = useRef(board)
  current.current = board

  const setBoard = useCallback(
    (update: (current: Containers<string>) => Containers<string>) => setBoardState(update),
    [],
  )

  const createIdea = useCallback((fields: Omit<Idea, 'id' | 'createdBy' | 'created'>) => {
    const id = `idea-new-${++next.current}`
    const idea: Idea = { ...fields, id, createdBy: me.id, created: shortDate.format(new Date()) }
    setIdeas((all) => ({ ...all, [id]: idea }))
    setBoardState((all) => ({ ...all, [UNASSIGNED]: [...(all[UNASSIGNED] ?? []), id] }))
    return id
  }, [])

  const updateIdea = useCallback((id: string, patch: Partial<Omit<Idea, 'id'>>) => {
    setIdeas((all) => (all[id] ? { ...all, [id]: { ...all[id]!, ...patch } } : all))
  }, [])

  const detachIdea = useCallback((id: string) => {
    const { next: after, where } = without(current.current, id)
    setBoardState(after)
    return () => {
      if (!where) return
      setBoardState((all) => {
        const ids = all[where.group] ?? []
        if (ids.includes(id)) return all
        return { ...all, [where.group]: [...ids.slice(0, where.index), id, ...ids.slice(where.index)] }
      })
    }
  }, [])

  const attachIdea = useCallback((id: string) => {
    setBoardState((all) =>
      Object.values(all).some((ids) => ids.includes(id))
        ? all
        : { ...all, [UNASSIGNED]: [...(all[UNASSIGNED] ?? []), id] },
    )
  }, [])

  const archiveIdea = useCallback(
    (id: string) => {
      const restore = detachIdea(id)
      setIdeas((all) => (all[id] ? { ...all, [id]: { ...all[id]!, archived: true } } : all))
      return () => {
        setIdeas((all) => (all[id] ? { ...all, [id]: { ...all[id]!, archived: false } } : all))
        restore()
      }
    },
    [detachIdea],
  )

  const addGroup = useCallback(() => {
    const id = `group-new-${++next.current}`
    setGroups((all) => [...all, { id, name: 'Untitled group' }])
    setBoardState((all) => ({ ...all, [id]: [] }))
    return id
  }, [])

  const clearGroup = useCallback(
    (groupId: string) => setBoardState((all) => ({ ...all, [groupId]: [] })),
    [],
  )

  const removeGroup = useCallback((groupId: string) => {
    if (groupId === UNASSIGNED) return
    setGroups((all) => all.filter((g) => g.id !== groupId))
    setBoardState((all) => {
      const { [groupId]: orphans = [], ...rest } = all
      return { ...rest, [UNASSIGNED]: [...(rest[UNASSIGNED] ?? []), ...orphans] }
    })
  }, [])

  const addIdeaNote = useCallback((ideaId: string, body: string) => {
    const note: PostComment = { id: `idea-note-${++next.current}`, authorId: me.id, body, ago: 'Just now' }
    setNotes((all) => ({ ...all, [ideaId]: [...(all[ideaId] ?? []), note] }))
  }, [])

  const value = useMemo<IdeasState>(
    () => ({
      ideas,
      groups,
      board,
      setBoard,
      createIdea,
      updateIdea,
      archiveIdea,
      detachIdea,
      attachIdea,
      addGroup,
      clearGroup,
      removeGroup,
      notes,
      addIdeaNote,
    }),
    [ideas, groups, board, setBoard, createIdea, updateIdea, archiveIdea, detachIdea, attachIdea, addGroup, clearGroup, removeGroup, notes, addIdeaNote],
  )

  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>
}
