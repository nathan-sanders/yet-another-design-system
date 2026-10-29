import { focusRing } from '../../../src/lib/focus'
import { cn } from '../../../src/lib/cn'
import type { Campaign } from '../data/types'
import { CAMPAIGN_COLOR_CLASSES } from './campaignColors'

/**
 * A campaign's row label on Plan › Campaigns: `_Campaign Name Cell`
 * (`40006171:40646`), a 16px swatch in the campaign's color and its name. The
 * swatch is the same color as its bar on the timeline, so the two views read
 * as one set.
 *
 * The name is a plain anchor in the cell's text color, as `ReportCell`'s is:
 * the row's `rowTarget`, so a press anywhere on the row follows it, and still
 * the keyboard's way in.
 */
export function CampaignNameCell({ campaign, href }: { campaign: Campaign; href: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className={cn(
          'size-4 shrink-0 rounded-full inset-ring',
          CAMPAIGN_COLOR_CLASSES[campaign.color].swatch,
        )}
      />
      <a href={href} className={cn('truncate rounded-xs hover:underline', focusRing)}>
        {campaign.name}
      </a>
    </span>
  )
}
