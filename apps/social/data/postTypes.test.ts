import { describe, expect, it } from 'vitest'

import { drafts } from './drafts'
import { posts, profiles } from './posts'
import { defaultPostType, isPostType, POST_TYPES, postTypeLabel } from './postTypes'
import type { Network } from './types'

const networkOf = (profileId: string): Network => profiles.find((p) => p.id === profileId)!.network

describe('POST_TYPES', () => {
  it('starts every network on its first type', () => {
    for (const network of Object.keys(POST_TYPES) as Network[]) {
      expect(defaultPostType(network)).toBe(POST_TYPES[network][0]!.value)
    }
  })

  it('lists each type once per network', () => {
    for (const types of Object.values(POST_TYPES)) {
      expect(new Set(types.map((t) => t.value)).size).toBe(types.length)
    }
  })

  it('gives every seeded post and draft a type its network has', () => {
    for (const item of [...posts, ...drafts]) {
      if (!item.format) continue
      expect(isPostType(networkOf(item.profileId), item.format), item.id).toBe(true)
    }
  })
})

describe('postTypeLabel', () => {
  it('names the type the way its network does', () => {
    expect(postTypeLabel('tiktok', 'carousel')).toBe('Photo carousel')
    expect(postTypeLabel('instagram', 'carousel')).toBe('Carousel')
    expect(postTypeLabel('instagram', 'trial-reel')).toBe('Trial reel')
  })

  it('reads "Post" when nothing was stored', () => {
    expect(postTypeLabel('x', undefined)).toBe('Post')
  })
})
