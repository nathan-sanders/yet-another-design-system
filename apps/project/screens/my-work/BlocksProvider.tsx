import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { timeBlocks, type TimeBlock } from '../../data/myWork'
import { BlocksContext, type BlocksState } from './blocksState'

/**
 * My work's blocked time, held above the router like the tasks, so time
 * Yak blocks from its panel is on the calendar when you get there, and a
 * task dropped on the calendar leaves the List's tray count too.
 */
export function BlocksProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState(timeBlocks)
  const addBlocks = useCallback(
    (added: TimeBlock[]) => setBlocks((current) => [...current, ...added]),
    [],
  )
  const removeBlocks = useCallback(
    (ids: string[]) => setBlocks((current) => current.filter((block) => !ids.includes(block.id))),
    [],
  )
  const value = useMemo<BlocksState>(
    () => ({ blocks, addBlocks, removeBlocks }),
    [blocks, addBlocks, removeBlocks],
  )
  return <BlocksContext.Provider value={value}>{children}</BlocksContext.Provider>
}
