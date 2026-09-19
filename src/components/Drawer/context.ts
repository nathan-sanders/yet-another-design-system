import { createContext } from 'react'

import type { DrawerSide } from './styles'

/**
 * What the root tells the popup: which edge the drawer is on *after* the
 * phone rule has been applied, and whether it is modal. The root owns
 * `swipeDirection` and the popup owns the classes, and they must not
 * disagree — so the side is decided once, here, and read below.
 *
 * Deliberately not exported from the barrel.
 */
export interface DrawerContextValue {
  side: DrawerSide
  modal: boolean
}

export const DrawerContext = createContext<DrawerContextValue>({ side: 'right', modal: true })
