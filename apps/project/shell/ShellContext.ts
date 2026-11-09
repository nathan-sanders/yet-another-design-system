import { createContext, useContext } from 'react'

export interface ShellState {
  /** Toast for what the mock does not do yet — Yak, the due-date picker, a task's full view. */
  notBuilt: (what: string) => void
  /**
   * Where a screen's own `Panel` portals to: a `contents` box after the
   * Page, so the panel is still a child of the shell's row (Yet Social's
   * `screenPanelHost`). A task's panel belongs to its project page and
   * closes when you leave it.
   */
  screenPanelHost: HTMLElement | null
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell(): ShellState {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell needs the ProjectShell around it')
  return shell
}
