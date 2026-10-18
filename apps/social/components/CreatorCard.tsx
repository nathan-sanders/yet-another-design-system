import { Radar } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { ClickableCard } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { CATEGORY_ICON, fitColor, type BrandCreator } from '../data/creators'
import { formatCount } from '../screens/reports/model'

/**
 * `_Creator Card Content` (`40005902:28198`) in a `Clickable Card`: two recent
 * posts, the creator's portrait on a ring that overlaps them, name, handle and
 * audience, brand fit and category. Plan › Creators lays them out in a grid,
 * and Yak shows the same card for a creator search.
 */
export function CreatorCard({ creator, onClick }: { creator: BrandCreator; onClick?: () => void }) {
  return (
    <ClickableCard onClick={onClick} className="w-full">
      <span className="relative flex w-full flex-col text-left">
        {/* Two of their recent posts; the name says whose, so they are decoration. */}
        <span className="flex h-50 gap-1 overflow-hidden rounded-sm">
          <img src={creator.photos[0]} alt="" className="h-full min-w-0 flex-1 object-cover" />
          <img src={creator.photos[1]} alt="" className="h-full w-16 shrink-0 object-cover" />
        </span>
        {/* The file's Avatar Ring: a 48px disc of the card's own surface, the 40px portrait centered in it. */}
        <span className="absolute top-44.5 left-2 flex size-12 items-center justify-center rounded-full bg-surface-background-primary">
          <Avatar size="large" name={creator.name} src={creator.avatar} alt="" />
        </span>
        <span className="flex flex-col gap-2 px-2 pt-8 pb-1">
          <span className="flex flex-col">
            <Text render={<span />} weight="semibold" color="emphasized">
              {creator.name}
            </Text>
            <Text render={<span />} size="sm" color="subtle">
              @{creator.handle} · {formatCount(creator.followers)} followers
            </Text>
          </span>
          <span className="flex flex-wrap gap-2">
            <Badge color={fitColor(creator.fit)} startIcon={Radar}>
              <span className="sr-only">Brand fit </span>
              {creator.fit}%
            </Badge>
            <Token startIcon={CATEGORY_ICON[creator.category]}>{creator.category}</Token>
          </span>
        </span>
      </span>
    </ClickableCard>
  )
}
