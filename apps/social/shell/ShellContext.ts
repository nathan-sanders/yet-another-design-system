import { createContext, useContext } from 'react'

/**
 * What is open in the shell's right-hand `Panel`. One at a time: the Figma
 * screens never show two side panels, and a second would be stacked *inside*
 * the first (Yak's history is), not beside it.
 */
export type ShellPanel =
  { type: 'yak'; history?: boolean } | { type: 'post'; postId: string } | null

export interface ShellState {
  panel: ShellPanel
  setPanel: (panel: ShellPanel) => void
  /** Toast for things the mock does not do yet — search, the composer. */
  notBuilt: (what: string) => void
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell(): ShellState {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell needs the SocialShell around it')
  return shell
}
