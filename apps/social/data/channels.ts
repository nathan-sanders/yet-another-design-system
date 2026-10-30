import { profiles } from './posts'
import type { Profile } from './types'

/**
 * The connected accounts (`profiles` in `posts.ts`) by brand, for Settings ›
 * Channels. Each brand is a set of profiles; the plan counts every one of them
 * against its channel allowance.
 */

export interface Brand {
  id: string
  name: string
  /** The brand's picture, where it has one: its profiles share it. */
  avatar?: string
  profiles: Profile[]
}

function brand(id: string, name: string, prefix: string): Brand {
  const owned = profiles.filter((profile) => profile.id.startsWith(prefix))
  return { id, name, avatar: owned[0]?.avatar, profiles: owned }
}

export const brands: Brand[] = [
  brand('veggie-vault', 'Veggie Vault', 'vv-'),
  brand('feel-good', 'Feel Good', 'fg-'),
]

/**
 * A connection the network has dropped: Reddit's token lapsed, so the
 * account still shows and nothing posts to it until someone reconnects.
 */
export const needsReconnect = new Set(['vv-reddit'])
