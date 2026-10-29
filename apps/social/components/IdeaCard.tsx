import type { ReactNode } from 'react'
import { Megaphone } from 'lucide-react'

import { Badge } from '../../../src/components/Badge'
import { ClickableCard } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { campaignFor } from '../data/campaigns'
import { ideaCardId } from '../data/ideas'
import type { Idea } from '../data/types'

/**
 * `_Idea Content` (`40005837:57433`) in a `Clickable Card`: an optional photo,
 * the title, three lines of the body, and the campaign it belongs to. The
 * Ideas board stacks them in its columns and the gallery lays them in a grid.
 *
 * The card is a `<button>`, so everything in it is a span, and the photo is
 * `draggable={false}`: an `<img>` starts the browser's own drag, which would
 * take the pointer before dnd-kit saw it (DragAndDrop's CLAUDE.md).
 */
export function IdeaCard({
  idea,
  status,
  end,
  onClick,
  className,
  showCampaign = true,
}: {
  idea: Idea
  /** The group it is in, as a Badge — for the gallery, where there are no columns to say so. */
  status?: string
  /** More Tokens after the campaign: the channel and date a derived column adds. */
  end?: ReactNode
  onClick?: () => void
  className?: string
  /** Off on a campaign's own Ideas tab, where every card is that campaign's. */
  showCampaign?: boolean
}) {
  const campaign = showCampaign ? campaignFor(idea.campaignId) : undefined

  return (
    <ClickableCard id={ideaCardId(idea.id)} onClick={onClick} className={cn('w-full', className)}>
      <span className="flex w-full flex-col gap-2 text-left">
        {idea.image && (
          <img
            src={idea.image}
            alt=""
            draggable={false}
            className="h-32 w-full rounded-md object-cover"
          />
        )}
        <Text render={<span />} weight="semibold" color="emphasized">
          {idea.title}
        </Text>
        {idea.body && (
          <Text render={<span />} color="subtle" className="line-clamp-3">
            {idea.body}
          </Text>
        )}
        {(campaign || status || end) && (
          <span className="flex flex-wrap items-center gap-2">
            {status && <Badge color="neutral">{status}</Badge>}
            {campaign && <Token startIcon={Megaphone}>{campaign.name}</Token>}
            {end}
          </span>
        )}
      </span>
    </ClickableCard>
  )
}
