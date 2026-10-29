/** The campaign page's tabs (`40006129:38303` and its siblings), in the file's order. */
export type CampaignTab = 'overview' | 'plan' | 'ideas' | 'creators' | 'assets' | 'measure'

export const CAMPAIGN_TABS: { value: CampaignTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'plan', label: 'Plan' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'creators', label: 'Creators' },
  { value: 'assets', label: 'Assets' },
  { value: 'measure', label: 'Measure' },
]

export const CAMPAIGNS_LIST = '/plan/campaigns'

/**
 * `#/plan/campaigns/summer-menu?tab=plan&from=…`: a campaign's page, the tab it
 * shows, and the list it was opened from — with that list's view and sort, so
 * Back lands on the timeline it left. Overview and the bare list are left off.
 */
export function campaignPath(
  id: string,
  tab: CampaignTab = 'overview',
  from: string = CAMPAIGNS_LIST,
): string {
  const params = new URLSearchParams()
  if (tab !== 'overview') params.set('tab', tab)
  if (from !== CAMPAIGNS_LIST) params.set('from', from)
  const query = params.toString()
  return `/plan/campaigns/${id}${query ? `?${query}` : ''}`
}

export function campaignTab(params: URLSearchParams): CampaignTab {
  return CAMPAIGN_TABS.find((t) => t.value === params.get('tab'))?.value ?? 'overview'
}

/** Where Back goes: the page it came from, or the list. Never another campaign. */
export function campaignFrom(params: URLSearchParams): string {
  const from = params.get('from')
  return from && from.startsWith('/') && !from.startsWith('/plan/campaigns/')
    ? from
    : CAMPAIGNS_LIST
}
