import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { campaigns as seed } from '../../data/campaigns'
import type { Campaign, CampaignCreatorStatus } from '../../data/types'
import { CampaignsContext, type CampaignsState } from './campaignsState'

/** Holds the campaigns for every screen. See `campaignsState.ts`. */
export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(seed)

  const edit = useCallback((id: string, change: (c: Campaign) => Campaign) => {
    setCampaigns((all) => all.map((c) => (c.id === id ? change(c) : c)))
  }, [])

  const cancel = useCallback(
    (id: string) =>
      edit(id, (c) => ({
        ...c,
        status: 'cancelled',
        // Today, unless it had already ended: then it keeps its own last day.
        end: c.end === null ? 0 : Math.min(c.end, 0),
        creators: c.creators?.map((creator) =>
          creator.status === 'invited' ? { ...creator, status: 'withdrawn' } : creator,
        ),
      })),
    [edit],
  )

  const setCreatorStatus = useCallback(
    (id: string, creatorId: string, status: CampaignCreatorStatus) =>
      edit(id, (c) => ({
        ...c,
        creators: c.creators?.map((creator) =>
          creator.creatorId === creatorId ? { ...creator, status } : creator,
        ),
      })),
    [edit],
  )

  const value = useMemo<CampaignsState>(
    () => ({
      campaigns,
      campaign: (id) => campaigns.find((c) => c.id === id),
      cancel,
      setCreatorStatus,
    }),
    [campaigns, cancel, setCreatorStatus],
  )

  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>
}
