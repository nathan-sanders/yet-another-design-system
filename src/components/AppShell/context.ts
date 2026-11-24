import { createContext } from 'react'

import type { AppShellMode, AppShellNavigation } from './styles'

/**
 * What the shell tells the things inside it.
 *
 * Set once on `AppShell` and read by `AppShell.Page`, `AppShell.Content`, and
 * — from one folder over — `SideNav` and `TopNav`, which take their `floating`
 * default from it. A nav cannot know what it is sitting in; this is the
 * ancestor telling it, so the caller states the fact once (the shell's `mode`)
 * rather than twice (`mode` *and* `floating`), which is how a shell ends up with
 * a shadow under a rail that is meant to be flush.
 * `MobileNav` derives its trigger from the selected row on the same reasoning.
 *
 * `null` outside a shell, where every reader falls back to a default of its own:
 * flush for a rail, a top bar and a panel, lifted for a phone bar, which pins
 * itself over the page.
 *
 * Deliberately not exported from the barrel.
 */
export interface AppShellContextValue {
  mode: AppShellMode
  /** The 8px frame is on. Off, a nav sits flush with the window edge and casts nothing. */
  frame: boolean
  /**
   * Row or column. `Panel` reads it: in a `top` shell there is no "beside the
   * page", so the panel takes the phone's arrangement at every width — under
   * the page, full width, sized by height.
   */
  navigation: AppShellNavigation
}

export const AppShellContext = createContext<AppShellContextValue | null>(null)
