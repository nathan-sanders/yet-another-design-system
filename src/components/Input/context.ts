import { createContext, useContext } from 'react'

import type { InputSize } from './styles'

/**
 * What an InputGroup tells the parts inside it.
 *
 * Only `size` travels down, and it travels rather than being a prop on each part
 * for the same reason it does in SegmentedControl: an addon cannot be a
 * different size from the field it sits in, so letting a caller say so would
 * only let the two disagree.
 *
 * Deliberately not exported from the package.
 */
export const InputGroupContext = createContext<{ size: InputSize }>({ size: 'default' })

export function useInputGroup(): { size: InputSize } {
  return useContext(InputGroupContext)
}
