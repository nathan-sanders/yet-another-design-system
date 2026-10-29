import { useParams } from 'react-router'

import { campaignFor } from '../../data/campaigns'
import { NotBuilt } from '../NotBuilt'

/**
 * A campaign's own page: drawn in Figma as six tabs and a cancel dialog
 * (`Campaign page · Overview` `40006129:38303` and its siblings), not built
 * yet. The list links here so every row and bar goes somewhere.
 */
export function CampaignPageStub() {
  const { campaignId } = useParams()
  const campaign = campaignFor(campaignId)
  return <NotBuilt title={campaign?.name} figma={campaign ? '40006129-38303' : undefined} />
}
