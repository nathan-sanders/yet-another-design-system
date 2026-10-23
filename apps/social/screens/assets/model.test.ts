import { describe, expect, it } from 'vitest'

import type { Asset } from '../../data/assets'
import { folders, seedAssets } from '../../data/assets'
import {
  assetsIn,
  folderPath,
  formatDuration,
  kindOf,
  metaFor,
  parseScope,
  scopeParam,
  sortAssets,
  statusFor,
  targetName,
  uploadTarget,
  withDescendants,
} from './model'

// Thursday 22 October 2026, mid-morning.
const now = new Date(2026, 9, 22, 10, 0)
const day = (offset: number) => new Date(2026, 9, 22 + offset)

function asset(over: Partial<Asset> & { id: string }): Asset {
  return {
    name: `${over.id}.jpg`,
    kind: 'image',
    src: '',
    preview: 'image',
    alt: '',
    folderId: null,
    source: 'upload',
    addedBy: 'nathan',
    addedAt: day(-1),
    sizeBytes: 1,
    tags: [],
    favorite: false,
    ...over,
  }
}

const noUses = new Map<string, number>()

describe('the scope in the URL', () => {
  it('reads a view, a folder, and falls back to All assets', () => {
    expect(parseScope('unused', folders)).toEqual({ view: 'unused' })
    expect(parseScope('reels', folders)).toEqual({ folderId: 'reels' })
    expect(parseScope('nope', folders)).toEqual({ view: 'all' })
    expect(parseScope(null, folders)).toEqual({ view: 'all' })
  })

  it('writes nothing for the default', () => {
    expect(scopeParam({ view: 'all' })).toBeNull()
    expect(scopeParam({ view: 'favorites' })).toBe('favorites')
    expect(scopeParam({ folderId: 'reels' })).toBe('reels')
  })
})

describe('folders', () => {
  it('collect every folder under them, at any depth', () => {
    expect([...withDescendants('summer-menu', folders)].sort()).toEqual(
      ['final-cuts', 'hero-shots', 'menu-boards', 'raw-footage', 'reels', 'summer-menu'].sort(),
    )
    expect([...withDescendants('logos', folders)]).toEqual(['logos'])
  })

  it('give a breadcrumb path from the root', () => {
    expect(folderPath('raw-footage', folders).map((f) => f.name)).toEqual([
      'Summer Menu 2026',
      'Reels',
      'Raw footage',
    ])
  })

  it('show their own files and their subfolders', () => {
    const list = [
      asset({ id: 'top', folderId: 'summer-menu' }),
      asset({ id: 'deep', folderId: 'raw-footage' }),
      asset({ id: 'elsewhere', folderId: 'logos' }),
      asset({ id: 'root', folderId: null }),
    ]
    const ids = (folderId: string) =>
      assetsIn({ folderId }, list, folders, noUses, now).map((a) => a.id)
    expect(ids('summer-menu')).toEqual(['top', 'deep'])
    expect(ids('reels')).toEqual(['deep'])
    expect(ids('colors-type')).toEqual([])
  })
})

describe('views', () => {
  const list = [
    asset({ id: 'fav', favorite: true }),
    asset({ id: 'used' }),
    asset({ id: 'root', folderId: null }),
    asset({ id: 'ending', rights: { creatorId: 'priya', endsAt: day(9), terms: '' } }),
    asset({ id: 'expired', rights: { creatorId: 'maya', endsAt: day(-3), terms: '' } }),
    asset({ id: 'later', rights: { creatorId: 'priya', endsAt: day(90), terms: '' } }),
    asset({ id: 'uploading', upload: { progress: 0.4 } }),
  ]
  const uses = new Map([['used', 2]])
  const ids = (view: 'all' | 'favorites' | 'unused' | 'expiring') =>
    assetsIn({ view }, list, folders, uses, now).map((a) => a.id)

  it('All assets includes the root, which no folder shows', () => {
    expect(ids('all')).toContain('root')
  })
  it('Favorites is the starred ones', () => {
    expect(ids('favorites')).toEqual(['fav'])
  })
  it('Unused leaves out used files and uploads still in flight', () => {
    expect(ids('unused')).not.toContain('used')
    expect(ids('unused')).not.toContain('uploading')
  })
  it('Rights expiring holds the soon-ending and the lapsed, not a distant end', () => {
    expect(ids('expiring')).toEqual(['ending', 'expired'])
  })
})

describe('where a drop lands', () => {
  it('lands in the open folder, or at the root from a view', () => {
    expect(uploadTarget({ folderId: 'reels' })).toBe('reels')
    expect(uploadTarget({ view: 'favorites' })).toBeNull()
    expect(targetName({ folderId: 'summer-menu' }, folders)).toBe('Summer Menu 2026')
    expect(targetName({ view: 'unused' }, folders)).toBe('Asset library')
  })
})

describe('sorting', () => {
  it('keeps uploads in flight first whatever the order', () => {
    const list = [
      asset({ id: 'b', name: 'b.jpg', addedAt: day(-5) }),
      asset({ id: 'up', name: 'z.jpg', addedAt: day(-9), upload: { progress: 0 } }),
      asset({ id: 'a', name: 'a.jpg', addedAt: day(-1) }),
    ]
    expect(sortAssets(list, 'recent').map((a) => a.id)).toEqual(['up', 'a', 'b'])
    expect(sortAssets(list, 'name').map((a) => a.id)).toEqual(['up', 'a', 'b'])
  })
})

describe('what a card says', () => {
  const handle = (id: string) => ({ priya: 'priyaplates' })[id]

  it('names a creator, an import, or how much it is used', () => {
    expect(metaFor(asset({ id: 'x', rights: { creatorId: 'priya', endsAt: day(9), terms: '' } }), 0, handle)).toBe(
      'Image · From @priyaplates',
    )
    expect(metaFor(asset({ id: 'x', kind: 'graphic', source: 'canva' }), 0, handle)).toBe('Graphic · Canva')
    expect(metaFor(asset({ id: 'x' }), 3, handle)).toBe('Image · Used in 3 posts')
    expect(metaFor(asset({ id: 'x' }), 1, handle)).toBe('Image · Used in 1 post')
    expect(metaFor(asset({ id: 'x', upload: { progress: 0 } }), 0, handle)).toBe('Image · Uploading…')
  })

  it('carries the most urgent badge', () => {
    expect(statusFor(asset({ id: 'x', rights: { creatorId: 'maya', endsAt: day(-3), terms: '' } }), 2, now)?.label).toBe(
      'Rights expired',
    )
    expect(statusFor(asset({ id: 'x', rights: { creatorId: 'priya', endsAt: day(9), terms: '' } }), 2, now)?.label).toBe(
      'Rights end Oct 31',
    )
    expect(statusFor(asset({ id: 'x' }), 0, now)?.label).toBe('Unused')
    expect(statusFor(asset({ id: 'x' }), 1, now)).toBeNull()
    expect(statusFor(asset({ id: 'x', upload: { progress: 0 } }), 0, now)).toBeNull()
  })

  it('formats a duration and a dropped file’s kind', () => {
    expect(formatDuration(24)).toBe('0:24')
    expect(formatDuration(75)).toBe('1:15')
    expect(kindOf({ type: 'video/mp4', name: 'a.mp4' })).toBe('video')
    expect(kindOf({ type: 'image/svg+xml', name: 'a.svg' })).toBe('graphic')
    expect(kindOf({ type: 'image/jpeg', name: 'a.jpg' })).toBe('image')
  })
})

describe('the seed', () => {
  it('puts every seeded asset in a folder that exists, or the root', () => {
    for (const a of seedAssets) {
      if (a.folderId !== null) expect(folders.some((f) => f.id === a.folderId)).toBe(true)
    }
  })
})
