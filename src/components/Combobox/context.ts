import { createContext, useContext } from 'react'

import type { ComboboxIndicator, ComboboxSize } from './Combobox'

/**
 * What a `Combobox` tells the rows inside it.
 *
 * Three things travel down, and none of them is a prop on `Combobox.Item`, for
 * the reason `Select`'s context gives: a row cannot sensibly be a different size
 * from the combobox it sits in, nor disagree with it about whether one value or
 * several can be chosen, nor about which mark a chosen row wears.
 *
 * Together they are Figma's `Type` property on the Combobox Menu Item set —
 * Single Select, Multi Select and Radio — reassembled from the two properties
 * that actually decide it.
 *
 * Deliberately not exported from the package.
 */
export const ComboboxContext = createContext<{
  multiple: boolean
  size: ComboboxSize
  indicator: ComboboxIndicator
}>({
  multiple: false,
  size: 'default',
  indicator: 'check',
})

export function useCombobox(): {
  multiple: boolean
  size: ComboboxSize
  indicator: ComboboxIndicator
} {
  return useContext(ComboboxContext)
}
