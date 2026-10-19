import { Radar } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { ClickableCard } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { CATEGORY_ICON, fitColor, type BrandCreator } from '../data/creators'
import { formatCount } from '../screens/reports/model'

/**
 * `_Creator Card Content` (`40005902:28198`) in a `Clickable Card`: their latest
 * four posts in a sideways-scrolling strip, the creator's portrait on a ring
 * that overlaps them, name, handle and audience, brand fit and category. Plan › Creators lays them out in a grid,
 * Yak shows the same card for a creator search, and the details panel's
 * Similar tab lists the nearest three.
 */
export function CreatorCard({
  creator,
  selected,
  onClick,
}: {
  creator: BrandCreator
  /** Its details are open in the panel: Figma's `State=Selected`. */
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <ClickableCard onClick={onClick} selected={selected} className="w-full">
      <span className="relative flex w-full flex-col text-left">
        {/* Their latest four posts, newest first, in a strip that scrolls
            sideways (trackpad, swipe or Shift+wheel). Each post is the card's
            width less 68px, so the next one peeks in by the file's 64 and says
            there is more. The strip sits inside the card's <button>, so it
            cannot hold a control or a tab stop of its own; it is decoration
            here, and the details panel's Content tab is where the posts are
            listed for a keyboard or a screen reader. */}
        <span
          aria-hidden
          className="flex h-50 snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain rounded-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {creator.posts.map((post) => (
            <img
              key={post}
              src={post}
              alt=""
              draggable={false}
              className="h-full w-[calc(100%-4.25rem)] shrink-0 snap-start object-cover"
            />
          ))}
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
