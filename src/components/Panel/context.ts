import { createContext } from 'react'

/**
 * Set once on `Panel` and read by `Panel.Header` and `Panel.Close`: which
 * heading the title sits in, and how to close the panel from inside it.
 *
 * Deliberately not exported from the barrel.
 */
export interface PanelContextValue {
  headingLevel: 2 | 3 | 4 | 5 | 6
  close: () => void
}

export const PanelContext = createContext<PanelContextValue>({
  headingLevel: 2,
  close: () => {},
})
