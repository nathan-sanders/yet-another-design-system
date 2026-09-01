import { createContext } from 'react'

import type { NavItemSize } from './styles'

/**
 * What a bar tells the items inside it.
 *
 * Set once on `SideNav` / `TopNav` and read by every `NavItem`, the way Tabs
 * carries its `size` and Accordion its `headingLevel`: an item cannot be in a
 * different collapse state from the rail it sits in, and there is no sensible
 * reading of a rail where one row kept its label.
 *
 * Deliberately not exported from the barrel. Its defaults are the standalone
 * case — a `NavItem` used outside a bar is expanded, default size, unindented.
 */
export interface NavContextValue {
  /** The rail is collapsed: items hide their labels and grow a tooltip. */
  collapsed: boolean
  /** The size items default to. `SideNav.Utilities` lowers it to `small`. */
  size: NavItemSize
  /** Items are children of an open group, so they carry the 16px indent. */
  indent: boolean
}

export const NavContext = createContext<NavContextValue>({
  collapsed: false,
  size: 'default',
  indent: false,
})
