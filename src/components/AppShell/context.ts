import { createContext } from 'react'

import type { AppShellMode } from './styles'

/**
 * What the shell tells the things inside it.
 *
 * Set once on `AppShell` and read by `AppShell.Page`, `AppShell.Content`, and
 * — from one folder over — `SideNav` and `TopNav`, which take their `floating`
 * default from it. A nav cannot know what it is sitting in; this is the
 * ancestor telling it, so the caller states the fact once (`mode="contained"`)
 * rather than twice (`mode="contained"` *and* `floating={false}`), which is
 * how a shell ends up with a shadow under a rail that is meant to be flush.
 * `MobileNav` derives its trigger from the selected row on the same reasoning.
 *
 * `null` outside a shell, and every reader falls back to today's defaults, so
 * a bar used on its own is unchanged.
 *
 * Deliberately not exported from the barrel.
 */
export interface AppShellContextValue {
  mode: AppShellMode
  /** The 8px frame is on. Off, a nav sits flush with the window edge and casts nothing. */
  frame: boolean
}

export const AppShellContext = createContext<AppShellContextValue | null>(null)
