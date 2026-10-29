import type { CSSProperties } from 'react'

import { Icon } from '../../../src/components/Icon'
import { focusRing } from '../../../src/lib/focus'
import { cn } from '../../../src/lib/cn'
import type { Campaign } from '../data/types'
import { postsLabel } from '../screens/campaigns/model'
import { CAMPAIGN_COLOR_CLASSES } from './campaignColors'
import { CAMPAIGN_STATUS } from './campaignStatus'

/**
 * One campaign on the Campaigns timeline: `_Campaign Bar` (`40006176:40513`).
 * A 28px bar (8px corners) in the campaign's color, its name taking the room and
 * truncating, then the status glyph and the post count at the end. The
 * component's leading megaphone is off in every instance on the frame, so it
 * is not drawn.
 *
 * `left` and `width` are fractions of the timeline. They are runtime values,
 * so they ride in custom properties a utility reads back rather than inline
 * `left`/`width`. A side the timeline cuts off is drawn square, as the file
 * draws Creator Kitchen (both) and Holiday Gift Cards (its end): a rounded
 * corner there would say the campaign stops at the edge.
 *
 * The bar is a link to the campaign. Its name is the whole bar, status and
 * count included, since the glyph alone says nothing to a screen reader.
 */
export function CampaignBar({
  campaign,
  href,
  left,
  width,
  clipStart,
  clipEnd,
}: {
  campaign: Campaign
  href: string
  left: number
  width: number
  clipStart: boolean
  clipEnd: boolean
}) {
  const status = CAMPAIGN_STATUS[campaign.status]
  return (
    <a
      href={href}
      style={{ '--bar-left': `${left * 100}%`, '--bar-width': `${width * 100}%` } as CSSProperties}
      className={cn(
        'absolute top-2 left-(--bar-left) flex h-7 w-(--bar-width) min-w-0 items-center gap-1.5 rounded-md px-2 text-sm',
        clipStart && 'rounded-s-none',
        clipEnd && 'rounded-e-none',
        CAMPAIGN_COLOR_CLASSES[campaign.color].bar,
        focusRing,
      )}
    >
      <span className="min-w-0 flex-1 truncate font-semibold">{campaign.name}</span>
      <Icon icon={status.icon} size="small" className="shrink-0" />
      <span className="sr-only">{status.label},</span>
      <span className="shrink-0">{postsLabel(campaign)}</span>
    </a>
  )
}
