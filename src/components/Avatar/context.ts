import { createContext, useContext } from 'react'

import type { AvatarSize, AvatarSurface } from './styles'

/**
 * What an AvatarGroup tells the avatars inside it.
 *
 * Three things travel down here rather than being props on each avatar:
 *
 * - `size`, so a group is sized once instead of on every child (this is how
 *   Astryx's AvatarGroup works too);
 * - `inGroup`, which is what turns on the ring that separates overlapping
 *   avatars. It is derived from where the avatar sits, not declared — the same
 *   reasoning as `CurrentContext` in Breadcrumbs and `iconOnly` in Button. An
 *   avatar cannot be wrong about whether it is in a group;
 * - `surface`, the color that ring has to be. Unlike `inGroup` this one cannot
 *   be derived — CSS has no way to ask what is painted behind you — so it is
 *   set once on the group and travels, exactly as `size` does.
 *
 * Deliberately not exported from the package.
 */
export interface AvatarGroupContextValue {
  size: AvatarSize
  inGroup: boolean
  surface: AvatarSurface
}

export const AvatarGroupContext = createContext<AvatarGroupContextValue | null>(null)

export function useAvatarGroup(): AvatarGroupContextValue | null {
  return useContext(AvatarGroupContext)
}
