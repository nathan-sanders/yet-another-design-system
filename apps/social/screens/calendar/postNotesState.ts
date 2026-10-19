import { createContext, useContext } from 'react'

import type { PostComment } from '../../data/types'

/**
 * The notes left on posts during a session, per post id. Held above the routes
 * (`PostNotesProvider` in `main.tsx`) because two screens show the same post
 * detail — the calendar's panel and Engage › Comments by post — and a note
 * left in one should be there in the other.
 */
export interface PostNotesState {
  added: Record<string, PostComment[]>
  addNote: (postId: string, note: PostComment) => void
}

export const PostNotesContext = createContext<PostNotesState | null>(null)

export function usePostNotes(): PostNotesState {
  const notes = useContext(PostNotesContext)
  if (!notes) throw new Error('usePostNotes needs the PostNotesProvider around it')
  return notes
}
