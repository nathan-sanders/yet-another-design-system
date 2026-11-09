import { createContext, useContext } from 'react'

export interface ShellState {
  /** Toast for what the mock does not do yet — a task's panel, Yak, the due-date picker. */
  notBuilt: (what: string) => void
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell(): ShellState {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell needs the ProjectShell around it')
  return shell
}
