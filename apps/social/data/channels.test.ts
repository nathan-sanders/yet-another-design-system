import { describe, expect, it } from 'vitest'

import { brands, needsReconnect } from './channels'
import { profiles } from './posts'

describe('brands', () => {
  it('holds every connected profile exactly once', () => {
    const grouped = brands.flatMap((brand) => brand.profiles.map((profile) => profile.id))
    expect(grouped.sort()).toEqual(profiles.map((profile) => profile.id).sort())
  })

  it('only flags profiles that exist', () => {
    const ids = new Set(profiles.map((profile) => profile.id))
    expect([...needsReconnect].every((id) => ids.has(id))).toBe(true)
  })
})
