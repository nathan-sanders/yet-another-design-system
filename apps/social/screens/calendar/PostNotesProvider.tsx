import { useCallback, useMemo, useState, type ReactNode } from 'react'

import type { PostComment } from '../../data/types'
import { PostNotesContext, type PostNotesState } from './postNotesState'

/** Holds the notes left on posts for every screen. See `postNotesState.ts`. */
export function PostNotesProvider({ children }: { children: ReactNode }) {
  const [added, setAdded] = useState<Record<string, PostComment[]>>({})

  const addNote = useCallback(
    (postId: string, note: PostComment) =>
      setAdded((all) => ({ ...all, [postId]: [...(all[postId] ?? []), note] })),
    [],
  )

  const value = useMemo<PostNotesState>(() => ({ added, addNote }), [added, addNote])

  return <PostNotesContext.Provider value={value}>{children}</PostNotesContext.Provider>
}
