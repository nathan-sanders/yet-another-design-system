import { useSyncExternalStore } from 'react'

import type { ComboboxItemData } from '../../../src/components/Combobox'

/**
 * The tags a post or an idea can carry, for the composer's Tags field. There
 * is no tag screen; this list is the whole catalog. Figma's `Details` block
 * shows `Launch` and `Menu` on the Back in stalk post.
 */
export const tagNames = [
  'Launch',
  'Menu',
  'Seasonal',
  'Behind the scenes',
  'UGC',
  'Promo',
  'Recipe',
  'Event',
]

/*
  The catalog grows: a tag typed into the Tags field that is not here is
  created there (Combobox `onCreate`) and joins the list for every field
  after it. One array of item objects, replaced on each addition, because
  Combobox matches a chosen tag to its row by identity — a fresh
  `{ value, label }` per render would never read as chosen.
*/
let catalog: ComboboxItemData[] = tagNames.map((name) => ({ value: name, label: name }))
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Every tag, as Combobox rows. Re-renders when one is created. */
export function useTagCatalog(): ComboboxItemData[] {
  return useSyncExternalStore(subscribe, () => catalog)
}

/** Add a tag, or find the one that already has this name; returns its row. */
export function createTag(label: string): ComboboxItemData {
  const existing = catalog.find((tag) => tag.label.toLowerCase() === label.toLowerCase())
  if (existing) return existing
  const tag = { value: label, label }
  catalog = [...catalog, tag]
  listeners.forEach((listener) => listener())
  return tag
}
