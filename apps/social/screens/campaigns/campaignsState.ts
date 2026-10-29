import { createContext, useContext } from 'react'

import type { Campaign, CampaignCreatorStatus } from '../../data/types'

/**
 * The campaigns for the session, held above the routes like the schedule, so
 * a campaign cancelled on its page is cancelled on the list and the timeline.
 */
export interface CampaignsState {
  campaigns: Campaign[]
  campaign: (id: string | undefined) => Campaign | undefined
  /**
   * Stops a campaign today: its bar ends today, it reads Cancelled, and any
   * offer a creator never accepted is withdrawn. Its scheduled posts are the
   * schedule's to move; the dialog does both.
   */
  cancel: (id: string) => void
  setCreatorStatus: (id: string, creatorId: string, status: CampaignCreatorStatus) => void
}

export const CampaignsContext = createContext<CampaignsState | null>(null)

export function useCampaigns(): CampaignsState {
  const state = useContext(CampaignsContext)
  if (!state) throw new Error('useCampaigns needs the CampaignsProvider around it')
  return state
}
