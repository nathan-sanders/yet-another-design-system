import { createContext, useContext } from 'react'

import type { Containers } from '../../../../src/components/DragAndDrop'
import type { Idea, IdeaGroup, PostComment } from '../../data/types'

/**
 * Plan › Ideas as the session has left it: the cards, the columns, and which
 * card sits where. Held above the routes (`IdeasProvider` in `main.tsx`), as
 * Measure's boards are, so a card moved on the board is still there after a
 * visit to the calendar.
 *
 * The groups are the user's. An idea leaves them when it is made into a post
 * (`detachIdea`, which the composer calls) and the board's derived columns —
 * Drafting, Scheduled, Published — take over from there (`lifecycle.ts`).
 */
export interface IdeasState {
  ideas: Record<string, Idea>
  groups: IdeaGroup[]
  /** Idea ids by group id, in board order. */
  board: Containers<string>
  setBoard: (update: (board: Containers<string>) => Containers<string>) => void
  /** Saves a new idea at the end of Unassigned and returns its id. */
  createIdea: (fields: Omit<Idea, 'id' | 'createdBy' | 'created'>) => string
  updateIdea: (id: string, patch: Partial<Omit<Idea, 'id'>>) => void
  /** Off the board, kept: `archived`, and out of every group. Returns the undo. */
  archiveIdea: (id: string) => () => void
  /** Out of every group, because it has gone on to a post. Returns the undo. */
  detachIdea: (id: string) => () => void
  /** Back onto the board, at the end of Unassigned. */
  attachIdea: (id: string) => void
  /** Adds an untitled group at the end of the board and returns its id. */
  addGroup: () => string
  /** Empties a group; its ideas are deleted with it, as the menu says. */
  clearGroup: (groupId: string) => void
  /** Removes a group, moving its ideas to Unassigned rather than losing them. */
  removeGroup: (groupId: string) => void
  /** The team's notes on each idea, in the order they were left. */
  notes: Record<string, PostComment[]>
  addIdeaNote: (ideaId: string, body: string) => void
}

export const IdeasContext = createContext<IdeasState | null>(null)

export function useIdeas(): IdeasState {
  const ideas = useContext(IdeasContext)
  if (!ideas) throw new Error('useIdeas needs the IdeasProvider around it')
  return ideas
}

/** The group a new idea lands in, and the one no menu can delete. */
export const UNASSIGNED = 'unassigned'
