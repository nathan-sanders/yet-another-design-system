import { createContext, useContext } from 'react'

import type { SelectSize } from './Select'

/**
 * What a `Select` tells the items inside it.
 *
 * Two things travel down, and neither is a prop on `Select.Item` for the same
 * reason `size` is not a prop on an InputGroup addon: an item cannot be a
 * different size from the select it sits in, and it cannot disagree with it
 * about whether the select takes one value or several. Letting a caller say so
 * would only let the two contradict each other.
 *
 * `multiple` is what swaps the item's anatomy — a trailing check for a single
 * select, a leading checkbox for a multi one, which is Figma's `Type` property
 * on the Select Menu Item set.
 *
 * Deliberately not exported from the package.
 */
export const SelectContext = createContext<{ multiple: boolean; size: SelectSize }>({
  multiple: false,
  size: 'default',
})

export function useSelect(): { multiple: boolean; size: SelectSize } {
  return useContext(SelectContext)
}
