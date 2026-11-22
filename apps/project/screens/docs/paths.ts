import type { DocsShow } from './model'

/** All docs, on one of its segments: `#/docs?show=mine`. */
export function docsPath(show: DocsShow = 'all'): string {
  return show === 'all' ? '/docs' : `/docs?show=${show}`
}

/**
 * A doc's page. `from` is where its back arrow returns — All docs on the
 * segment it was opened from, or the project's Docs tab.
 */
export function docPath(id: string, from?: string): string {
  return from ? `/docs/${id}?from=${encodeURIComponent(from)}` : `/docs/${id}`
}

/** What the side column shows: Linked tasks and Details, Comments, or Version history. */
export type DocSide = 'details' | 'comments' | 'history'
