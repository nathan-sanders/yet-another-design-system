import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type { ComboboxItemData } from '../../../../src/components/Combobox'
import { seedAssets, type Asset } from '../../data/assets'
import { me } from '../../data/people'
import { kindOf } from './model'
import { AssetsContext, type AssetsState } from './assetsState'

/** How long a mock upload takes, start to finish. */
const UPLOAD_MS = 1600
const TICK_MS = 100

/**
 * Holds the asset library. See `assetsState.ts`. Nothing leaves the browser:
 * an upload is an object URL for the dropped file, shown at once, with a
 * progress bar that fills over a second and a half to stand in for the
 * network.
 */
export function AssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(seedAssets)
  const nextId = useRef(1)
  // Every object URL this session made, so none outlives the page.
  const urls = useRef(new Set<string>())

  const upload = useCallback((files: File[], folderId: string | null) => {
    const added: Asset[] = files.map((file) => {
      const src = URL.createObjectURL(file)
      urls.current.add(src)
      const kind = kindOf(file)
      return {
        id: `a-new-${nextId.current++}`,
        name: file.name,
        kind,
        src,
        preview: file.type.startsWith('video/') ? 'video' : 'image',
        alt: '',
        folderId,
        source: 'upload',
        addedBy: me.id,
        addedAt: new Date(),
        sizeBytes: file.size,
        tags: [],
        favorite: false,
        upload: { progress: 0 },
      }
    })
    setAssets((all) => [...added, ...all])
    const ids = added.map((a) => a.id)
    const undo = () => {
      setAssets((all) => all.filter((a) => !ids.includes(a.id)))
      for (const a of added) {
        URL.revokeObjectURL(a.src)
        urls.current.delete(a.src)
      }
    }
    return { ids, undo }
  }, [])

  // One clock for every upload in flight, running only while there is one.
  const uploading = assets.some((a) => a.upload)
  useEffect(() => {
    if (!uploading) return
    const step = TICK_MS / UPLOAD_MS
    const timer = window.setInterval(() => {
      setAssets((all) =>
        all.map((a) => {
          if (!a.upload) return a
          const progress = a.upload.progress + step
          if (progress < 1) return { ...a, upload: { progress } }
          const { upload: _done, ...rest } = a
          return rest
        }),
      )
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [uploading])

  useEffect(() => {
    const made = urls.current
    return () => {
      for (const url of made) URL.revokeObjectURL(url)
    }
  }, [])

  const toggleFavorite = useCallback(
    (id: string) =>
      setAssets((all) => all.map((a) => (a.id === id ? { ...a, favorite: !a.favorite } : a))),
    [],
  )

  const setTags = useCallback(
    (id: string, tags: string[]) =>
      setAssets((all) => all.map((a) => (a.id === id ? { ...a, tags } : a))),
    [],
  )

  const [tagCatalog, setTagCatalog] = useState<ComboboxItemData[]>(() =>
    [...new Set(seedAssets.flatMap((a) => a.tags))]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name })),
  )
  // The latest catalog for `createTag`, which Combobox calls between renders.
  const catalogRef = useRef(tagCatalog)

  const createTag = useCallback((label: string) => {
    const existing = catalogRef.current.find((t) => t.label.toLowerCase() === label.toLowerCase())
    if (existing) return existing
    const tag = { value: label, label }
    catalogRef.current = [...catalogRef.current, tag]
    setTagCatalog(catalogRef.current)
    return tag
  }, [])

  const value = useMemo<AssetsState>(
    () => ({ assets, upload, toggleFavorite, setTags, tagCatalog, createTag }),
    [assets, upload, toggleFavorite, setTags, tagCatalog, createTag],
  )

  return <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
}
