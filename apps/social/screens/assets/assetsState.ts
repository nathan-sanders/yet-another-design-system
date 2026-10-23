import { createContext, useContext } from 'react'

import type { ComboboxItemData } from '../../../../src/components/Combobox'
import type { Asset } from '../../data/assets'

/**
 * The asset library for the session. Held above the routes (`AssetsProvider`
 * in `main.tsx`), so a file uploaded here is still here after a trip to the
 * calendar and back.
 */
export interface AssetsState {
  assets: Asset[]
  /**
   * Add files to `folderId` (`null` is the root). Each appears at once with
   * `upload` set and finishes on its own a moment later. Returns the new ids
   * and an undo that takes them all back out.
   */
  upload: (files: File[], folderId: string | null) => { ids: string[]; undo: () => void }
  toggleFavorite: (id: string) => void
  setTags: (id: string, tags: string[]) => void
  /**
   * Every tag any asset carries, as Combobox rows: one array, extended in
   * place, because Combobox matches a chosen row by identity.
   */
  tagCatalog: ComboboxItemData[]
  createTag: (label: string) => ComboboxItemData
}

export const AssetsContext = createContext<AssetsState | null>(null)

export function useAssets(): AssetsState {
  const assets = useContext(AssetsContext)
  if (!assets) throw new Error('useAssets needs the AssetsProvider around it')
  return assets
}
