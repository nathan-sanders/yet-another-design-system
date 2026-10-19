/** The detail sections. Overview is the panel's first tab and the full view's left column. */
export type DetailTab = 'overview' | 'audience' | 'content' | 'similar'

/** The full view's tabs: everything but Overview, which it always shows. */
export type FullViewTab = Exclude<DetailTab, 'overview'>

export const FULL_VIEW_TABS: { value: FullViewTab; label: string }[] = [
  { value: 'audience', label: 'Audience' },
  { value: 'content', label: 'Content' },
  { value: 'similar', label: 'Similar' },
]

/**
 * `#/plan/creators/alena?tab=content&from=…`: the creator's full view, the tab
 * it shows, and the page it was opened from. The tab is left off for Audience,
 * the first one.
 */
export function creatorPath(creatorId: string, tab: FullViewTab, from: string): string {
  const params = new URLSearchParams()
  if (tab !== 'audience') params.set('tab', tab)
  if (from !== '/plan/creators') params.set('from', from)
  const query = params.toString()
  return `/plan/creators/${creatorId}${query ? `?${query}` : ''}`
}

export function fullViewTab(params: URLSearchParams): FullViewTab {
  return FULL_VIEW_TABS.find((t) => t.value === params.get('tab'))?.value ?? 'audience'
}

/** Where the full view goes back to: the page it came from, or Creators. */
export function creatorFrom(params: URLSearchParams): string {
  const from = params.get('from')
  return from && from.startsWith('/') && !from.startsWith('/plan/creators/')
    ? from
    : '/plan/creators'
}
