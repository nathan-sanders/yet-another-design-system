import { createContext, useContext } from 'react'

import type { AvatarSize } from './styles'

/**
 * What an AvatarGroup tells the avatars inside it.
 *
 * Two things travel down here rather than being props on each avatar:
 *
 * - `size`, so a group is sized once instead of on every child (this is how
 *   Astryx's AvatarGroup works too);
 * - `inGroup`, which is what turns on the canvas ring that separates overlapping
 *   avatars. It is derived from where the avatar sits, not declared — the same
 *   reasoning as `CurrentContext` in Breadcrumbs and `iconOnly` in Button. An
 *   avatar cannot be wrong about whether it is in a group.
 *
 * Deliberately not exported from the package.
 */
export interface AvatarGroupContextValue {
  size: AvatarSize
  inGroup: boolean
}

export const AvatarGroupContext = createContext<AvatarGroupContextValue | null>(null)

export function useAvatarGroup(): AvatarGroupContextValue | null {
  return useContext(AvatarGroupContext)
}
