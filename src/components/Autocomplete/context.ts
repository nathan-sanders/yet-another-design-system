import { createContext, useContext } from 'react'

import type { AutocompleteSize } from './Autocomplete'

/**
 * What an `Autocomplete` tells the rows inside it.
 *
 * One thing travels down, and it is not a prop on `Autocomplete.Item`, for the
 * reason `Combobox`'s and `Select`'s contexts give: a row cannot sensibly be a
 * different size from the control it sits in.
 *
 * Combobox carries three values here because Figma's `Type` on its Menu Item is
 * reassembled from `multiple` and `indicator`. Autocomplete's `Type` is Default
 * or Avatar, and that is derived from the row's own data rather than passed
 * down — so `size` is all that is left.
 *
 * Deliberately not exported from the package.
 */
export const AutocompleteContext = createContext<{ size: AutocompleteSize }>({
  size: 'default',
})

export function useAutocomplete(): { size: AutocompleteSize } {
  return useContext(AutocompleteContext)
}
