import { createContext, useContext } from 'react'

import type { Containers } from '../../../../src/components/DragAndDrop'
import type { Idea, IdeaGroup } from '../../data/types'

/**
 * Plan › Ideas as the session has left it: the cards, the columns, and which
 * card sits where. Held above the routes (`IdeasProvider` in `main.tsx`), as
 * Measure's boards are, so a card moved on the board is still there after a
 * visit to the calendar.
 */
export interface IdeasState {
  ideas: Record<string, Idea>
  groups: IdeaGroup[]
  /** Idea ids by group id, in board order. */
  board: Containers<string>
  setBoard: (update: (board: Containers<string>) => Containers<string>) => void
  /** Adds an untitled idea to the end of a group and returns its id. */
  addIdea: (groupId: string) => string
  /** Adds an untitled group at the end of the board and returns its id. */
  addGroup: () => string
  /** Empties a group; its ideas are deleted with it, as the menu says. */
  clearGroup: (groupId: string) => void
  /** Removes a group, moving its ideas to Unassigned rather than losing them. */
  removeGroup: (groupId: string) => void
}

export const IdeasContext = createContext<IdeasState | null>(null)

export function useIdeas(): IdeasState {
  const ideas = useContext(IdeasContext)
  if (!ideas) throw new Error('useIdeas needs the IdeasProvider around it')
  return ideas
}

/** The group a new idea from the top bar lands in, and the one no menu can delete. */
export const UNASSIGNED = 'unassigned'
