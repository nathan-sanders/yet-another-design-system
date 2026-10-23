import type { BadgeProps } from '../../../../src/components/Badge'
import type { Asset, AssetFolder, AssetKind } from '../../data/assets'
import { SOURCE_NAMES } from '../../data/assets'
import { formatFileSize } from '../../../../src/components/FileInput/files'
import { addDays, monthDay, startOfDay } from '../../data/dates'

/**
 * The pure half of Plan › Asset library: which assets a folder or a view
 * shows, how they sort, where a drop lands, and what each card says. Tested
 * in `model.test.ts`.
 */

/** The four rows above the folders. They filter; they are not places. */
type BadgeColor = NonNullable<BadgeProps['color']>

export type AssetView = 'all' | 'favorites' | 'unused' | 'expiring'

export const VIEWS: { id: AssetView; label: string }[] = [
  { id: 'all', label: 'All assets' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'unused', label: 'Unused' },
  { id: 'expiring', label: 'Rights expiring' },
]

/** What the folder column has selected: `?in=` in the URL. */
export type AssetScope = { view: AssetView } | { folderId: string }

/** How soon a license's end counts as "expiring": the amber badge and the view. */
export const RIGHTS_WARNING_DAYS = 30

/** `?in=` → a scope. Anything unknown falls back to All assets. */
export function parseScope(value: string | null, all: readonly AssetFolder[]): AssetScope {
  if (value && VIEWS.some((v) => v.id === value)) return { view: value as AssetView }
  if (value && all.some((f) => f.id === value)) return { folderId: value }
  return { view: 'all' }
}

/** The scope back as `?in=`; `null` for the default, which writes nothing. */
export function scopeParam(scope: AssetScope): string | null {
  if ('folderId' in scope) return scope.folderId
  return scope.view === 'all' ? null : scope.view
}

/** The tree row id for a scope: views and folders share one namespace. */
export function scopeId(scope: AssetScope): string {
  return 'folderId' in scope ? scope.folderId : scope.view
}

/** A folder and every folder under it, at any depth. */
export function withDescendants(folderId: string, all: readonly AssetFolder[]): Set<string> {
  const ids = new Set([folderId])
  let grew = true
  while (grew) {
    grew = false
    for (const f of all) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id)
        grew = true
      }
    }
  }
  return ids
}

/** Root first: Summer Menu 2026 › Reels › Raw footage. */
export function folderPath(folderId: string, all: readonly AssetFolder[]): AssetFolder[] {
  const path: AssetFolder[] = []
  let current = all.find((f) => f.id === folderId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? all.find((f) => f.id === current!.parentId) : undefined
  }
  return path
}

export type RightsState = 'ok' | 'ending' | 'expired'

export function rightsState(asset: Asset, now: Date): RightsState | null {
  if (!asset.rights) return null
  const end = startOfDay(asset.rights.endsAt)
  const today = startOfDay(now)
  if (end < today) return 'expired'
  return end <= addDays(today, RIGHTS_WARNING_DAYS) ? 'ending' : 'ok'
}

/** Whole days until a license ends; negative once it has. */
export function daysLeft(asset: Asset, now: Date): number | null {
  if (!asset.rights) return null
  const ms = startOfDay(asset.rights.endsAt).getTime() - startOfDay(now).getTime()
  return Math.round(ms / 86_400_000)
}

/** How many posts use each asset, keyed by id. Assets no post uses are absent. */
export type UseCounts = ReadonlyMap<string, number>

/**
 * What a folder or a view shows. **A folder shows everything under it**, its
 * subfolders' files too, so Summer Menu 2026 is the whole campaign and Reels
 * is every cut; that also makes its count in the tree the number you see.
 * An upload still lands in exactly the folder that is open.
 */
export function assetsIn(
  scope: AssetScope,
  assets: readonly Asset[],
  all: readonly AssetFolder[],
  uses: UseCounts,
  now: Date,
): Asset[] {
  if ('folderId' in scope) {
    const ids = withDescendants(scope.folderId, all)
    return assets.filter((a) => a.folderId !== null && ids.has(a.folderId))
  }
  switch (scope.view) {
    case 'all':
      return [...assets]
    case 'favorites':
      return assets.filter((a) => a.favorite)
    case 'unused':
      return assets.filter((a) => !a.upload && !uses.get(a.id))
    case 'expiring':
      return assets.filter((a) => {
        const state = rightsState(a, now)
        return state === 'ending' || state === 'expired'
      })
  }
}

/**
 * Where a drop or an upload from the Import menu lands. In a folder, that
 * folder. In a view there is no folder to be in, so the files go to the
 * library's root: unfiled, and in All assets.
 */
export function uploadTarget(scope: AssetScope): string | null {
  return 'folderId' in scope ? scope.folderId : null
}

/** The name a drop says it will land in: the folder, or the library itself. */
export function targetName(scope: AssetScope, all: readonly AssetFolder[]): string {
  const id = uploadTarget(scope)
  return (id && all.find((f) => f.id === id)?.name) || 'Asset library'
}

export type AssetSort = 'recent' | 'name' | 'size'

export const SORTS: { value: AssetSort; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
]

export type AssetTypeFilter = 'all' | AssetKind

export const TYPES: { value: AssetTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'graphic', label: 'Graphics' },
]

/** Uploads in flight always lead, so a drop is seen landing whatever the sort. */
export function sortAssets(assets: readonly Asset[], sort: AssetSort): Asset[] {
  return [...assets].sort((a, b) => {
    if (!!a.upload !== !!b.upload) return a.upload ? -1 : 1
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'size') return b.sizeBytes - a.sizeBytes
    return b.addedAt.getTime() - a.addedAt.getTime()
  })
}

export function byType(assets: readonly Asset[], type: AssetTypeFilter): Asset[] {
  return type === 'all' ? [...assets] : assets.filter((a) => a.kind === type)
}

export const KIND_NAMES: Record<AssetKind, string> = {
  image: 'Image',
  video: 'Video',
  graphic: 'Graphic',
}

/**
 * The card's second line, after the file type: where it came from if that
 * matters (a creator's, an import), else how much it is used, else its size.
 */
export function metaFor(
  asset: Asset,
  uses: number,
  creatorHandle: (id: string) => string | undefined,
): string {
  const kind = KIND_NAMES[asset.kind]
  if (asset.upload) return `${kind} · Uploading…`
  if (asset.rights) {
    const handle = creatorHandle(asset.rights.creatorId)
    if (handle) return `${kind} · From @${handle}`
  }
  if (asset.source !== 'upload') return `${kind} · ${SOURCE_NAMES[asset.source]}`
  if (uses > 0) return `${kind} · Used in ${uses} ${uses === 1 ? 'post' : 'posts'}`
  // Unused: the badge says so, so the line says something else.
  return `${kind} · ${formatFileSize(asset.sizeBytes)}`
}

/** The one status badge a card carries, most urgent first; `null` for none. */
export function statusFor(
  asset: Asset,
  uses: number,
  now: Date,
): { label: string; color: BadgeColor } | null {
  if (asset.upload) return null
  const rights = rightsState(asset, now)
  if (rights === 'expired') return { label: 'Rights expired', color: 'red' }
  if (rights === 'ending') {
    return { label: `Rights end ${monthDay.format(asset.rights!.endsAt)}`, color: 'amber' }
  }
  if (uses === 0) return { label: 'Unused', color: 'neutral' }
  return null
}

/** `0:24`. */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** A dropped file's kind. Only images and videos get this far (`ACCEPT`). */
export function kindOf(file: { type: string; name: string }): AssetKind {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'image/svg+xml') return 'graphic'
  return 'image'
}

/** What the library takes, from a drop or the picker: the native `accept` grammar. */
export const ACCEPT = 'image/*,video/*'
export const MAX_SIZE = 200_000_000

/** "Uploaded 3 files to Summer Menu 2026". */
export function uploadedMessage(count: number, where: string): string {
  return `Uploaded ${count} ${count === 1 ? 'file' : 'files'} to ${where}`
}

/** "2 files weren't uploaded". The first reason follows in the description. */
export function refusedMessage(count: number): string {
  return `${count} ${count === 1 ? "file wasn't" : "files weren't"} uploaded`
}
