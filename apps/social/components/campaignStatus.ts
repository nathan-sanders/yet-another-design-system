import { CircleDashed, CircleDot, CircleX, Hourglass, type LucideIcon } from 'lucide-react'

import type { CampaignStatus } from '../data/types'

/**
 * A campaign status's words and glyph, as the Status Token in the table and
 * the icon on a timeline bar draw it (`40006170:39473`, `40006176:40513`).
 */
export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; icon: LucideIcon }> = {
  planning: { label: 'Planning', icon: CircleDashed },
  live: { label: 'Live', icon: CircleDot },
  'wrapping-up': { label: 'Wrapping up', icon: Hourglass },
  // Code-first: the file draws the Cancel dialog, not the campaign after it (FINDINGS 186).
  cancelled: { label: 'Cancelled', icon: CircleX },
}
