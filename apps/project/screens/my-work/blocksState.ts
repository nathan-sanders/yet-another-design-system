import { createContext, useContext } from 'react'

import type { TimeBlock } from '../../data/myWork'

export interface BlocksState {
  /** The time Nathan has blocked for his work this week. */
  blocks: TimeBlock[]
  /** Blocks time: a task dropped on the calendar, or Yak's plan for the week. */
  addBlocks: (blocks: TimeBlock[]) => void
  /** Takes blocks back off, by id: an Undo. */
  removeBlocks: (ids: string[]) => void
}

export const BlocksContext = createContext<BlocksState | null>(null)

export function useBlocks(): BlocksState {
  const state = useContext(BlocksContext)
  if (!state) throw new Error('useBlocks needs the BlocksProvider around it')
  return state
}
