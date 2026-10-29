import { Calendar, SlidersHorizontal } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { Text } from '../../../src/components/Text'
import type { Campaign } from '../data/types'
import { channelsLabel, dateSpanLabel } from '../screens/campaigns/model'
import { useShell } from '../shell/ShellContext'
import { CAMPAIGN_STATUS } from './campaignStatus'
import { NetworkIcon } from './NetworkIcon'

/**
 * `_Campaign Header` (`40006130:38525`): the row over a campaign's tabs. Its
 * status and dates as Secondary buttons, its channels as a chip drawn like one
 * — the file draws a frame there, not a button, because there is nothing to
 * press — and Edit at the end.
 *
 * Editing isn't designed, so Edit, the status and the dates say so. The file's
 * hidden `Send for approval` and `Review actions` are approval states nothing
 * here has yet.
 */
export function CampaignHeader({ campaign }: { campaign: Campaign }) {
  const shell = useShell()
  const status = CAMPAIGN_STATUS[campaign.status]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Button
          appearance="secondary"
          startIcon={status.icon}
          onClick={() => shell.notBuilt('Changing a campaign’s status')}
        >
          {status.label}
        </Button>
        <Button
          appearance="secondary"
          startIcon={Calendar}
          onClick={() => shell.notBuilt('Changing a campaign’s dates')}
        >
          {dateSpanLabel(campaign)}
        </Button>
        <span className="flex h-8 items-center gap-2 rounded-md border border-action-secondary-border bg-action-secondary-background px-3 text-action-secondary-foreground">
          {campaign.channels.map((network) => (
            <NetworkIcon key={network} network={network} />
          ))}
          <Text render={<span />} weight="semibold">
            {channelsLabel(campaign)}
          </Text>
        </span>
      </div>
      <Button
        appearance="secondary"
        startIcon={SlidersHorizontal}
        onClick={() => shell.notBuilt('Editing a campaign')}
      >
        Edit
      </Button>
    </div>
  )
}
